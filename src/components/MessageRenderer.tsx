import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import { Copy } from "lucide-react";
import { WidgetRenderer } from "./WidgetRenderer";

// Plugin to handle :::widget[type]{config}
function remarkWidgetPlugin() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        if (node.name !== "widget") return;

        const data = node.data || (node.data = {});

        // The type is passed in the brackets: :::widget[chart]
        let widgetType = "unknown";
        let configStr = "{}";

        if (node.type === "containerDirective") {
          const labelChild = node.children.find(
            (c: any) => c.data && c.data.directiveLabel,
          );
          if (
            labelChild &&
            labelChild.children &&
            labelChild.children.length > 0
          ) {
            widgetType = labelChild.children[0].value;
          }

          // Extract text from children (excluding the label)
          const extractText = (n: any): string => {
            if (n.type === "text" || n.type === "code") return n.value;
            if (n.children) return n.children.map(extractText).join("");
            return "";
          };

          const contentNodes = node.children.filter(
            (c: any) => !(c.data && c.data.directiveLabel),
          );
          configStr = contentNodes.map(extractText).join("\n");
        } else if (
          node.type === "leafDirective" ||
          node.type === "textDirective"
        ) {
          if (node.children && node.children.length > 0) {
            widgetType = node.children[0].value;
          }
        }

        data.hName = "custom-widget";
        data.hProperties = {
          widgetType: widgetType,
          configStr: configStr,
        };
      }
    });
  };
}

interface MessageRendererProps {
  content: string;
}

export const MessageRenderer = React.memo<MessageRendererProps>(
  ({ content }) => {
    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkDirective, remarkWidgetPlugin]}
          components={{
            // @ts-ignore
            "custom-widget": ({ node, widgetType, configStr, ...props }) => {
              return (
                <div className="mb-8">
                  <WidgetRenderer
                    type={widgetType as string}
                    configStr={configStr as string}
                  />
                </div>
              );
            },
            p: ({ node, children, ...props }) => {
              // Check if paragraph contains a custom-widget to avoid validateDOMNesting warning
              // @ts-ignore
              const hasWidget = node?.children?.some(
                (child: any) => child.tagName === "custom-widget",
              );
              if (hasWidget) {
                return (
                  <div
                    className="mb-6 leading-relaxed text-pplx-text font-normal text-[15px] md:text-[16px]"
                    {...props}
                  >
                    {children}
                  </div>
                );
              }
              return (
                <p
                  className="mb-6 leading-relaxed text-pplx-text font-normal text-[15px] md:text-[16px]"
                  {...props}
                >
                  {children}
                </p>
              );
            },
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc pl-5 mb-6 space-y-2 text-pplx-text leading-relaxed"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal pl-5 mb-6 space-y-2 text-pplx-text leading-relaxed"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            h1: ({ node, ...props }) => (
              <h1
                className="text-3xl font-display font-bold mb-6 mt-10 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-display font-bold mb-4 mt-8 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-xl font-display font-semibold mb-3 mt-6 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-pplx-accent pl-6 italic my-8 text-pplx-text-secondary bg-pplx-bg-secondary py-4 pr-4 rounded-r-2xl"
                {...props}
              />
            ),
            code: ({ node, ...props }) => {
              const match = /language-(\w+)/.exec(props.className || "");
              // @ts-ignore
              const isInline = !match && !String(props.children).includes("\n");
              const lang = match?.[1] || "";

              if (
                !isInline &&
                (lang === "chart" ||
                  lang === "widget" ||
                  lang === "mermaid" ||
                  lang === "diagram")
              ) {
                return (
                  <div className="mb-8">
                    <WidgetRenderer
                      type={
                        lang === "mermaid" || lang === "diagram"
                          ? "mermaid"
                          : "chart"
                      }
                      configStr={String(props.children)}
                    />
                  </div>
                );
              }

              return isInline ? (
                <code
                  className="bg-pplx-bg-secondary text-pplx-accent px-1.5 py-0.5 rounded text-sm font-mono border border-pplx-border"
                  {...props}
                />
              ) : (
                <div className="relative my-8 rounded-2xl overflow-hidden border border-pplx-border bg-pplx-bg shadow-premium">
                  <div className="flex items-center justify-between px-5 py-3 bg-pplx-bg-secondary border-b border-pplx-border">
                    <span className="text-xs text-pplx-text-secondary font-mono font-medium lowercase tracking-wider">
                      {lang || "code"}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(String(props.children))
                      }
                      className="flex items-center gap-1.5 text-xs text-pplx-text-secondary hover:text-pplx-text transition-colors font-medium"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <pre className="p-5 overflow-x-auto text-sm text-pplx-text font-mono leading-relaxed custom-scrollbar">
                    <code className={props.className} {...props} />
                  </pre>
                </div>
              );
            },
            table: ({ node, ...props }) => (
              <div className="my-8 mb-10 w-full overflow-hidden rounded-2xl border border-pplx-border shadow-premium">
                <div className="overflow-x-auto">
                  <table
                    className="w-full border-collapse text-sm text-left"
                    {...props}
                  />
                </div>
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead
                className="bg-pplx-bg-secondary text-pplx-text-secondary font-bold uppercase tracking-[0.1em] text-[10px]"
                {...props}
              />
            ),
            th: ({ node, ...props }) => (
              <th
                className="px-5 py-4 border-b border-pplx-border whitespace-nowrap"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="px-5 py-4 border-b border-pplx-border text-pplx-text align-top leading-relaxed"
                {...props}
              />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-pplx-accent hover:text-pplx-accent-hover underline decoration-pplx-accent/30 hover:decoration-pplx-accent underline-offset-4 transition-all font-semibold"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            hr: ({ node, ...props }) => (
              <hr className="my-10 border-t border-pplx-border" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </>
    );
  },
);
