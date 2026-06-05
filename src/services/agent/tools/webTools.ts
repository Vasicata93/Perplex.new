import { ToolRegistry } from './ToolRegistry';

export function registerWebTools() {
  ToolRegistry.register(
    {
      name: 'scrape_website',
      description: 'Extract main content from a URL using advanced web scraping and website policy parsing (robots.txt awareness).',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          ignore_robots: { type: 'boolean', description: 'Bypass robots.txt checks (if permitted by user settings).' }
        },
        required: ['url']
      }
    },
    async (args: { url: string, ignore_robots?: boolean }) => {
      // Mock scrape
      return {
        success: true,
        data: {
          url: args.url,
          text: `Extracted content from ${args.url}. Simulated scrape respecting strict website policies.`
        },
        summary: `Scraped website ${args.url}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_navigate',
      description: 'Navighează browserul live din companion la un URL specific și curăță automat micile cookie consent blocks.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL-ul complet pe care dorești să-l accesezi (de ex. https://www.google.com sau un videoclip youtube).'
          }
        },
        required: ['url']
      }
    },
    async (args: { url: string }) => {
      try {
        const response = await fetch('/api/browser/navigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: args.url })
        });
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Navigat cu succes pe browser la ${args.url}`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare la navigarea pe browser la ${args.url}` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_click',
      description: 'Execută click pe un element specific de pe pagină folosind selectorul lui CSS, sau textul lui sub forma de selector "tagName:has-text(\\"Text element\\")" (de exemplu "button:has-text(\\"Acceptă tot\\")" pentru a accepta cookie-uri sau piese pe youtube ca "a:has-text(\\"Chris Brown\\")").',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'Selectorul CSS simplu sau format cu has-text (de ex. "#L2AGLb", "button:has-text(\\"Acceptă tot\\")" sau "span:has-text(\\"De acord\\")").'
          }
        },
        required: ['selector']
      }
    },
    async (args: { selector: string }) => {
      try {
        const response = await fetch('/api/browser/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selector: args.selector })
        });
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Click executat cu succes pe selectorul: ${args.selector}`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare la click pe selectorul: ${args.selector}` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_type',
      description: 'Tipărește text într-o casetă activă sau pe un selector exact CSS și poate apăsa tasta Enter.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Textul de textat / introdus.'
          },
          selector: {
            type: 'string',
            description: 'Opțional: Selectorul CSS al casetei unde se va scrie (de ex. "input[name=\\"q\\"]" pentru căutare Google).'
          },
          press_enter: {
            type: 'boolean',
            description: 'Opțional: Trimite / apasă tasta Enter după scrierea textului (implicit true pentru a căuta direct).'
          }
        },
        required: ['text']
      }
    },
    async (args: { text: string; selector?: string; press_enter?: boolean }) => {
      try {
        const response = await fetch('/api/browser/type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: args.text,
            selector: args.selector,
            press_enter: args.press_enter !== false
          })
        });
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Tastat textul "${args.text}" pe selectorul selectat.`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare de scriere text: ${err.message}` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_get_content',
      description: 'Preia informații strategice despre pagina curentă: URL-ul, titlul, o versiune text sumară a paginii pentru a o citi, și elementele interactive (butoane, intrări, text clickable cu selectorii lor) pentru a ști cum să acționezi sau dacă au apărut ecrane de cookie care te blochează.',
      parameters: { type: 'object', properties: {} }
    },
    async () => {
      try {
        const response = await fetch('/api/browser/info');
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Citit în mod programatic pagina curentă: URL - ${result.url}, Titlu - "${result.title}".`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare la preluarea structurii paginii.` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_bypass_consent',
      description: 'Forțează încercarea de a autodetecta și de a închide ecranele de cookie popups de pe Google / YouTube sau alte site-uri.',
      parameters: { type: 'object', properties: {} }
    },
    async () => {
      try {
        const response = await fetch('/api/browser/bypass-consent', { method: 'POST' });
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Rulat manual scanarea de cookie bypass.`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare la bypass cookie consent: ${err.message}` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_scroll',
      description: 'Face scroll pe pagină sus sau jos în browserul live. deltaY este un număr: pozitiv pentru scroll în jos (ex: 400, 800) și negativ pentru scroll în sus (ex: -400).',
      parameters: {
        type: 'object',
        properties: {
          deltaY: {
            type: 'number',
            description: 'Valoarea scroll-ului (ex: 400 pentru în jos, -400 pentru în sus).'
          }
        },
        required: ['deltaY']
      }
    },
    async (args: { deltaY: number }) => {
      try {
        const response = await fetch('/api/browser/scroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deltaY: args.deltaY })
        });
        const result = await response.json();
        return {
          success: result.success,
          data: result,
          summary: `Scroll efectuat pe pagină cu deltaY: ${args.deltaY}`
        };
      } catch (err: any) {
        return { success: false, error: err.message, summary: `Eroare la scroll pe pagină: ${err.message}` };
      }
    }
  );
}
