import {
  Globe,
  BrainCircuit,
  Lightbulb,
  SearchCheck,
  GraduationCap,
  ShoppingBag,
  Zap,
  FileText,
  Layers,
} from "lucide-react";
import { FocusMode, ProMode, LocalModelConfig } from "./types";

export const PerplexityLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FOCUS_MODES = [
  {
    id: FocusMode.WEB_SEARCH,
    label: "Web Search",
    icon: Globe,
    description: "Search across the whole internet",
  },
  {
    id: FocusMode.ALL,
    label: "All",
    icon: Layers,
    description: "Search internet and libraries",
  },
  {
    id: FocusMode.LIBRARY,
    label: "Library",
    icon: FileText,
    description: "Search within your Personal Pages",
  },
];

export const PRO_MODES = [
  {
    id: ProMode.STANDARD,
    label: "Standard",
    icon: Zap,
    description: "Fast, concise answers for general queries",
  },
  {
    id: ProMode.REASONING,
    label: "Reasoning",
    icon: BrainCircuit,
    description: "Advanced logic using high thinking budget",
  },
  {
    id: ProMode.THINKING,
    label: "Thinking",
    icon: Lightbulb,
    description: "Step-by-step logical breakdown",
  },
  {
    id: ProMode.RESEARCH,
    label: "Research",
    icon: SearchCheck,
    description: "Deep dive with extensive citations",
  },
  {
    id: ProMode.LEARNING,
    label: "Learning",
    icon: GraduationCap,
    description: "Educational explanations and concepts",
  },
  {
    id: ProMode.SHOPPING,
    label: "Shop Research",
    icon: ShoppingBag,
    description: "Find products, prices, and reviews",
  },
];

export const EMOJI_LIST = [
  "📄",
  "💡",
  "🚀",
  "🎨",
  "📚",
  "✅",
  "🔥",
  "🧠",
  "💼",
  "🏡",
  "💻",
  "⚙️",
  "📈",
  "🔗",
  "📝",
  "🔒",
  "❤️",
  "⭐",
  "📅",
  "💬",
  "🌎",
  "🍕",
  "🎉",
  "🎵",
  "📷",
  "✈️",
  "🛠️",
  "⚛️",
  "🦠",
  "💊",
  "💵",
  "🪙",
  "📊",
  "📉",
  "📁",
  "📂",
  "📑",
  "🗒️",
  "📅",
  "📇",
];

export const AVAILABLE_OFFLINE_MODELS: LocalModelConfig[] = [
  {
    id: "gemma-4-2b",
    name: "Gemma 4 (2B)",
    modelId: "gemma-4-2b-it-q4f16_1-MLC",
    fileSize: "1.6 GB",
    description: "Google's latest efficient model. Strong reasoning for its size.",
    isDownloaded: false,
    family: "gemma",
  },
  {
    id: "gemma-4-4b",
    name: "Gemma 4 (4B)",
    modelId: "gemma-4-4b-it-q4f16_1-MLC",
    fileSize: "2.8 GB",
    description: "Enhanced capabilities with balanced performance and footprint.",
    isDownloaded: false,
    family: "gemma",
  },
  {
    id: "gemma-4-9b",
    name: "Gemma 4 (9B)",
    modelId: "gemma-4-9b-it-q4f16_1-MLC",
    fileSize: "5.4 GB",
    description: "High-performance model for complex tasks and deep reasoning.",
    isDownloaded: false,
    family: "gemma",
  },
  {
    id: "gemma-4-27b",
    name: "Gemma 4 (27B)",
    modelId: "gemma-4-27b-it-q4f16_1-MLC",
    fileSize: "14.2 GB",
    description: "The most powerful Gemma 4 variant, approaching frontier model quality.",
    isDownloaded: false,
    family: "gemma",
  },
  {
    id: "qwen-3.5-3.1b",
    name: "Qwen 3.5 (3.1B)",
    modelId: "Qwen3.5-3.1B-Instruct-q4f16_1-MLC",
    fileSize: "2.1 GB",
    description: "Highly capable small footprint model. Great multilingual support.",
    isDownloaded: false,
    family: "qwen",
  },
  {
    id: "qwen-3.5-8b",
    name: "Qwen 3.5 (8B)",
    modelId: "Qwen3.5-8B-Instruct-q4f16_1-MLC",
    fileSize: "4.8 GB",
    description: "Excellent accuracy and instruction following across languages.",
    isDownloaded: false,
    family: "qwen",
  },
  {
    id: "qwen-3.6-10b",
    name: "Qwen 3.6 (10B)",
    modelId: "Qwen3.6-10B-Instruct-q4f16_1-MLC",
    fileSize: "5.8 GB",
    description: "The newest Qwen architecture with improved context processing.",
    isDownloaded: false,
    family: "qwen",
  },
  {
    id: "qwen-3.6-27b",
    name: "Qwen 3.6 (27B)",
    modelId: "Qwen3.6-27B-Instruct-q4f16_1-MLC",
    fileSize: "15.1 GB",
    description: "Massive scale and reasoning capacity for heavy local workloads.",
    isDownloaded: false,
    family: "qwen",
  },
];

export const UI_STRINGS = {
  en: {
    newThread: "New Thread",
    home: "Search",
    chat: "Chat",
    library: "Library",
    spaces: "Spaces",
    settings: "Settings",
    general: "General",
    models: "AI Models",
    voice: "Voice UI",
    embeddings: "Embeddings",
    profile: "Profile",
    memory: "Memory",
    appearance: "Appearance",
    language: "Interface Language",
    region: "Search Region",
    save: "Save Changes",
    cancel: "Cancel",
    noHistory: "No history yet",
    noPages: "No pages yet",
  },
  ro: {
    newThread: "Conversație Nouă",
    home: "Search",
    chat: "Conversații",
    library: "Bibliotecă",
    spaces: "Spații",
    settings: "Setări",
    general: "General",
    models: "Modele AI",
    voice: "Voce",
    embeddings: "Embeddings",
    profile: "Profil",
    memory: "Memorie",
    appearance: "Aspect",
    language: "Limbă Interfață",
    region: "Regiune Căutare",
    save: "Salvează",
    cancel: "Anulează",
    noHistory: "Fără istoric",
    noPages: "Fără notițe",
  },
};
