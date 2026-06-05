import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import puppeteer, { Browser } from "puppeteer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Puppeteer Global Lazy State
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance;

  console.log("[Puppeteer] Launching headless browser...");
  try {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1280,720",
        "--autoplay-policy=no-user-gesture-required",
        "--no-user-gesture-required",
        "--mute-audio=false"
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
        isMobile: false
      }
    });

    browserInstance.on("disconnected", () => {
      console.log("[Puppeteer] Browser disconnected, resetting instance.");
      browserInstance = null;
    });

    console.log("[Puppeteer] Browser launched successfully.");
    return browserInstance;
  } catch (err) {
    console.error("[Puppeteer] Failed to launch browser:", err);
    throw err;
  }
}

// Puppeteer Active Page Pointer for programmatic control by the AI Agent
let activePage: any = null;

async function getActivePage(): Promise<any> {
  if (activePage && !activePage.isClosed()) {
    return activePage;
  }

  const browser = await getBrowser();
  const pages = await browser.pages();
  if (pages.length > 0) {
    activePage = pages[0];
    return activePage;
  }

  activePage = await browser.newPage();
  await activePage.setViewport({ width: 1280, height: 720 });
  await activePage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  return activePage;
}

// Automatically dismiss common Accept-Cookies screen triggers
async function autoBypassConsent(page: any) {
  try {
    console.log("[Puppeteer] Proactively attempting to bypass common cookie consent banners...");
    
    // 1. Evaluate button text patterns in standard DOM
    const clickedByText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"], span, p, label'));
      const textToMatch = [
        'accept all', 'acceptă tot', 'sunt de acord', 'agree', 'accept', 'consent',
        'allow all', 'allow essential and optional', 'accept cookies', 'ro_agree',
        'accept everything', 'accept and close', 'accepta tot', 'alle akzeptieren',
        'zustimmen', 'ich stimme zu', 'agree to the use', 'accept all cookies',
        'da, sunt de acord', 'da, accept', 'permitere toate', 'allow'
      ];
      
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (textToMatch.some(term => text === term || (text.includes(term) && text.length < 50))) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            (btn as any).click();
            return { clicked: true, text, tag: btn.tagName };
          }
        }
      }
      return { clicked: false };
    }).catch(() => ({ clicked: false }));

    if (clickedByText && clickedByText.clicked) {
      console.log(`[Puppeteer] Clicked consent element by text: "${clickedByText.text}" (${clickedByText.tag})`);
      await new Promise(r => setTimeout(r, 1000));
      return;
    }

    // 2. Fallback to common CSS selectors (Google, YouTube, etc.)
    const consentSelectors = [
      'button[aria-label="Accept all"]',
      'button[aria-label="Agree to the use of cookies and other data"]',
      'button[aria-label="Consent"]',
      '#L2AGLb', // Google Accept
      'ytd-button-renderer.style-primary[is-two-columns_] #button', // YouTube old
      'ytd-button-renderer.style-primary #button', // YouTube standard
      '#yt-cookie-consent-accept-button',
      'yt-button-shape button',
      'button[aria-label*="accept" i]',
      'button[aria-label*="acceptă" i]',
      'button[aria-label*="agree" i]',
      'button[aria-label*="permit" i]',
      'button[name="agree"]', // Yahoo/Oath
      'button#accept-all',
      'button.accept-all',
      'button#cookie-accept',
      'button.cookie-accept',
      '.cookie-banner-accept',
    ];

    for (const selector of consentSelectors) {
      const el = await page.$(selector);
      if (el) {
        await el.click().catch(() => {});
        console.log(`[Puppeteer] Clicked consent selector: ${selector}`);
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  } catch (err) {
    console.warn("[Puppeteer] Consent auto-bypass skipped:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Browser Proxy to bypass security headers (X-Frame-Options, CSP, etc.)
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Missing url parameter");
    }

    try {
      let validatedUrl = targetUrl;
      if (!/^https?:\/\//i.test(validatedUrl)) {
        validatedUrl = "https://" + validatedUrl;
      }

      const response = await fetch(validatedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const finalUrl = response.url || validatedUrl;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        let html = await response.text();

        // Inject <base> tag and link interception scripts
        const baseTag = `<base href="${finalUrl}">`;
        const interceptorScript = `
          <script>
            document.addEventListener("DOMContentLoaded", () => {
              // Intercept all link-based navigation inside the iframe
              document.addEventListener("click", (e) => {
                const link = e.target.closest("a");
                if (link && link.href) {
                  const href = link.href.trim();
                  if (!href || href.startsWith("javascript:") || href.startsWith("#") || href.includes("#")) {
                    return;
                  }
                  
                  // Bypassing normal navigation and reloading through our proxy
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = "/api/proxy?url=" + encodeURIComponent(link.href);
                }
              }, true);

              // Intercept form submissions
              document.addEventListener("submit", (e) => {
                const form = e.target;
                const actionUrl = form.action || window.location.href;
                const method = (form.method || "get").toLowerCase();
                
                if (method === "get") {
                  e.preventDefault();
                  const formData = new FormData(form);
                  const params = new URLSearchParams();
                  for (const [key, value] of formData.entries()) {
                    params.append(key, value.toString());
                  }
                  const delimiter = actionUrl.includes("?") ? "&" : "?";
                  const finalFormUrl = actionUrl + delimiter + params.toString();
                  window.location.href = "/api/proxy?url=" + encodeURIComponent(finalFormUrl);
                }
              }, true);
            });
          </script>
        `;

        if (html.includes("<head>")) {
          html = html.replace("<head>", "<head>\n" + baseTag + "\n" + interceptorScript);
        } else if (html.includes("<HEAD>")) {
          html = html.replace("<HEAD>", "<HEAD>\n" + baseTag + "\n" + interceptorScript);
        } else if (html.includes("<body>")) {
          html = html.replace("<body>", "<body>\n" + baseTag + "\n" + interceptorScript);
        } else if (html.includes("<BODY>")) {
          html = html.replace("<BODY>", "<BODY>\n" + baseTag + "\n" + interceptorScript);
        } else {
          html = baseTag + "\n" + interceptorScript + "\n" + html;
        }

        res.setHeader("Content-Type", "text/html");
        res.removeHeader("X-Frame-Options");
        res.removeHeader("Content-Security-Policy");
        return res.send(html);
      } else {
        const buffer = await response.arrayBuffer();
        res.setHeader("Content-Type", contentType);
        res.removeHeader("X-Frame-Options");
        res.removeHeader("Content-Security-Policy");
        return res.send(Buffer.from(buffer));
      }
    } catch (err: any) {
      console.error("Proxy error for URL " + targetUrl, err);
      return res.status(200).send(`
        <html>
          <body style="background: #09090b; color: #f4f4f5; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
            <svg style="color: #ef4444; width: 48px; height: 48px; margin-bottom: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Cannot load web page</h1>
            <p style="font-size: 14px; opacity: 0.7; max-width: 400px; margin-bottom: 24px;">The proxy was unable to retrieve content from: <code>${targetUrl}</code></p>
            <p style="font-size: 12px; color: #71717a; max-width: 400px; margin-bottom: 24px;">Error details: ${err?.message || err}</p>
            <button onclick="window.location.reload()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">Retry Connection</button>
          </body>
        </html>
      `);
    }
  });

  // ========================================================
  // BROWSER CONTROL ENDPOINTS (For AI Agent Programmatic Use)
  // ========================================================
  app.get("/api/browser/info", async (req, res) => {
    try {
      const page = await getActivePage();
      const url = page.url();
      const title = await page.title();
      
      // Clear cookie banners first!
      await autoBypassConsent(page);
      
      const info = await page.evaluate(() => {
        // Clone body to manipulate and clean up tags
        const clone = document.body.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('script, style, iframe, noscript, svg, path, link, meta, head').forEach(el => el.remove());
        const textContent = (clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);

        const items: Array<{ tag: string; text: string; selector: string; type?: string; placeholder?: string }> = [];
        
        // Find input elements
        document.querySelectorAll('input, textarea, select').forEach(el => {
          const inputEl = el as HTMLInputElement;
          const rect = inputEl.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          let label = inputEl.getAttribute('placeholder') || inputEl.getAttribute('name') || inputEl.getAttribute('id') || inputEl.getAttribute('aria-label') || '';
          
          let selector = '';
          if (inputEl.id) {
            selector = `#${inputEl.id}`;
          } else if (inputEl.getAttribute('name')) {
            selector = `${inputEl.tagName.toLowerCase()}[name="${inputEl.getAttribute('name')}"]`;
          } else if (inputEl.getAttribute('placeholder')) {
            selector = `${inputEl.tagName.toLowerCase()}[placeholder="${inputEl.getAttribute('placeholder')}"]`;
          } else {
            selector = inputEl.tagName.toLowerCase();
          }

          items.push({
            tag: inputEl.tagName.toLowerCase(),
            text: `Input Field (ID: "${inputEl.id || ''}", Name: "${inputEl.getAttribute('name') || ''}", Placeholder: "${label}")`,
            selector,
            type: inputEl.type,
            placeholder: label
          });
        });

        // Find clickable elements
        document.querySelectorAll('button, a, div[role="button"]').forEach((el) => {
          const btn = el as HTMLElement;
          const rect = btn.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const text = btn.textContent ? btn.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
          if (!text) return;

          let selector = '';
          if (btn.id) {
            selector = `#${btn.id}`;
          } else if (btn.tagName.toLowerCase() === 'a' && btn.getAttribute('href') && !btn.getAttribute('href')?.startsWith('#')) {
            selector = `a[href="${btn.getAttribute('href')}"]`;
          } else if (text && text.length < 30) {
            selector = `${btn.tagName.toLowerCase()}:has-text("${text}")`;
          } else {
            selector = btn.tagName.toLowerCase();
          }

          items.push({
            tag: btn.tagName.toLowerCase(),
            text: `Clickable ${btn.tagName.toLowerCase()} "${text}"`,
            selector
          });
        });

        return {
          textContent,
          interactiveElements: items.slice(0, 30)
        };
      });

      res.json({
        success: true,
        url,
        title,
        textContent: info.textContent,
        interactiveElements: info.interactiveElements
      });
    } catch (err: any) {
      console.error("Browser info error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/browser/search-youtube", async (req, res) => {
    try {
      const query = (req.query.query as string) || "";
      if (!query) {
        return res.status(400).json({ success: false, error: "Missing query parameter" });
      }

      console.log(`[YouTube-Search] Actively searching YouTube for matches of: ${query}`);
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
          "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      const html = await response.text();
      const videos: Array<{ title: string; url: string }> = [];

      // Try parsing ytInitialData
      const match = html.match(/ytInitialData\s*=\s*({.+?});/);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const contents = data.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
          if (contents && Array.isArray(contents)) {
            for (const item of contents) {
              if (item.videoRenderer) {
                const videoId = item.videoRenderer.videoId;
                const title = item.videoRenderer.title?.runs?.[0]?.text || item.videoRenderer.title?.accessibility?.accessibilityData?.label || "";
                if (videoId && title) {
                  videos.push({
                    title,
                    url: `https://www.youtube.com/watch?v=${videoId}`
                  });
                }
              }
              if (videos.length >= 5) break;
            }
          }
        } catch (e) {
          console.warn("[YouTube-Search] ytInitialData JSON parse fail, trying regex:", e);
        }
      }

      // If ytInitialData empty or failed, use regex fallback
      if (videos.length === 0) {
        const regex = /"videoRenderer":\s*\{\s*"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"[^}]+"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/g;
        let m;
        while ((m = regex.exec(html)) !== null && videos.length < 5) {
          const videoId = m[1];
          const rawTitle = m[2];
          const title = rawTitle.replace(/\\u0026/g, '&').replace(/\\"/g, '"');
          videos.push({
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }

      if (videos.length > 0) {
        return res.json({ success: true, data: videos });
      }

      // Final fallback search search results URL if nothing found
      return res.json({
        success: true,
        data: [
          {
            title: `Căutare YouTube: ${query}`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
          }
        ]
      });
    } catch (err: any) {
      console.error("[YouTube-Search] Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/navigate", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, error: "Missing url parameter" });
      
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      console.log(`[Agent-API] Navigating active page to: ${targetUrl}`);
      const page = await getActivePage();
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
      
      // Bypass cookie barriers
      await autoBypassConsent(page);

      res.json({ success: true, url: page.url(), title: await page.title() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/click", async (req, res) => {
    try {
      const { selector, x, y } = req.body;
      const page = await getActivePage();

      if (typeof x === "number" && typeof y === "number") {
        console.log(`[Agent-API] Clicking coordinates x:${x}, y:${y}`);
        await page.mouse.click(Math.round(x * 1280), Math.round(y * 720));
        return res.json({ success: true });
      }

      if (!selector) return res.status(400).json({ success: false, error: "Missing selector parameter" });

      console.log(`[Agent-API] Programmatic click on selector: ${selector}`);

      // Try mechanical clicking using bounding box first (creates realistic mouse event on coordinate)
      const hasTextMatch = selector.match(/([^:]+):has-text\("([^"]+)"\)/i);
      if (hasTextMatch) {
        const tagName = hasTextMatch[1];
        const textQuery = hasTextMatch[2].toLowerCase();

        const box = await page.evaluate((tag: string, txt: string) => {
          const elements = Array.from(document.querySelectorAll(tag));
          for (const el of elements) {
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const value = ('value' in el ? String((el as any).value) : '').toLowerCase();
            const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
            const textContent = (el.textContent || '').trim().toLowerCase();
            if (
              textContent.includes(txt) ||
              ariaLabel.includes(txt) ||
              value.includes(txt) ||
              placeholder.includes(txt)
            ) {
              const rect = el.getBoundingClientRect();
              return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            }
          }
          return null;
        }, tagName, textQuery);

        if (box && box.width > 0 && box.height > 0) {
          await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
          return res.json({ success: true, info: `Mechanical text click on text "${textQuery}" inside <${tagName}>` });
        }

        // Fallback programmatic click
        const clicked = await page.evaluate((tag: string, txt: string) => {
          const elements = Array.from(document.querySelectorAll(tag));
          for (const el of elements) {
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const value = ('value' in el ? String((el as any).value) : '').toLowerCase();
            const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
            const textContent = (el.textContent || '').trim().toLowerCase();
            if (
              textContent.includes(txt) ||
              ariaLabel.includes(txt) ||
              value.includes(txt) ||
              placeholder.includes(txt)
            ) {
              (el as any).click();
              return true;
            }
          }
          return false;
        }, tagName, textQuery);

        if (clicked) {
          return res.json({ success: true, info: `JS click fallback on text "${textQuery}" inside <${tagName}>` });
        } else {
          return res.status(404).json({ success: false, error: `Tag "${tagName}" matching text "${textQuery}" not found` });
        }
      }

      // Normal CSS selector click with mechanical bounding box try
      try {
        const box = await page.evaluate((sel: string) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
        }, selector);

        if (box && box.width > 0 && box.height > 0) {
          await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
          return res.json({ success: true, info: `Mechanical selector click on ${selector}` });
        }
      } catch (e) {
        // ignore evaluation errors
      }

      const el = await page.$(selector);
      if (el) {
        await el.click();
        res.json({ success: true });
      } else {
        const clickedEval = await page.evaluate((sel: string) => {
          const element = document.querySelector(sel) as HTMLElement;
          if (element) {
            element.click();
            return true;
          }
          return false;
        }, selector);

        if (clickedEval) {
          res.json({ success: true, info: "Clicked via page evaluation fallback" });
        } else {
          res.status(404).json({ success: false, error: `Selector ${selector} not found` });
        }
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/type", async (req, res) => {
    try {
      const { selector, text, press_enter } = req.body;
      if (!text) return res.status(400).json({ success: false, error: "Missing text parameter" });

      const page = await getActivePage();
      let resolvedSelector = selector;

      if (selector) {
        console.log(`[Agent-API] Typing text inside selector "${selector}": ${text}`);

        // Try text match to get specific inputs organically
        const hasTextMatch = selector.match(/([^:]+):has-text\("([^"]+)"\)/i);
        if (hasTextMatch) {
          const tagName = hasTextMatch[1];
          const textQuery = hasTextMatch[2].toLowerCase();

          const tempId = await page.evaluate((tag: string, txt: string) => {
            const elements = Array.from(document.querySelectorAll(tag));
            for (const el of elements) {
              const elText = (el.textContent || '').trim().toLowerCase();
              const elPlaceholder = (el.getAttribute('placeholder') || '').trim().toLowerCase();
              const elId = el.getAttribute('id') || '';
              const elName = (el.getAttribute('name') || '').toLowerCase();
              const elAria = (el.getAttribute('aria-label') || '').toLowerCase();
              
              if (
                elText.includes(txt) || 
                elPlaceholder.includes(txt) || 
                elId.toLowerCase().includes(txt) || 
                elName.includes(txt) ||
                elAria.includes(txt)
              ) {
                let id = el.getAttribute('id');
                if (!id) {
                  id = 'temp-agent-type-' + Math.random().toString(36).substring(2, 9);
                  el.setAttribute('id', id);
                }
                return '#' + id;
              }
            }
            return null;
          }, tagName, textQuery);

          if (tempId) {
            resolvedSelector = tempId;
          }
        }

        const focused = await page.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLElement;
          if (el) {
            el.focus();
            return true;
          }
          return false;
        }, resolvedSelector);

        if (!focused) {
          return res.status(404).json({ success: false, error: `Selector ${selector} not found` });
        }

        // Clear existing input content naturally using triple click + Backspace (compatible with React/Vue)
        await page.click(resolvedSelector, { clickCount: 3 });
        await new Promise(r => setTimeout(r, 100));
        await page.keyboard.press('Backspace');
        await page.keyboard.type(text);
      } else {
        console.log(`[Agent-API] Typing in active field: ${text}`);
        await page.keyboard.type(text);
      }

      if (press_enter !== false) {
        await new Promise(r => setTimeout(r, 200));
        await page.keyboard.press("Enter");
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/bypass-consent", async (req, res) => {
    try {
      const page = await getActivePage();
      await autoBypassConsent(page);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/scroll", async (req, res) => {
    try {
      const { deltaY } = req.body;
      const page = await getActivePage();
      await page.evaluate((dy: any) => {
        window.scrollBy({
          top: typeof dy === 'number' ? dy : 400,
          left: 0,
          behavior: 'smooth'
        });
      }, deltaY);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/browser/agent-step", async (req, res) => {
    try {
      const { goal, history, geminiApiKey } = req.body;
      if (!goal) {
        return res.status(400).json({ success: false, error: "Goal parameter is required" });
      }

      const page = await getActivePage();
      const url = page.url();
      const title = await page.title();
      
      const info = await page.evaluate(() => {
        const clone = document.body.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('script, style, iframe, noscript, svg, path, link, meta, head').forEach(el => el.remove());
        const textContent = (clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 3000);

        const items: Array<{ tag: string; text: string; selector: string; type?: string; placeholder?: string }> = [];
        
        document.querySelectorAll('input, textarea, select').forEach(el => {
          const inputEl = el as HTMLInputElement;
          const rect = inputEl.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          let label = inputEl.getAttribute('placeholder') || inputEl.getAttribute('name') || inputEl.getAttribute('id') || inputEl.getAttribute('aria-label') || '';
          
          let selector = '';
          if (inputEl.id) {
            selector = `#${inputEl.id}`;
          } else if (inputEl.getAttribute('name')) {
            selector = `${inputEl.tagName.toLowerCase()}[name="${inputEl.getAttribute('name')}"]`;
          } else if (inputEl.getAttribute('placeholder')) {
            selector = `${inputEl.tagName.toLowerCase()}[placeholder="${inputEl.getAttribute('placeholder')}"]`;
          } else {
            selector = inputEl.tagName.toLowerCase();
          }

          items.push({
            tag: inputEl.tagName.toLowerCase(),
            text: `Input (ID: "${inputEl.id || ''}", Placeholder: "${label}")`,
            selector,
            type: inputEl.type,
            placeholder: label
          });
        });

        document.querySelectorAll('button, a, div[role="button"]').forEach((el) => {
          const btn = el as HTMLElement;
          const rect = btn.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const text = btn.textContent ? btn.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
          if (!text) return;

          let selector = '';
          if (btn.id) {
            selector = `#${btn.id}`;
          } else if (btn.tagName.toLowerCase() === 'a' && btn.getAttribute('href') && !btn.getAttribute('href')?.startsWith('#')) {
            selector = `a[href="${btn.getAttribute('href')}"]`;
          } else if (text && text.length < 30) {
            selector = `${btn.tagName.toLowerCase()}:has-text("${text}")`;
          } else {
            selector = btn.tagName.toLowerCase();
          }

          items.push({
            tag: btn.tagName.toLowerCase(),
            text: `Clickable text "${text}"`,
            selector
          });
        });

        return {
          textContent,
          interactiveElements: items.slice(0, 30)
        };
      });

      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not defined on the server nor configured in settings." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `Ești un Agent de Browser autonom genial (numit "Operator").
Misiunea ta este să îndeplinești obiectivul utilizatorului navigând pe Internet, căutând bunuri, hărți, zboruri sau informații și extrăgând datele relevante.

Operezi pe un browser live Puppeteer. În fiecare pas, primești URL-ul curent, titlul paginii, conținutul paginii text, lista de elemente interactive descoperite în pagină, și istoricul pașilor tăi anteriori.

Poți alege EXACT una din următoarele acțiuni programatice la fiecare pas:
1. "navigate": url-ul de încărcat (folosește URL-uri complete, de ex. "https://www.google.com").
2. "click": selectorul exact CSS al butonului sau linkului de pe pagină. ATENȚIE: poți folosi selector de tipul: "button:has-text(\\"Rezervă\\")" sau "a:has-text(\\"Rezultate\\")" dacă dorești să apeși un element după textul său.
3. "type": textul de tastat și selectorul casetei unde se scrie. (dacă vrei să scrii în câmpul activ, poți omite selectorul). Trimite press_enter ca boolean (de regulă true pentru a trimite formularul/căutarea imediat).
4. "scroll": deltaY (numeric, pozitiv pentru scroll în jos, negativ pentru scroll în sus, ex: 400).
5. "bypass": auto-bypass pop-up de cookies.
6. "finish": rezumat detaliat (cel puțin 2-3 paragrafe explicative în limba română cu TOATE datele extrase).

Trebuie să returnezi strict un format JSON valid:
{
  "thought": "raționamentul tău intern în limba română pe baza a ceea ce vezi acum si ultimul pas făcut",
  "label": "un mesaj scurt, dinamic și descriptiv în română ce va fi afișat în log-ul live, ex: 'Navighez spre Google...', 'Scriu cautarea în câmp', 'Fac scroll pe listă...'",
  "action": "navigate" | "click" | "type" | "scroll" | "bypass" | "finish",
  "args": {
    "url": "optional string",
    "selector": "optional string",
    "text": "optional string",
    "press_enter": "optional boolean",
    "deltaY": "optional number",
    "summary": "optional string"
  }
}

RECOMANDĂRI STRATEGICE:
- Căutare: Dacă utilizatorul vrea informații, mergi la Google.com și tastează în input. Când ești pe pagina de rezultate Google, analizează linkurile ('a:has-text(...)') pentru a alege cel mai potrivit titlu și dă click pe el.
- Cookie Consent: Primul lucru pe Google/YouTube sau orice alt site mare este bypass-ul sau click pe butoanele de "Accept" / "De acord".
- Citire: După ce navighezi sau dai click, citește textul paginii de rezultate pentru a obține faptele necesare.
- Nu te bloca în bucle finite! Dacă ai repetat o acțiune de 3 ori fără succes, încearcă un alt traseu sau finalizează cu datele pe care le ai deja.`;

      const prompt = `OBIECTIVUL UTILIZATORULUI: "${goal}"

STAREA CURENTĂ A BROWSERULUI:
- URL Curent: ${url}
- Titlul Paginii: "${title}"
- Conținut text sumat (primele 3000 caractere):
"${info.textContent}"

- Elementele interactive identificate pe pagină:
${JSON.stringify(info.interactiveElements, null, 2)}

ISTORICUL PAȘILOR EFECTUAȚI DE TINE PÂNĂ ACUM:
${JSON.stringify(history, null, 2)}

Ce decizie iei la acest pas? Transmite următorul pas în formatul JSON cerut.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const rawText = response.text || "{}";
      const parsed = JSON.parse(rawText.trim());

      res.json({ success: true, step: parsed });
    } catch (err: any) {
      console.error("Agent step error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // OAuth Setup Constants
  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

  // Helper to construct OAuth URLs
  app.get("/api/auth/url", (req, res) => {
    const provider = req.query.provider as string;
    const clientRedirectUri = req.query.redirect_uri as string;
    const redirectUri = clientRedirectUri || `${APP_URL}/api/auth/callback/${provider}`;

    let authUrl = "";
    
    if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) return res.status(400).json({ error: "GITHUB_CLIENT_ID not set" });
      authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo user`;
    } 
    else if (provider === "google_workspace") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) return res.status(400).json({ error: "GOOGLE_CLIENT_ID not set" });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly&access_type=offline&prompt=consent`;
    }
    else if (provider === "vercel") {
      // Vercel apps OAuth
      authUrl = `https://vercel.com/integrations/hermes_ai/new`; // Note: Real Vercel OAuth needs a specific App install URL, this is a placeholder URL structure
    }
    else {
      return res.status(400).json({ error: "Unknown provider" });
    }

    res.json({ url: authUrl });
  });

  // OAuth Callback Handler
  app.get("/api/auth/callback/:provider", async (req, res) => {
    const provider = req.params.provider;
    const code = req.query.code as string;
    
    // AI studio provides an https tunnel, usually the host header is the true public URL without protocol.
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const dynamicOrigin = `${protocol}://${host}`;
    
    const redirectUri = `${dynamicOrigin}/api/auth/callback/${provider}`;

    if (!code) {
       return res.send(`<html><body><script>window.close();</script>Missing code</body></html>`);
    }

    let token = "";

    try {
      if (provider === "github") {
        const response = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri
          })
        });
        const data = await response.json();
        if (data.access_token) {
          token = data.access_token;
        } else {
          throw new Error(data.error_description || "Failed to get GitHub token");
        }
      } 
      else if (provider === "google_workspace") {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
             "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri
          })
        });
        const data = await response.json();
        if (data.access_token) {
           token = data.access_token; // Normally you'd store the refresh token too
        } else {
           throw new Error(data.error_description || "Failed to get Google token");
        }
      }
      
      // If we successfully fetched a token, send it back to the parent window
      // Note: In a production app with a real database, you wouldn't send the token back to the frontend.
      // You would store it in the database associated with the user's session.
      // However, since this is a local/client-db system (Dexie), we send it to the frontend.
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: '${provider}',
                  token: '${token}'
                }, '*');
                window.close();
              } else {
                document.write("Successfully authenticated! You can close this window now.");
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);

    } catch (err: any) {
      res.send(`<html><body><script>window.close();</script><p>Failed to authenticate: ${err?.message}</p></body></html>`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/api/browser-sync") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws: WebSocket) => {
    console.log("[WebSocket] Client connected for browser-sync.");
    
    let page: any = null;
    let cdpSession: any = null;
    let isActive = true;

    const sendToClient = (msg: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    };

    try {
      const browser = await getBrowser();
      if (!isActive) return;

      let isExisting = false;
      if (activePage && !activePage.isClosed()) {
        page = activePage;
        isExisting = true;
        console.log("[WebSocket] Client connected, attaching to existing activePage:", page.url());
      } else {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        activePage = page;
        console.log("[WebSocket] Client connected, created fresh activePage");
      }

      if (!isActive) {
        if (!isExisting) {
          await page.close().catch(() => {});
        }
        return;
      }

      // Set up navigation listener to send real-time URL updates
      page.on("framenavigated", async (frame: any) => {
        if (frame === page?.mainFrame()) {
          const currentUrl = page.url();
          sendToClient({ type: "url", url: currentUrl });
          
          // Automatically attempt to bypass consent on the new page after 1.5s
          setTimeout(async () => {
            try {
              if (page && !page.isClosed()) {
                await autoBypassConsent(page);
              }
            } catch (err) {
              console.warn("[Puppeteer-AutoBypass] Failed auto consent bypass:", err);
            }
          }, 1500);
        }
      });

      page.on("domcontentloaded", async () => {
        try {
          const title = await page?.title();
          sendToClient({ type: "title", title });

          // Auto play video element if on a watch page
          const currentUrl = page.url();
          if (currentUrl.includes("youtube.com/watch")) {
            console.log("[Puppeteer] Watch URL detected, triggering auto-video play...");
            setTimeout(async () => {
              try {
                if (page && !page.isClosed()) {
                  await page.evaluate(() => {
                    const video = document.querySelector("video");
                    if (video) {
                      video.muted = true; // Muting ensures autoplay complies with browser policy
                      video.play().catch(() => {});
                    }
                    // Try clicking standard large play button
                    const playButton = document.querySelector(".ytp-large-play-button") as HTMLElement;
                    if (playButton) playButton.click();
                  }).catch(() => {});
                }
              } catch (e) {
                console.warn("[Puppeteer] Auto play evaluation failed", e);
              }
            }, 2000);
          }
        } catch {}
      });

      // Set up CDPSession screencast
      cdpSession = await page.target().createCDPSession();
      await cdpSession.send("Page.startScreencast", {
        format: "jpeg",
        quality: 40,
        maxWidth: 800,
        maxHeight: 450,
        everyNthFrame: 5
      });

      cdpSession.on("Page.screencastFrame", ({ data, sessionId }: any) => {
        sendToClient({ type: "frame", data: `data:image/jpeg;base64,${data}` });
        cdpSession.send("Page.ackScreencastFrame", { sessionId }).catch(() => {});
      });

      // Synchronize immediate URL and Title specs
      sendToClient({ type: "url", url: page.url() });
      try {
        const title = await page.title();
        sendToClient({ type: "title", title });
      } catch {}

      if (!isExisting) {
        // Go to Google Search initially
        await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
      }
      sendToClient({ type: "status", text: "Ready to browse!" });

    } catch (err: any) {
      console.error("[WebSocket] Puppeteer setup error:", err);
      sendToClient({ type: "error", message: `Screencast Browser initialization failed: ${err?.message || err}` });
    }

    ws.on("message", async (messageData: string) => {
      if (!page) return;
      
      try {
        const msg = JSON.parse(messageData);
        switch (msg.type) {
          case "navigate": {
            let targetUrl = msg.url.trim();
            if (targetUrl) {
              if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl = "https://" + targetUrl;
              }
              sendToClient({ type: "status", text: "Loading page..." });
              await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch((e: any) => {
                console.warn("[Puppeteer] Navigation warn:", e.message);
              });
            }
            break;
          }
          case "click": {
            const targetX = Math.round(msg.x * 1280);
            const targetY = Math.round(msg.y * 720);
            await page.mouse.click(targetX, targetY);
            break;
          }
          case "hover": {
            const targetX = Math.round(msg.x * 1280);
            const targetY = Math.round(msg.y * 720);
            await page.mouse.move(targetX, targetY);
            break;
          }
          case "scroll": {
            await page.evaluate((deltaY: number) => {
              window.scrollBy(0, deltaY);
            }, msg.deltaY || 100);
            break;
          }
          case "key": {
            if (msg.key) {
              await page.keyboard.press(msg.key);
            }
            break;
          }
          case "type": {
            if (msg.text) {
              await page.keyboard.type(msg.text);
            }
            break;
          }
          case "back": {
            await page.goBack().catch(() => {});
            break;
          }
          case "forward": {
            await page.goForward().catch(() => {});
            break;
          }
          case "refresh": {
            await page.reload().catch(() => {});
            break;
          }
          case "toggle-play": {
            console.log("[WebSocket] Manual Command: toggle-play");
            await page.evaluate(() => {
              const video = document.querySelector("video");
              if (video) {
                if (video.paused) {
                  video.play().catch(() => {});
                } else {
                  video.pause();
                }
              }
            }).catch(() => {});
            break;
          }
          case "toggle-mute": {
            console.log("[WebSocket] Manual Command: toggle-mute");
            await page.evaluate(() => {
              const video = document.querySelector("video");
              if (video) {
                video.muted = !video.muted;
              }
            }).catch(() => {});
            break;
          }
          case "skip-ad": {
            console.log("[WebSocket] Manual Command: skip-ad");
            await page.evaluate(() => {
              const skipBtn = document.querySelector(".ytp-ad-skip-button, .ytp-ad-skip-button-hover, .ytp-ad-skip-button-text") as HTMLElement;
              if (skipBtn) {
                skipBtn.click();
              }
            }).catch(() => {});
            break;
          }
        }
      } catch (err: any) {
        console.error("[WebSocket] Command dispatch error:", err);
      }
    });

    ws.on("close", async () => {
      console.log("[WebSocket] Client connection closed. Keeping activePage alive.");
      isActive = false;
      if (cdpSession) {
        await cdpSession.send("Page.stopScreencast").catch(() => {});
      }
      // Keep the activePage alive so programmatic tools and subsequent UI views share the state.
      if (page && page !== activePage) {
        await page.close().catch(() => {});
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
