import React, { useEffect, useState, useRef } from "react";
import { Copy, ExternalLink, Download, Code, MousePointerClick, Maximize, Save, Github, History, X } from "lucide-react";
import { buildWidgetHtml } from "../services/widgetHtmlBuilder";
import { PortfolioDashboard } from "./portfolio/PortfolioDashboard";
import SafeDigitalPage from "./safedigital/SafeDigitalPage";
import { Tooltip } from "./Tooltip";

interface WidgetRendererProps {
  type: string;
  configStr: string;
  isFullscreen?: boolean;
  onCloseFullscreen?: () => void;
}

export const WidgetRenderer = React.memo<WidgetRendererProps>(
  ({ type, configStr, isFullscreen = false, onCloseFullscreen }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);
    const [height, setHeight] = useState<number>(400); // Default height
    const [isEditing, setIsEditing] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [localConfig, setLocalConfig] = useState(configStr);
    const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
    
    // Update local config if prop changes
    useEffect(() => {
        setLocalConfig(configStr);
    }, [configStr]);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastHtmlRef = useRef<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    // Listen for resize messages from the iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (!event.data) return;
        
        if (event.data.type === "WIDGET_RESIZE" && typeof event.data.height === "number") {
          // Set height exactly to prevent infinite expansion loops
          setHeight(Math.ceil(event.data.height));
        }
        
        if (event.data.type === "WIDGET_SELECTED_ELEMENT") {
             const selector = event.data.selector;
             const outerHtml = event.data.html;
             const attachmentContent = `SELECTOR: ${selector}\n\nHTML CODE:\n${outerHtml}`;
             const attachment = {
                type: "text",
                content: attachmentContent,
                mimeType: "text/html",
                name: "element_selectat.html"
             };
             window.dispatchEvent(new CustomEvent('append-to-input', { detail: { text: "Te rog să modifici codul elementului selectat.", attachment }}));
        }

        if (event.data.type === "WIDGET_SELECT_DISABLED") {
             setIsSelectMode(false);
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, []);

    useEffect(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
         iframeRef.current.contentWindow.postMessage({ type: 'TOGGLE_SELECT_MODE', enabled: isSelectMode }, '*');
      }
    }, [isSelectMode]);

    // Listen for side chat close to reset edit/select states
    useEffect(() => {
      const handleSideChatClosed = () => {
        setIsEditing(false);
        setIsSelectMode(false);
      };
      
      window.addEventListener('side-chat-closed', handleSideChatClosed);
      return () => window.removeEventListener('side-chat-closed', handleSideChatClosed);
    }, []);

    // Detect theme
    useEffect(() => {
      const checkTheme = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };

      checkTheme();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            checkTheme();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const timerId = setTimeout(() => {
        try {
          // Robust JSON cleaning
          let cleanConfigStr = localConfig.trim();

          // 1. Remove potential markdown code block markers
          if (cleanConfigStr.startsWith("```")) {
            cleanConfigStr = cleanConfigStr
              .replace(/^```(\w+)?\n/, "")
              .replace(/\n```$/, "");
          }

          // 2. Check for HTML content (common LLM error)
          if (cleanConfigStr.trim().startsWith("<") && !["html", "web", "react", "widget", "chart"].includes(type)) {
            throw new Error(
              "Received HTML instead of JSON configuration. Please check the agent's output.",
            );
          }

          // 3. Aggressive cleaning for common LLM JSON errors
          const aggressiveClean = (str: string) => {
            let s = str.trim();

            // 1. Fix smart quotes
            s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

            // 2. Remove comments
            s = s.replace(/\/\/.*$/gm, "");
            s = s.replace(/\/\*[\s\S]*?\*\//g, "");

            // 3. Fix literal newlines/tabs inside string literals
            s = s.replace(/(["'])([\s\S]*?)(?<!\\)\1/g, (_, quote, content) => {
              return (
                quote +
                content
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r")
                  .replace(/\t/g, "\\t") +
                quote
              );
            });

            // 4. Fix unquoted keys (more robustly)
            s = s.replace(/([{,]\s*)([a-zA-Z0-9_\-]+)(\s*:)/g, '$1"$2"$3');

            // 5. Fix single quotes on keys/values
            s = s.replace(/([{,]\s*)'([^']*)'(\s*:)/g, '$1"$2"$3'); // Keys
            s = s.replace(/(:\s*)'([^']*)'(\s*[,}\]])/g, '$1"$2"$3'); // Values

            // 6. Fix missing commas between key-value pairs or array elements
            s = s.replace(
              /(["\d\}\]]|true|false|null)\s*\n?\s*(["\{\[\d]|true|false|null)/g,
              "$1, $2",
            );

            // 7. Handle truncated JSON
            const quoteCount = (s.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              s += '"';
            }

            const openBraces = (s.match(/\{/g) || []).length;
            const closeBraces = (s.match(/\}/g) || []).length;
            if (openBraces > closeBraces) {
              s += "}".repeat(openBraces - closeBraces);
            }

            const openBrackets = (s.match(/\[/g) || []).length;
            const closeBrackets = (s.match(/\]/g) || []).length;
            if (openBrackets > closeBrackets) {
              s += "]".repeat(openBrackets - closeBrackets);
            }

            // 8. Remove trailing commas
            s = s.replace(/,\s*([\}\]])/g, "$1");

            // 9. Fix non-JSON values
            s = s.replace(/\bundefined\b/g, "null");
            s = s.replace(/\bNaN\b/g, "null");
            s = s.replace(/\bInfinity\b/g, "null");

            // 10. Fix functions
            s = s.replace(/function\s*\([^\)]*\)\s*\{[^}]*\}/g, "null");

            return s;
          };

          // 4. Stack-based JSON extractor
          const extractJson = (str: string) => {
            let s = str.trim();
            // Skip :::widget[...] prefix if present (fallback for malformed blocks)
            if (s.startsWith(":::widget")) {
              const closingBracket = s.indexOf("]");
              if (closingBracket !== -1) {
                s = s.substring(closingBracket + 1);
              }
            }

            const firstBrace = s.indexOf("{");
            const firstBracket = s.indexOf("[");
            let start = -1;

            if (
              firstBrace !== -1 &&
              (firstBracket === -1 || firstBrace < firstBracket)
            ) {
              start = firstBrace;
            } else if (firstBracket !== -1) {
              start = firstBracket;
            }

            if (start === -1) return null;

            let stack = 0;
            let inString = false;
            let escape = false;
            let quoteChar = "";

            for (let i = start; i < s.length; i++) {
              const c = s[i];
              if (escape) {
                escape = false;
                continue;
              }
              if (c === "\\") {
                escape = true;
                continue;
              }
              if (inString) {
                if (c === quoteChar) inString = false;
                continue;
              }
              if (c === '"' || c === "'") {
                inString = true;
                quoteChar = c;
                continue;
              }
              if (c === "{" || c === "[") stack++;
              else if (c === "}" || c === "]") {
                stack--;
                if (stack === 0) return s.substring(start, i + 1);
              }
            }
            return s.substring(start); // Return truncated if not balanced
          };

          let config;
          if (type === "mermaid" || type === "diagram" || type === "html" || type === "web" || type === "react") {
            try {
              config = JSON.parse(cleanConfigStr);
            } catch (e) {
              config = cleanConfigStr;
            }
          } else {
            // Try multiple parsing strategies
            const strategies = [
              () => JSON.parse(cleanConfigStr),
              () => JSON.parse(aggressiveClean(cleanConfigStr)),
              () => {
                const extracted = extractJson(cleanConfigStr);
                if (!extracted) throw new Error("No JSON structure found");
                return JSON.parse(extracted);
              },
              () => {
                const extracted = extractJson(cleanConfigStr);
                if (!extracted) throw new Error("No JSON structure found");
                return JSON.parse(aggressiveClean(extracted));
              },
            ];

            let lastError = null;
            for (const strategy of strategies) {
              try {
                config = strategy();
                break;
              } catch (e) {
                lastError = e;
              }
            }

            if (!config) {
              // Fallback: If parsing failed but string looks like HTML, treat as HTML
              if (cleanConfigStr.trim().startsWith("<") || cleanConfigStr.includes("</div>") || cleanConfigStr.includes("</script>")) {
                config = cleanConfigStr;
                // Force type to html for the builder
                type = "html";
              } else {
                throw lastError || new Error("Failed to parse configuration");
              }
            }
          }

          // Build the HTML string with theme support
          const html = buildWidgetHtml(type, config, isDark ? "dark" : "light");

          // ONLY update if the HTML content has actually changed
          if (html === lastHtmlRef.current && blobUrlRef.current) {
            return;
          }

          // Revoke old URL if it exists
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }

          lastHtmlRef.current = html;

          // Create a Blob and URL
          const blob = new Blob([html], { type: "text/html" });
          const url = URL.createObjectURL(blob);

          blobUrlRef.current = url;
          setBlobUrl(url);
          setError(null);
        } catch (err: any) {
          // Only show error if we haven't successfully rendered anything yet.
          // This prevents the UI from violently flashing between an iframe and an error div
          // during streaming when the JSON is temporarily malformed.
          if (!blobUrlRef.current) {
            setError(`Invalid widget configuration: ${err.message}`);
          }
        }
      }, 600); // 600ms debounce to prevent iframe reloading jitter during streaming

      return () => clearTimeout(timerId);
    }, [type, localConfig, isDark]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
      };
    }, []);

    if (error) {
      return (
        <div className="my-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold">Widget Error</div>
            <button
              onClick={() => navigator.clipboard.writeText(configStr)}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-[10px] transition-colors flex items-center gap-1"
            >
              <Copy size={10} /> Copy Config
            </button>
          </div>
          <div className="opacity-80 mb-2">{error}</div>
          <pre className="p-2 bg-black/20 rounded overflow-x-auto text-[10px] max-h-40 custom-scrollbar">
            {configStr}
          </pre>
        </div>
      );
    }

    if (type === "portfolio-dashboard") {
      return (
        <div className="my-6 rounded-3xl overflow-hidden border border-pplx-border shadow-2xl">
          <PortfolioDashboard />
        </div>
      );
    }

    if (type === "safe-digital") {
      return (
        <div className="my-6 rounded-3xl overflow-hidden border border-pplx-border shadow-2xl">
          <SafeDigitalPage />
        </div>
      );
    }

    if (!blobUrl) {
      return (
        <div className="my-6 h-64 flex items-center justify-center rounded-lg border border-pplx-border bg-pplx-secondary/20 animate-pulse">
          <span className="text-pplx-muted text-sm">
            Loading interactive widget...
          </span>
        </div>
      );
    }

    const showToolbar = isFullscreen || ['html', 'web', 'react', 'dashboard'].includes(type?.toLowerCase());

    return (
      <div className={`${isFullscreen ? 'w-full h-full flex flex-col bg-white dark:bg-pplx-primary' : 'my-2'} group/widgetWrapper ${isEditing || isSelectMode ? 'active-widget' : ''}`}>
        {/* Actions Toolbar - Above the widget */}
        {showToolbar && (
        <div className={`flex items-center justify-between opacity-100 transition-opacity ${isFullscreen ? 'px-4 py-3 border-b border-pplx-border shrink-0 bg-pplx-card/50 backdrop-blur-md' : 'mb-3 justify-end gap-1.5 relative'}`}>
          
          {isFullscreen ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-pplx-accent animate-pulse" />
              <span className="text-[12px] font-bold text-pplx-text tracking-wider uppercase opacity-80">Workspace Diagram</span>
              <span className="px-2 py-0.5 rounded-md bg-pplx-secondary/80 border border-pplx-border text-[9px] text-pplx-muted font-mono uppercase tracking-tighter">{type}</span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-2 flex-nowrap">
            
            {isFullscreen && (
              <div className="flex items-center gap-2 mr-1">
                <button
                  onMouseEnter={() => setHoveredTooltip("history")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  className="relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center"
                >
                  <History size={16} />
                  {hoveredTooltip === "history" && <Tooltip text="Istoric Versiuni" position="bottom" />}
                </button>

                <button
                  onMouseEnter={() => setHoveredTooltip("github")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  onClick={() => {
                    window.open("https://github.com", "_blank");
                  }}
                  className="relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center"
                >
                  <Github size={16} />
                  {hoveredTooltip === "github" && <Tooltip text="Deschide în GitHub" position="bottom" />}
                </button>
              </div>
            )}

            <button
              onMouseEnter={() => setHoveredTooltip("external")}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => {
                if (blobUrl) {
                  window.open(blobUrl, "_blank");
                }
              }}
              className={`relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border shadow-sm'}`}
            >
              <ExternalLink size={16} />
              {hoveredTooltip === "external" && <Tooltip text="Deschide în tab nou" position="bottom" />}
            </button>
            
            <div className="relative">
              <button
                onMouseEnter={() => setHoveredTooltip("download")}
                onMouseLeave={() => setHoveredTooltip(null)}
                onClick={() => {
                  const menu = document.getElementById(`download-menu-${blobUrl}`);
                  if (menu) menu.classList.toggle('hidden');
                }}
                className={`relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border shadow-sm'}`}
              >
                <Download size={16} />
                {hoveredTooltip === "download" && <Tooltip text="Descarcă" position="bottom" />}
              </button>
                  <div id={`download-menu-${blobUrl}`} className="hidden absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-pplx-border rounded-lg shadow-xl overflow-hidden z-[100]">
                 <button className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover transition-colors" onClick={(e) => {
                    if (lastHtmlRef.current) {
                      const blob = new Blob([lastHtmlRef.current], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `widget-${Date.now()}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    e.currentTarget.parentElement?.classList.add('hidden');
                 }}>HTML</button>
                 <button className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover transition-colors" onClick={(e) => {
                    if (iframeRef.current && iframeRef.current.contentWindow) {
                      iframeRef.current.contentWindow.focus();
                      iframeRef.current.contentWindow.print();
                    }
                    e.currentTarget.parentElement?.classList.add('hidden');
                 }}>PDF / Print</button>
                 <button className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover transition-colors" onClick={(e) => {
                    const blob = new Blob([localConfig], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Component-${Date.now()}.tsx`;
                    a.click();
                    URL.revokeObjectURL(url);
                    e.currentTarget.parentElement?.classList.add('hidden');
                 }}>React (.tsx)</button>
              </div>
            </div>

            <button
              onMouseEnter={() => setHoveredTooltip("save")}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => {
                 window.dispatchEvent(new CustomEvent('save-artifact-to-library', {
                    detail: {
                       content: `:::widget[${type}]\n${configStr}\n:::`,
                       title: `Widget ${type}`
                    }
                 }));
              }}
              className={`relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border shadow-sm'}`}
            >
              <Save size={16} />
              {hoveredTooltip === "save" && <Tooltip text="Salvează" position="bottom" />}
            </button>

            <button
              onMouseEnter={() => setHoveredTooltip("element")}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => {
                if (!isFullscreen) {
                   window.dispatchEvent(new CustomEvent('request-fullscreen-widget', { detail: { open: true } }));
                }
                const newMode = !isSelectMode;
                if (!isEditing) {
                  setIsSelectMode(newMode);
                  if (newMode) {
                     window.dispatchEvent(new CustomEvent('toggle-side-chat', { detail: { open: true } }));
                  }
                }
              }}
              className={`relative p-1.5 rounded-md transition-colors shadow-sm flex items-center justify-center ${
                isSelectMode 
                  ? "bg-pplx-accent text-white" 
                  : `text-pplx-muted hover:text-pplx-text hover:bg-black/5 dark:hover:bg-white/10 ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border'}`
              }`}
              disabled={isEditing}
            >
              <MousePointerClick size={16} />
              {hoveredTooltip === "element" && <Tooltip text="Alege Element Vizual Pentru AI" position="bottom" />}
            </button>

            <button
              onMouseEnter={() => setHoveredTooltip("code")}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => {
                 if (!isFullscreen) {
                    window.dispatchEvent(new CustomEvent('request-fullscreen-widget', { detail: { open: true } }));
                 }
                 const newMode = !isEditing;
                 setIsEditing(newMode);
                 if (newMode) {
                    window.dispatchEvent(new CustomEvent('toggle-side-chat', { detail: { open: true } }));
                 }
                 if (newMode) setIsSelectMode(false);
              }}
              className={`relative p-1.5 rounded-md transition-colors shadow-sm flex items-center justify-center ${
                isEditing 
                  ? "bg-pplx-accent text-white" 
                  : `text-pplx-muted hover:text-pplx-text hover:bg-black/5 dark:hover:bg-white/10 ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border'}`
              }`}
            >
              <Code size={16} />
              {hoveredTooltip === "code" && <Tooltip text="Previzualizare / Cod" position="bottom" />}
            </button>

            <button
              onMouseEnter={() => setHoveredTooltip("copy")}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => {
                 if (lastHtmlRef.current && !isEditing) {
                    navigator.clipboard.writeText(lastHtmlRef.current);
                 } else {
                    navigator.clipboard.writeText(localConfig);
                 }
              }}
              className={`relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-pplx-muted hover:text-pplx-text flex items-center justify-center ${!isFullscreen && 'bg-pplx-primary/80 backdrop-blur border border-pplx-border shadow-sm'}`}
            >
              <Copy size={16} />
              {hoveredTooltip === "copy" && <Tooltip text="Copiază" position="bottom" />}
            </button>

            {!isFullscreen ? (
              <button
                onMouseEnter={() => setHoveredTooltip("fullscreen")}
                onMouseLeave={() => setHoveredTooltip(null)}
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('request-fullscreen-widget', { detail: { open: true } }));
                   window.dispatchEvent(new CustomEvent('toggle-side-chat', { detail: { open: true } }));
                }}
                className="relative p-1.5 hover:bg-black/5 dark:hover:bg-white/10 bg-pplx-primary/80 backdrop-blur border border-pplx-border rounded-md text-pplx-muted hover:text-pplx-text transition-colors shadow-sm flex items-center justify-center"
              >
                <Maximize size={16} />
                {hoveredTooltip === "fullscreen" && <Tooltip text="Editare / Fullscreen" position="bottom" />}
              </button>
            ) : (
              <>
                <div className="w-px h-5 bg-pplx-border mx-1" />
                <button
                  onMouseEnter={() => setHoveredTooltip("close")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  onClick={() => {
                    if (onCloseFullscreen) onCloseFullscreen();
                  }}
                  className="relative p-1.5 hover:bg-red-500/10 text-pplx-muted hover:text-red-500 rounded-md transition-colors flex items-center justify-center"
                >
                  <X size={16} />
                  {hoveredTooltip === "close" && <Tooltip text="Închide Fullscreen" position="bottom" />}
                </button>
              </>
            )}
          </div>
        </div>
        )}

        <div className={`relative overflow-hidden flex-1 flex flex-col !border-none !outline-none !shadow-none ${isFullscreen ? 'w-full h-full bg-white dark:bg-pplx-primary' : 'bg-transparent'}`} 
             style={isFullscreen ? { height: '100%', minHeight: 0 } : { height: isEditing ? `${height}px` : 'auto' }}>
        {isEditing ? (
          <div className="absolute inset-0 bg-pplx-bg/95 backdrop-blur-md p-4 flex flex-col z-50 h-full">
             <div className="flex justify-between items-center mb-2 shrink-0">
                 <span className="text-sm font-semibold text-pplx-text flex items-center gap-2">
                    <Code size={16} /> Editor Cod
                 </span>
             </div>
             <p className="text-[10px] text-pplx-muted mb-2">
                Modifică direct codul. Selectează Prevzualizare (iconița &lt;/&gt;) pentru a vedea rezultatul. Pentru a folosi AI-ul, selectează Prevzualizarea, apasă pe un element și scrie în chat.
             </p>
             <textarea
               value={localConfig}
               onChange={(e) => setLocalConfig(e.target.value)}
               className="w-full flex-1 bg-black/5 dark:bg-black/40 border border-pplx-border rounded-lg p-3 font-mono text-xs text-pplx-text resize-none focus:outline-none focus:ring-1 focus:ring-pplx-accent/50 custom-scrollbar mb-2"
               placeholder="Editează codul aici..."
             />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            sandbox="allow-scripts allow-same-origin"
            style={isFullscreen ? { height: "100%" } : { height: `${height}px` }}
            className="w-full !border-none !outline-none transition-all duration-500 bg-transparent pointer-events-auto h-full rounded-none"
            title="Interactive Widget"
            loading="lazy"
          />
        )}
      </div>
    </div>
    );
  },
);
