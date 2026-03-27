import React, { useEffect, useState, useRef } from 'react';
import { buildWidgetHtml } from '../services/widgetHtmlBuilder';

interface WidgetRendererProps {
    type: string;
    configStr: string;
}

export const WidgetRenderer = React.memo<WidgetRendererProps>(({ type, configStr }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastHtmlRef = useRef<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    // Detect theme
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    checkTheme();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        try {
            // Robust JSON cleaning
            let cleanConfigStr = configStr.trim();
            
            // 1. Remove potential markdown code block markers
            if (cleanConfigStr.startsWith('```')) {
                cleanConfigStr = cleanConfigStr.replace(/^```(\w+)?\n/, '').replace(/\n```$/, '');
            }

            // 2. Check for HTML content (common LLM error)
            if (cleanConfigStr.trim().startsWith('<')) {
                throw new Error("Received HTML instead of JSON configuration. Please check the agent's output.");
            }

            // 3. Fix literal newlines/tabs inside string literals
            // This regex finds content between double quotes and replaces literal control chars
            cleanConfigStr = cleanConfigStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
                return match
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
            });

            // 4. Remove trailing commas in objects and arrays
            cleanConfigStr = cleanConfigStr.replace(/,\s*([\}\]])/g, '$1');

            const config = JSON.parse(cleanConfigStr);
            
            // Build the HTML string with theme support
            const html = buildWidgetHtml(type, config, isDark ? 'dark' : 'light');
            
            // ONLY update if the HTML content has actually changed
            if (html === lastHtmlRef.current && blobUrl) {
                return;
            }
            
            // Revoke old URL if it exists
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }

            lastHtmlRef.current = html;

            // Create a Blob and URL
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            blobUrlRef.current = url;
            setBlobUrl(url);
            setError(null);
        } catch (err: any) {
            console.error('Failed to parse widget config:', err);
            setError(`Invalid widget configuration: ${err.message}`);
        }
    }, [type, configStr, isDark, blobUrl]);

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
                <div className="font-bold mb-1">Widget Error</div>
                <div className="opacity-80">{error}</div>
                <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto text-[10px]">
                    {configStr}
                </pre>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div className="my-6 h-64 flex items-center justify-center rounded-lg border border-pplx-border bg-pplx-secondary/20 animate-pulse">
                <span className="text-pplx-muted text-sm">Loading interactive widget...</span>
            </div>
        );
    }

    return (
        <div className={`my-6 overflow-hidden ${isDark ? 'bg-[#191919]' : 'bg-white'}`}>
            <div className={`px-0 py-1.5 flex items-center justify-between mb-2`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {type === 'mermaid' || type === 'diagram' ? 'Diagram' : 'Interactive Chart'}
                </span>
            </div>
            <iframe
                ref={iframeRef}
                src={blobUrl}
                sandbox="allow-scripts"
                className={`w-full h-80 md:h-96 border-0 ${isDark ? 'bg-[#191919]' : 'bg-white'}`}
                title="Interactive Widget"
                loading="lazy"
            />
        </div>
    );
});
