import React, { useEffect, useState, useRef } from 'react';
import { buildWidgetHtml } from '../services/widgetHtmlBuilder';

interface WidgetRendererProps {
    type: string;
    configStr: string;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ type, configStr }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        try {
            // Parse the JSON config provided by the agent
            const config = JSON.parse(configStr);
            
            // Build the HTML string
            const html = buildWidgetHtml(type, config);
            
            // Create a Blob and URL
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            setBlobUrl(url);
            setError(null);

            // Cleanup
            return () => {
                URL.revokeObjectURL(url);
            };
        } catch (err: any) {
            console.error('Failed to parse widget config:', err);
            setError(`Invalid widget configuration: ${err.message}`);
        }
    }, [type, configStr]);

    if (error) {
        return (
            <div className="my-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-mono">
                {error}
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
        <div className="my-6 rounded-lg border border-pplx-border bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Interactive Chart</span>
            </div>
            <iframe
                ref={iframeRef}
                src={blobUrl}
                sandbox="allow-scripts"
                className="w-full h-80 md:h-96 border-0 bg-white"
                title="Interactive Widget"
                loading="lazy"
            />
        </div>
    );
};
