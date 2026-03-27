
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { Copy } from 'lucide-react';
import { WidgetRenderer } from './WidgetRenderer';

// Plugin to handle :::widget[type]{config}
function remarkWidgetPlugin() {
    return (tree: any) => {
        visit(tree, (node) => {
            if (
                node.type === 'textDirective' ||
                node.type === 'leafDirective' ||
                node.type === 'containerDirective'
            ) {
                if (node.name !== 'widget') return;

                const data = node.data || (node.data = {});
                
                // The type is passed in the brackets: :::widget[chart]
                let widgetType = 'unknown';
                let configStr = '{}';
                
                if (node.type === 'containerDirective') {
                    const labelChild = node.children.find((c: any) => c.data && c.data.directiveLabel);
                    if (labelChild && labelChild.children && labelChild.children.length > 0) {
                        widgetType = labelChild.children[0].value;
                    }

                    // Extract text from children (excluding the label)
                    const extractText = (n: any): string => {
                        if (n.type === 'text' || n.type === 'code') return n.value;
                        if (n.children) return n.children.map(extractText).join('');
                        return '';
                    };
                    
                    const contentNodes = node.children.filter((c: any) => !(c.data && c.data.directiveLabel));
                    configStr = contentNodes.map(extractText).join('\n');
                } else if (node.type === 'leafDirective' || node.type === 'textDirective') {
                    if (node.children && node.children.length > 0) {
                        widgetType = node.children[0].value;
                    }
                }

                data.hName = 'custom-widget';
                data.hProperties = {
                    widgetType: widgetType,
                    configStr: configStr
                };
            }
        });
    };
}

interface MessageRendererProps {
    content: string;
}

export const MessageRenderer = React.memo<MessageRendererProps>(({ content }) => {
    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkDirective, remarkWidgetPlugin]}
            components={{
                // @ts-ignore
                'custom-widget': ({ node, widgetType, configStr, ...props }) => {
                    return <WidgetRenderer type={widgetType as string} configStr={configStr as string} />;
                },
                p: ({node, ...props}) => {
                    // Check if paragraph contains a custom-widget to avoid validateDOMNesting warning
                    const hasWidget = node?.children?.some((child: any) => child.tagName === 'custom-widget');
                    if (hasWidget) {
                        return <div className="mb-6 leading-7 md:leading-8 text-pplx-text font-normal text-[15px] md:text-[16px]" {...props} />;
                    }
                    return <p className="mb-6 leading-7 md:leading-8 text-pplx-text font-normal text-[15px] md:text-[16px]" {...props} />;
                },
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-6 space-y-2 text-pplx-text" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-pplx-text" {...props} />,
                li: ({node, ...props}) => <li className="pl-1 leading-7" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-8 text-pplx-text pb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-6 text-pplx-text" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 text-pplx-text" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-pplx-accent pl-4 italic my-4 text-pplx-muted bg-pplx-secondary/40 py-2 pr-2 rounded-r-lg" {...props} />,
                code: ({node, ...props}) => {
                    const match = /language-(\w+)/.exec(props.className || '')
                    // @ts-ignore
                    const isInline = !match && !String(props.children).includes('\n');
                    const lang = match?.[1] || '';
                    
                    if (!isInline && (lang === 'chart' || lang === 'widget' || lang === 'mermaid' || lang === 'diagram')) {
                        return <WidgetRenderer type={lang === 'mermaid' || lang === 'diagram' ? 'mermaid' : 'chart'} configStr={String(props.children)} />;
                    }

                    return isInline ? <code className="bg-pplx-secondary text-pplx-accent px-1.5 py-0.5 rounded text-sm font-mono border border-pplx-border" {...props} /> : <div className="relative my-6 rounded-lg overflow-hidden border border-pplx-border bg-pplx-card shadow-sm"><div className="flex items-center justify-between px-4 py-2 bg-pplx-hover/40 border-b border-pplx-border"><span className="text-xs text-pplx-muted font-mono lowercase">{lang || 'code'}</span><button onClick={() => navigator.clipboard.writeText(String(props.children))} className="flex items-center gap-1.5 text-xs text-pplx-muted hover:text-pplx-text transition-colors"><Copy size={12} /> Copy</button></div><pre className="p-4 overflow-x-auto text-sm text-pplx-text font-mono leading-relaxed custom-scrollbar"><code className={props.className} {...props} /></pre></div>
                },
                table: ({node, ...props}) => (<div className="my-6 w-full overflow-hidden rounded-lg border border-pplx-border shadow-sm"><div className="overflow-x-auto"><table className="w-full border-collapse text-sm text-left" {...props} /></div></div>),
                thead: ({node, ...props}) => <thead className="bg-pplx-secondary text-pplx-text font-semibold uppercase tracking-wider text-xs" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 border-b border-pplx-border whitespace-nowrap" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 border-b border-pplx-border text-pplx-text align-top leading-relaxed" {...props} />,
                a: ({node, ...props}) => <a className="text-pplx-accent hover:underline decoration-pplx-accent underline-offset-2 transition-all font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                hr: ({node, ...props}) => <hr className="my-8 border-t border-pplx-border" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    );
});
