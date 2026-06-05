import { Message, Role } from "../types";

export function getLatestWidget(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === Role.MODEL) {
      const widgetMatch = msg.content.match(/:::widget\[(.*?)\]\n([\s\S]*?)(\n:::|$)/);
      if (widgetMatch) {
         return { type: widgetMatch[1], configStr: widgetMatch[2], msgId: msg.id };
      }
      
      const codeMatch = msg.content.match(/```(chart|html|web|react|mermaid|diagram|widget)\n([\s\S]*?)(\n```|$)/);
      if (codeMatch) {
         let widgetType = codeMatch[1];
         const configStr = codeMatch[2];
         if (widgetType === "mermaid" || widgetType === "diagram") widgetType = "mermaid";
         else if (widgetType === "html" || widgetType === "web" || widgetType === "react") widgetType = "html";
         else if (widgetType === "widget") {
           try {
             const p = JSON.parse(configStr);
             if (p.type) widgetType = p.type;
           } catch(e) {}
         }
         return { type: widgetType, configStr, msgId: msg.id };
      }
    }
  }
  return null;
}
