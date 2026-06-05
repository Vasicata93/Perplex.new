import { IConnector } from "../../../types/integration";
import { connectorManager } from "../ConnectorManager";

const platforms = [
  { id: "discord", name: "Discord", desc: "Connect to Discord servers and answer mentions or DMs.", icon: "message-square" },
  { id: "telegram", name: "Telegram", desc: "Interact via Telegram Bot API.", icon: "send" },
  { id: "slack", name: "Slack", desc: "Integrate into Slack workspaces.", icon: "hash" },
  { id: "mattermost", name: "Mattermost", desc: "Connect to Mattermost channels.", icon: "message-circle" },
  { id: "matrix", name: "Matrix", desc: "Matrix protocol for secure decentralized communication.", icon: "box" },
  { id: "whatsapp", name: "WhatsApp", desc: "WhatsApp business API connection.", icon: "phone" },
  { id: "signal", name: "Signal", desc: "Secure messaging via Signal.", icon: "shield" },
  { id: "sms", name: "SMS", desc: "SMS via Twilio or similar payload.", icon: "smartphone" },
  { id: "homeassistant", name: "HomeAssistant", desc: "Control smart home devices natively.", icon: "home" },
  { id: "email", name: "Email", desc: "IMAP/SMTP connection for emails.", icon: "mail" },
  { id: "wecom", name: "WeCom", desc: "Enterprise WeChat integration.", icon: "message-square" },
  { id: "feishu", name: "Feishu", desc: "Lark / Feishu integration.", icon: "box" },
  { id: "dingtalk", name: "DingTalk", desc: "DingTalk workspace connection.", icon: "smartphone" },
  { id: "weixin", name: "Weixin", desc: "Wechat connectivity.", icon: "message-circle" },
  { id: "qqbot", name: "QQBot", desc: "QQ Open Platform Bot API v2.", icon: "message-square" },
  { id: "yuanbao", name: "Yuanbao", desc: "Tencent Yuanbao Bot connectivity.", icon: "box" },
  { id: "webhook", name: "Webhook", desc: "Receive real-time generic webhooks.", icon: "webhook" }
];

export const marketplaceConnectors: IConnector[] = platforms.map(p => ({
  id: p.id,
  name: p.name,
  description: p.desc,
  icon: p.icon as any,
  authType: ["discord", "slack", "feishu", "dingtalk"].includes(p.id) ? "oauth2" : "api_key",
  status: "disconnected",
  connect: async () => true,
  disconnect: async () => {
    await connectorManager.disconnect(p.id);
    return true;
  },
  checkStatus: async () => {
    const creds = await connectorManager.getCredentials(p.id);
    return creds?.apiKey ? "connected" : "disconnected";
  }
}));
