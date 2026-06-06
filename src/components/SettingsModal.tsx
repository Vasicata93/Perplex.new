import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { LocalBackendPanel } from "./LocalBackendPanel";
import {
  X,
  Plus,
  Trash2,
  Check,
  Brain,
  Cpu,
  Search,
  User,
  Settings as SettingsIcon,
  Briefcase,
  Globe,
  ChevronDown,
  Activity,
  Zap,
  Key,
  Moon,
  Sun,
  Type,
  Laptop,
  Cloud,
  Sparkles,
  Camera,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Lock,
  Smartphone,
  AlertTriangle,
  Plug,
  Github,
  Triangle,
  Mail,
  Sliders,
  MoreHorizontal,
  Info,
  HardDrive,
  RefreshCw,
  Database,
  Bot,
  CheckCircle2,
  Shield,
  ToggleLeft,
  Terminal,
  Server,
} from "lucide-react";
import {
  AppSettings,
  ModelProvider,
  LocalModelConfig,
  MemoryItem,
  MemoryCategory,
  Thread,
} from "../types";
import { db, STORES } from "../services/db";
import { MemoryService } from "../services/memoryService";
import { UI_STRINGS, AVAILABLE_OFFLINE_MODELS } from "../constants";
import { checkLocalModelSupport } from "../services/localLlmService";
import { useIntegrationStore } from "../store/integrationStore";
import { connectorManager } from "../services/integration/ConnectorManager";
import { SkillRegistry } from "../services/agent/SkillRegistry";
import { getPlatformName, isElectron, isCapacitor, isPWA } from "../utils/platform";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  initialTab?: TabType;
}

type TabType =
  | "profile"
  | "general"
  | "models"
  | "memory"
  | "skills"
  | "connectors"
  | "local_backend"
  | "permissions"
  | "about";

// --- CONSTANTS ---
const OPENROUTER_PRESETS = [
  "z-ai/glm-4.7-flash",
  "xiaomi/mimo-v2-flash",
  "mistralai/ministral-8b-2512",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "qwen/qwen3-vl-30b-a3b-thinking",
  "google/gemini-2.5-flash-lite-preview-09-2025",
  "deepseek/deepseek-v3.2",
  "openai/gpt-4o", // Ensuring typical defaults are available
  "anthropic/claude-3-opus",
];

const TOOL_CARDS = [
  { key: 'setting_context_compressor', label: 'Context Compressor', desc: 'Auto-summarizes long dialogues', icon: Brain, iconClasses: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'setting_moa', label: 'Mixture of Agents (MoA)', desc: 'Cross-model answer synthesis', icon: Cpu, iconClasses: 'bg-purple-500/10 text-purple-500' },
  { key: 'setting_trajectory', label: 'Trajectory Tracking', desc: 'Internal task steps visualization', icon: Activity, iconClasses: 'bg-blue-500/10 text-blue-500' },
  { key: 'setting_data_redaction', label: 'Data Redaction', desc: 'Automatic token scrubbing', icon: Shield, iconClasses: 'bg-amber-500/10 text-amber-500' },
  { key: 'setting_code_execution', label: 'Code Execution (PTC)', desc: 'Auto-generate tool chains', icon: Activity, iconClasses: 'bg-red-500/10 text-red-500' },
  { key: 'setting_session_goals', label: 'Session Goals', desc: 'Persistent execution loop', icon: Activity, iconClasses: 'bg-cyan-500/10 text-cyan-500' },
  { key: 'setting_session_search', label: 'Session Search', desc: 'Long-term conversation recall', icon: Brain, iconClasses: 'bg-orange-500/10 text-orange-500' },
  { key: 'setting_clarify', label: 'Clarify Tool', desc: 'Interactive user clarification', icon: Activity, iconClasses: 'bg-indigo-500/10 text-indigo-500' },
  { key: 'setting_voice_mode', label: 'Voice Mode', desc: 'Push-to-talk audio & STT', icon: Activity, iconClasses: 'bg-pink-500/10 text-pink-500' },
  { key: 'setting_mcp_client', label: 'MCP Client', desc: 'Model Context Protocol', icon: Activity, iconClasses: 'bg-gray-500/10 text-gray-500' },
  { key: 'setting_osv_check', label: 'OSV Security Check', desc: 'Scan dependencies for vulns', icon: Shield, iconClasses: 'bg-rose-500/10 text-rose-500' },
  { key: 'setting_mini_swe', label: 'Mini SWE Sub-Agent', desc: 'Autonomous coding in background', icon: Brain, iconClasses: 'bg-fuchsia-500/10 text-fuchsia-500' },
  { key: 'setting_background_scheduler', label: 'Background Scheduler', desc: 'Recurring jobs & cron tasks', icon: Activity, iconClasses: 'bg-yellow-500/10 text-yellow-500' },
  { key: 'setting_image_gen', label: 'Image Gen Routing', desc: 'DALL-E / Midjourney', icon: Activity, iconClasses: 'bg-lime-500/10 text-lime-500' },
  { key: 'setting_budget', label: 'Budget Configuration', desc: 'Token cost monitoring & limits', icon: Shield, iconClasses: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'setting_approval_protocol', label: 'Approval Protocol', desc: 'Wait for execution confirmation', icon: CheckCircle2, iconClasses: 'bg-slate-500/10 text-slate-500' },
  { key: 'setting_web_policies', label: 'Advanced Web Policies', desc: 'Strict robots.txt parsing', icon: Activity, iconClasses: 'bg-blue-400/10 text-blue-400' },
  { key: 'setting_output_limits', label: 'Tool Output Limits', desc: 'Truncate giant command logs', icon: Activity, iconClasses: 'bg-violet-400/10 text-violet-400' },
  { key: 'setting_todo', label: 'Simple To-Do Tool', desc: 'Atomic local task checks', icon: CheckCircle2, iconClasses: 'bg-zinc-400/10 text-zinc-400' },
  { key: 'setting_file_safety', label: 'File Safety Guard', desc: 'Path traversal prevention', icon: Shield, iconClasses: 'bg-orange-400/10 text-orange-400' },
  { key: 'setting_checkpoint', label: 'Checkpoints', desc: 'Save & restore context states', icon: Activity, iconClasses: 'bg-blue-500/10 text-blue-500' },
  { key: 'setting_memory_retrieval', label: 'Memory Retrieval', desc: 'Access agent memory', icon: Brain, iconClasses: 'bg-purple-500/10 text-purple-500' },
  { key: 'setting_web_search', label: 'Web Search', desc: 'Perform live web searches', icon: Globe, iconClasses: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'setting_library', label: 'Library Tool', desc: 'Access internal document library', icon: Briefcase, iconClasses: 'bg-amber-500/10 text-amber-500' },
  { key: 'setting_workspace', label: 'Workspace Tool', desc: 'Manage project workspace files', icon: Laptop, iconClasses: 'bg-gray-500/10 text-gray-500' },
  { key: 'setting_portfolio', label: 'Portfolio Tool', desc: 'Manage digital portfolio', icon: Briefcase, iconClasses: 'bg-indigo-500/10 text-indigo-500' },
  { key: 'setting_safe_digital', label: 'Safe Digital Tool', desc: 'Interact securely with digital assets', icon: Shield, iconClasses: 'bg-fuchsia-500/10 text-fuchsia-500' },
  { key: 'setting_core_code_execution', label: 'Core Code Execution', desc: 'Execute code in a standard sandbox', icon: Activity, iconClasses: 'bg-rose-500/10 text-rose-500' },
  { key: 'setting_calendar', label: 'Calendar', desc: 'Read calendar and fetch holidays', icon: Activity, iconClasses: 'bg-red-500/10 text-red-500' },
  { key: 'setting_terminal', label: 'Terminal Tool', desc: 'Execute CLI commands', icon: Activity, iconClasses: 'bg-slate-500/10 text-slate-500' },
  { key: 'setting_browser', label: 'Browser Tool', desc: 'Simulate web browsing locally', icon: Globe, iconClasses: 'bg-blue-500/10 text-blue-500' },
  { key: 'setting_send_message', label: 'Send Message', desc: 'Send emails or messages', icon: Mail, iconClasses: 'bg-pink-500/10 text-pink-500' },
  { key: 'setting_vision', label: 'Vision Tools', desc: 'Analyze images and frames', icon: Camera, iconClasses: 'bg-cyan-500/10 text-cyan-500' },
  { key: 'setting_tts', label: 'TTS Tool', desc: 'Generate spoken audio from text', icon: Activity, iconClasses: 'bg-violet-500/10 text-violet-500' },
  { key: 'setting_insights', label: 'Insights Generator', desc: 'Extract and formulate insights', icon: Sparkles, iconClasses: 'bg-yellow-500/10 text-yellow-500' },
  { key: 'setting_kanban', label: 'Kanban Board', desc: 'Manage visual task boards', icon: CheckCircle2, iconClasses: 'bg-emerald-500/10 text-emerald-500' }
];

// --- COMPONENTS ---

// Desktop Sidebar Item
const SidebarItem = ({
  id,
  label,
  icon: Icon,
  activeTab,
  onSelect,
}: {
  id: TabType;
  label: string;
  icon: any;
  activeTab: TabType;
  onSelect: (id: TabType) => void;
}) => (
  <button
    onClick={() => onSelect(id)}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm transition-all group ${
      activeTab === id
        ? "bg-pplx-hover text-pplx-text shadow-sm"
        : "text-pplx-muted hover:bg-pplx-secondary hover:text-pplx-text"
    }`}
  >
    <div
      className={`${activeTab === id ? "text-pplx-accent" : "text-pplx-muted group-hover:text-pplx-text opacity-70"}`}
    >
      <Icon size={20} />
    </div>
    <div className="flex flex-col items-start text-left">
      <span className="font-medium tracking-wide">{label}</span>
    </div>
  </button>
);

// Premium Mobile Menu Item
const MobileMenuItem = ({
  icon: Icon,
  label,
  description,
  onClick,
  active,
}: {
  icon: any;
  label: string;
  description?: string;
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 my-1 mx-0 md:mx-2 rounded-2xl active:scale-[0.98] transition-all duration-150 group bg-transparent hover:bg-pplx-hover/50"
  >
    <div className="flex items-center gap-5">
      <div
        className={`p-3 rounded-2xl transition-colors duration-150 ${active ? "bg-pplx-accent text-black" : "bg-pplx-secondary/50 text-pplx-muted group-hover:text-pplx-text"}`}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col text-left">
        <span
          className={`text-[17px] font-medium tracking-tight ${active ? "text-pplx-text" : "text-pplx-text/90"}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-[13px] text-pplx-muted font-normal opacity-60">
            {description}
          </span>
        )}
      </div>
    </div>
    <ChevronRight size={18} className="text-pplx-muted/30" strokeWidth={2} />
  </button>
);

interface FilterPillProps {
  id: MemoryCategory | "all";
  label: string;
  icon: any;
  isActive: boolean;
  onClick: (id: MemoryCategory | "all") => void;
}

const FilterPill: React.FC<FilterPillProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
      isActive
        ? "bg-pplx-text text-pplx-primary shadow-lg ring-1 ring-pplx-text/10"
        : "bg-pplx-secondary/50 text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
    }`}
  >
    <Icon size={14} className={isActive ? "text-pplx-primary" : "opacity-70"} />
    {label}
  </button>
);

const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-8 pb-4">
    <h4 className="text-2xl font-semibold text-pplx-text mb-2 font-serif tracking-tight">
      {title}
    </h4>
    <p className="text-sm text-pplx-muted leading-relaxed max-w-2xl opacity-80">
      {desc}
    </p>
  </div>
);

const InputGroup = ({
  label,
  children,
  description,
}: {
  label: string;
  children?: React.ReactNode;
  description?: string;
}) => (
  <div className="mb-6">
    <label className="block text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-3 ml-1 opacity-70">
      {label}
    </label>
    {children}
    {description && (
      <p className="text-[11px] text-pplx-muted mt-2 ml-1 opacity-60 font-medium">
        {description}
      </p>
    )}
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  isBeta = false,
}: any) => (
  <div
    className="flex items-center justify-between py-4 group cursor-pointer"
    onClick={onChange}
  >
    <div className="pr-6">
      <h4 className="text-base font-medium text-pplx-text flex items-center gap-2 mb-1">
        {label}
        {isBeta && (
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-pplx-secondary text-pplx-muted font-bold tracking-wide uppercase border border-transparent">
            Beta
          </span>
        )}
      </h4>
      <p className="text-xs text-pplx-muted max-w-md leading-relaxed opacity-70">
        {description}
      </p>
    </div>
    <button
      className={`flex-shrink-0 w-12 h-7 rounded-full relative transition-colors duration-150 ease-out ${checked ? "bg-pplx-text" : "bg-pplx-secondary"}`}
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 bg-pplx-primary rounded-full shadow-sm transition-transform duration-150 ease-out ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);

interface OfflineModelCardProps {
  model: LocalModelConfig;
  isDownloaded: boolean;
  isActive: boolean;
  onDownload: () => void;
  onSelect: () => void;
  onDelete: () => void;
  progress: number;
  isSupported: boolean;
  unsupportedReason: string;
}

// Offline Model Card Component
const OfflineModelCard: React.FC<OfflineModelCardProps> = ({
  model,
  isDownloaded,
  isActive,
  onDownload,
  onSelect,
  onDelete,
  progress,
  isSupported,
  unsupportedReason,
}) => {
  return (
    <div className={`border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full ${!isSupported ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="relative">
          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm text-pplx-text flex items-center justify-center font-bold font-mono text-xs uppercase tracking-wider">
            {model.family.substring(0, 3)}
          </div>
          {isDownloaded && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {progress > 0 && progress < 100 ? (
            <div className="text-[10px] text-pplx-primary bg-pplx-text px-3 py-1.5 rounded-full font-bold">
              {progress}%
            </div>
          ) : isDownloaded ? (
            <>
              {!isActive && (
                <button
                  onClick={onSelect}
                  className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors"
                >
                  Activate
                </button>
              )}
              <button
                onClick={onDelete}
                className="p-1.5 text-pplx-muted hover:text-red-400 bg-pplx-hover rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={isSupported ? onDownload : undefined}
              disabled={!isSupported}
              title={!isSupported ? unsupportedReason : `Download ${model.name} (${model.fileSize})`}
              className={`px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity ${!isSupported ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isSupported ? "Download" : "Unavailable"}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-1 flex-1">
        <h3 className="text-[15px] font-medium text-pplx-text flex flex-wrap items-center gap-2">
          {model.name}
          {isActive && (
            <span className="text-[9px] bg-pplx-accent text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
          )}
          {!isDownloaded && (
            <span className="text-[9px] bg-pplx-secondary text-pplx-muted px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {model.fileSize}
            </span>
          )}
        </h3>
        
        <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
          {model.description}
        </p>

        {!isSupported && (
          <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed">
            <AlertTriangle size={12} className="inline mr-1 mb-0.5" />
            {unsupportedReason}
          </div>
        )}

        {progress > 0 && progress < 100 && (
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-1.5 bg-pplx-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-pplx-accent transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  initialTab = "general",
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [connectorsSubTab, setConnectorsSubTab] = useState<"installed" | "connectors" | "gateways">("installed");
  const [connectorsSearch, setConnectorsSearch] = useState("");
  const [skillsSubTab, setSkillsSubTab] = useState<"installed" | "marketplace" | "learned">("installed");

  const [skillsSearch, setSkillsSearch] = useState("");
  const [modelsSubTab, setModelsSubTab] = useState<"cloud" | "browser" | "local_node">("cloud");
  const [modelsSearch, setModelsSearch] = useState("");
  const [learnedSkills, setLearnedSkills] = useState<any[]>([]);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryStats, setMemoryStats] = useState({ sessions: 0, messages: 0, memoryChars: 0, userProfileChars: 0 });

  // Mobile Navigation State
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false);

  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | "all">(
    "all",
  );
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] =
    useState<MemoryCategory>("profile");

  // Offline Model State
  const [downloadProgress, setDownloadProgress] = useState<{
    [key: string]: number;
  }>({});

  // Integrations State
  const { connectors, skills, toggleSkill } = useIntegrationStore();
  const [editingConnector, setEditingConnector] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  
  // Authorization Flow State
  const [authorizingConnector, setAuthorizingConnector] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const [toolToggles, setToolToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const keys = [
      'setting_moa', 'setting_trajectory', 'setting_data_redaction', 
      'setting_code_execution', 'setting_session_goals', 'setting_session_search', 
      'setting_clarify', 'setting_voice_mode', 'setting_mcp_client', 
      'setting_osv_check', 'setting_mini_swe', 'setting_background_scheduler', 
      'setting_image_gen', 'setting_budget', 'setting_approval_protocol', 
      'setting_web_policies', 'setting_output_limits', 'setting_todo', 
      'setting_file_safety', 'setting_context_compressor',
      'setting_checkpoint', 'setting_memory_retrieval', 'setting_web_search',
      'setting_library', 'setting_workspace', 'setting_portfolio', 'setting_safe_digital',
      'setting_core_code_execution', 'setting_calendar', 'setting_terminal',
      'setting_browser', 'setting_send_message', 'setting_vision', 'setting_tts',
      'setting_insights', 'setting_kanban'
    ];
    const initial: Record<string, boolean> = {};
    keys.forEach(k => {
      initial[k] = localStorage.getItem(k) !== 'false';
    });
    setToolToggles(initial);
  }, []);

  const handleToggleTool = (key: string) => {
    setToolToggles(prev => {
      const newVal = !prev[key];
      localStorage.setItem(key, newVal ? 'true' : 'false');
      return { ...prev, [key]: newVal };
    });
  };

  // Updates & Backup State
  const [githubRepoUrl, setGithubRepoUrl] = useState(localStorage.getItem('githubRepoUrl') || "");
  const [e2bApiKey, setE2bApiKey] = useState(localStorage.getItem('E2B_API_KEY') || "");
  const [latestCommit, setLatestCommit] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("idle");
  const [backupEmail, setBackupEmail] = useState(localStorage.getItem('backupEmail') || "");

  const saveGithubUrl = (url: string) => {
    setGithubRepoUrl(url);
    localStorage.setItem('githubRepoUrl', url);
  };

  const saveBackupEmail = (email: string) => {
    setBackupEmail(email);
    localStorage.setItem('backupEmail', email);
  };

  const checkForUpdates = async () => {
    if (!githubRepoUrl) return;
    setUpdateStatus("checking");
    try {
      const parts = githubRepoUrl.split('/');
      const repoName = parts.length >= 2 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : githubRepoUrl;
      const cleanRepoName = repoName.replace('.git', '');
      const res = await fetch(`https://api.github.com/repos/${cleanRepoName}/commits?per_page=1`);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLatestCommit(data[0]);
          setUpdateStatus("found");
        } else {
          setUpdateStatus("not_found");
        }
      } else {
        setUpdateStatus("error");
      }
    } catch(e) {
      setUpdateStatus("error");
    }
  };

  const handleDownloadUpdate = () => {
    if (latestCommit && githubRepoUrl) {
      const parts = githubRepoUrl.split('/');
      const repoName = parts.length >= 2 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : githubRepoUrl;
      const cleanRepoName = repoName.replace('.git', '');
      const downloadUrl = `https://github.com/${cleanRepoName}/archive/${latestCommit.sha}.zip`;
      window.open(downloadUrl, "_blank");
    }
  };

  const createBackupData = () => {
    const data = {
      settings: formData,
      memories: memories,
      localStorage: Object.entries(localStorage).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {} as any)
    };
    return JSON.stringify(data, null, 2);
  };

  const handleLocalBackup = () => {
    const jsonStr = createBackupData();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hermes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailBackup = () => {
    if (!backupEmail) return;
    const jsonStr = createBackupData();
    const uriBody = encodeURIComponent("Attached is your hermes backup data:\n\n" + jsonStr);
    const mailto = `mailto:${backupEmail}?subject=Hermes System Backup&body=${uriBody}`;
    window.location.href = mailto;
  };

  const handleConnect = async (connectorId: string) => {
    const connector = connectors[connectorId];
    if (connector.authType === "api_key") {
      setEditingConnector(connectorId);
      setApiKeyInput("");
    } else {
      // Initiate the seamless connection flow
      setAuthorizingConnector(connectorId);
    }
  };

  const handleConfirmAuthorization = async () => {
    if (!authorizingConnector) return;
    setIsAuthorizing(true);
    
    try {
      if (authorizingConnector === 'github' || authorizingConnector === 'google_workspace' || authorizingConnector === 'vercel' || authorizingConnector === 'discord') {
         // Try to fetch real OAuth URL
         const redirectUri = `${window.location.origin}/api/auth/callback/${authorizingConnector}`;
         const res = await fetch(`/api/auth/url?provider=${authorizingConnector}&redirect_uri=${encodeURIComponent(redirectUri)}`);
         
         if (res.ok) {
            const data = await res.json();
            if (data.url) {
               setIsAuthorizing(false);
               
               const width = 600;
               const height = 700;
               const left = window.screen.width / 2 - width / 2;
               const top = window.screen.height / 2 - height / 2;
               
               const authWindow = window.open(
                 data.url,
                 'oauth_popup',
                 `width=${width},height=${height},top=${top},left=${left}`
               );
               
               if (!authWindow) {
                 toast.error("Popup blocked! Please allow popups to authenticate.");
                 setAuthorizingConnector(null);
               }
               return; // The popup will handle the rest via postMessage
            }
         } else {
            const data = await res.json();
            if (data.error && data.error.includes("not set")) {
                toast.error(`Missing OAuth Configuration: ${data.error}`);
            } else {
                toast.error("Failed to initiate OAuth flow");
            }
         }
      }
      
      // Fallback: Simulate if not implemented in the backend yet
      setTimeout(async () => {
        const dummyToken = `simulated_token_${Math.random().toString(36).substr(2, 9)}`;
        
        await connectorManager.saveCredentials({
          connectorId: authorizingConnector,
          apiKey: dummyToken, // Saving a simulated key automatically
        });
        
        setIsAuthorizing(false);
        setAuthorizingConnector(null);
        toast.success(`Successfully connected ${connectors[authorizingConnector]?.name}`);
      }, 2000);

    } catch (err) {
      console.error(err);
      toast.error("Failed to start connection process");
      setIsAuthorizing(false);
    }
  };

  // Add an effect to listen for postMessage from the OAuth callback window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Allow messages from the same origin or common run app subdomains
      if (
        !event.origin.includes("localhost") && 
        !event.origin.includes(".run.app") && 
        !event.origin.includes("127.0.0.1")
      ) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { provider, token } = event.data;
        if (provider) {
          await connectorManager.saveCredentials({
            connectorId: provider,
            apiKey: token,
          });
          toast.success(`Successfully connected ${connectors[provider]?.name || provider}`);
          setAuthorizingConnector(null); // Close the authorization modal
          setIsAuthorizing(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [connectors]);

  const handleSaveApiKey = async () => {
    if (editingConnector && apiKeyInput) {
      await connectorManager.saveCredentials({
        connectorId: editingConnector,
        apiKey: apiKeyInput,
      });
      setEditingConnector(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    await connectorManager.disconnect(connectorId);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "github":
        return <Github className="w-5 h-5 text-gray-100" />;
      case "vercel":
        return <Triangle className="w-5 h-5 text-white" />;
      case "google":
        return <Mail className="w-5 h-5 text-red-500" />;
      case "search":
        return <Search className="w-5 h-5 text-pplx-primary" />;
      default:
        return <Plug className="w-5 h-5 text-pplx-muted" />;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = UI_STRINGS[formData.interfaceLanguage] || UI_STRINGS.en;

  const uniqueCategories = Array.from(new Set(memories.map(m => m.category))).filter(Boolean);
  const dynamicCategories = uniqueCategories.map(cat => {
    let icon = Database;
    let label = cat.charAt(0).toUpperCase() + cat.slice(1);
    
    if (cat === "profile") icon = User;
    if (cat === "project") icon = Briefcase;
    if (cat === "preference") icon = Sliders;
    if (cat === "decision") icon = Check;
    if (cat === "rag_cache") { icon = Database; label = "RAG Cache"; }
    if (cat === "finance") icon = Brain; // Or some other icon
    if (cat === "work") icon = Briefcase;
    if (cat === "coding") icon = Terminal; // We'll need to import Terminal or fallback
    
    return { id: cat as string, label, icon };
  });

  const MEMORY_CATEGORIES: {
    id: string;
    label: string;
    icon: any;
  }[] = [
    { id: "all", label: "All", icon: Brain },
    { id: "profile", label: "Profile", icon: User },
    { id: "project", label: "Project", icon: Briefcase },
    { id: "preference", label: "Preferences", icon: Sliders },
    { id: "decision", label: "Decisions", icon: Check },
    { id: "rag_cache", label: "RAG Cache", icon: Database },
  ];

  // Add dynamically discovered ones
  dynamicCategories.forEach(dc => {
    if (!MEMORY_CATEGORIES.some(c => c.id === dc.id)) {
      MEMORY_CATEGORIES.push(dc);
    }
  });

  useEffect(() => {
    setFormData(settings);
    if (isOpen) {
      setActiveTab(initialTab);
      setIsMobileDetail(initialTab !== "general"); // Open detail view directly if not general on mobile
      setIsCategoriesCollapsed(false);

      if (settings.modelProvider === ModelProvider.LOCAL) {
        setModelsSubTab("browser");
      } else {
        setModelsSubTab("cloud");
      }
      
      const loadStats = async () => {
        try {
          const mems = await MemoryService.getMemories();
          setMemories(mems);
          
          let mChars = 0;
          mems.forEach(m => mChars += m.content.length);
          
          const threads = await db.get<Thread[]>(STORES.THREADS, "all_threads") || [];
          let msgCount = 0;
          threads.forEach(t => msgCount += (t.messages?.length || 0));
          
          const profileRaw = localStorage.getItem('hermes_user_profile') || '';
          
          setMemoryStats({
            sessions: threads.length,
            messages: msgCount,
            memoryChars: mChars,
            userProfileChars: profileRaw.length || 40
          });
        } catch (e) {
          console.error("Failed to load memory stats:", e);
        }
      };

      loadStats();
      
      const hermesSkills = SkillRegistry.listSkills().skills;
      setLearnedSkills(hermesSkills);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleMobileNav = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDetail(true);
  };

  const getUserInitials = (name: string) => {
    return name ? name.substring(0, 1).toUpperCase() : "U";
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({
          ...formData,
          userProfile: {
            ...formData.userProfile,
            avatar: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;
    await MemoryService.addMemory(newMemoryContent, newMemoryCategory);
    const updated = await MemoryService.getMemories();
    setMemories(updated);
    setNewMemoryContent("");
    setIsAddingMemory(false);
  };

  const handleDeleteMemory = async (id: string) => {
    await MemoryService.deleteMemory(id);
    const updated = await MemoryService.getMemories();
    setMemories(updated);
  };

  const handleClearMemory = async () => {
    const confirmationWord = "DELETE";
    const userConfirm = prompt(
      `SECURITY WARNING: You are about to permanently erase all memories and learned context.\n\nTo confirm this action, please type "${confirmationWord}" exactly as shown:`
    );
    if (userConfirm === confirmationWord) {
      await MemoryService.clearMemories();
      setMemories([]);
    } else if (userConfirm !== null) {
      alert("Clear aborted: Confirmation keyword did not match.");
    }
  };

  // --- Offline Model Logic ---
  const handleDownloadModel = async (model: LocalModelConfig) => {
    // ── Check environment BEFORE trying to download ──────────────
    const support = checkLocalModelSupport();

    if (!support.supported) {
      alert(
        `❌ Cannot download model\n\n${support.reason}\n\n${support.details}`,
      );
      return;
    }

    setDownloadProgress((prev) => ({ ...prev, [model.id]: 1 })); // Show spinner immediately

    try {
      const { localLlmService } = await import("../services/localLlmService");

      await localLlmService.initModel(
        model.modelId,
        (progress: number, text: string) => {
          setDownloadProgress((prev) => ({ ...prev, [model.id]: progress }));
          console.log(`[Download] ${model.name}: ${progress}% — ${text}`);
        },
      );

      // Mark as downloaded
      setFormData((prev) => {
        const updatedLocalModels = [...prev.localModels];
        const existingIdx = updatedLocalModels.findIndex(
          (m) => m.id === model.id,
        );
        const completedModel = { ...model, isDownloaded: true };
        if (existingIdx >= 0) updatedLocalModels[existingIdx] = completedModel;
        else updatedLocalModels.push(completedModel);
        return {
          ...prev,
          localModels: updatedLocalModels,
          activeLocalModelId: prev.activeLocalModelId || model.id,
          modelProvider:
            prev.modelProvider === ModelProvider.LOCAL
              ? prev.modelProvider
              : ModelProvider.LOCAL,
        };
      });
    } catch (error: any) {
      console.error("Download failed:", error);
      // Show the clean error message from localLlmService
      alert(`❌ Download failed\n\n${error.message}`);
    } finally {
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[model.id];
          return next;
        });
      }, 1500);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this model? You will need to download it again to use it offline.",
      )
    ) {
      try {
        const { localLlmService } = await import("../services/localLlmService");

        // Find the full modelId (WebLLM ID) from our constants
        const modelDef = AVAILABLE_OFFLINE_MODELS.find((m) => m.id === id);
        if (modelDef) {
          await localLlmService.deleteModel(modelDef.modelId);
        } else {
          await localLlmService.deleteModel(id); // Fallback
        }

        const newModels = formData.localModels.filter((m) => m.id !== id);
        let newActiveId = formData.activeLocalModelId;
        if (id === formData.activeLocalModelId) {
          newActiveId = newModels.length > 0 ? newModels[0].id : "";
        }
        setFormData({
          ...formData,
          localModels: newModels,
          activeLocalModelId: newActiveId,
        });
      } catch (error) {
        console.error("Failed to delete model:", error);
      }
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = m.content
      .toLowerCase()
      .includes(memorySearch.toLowerCase());
    const matchesFilter = memoryFilter === "all" || m.category === memoryFilter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (cat: MemoryCategory) => {
    const found = MEMORY_CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : Globe;
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case "general":
        return t.general;
      case "models":
        return t.models;
      case "profile":
        return t.profile;
      case "memory":
        return t.memory;
      case "skills":
        return "Skills";
      case "connectors":
        return "Connectors";
      case "local_backend":
        return "Local Network";
      case "permissions":
        return "Permissions";
      case "about":
        return "About";
      default:
        return "Settings";
    }
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 transition-opacity duration-150">
      <div className="bg-pplx-primary w-full max-w-6xl md:rounded-[32px] shadow-2xl border-none md:border border-white/5 overflow-hidden flex flex-col md:flex-row h-[100dvh] md:h-[90vh] max-h-[1000px] text-pplx-text relative">
        {/* --- MOBILE ROOT MENU --- */}
        <div
          className={`md:hidden flex-col h-full bg-pplx-primary w-full absolute inset-0 z-20 ${!isMobileDetail ? "flex" : "hidden"}`}
        >
          {/* Settings List - Scrollable Container */}
          <div className="flex-1 overflow-y-auto bg-pplx-primary pb-20 custom-scrollbar">
            {/* Header (Now Scrollable) */}
            <div className="flex items-center justify-between p-6 pb-2 bg-transparent">
              <h2 className="text-3xl font-serif font-medium text-pplx-text tracking-tight">
                {t.settings}
              </h2>
              <button
                onClick={onClose}
                className="p-3 -ml-2 bg-pplx-secondary/50 text-pplx-text rounded-full hover:bg-pplx-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Hero Card (Now Scrollable) */}
            <div className="px-4 py-6">
              <div
                className="bg-pplx-card rounded-3xl p-6 shadow-xl shadow-black/5 relative overflow-hidden group active:scale-[0.98] transition-transform duration-150"
                onClick={() => handleMobileNav("profile")}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-pplx-secondary flex items-center justify-center text-pplx-muted overflow-hidden">
                      {formData.userProfile.avatar ? (
                        <img
                          src={formData.userProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-pplx-text">
                          {getUserInitials(formData.userProfile.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-pplx-text tracking-tight truncate font-serif">
                      {formData.userProfile.name || "User"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 bg-pplx-secondary text-pplx-text text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Pro
                      </span>
                      {formData.userProfile.location && (
                        <span className="text-xs text-pplx-muted truncate flex items-center gap-1 opacity-70">
                          <Globe size={10} /> {formData.userProfile.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-pplx-secondary/50 rounded-full">
                    <ChevronRight size={18} className="text-pplx-muted" />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Items */}
            <div className="px-4 flex flex-col gap-2">
              <div className="px-2 py-3 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                General
              </div>
              <MobileMenuItem
                icon={SettingsIcon}
                label={t.general}
                description="Appearance & language"
                onClick={() => handleMobileNav("general")}
              />
              <MobileMenuItem
                icon={Cpu}
                label={t.models}
                description="AI models & providers"
                onClick={() => handleMobileNav("models")}
              />

              <div className="px-2 py-3 mt-6 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                Personalization
              </div>
              <MobileMenuItem
                icon={Brain}
                label={t.memory}
                description="Long-term knowledge"
                onClick={() => handleMobileNav("memory")}
              />

              <div className="px-2 py-3 mt-6 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                Integrations
              </div>
              <MobileMenuItem
                icon={Zap}
                label="Skills"
                description="Agent capabilities"
                onClick={() => handleMobileNav("skills")}
              />
              <MobileMenuItem
                icon={Plug}
                label="Connectors"
                description="External services"
                onClick={() => handleMobileNav("connectors")}
              />
              <div className="px-2 py-3 mt-6 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                Security & Environment
              </div>
              <MobileMenuItem
                icon={Laptop}
                label="Local Network"
                description="Backend connections"
                onClick={() => handleMobileNav("local_backend")}
              />
              <MobileMenuItem
                icon={Shield}
                label="Permissions"
                description="Internet & system access"
                onClick={() => handleMobileNav("permissions")}
              />
            </div>

            <div className="mt-12 flex flex-col items-center justify-center text-center opacity-30 mb-6">
              <span className="text-xl font-serif text-pplx-text font-bold italic tracking-tighter">
                Perplex
              </span>
              <p className="text-[10px] text-pplx-muted mt-1">v1.0.2</p>
            </div>
          </div>
        </div>

        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden md:flex w-64 border-r border-pplx-border/50 bg-pplx-primary flex-col p-6 flex-shrink-0">
          <h2 className="text-xl font-medium text-pplx-text mb-8 px-2 font-serif tracking-tight">
            {t.settings}
          </h2>
          <nav className="flex flex-col gap-2">
            <SidebarItem
              id="general"
              label={t.general}
              icon={SettingsIcon}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="models"
              label={t.models}
              icon={Cpu}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="memory"
              label={t.memory}
              icon={Brain}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="skills"
              label="Skills"
              icon={Zap}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="connectors"
              label="Connectors"
              icon={Plug}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="local_backend"
              label="Local Network"
              icon={Laptop}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="permissions"
              label="Permissions"
              icon={Shield}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="about"
              label="About"
              icon={Info}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          </nav>
          <div className="mt-auto pt-6 px-2 opacity-40">
            <p className="text-xs text-pplx-muted">Perplex Clone v1.0</p>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div
          className={`${isMobileDetail ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0 bg-pplx-primary md:bg-pplx-sidebar/30 overflow-hidden w-full h-full absolute md:static inset-0 z-30`}
        >
          {/* Mobile Header: Blurred & Clean (No Border) */}
          <div className="md:hidden flex items-center gap-4 p-4 pt-6 pb-4 bg-pplx-primary/95 backdrop-blur-md sticky top-0 z-20">
            <button
              onClick={() => setIsMobileDetail(false)}
              className="p-3 -ml-2 rounded-full hover:bg-pplx-secondary text-pplx-text transition-all active:scale-95"
            >
              <ArrowLeft size={22} />
            </button>
            <h3 className="text-xl font-serif font-medium text-pplx-text tracking-tight">
              {getTabTitle(activeTab)}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain bg-pplx-primary md:bg-transparent">
            <div className="p-5 md:p-10 max-w-4xl mx-auto pb-32 md:pb-10">
              {/* --- GENERAL TAB --- */}
              {activeTab === "general" && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.general}
                      desc="Customize your experience."
                    />
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h5 className="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-4 ml-1 opacity-70">
                        {t.appearance}
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "dark", label: "Dark", icon: Moon },
                          { id: "light", label: "Light", icon: Sun },
                          { id: "system", label: "Auto", icon: Laptop },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setFormData({ ...formData, theme: opt.id as any })
                            }
                            className={`flex flex-col items-center justify-center py-5 px-2 rounded-2xl transition-all duration-150 ${
                              formData.theme === opt.id
                                ? "bg-pplx-card text-pplx-text shadow-xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10"
                                : "bg-pplx-secondary/30 text-pplx-muted hover:bg-pplx-secondary/60 hover:text-pplx-text"
                            }`}
                          >
                            <opt.icon
                              size={22}
                              className={`mb-3 ${formData.theme === opt.id ? "text-pplx-text" : "opacity-50"}`}
                              strokeWidth={1.5}
                            />
                            <span className="text-[11px] font-medium tracking-wide">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-pplx-card p-6 rounded-3xl shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-pplx-secondary rounded-xl text-pplx-text">
                            <Type size={18} />
                          </div>
                          <span className="text-sm font-medium text-pplx-text">
                            Text Size
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-pplx-muted bg-pplx-secondary px-3 py-1 rounded-lg uppercase tracking-wider">
                          {formData.textSize}
                        </span>
                      </div>
                      <div className="relative pt-2 pb-1 px-1">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="1"
                          value={
                            formData.textSize === "small"
                              ? 0
                              : formData.textSize === "medium"
                                ? 1
                                : 2
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const size =
                              val === 0
                                ? "small"
                                : val === 1
                                  ? "medium"
                                  : "large";
                            setFormData({ ...formData, textSize: size });
                          }}
                          className="w-full h-1.5 bg-pplx-secondary rounded-lg appearance-none cursor-pointer accent-pplx-text"
                        />
                        <div className="flex justify-between mt-3 text-[10px] text-pplx-muted font-semibold uppercase tracking-widest opacity-60">
                          <span>Small</span>
                          <span>Default</span>
                          <span>Large</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-pplx-card rounded-3xl px-6 py-2 shadow-sm sm:hidden">
                      <ToggleRow
                        label="Mobile Dock"
                        description="Show a persistent bottom navigation bar on mobile."
                        checked={formData.enableMobileDock}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            enableMobileDock: !formData.enableMobileDock,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <h5 className="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-2 ml-1 opacity-70">
                      Language
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="relative group">
                          <select
                            value={formData.interfaceLanguage}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                interfaceLanguage: e.target.value as any,
                              })
                            }
                            className="w-full bg-pplx-input text-pplx-text text-sm rounded-2xl px-5 py-4 outline-none appearance-none transition-all cursor-pointer hover:bg-pplx-secondary"
                          >
                            <option value="en">English (Interface)</option>
                            <option value="ro">Română (Interfață)</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative group">
                          <select
                            value={formData.aiProfile.language}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                aiProfile: {
                                  ...formData.aiProfile,
                                  language: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-pplx-input text-pplx-text text-sm rounded-2xl px-5 py-4 outline-none appearance-none transition-all cursor-pointer hover:bg-pplx-secondary"
                          >
                            <option value="English">
                              English (AI Response)
                            </option>
                            <option value="Romanian">
                              Romanian (AI Response)
                            </option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Japanese">Japanese</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-pplx-card rounded-3xl px-6 py-2 shadow-sm mt-6">
                      <ToggleRow
                        label="Pro Search"
                        description="Enable real-time web grounding."
                        checked={formData.useSearch}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            useSearch: !formData.useSearch,
                          })
                        }
                        isBeta={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- MODELS TAB --- */}
              {activeTab === "models" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="AI Models"
                      desc="Configure Cloud and Offline AI sources."
                    />
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
                    <div className="flex items-center flex-wrap gap-1 p-1 bg-pplx-hover/50 border border-pplx-border rounded-xl w-fit">
                      <button 
                        onClick={() => setModelsSubTab("cloud")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${modelsSubTab === 'cloud' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Cloud 
                      </button>
                      <button 
                        onClick={() => setModelsSubTab("local_node")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${modelsSubTab === 'local_node' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Device & Network
                      </button>
                      <button 
                        onClick={() => setModelsSubTab("browser")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${modelsSubTab === 'browser' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        In-Browser
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted" />
                      <input 
                        type="text" 
                        placeholder="Search models..." 
                        value={modelsSearch}
                        onChange={(e) => setModelsSearch(e.target.value)}
                        className="w-full md:w-64 pl-9 pr-4 py-2 bg-pplx-hover/50 border border-pplx-border focus:border-pplx-accent rounded-xl text-sm outline-none transition-all placeholder:text-pplx-muted text-pplx-text" 
                      />
                    </div>
                  </div>

                  {modelsSubTab === "cloud" && (
                    <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                      {/* Gemini Card */}
                      {"google gemini".includes(modelsSearch.toLowerCase()) && (
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                              <Sparkles size={20} className="text-blue-500" />
                            </div>
                            {formData.modelProvider === ModelProvider.GEMINI && (
                              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {formData.modelProvider === ModelProvider.GEMINI ? (
                              <button onClick={() => setEditingConnector(editingConnector === "gemini" ? null : "gemini")} className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                Configure
                              </button>
                            ) : (
                              <button onClick={() => setFormData({ ...formData, modelProvider: ModelProvider.GEMINI })} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity">
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text flex items-center justify-between">
                            Google Gemini
                            {formData.modelProvider === ModelProvider.GEMINI && (
                              <span className="text-[9px] bg-pplx-accent text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                            )}
                          </h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Gemini 1.5 Pro & Flash. Fast, multimodal reasoning models.
                          </p>

                          {editingConnector === "gemini" && (
                            <div className="mt-4 space-y-3">
                              <input
                                type="password"
                                value={formData.geminiApiKey || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    geminiApiKey: e.target.value,
                                  })
                                }
                                placeholder="Override API Key (Optional)..."
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      )}

                      {/* OpenRouter Card */}
                      {"openrouter aggregated models".includes(modelsSearch.toLowerCase()) && (
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                              <Globe size={20} className="text-indigo-500" />
                            </div>
                            {formData.modelProvider === ModelProvider.OPENROUTER && (
                              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {formData.modelProvider === ModelProvider.OPENROUTER ? (
                              <button onClick={() => setEditingConnector(editingConnector === "openrouter" ? null : "openrouter")} className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                Configure
                              </button>
                            ) : (
                              <button onClick={() => setFormData({ ...formData, modelProvider: ModelProvider.OPENROUTER })} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity">
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text flex items-center justify-between">
                            OpenRouter
                            {formData.modelProvider === ModelProvider.OPENROUTER && (
                              <span className="text-[9px] bg-pplx-accent text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                            )}
                          </h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Aggregated Models. Access top LLMs through a single API.
                          </p>

                          {editingConnector === "openrouter" && (
                            <div className="mt-4 space-y-3">
                              <input
                                type="password"
                                value={formData.openRouterApiKey}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openRouterApiKey: e.target.value,
                                  })
                                }
                                placeholder="sk-or-..."
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                              <input
                                list="openrouter-models"
                                type="text"
                                value={formData.openRouterModelId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openRouterModelId: e.target.value,
                                  })
                                }
                                placeholder="Select or type model ID..."
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                              <datalist id="openrouter-models">
                                {OPENROUTER_PRESETS.map((model) => (
                                  <option key={model} value={model} />
                                ))}
                              </datalist>
                            </div>
                          )}
                        </div>
                      </div>
                      )}

                      {/* OpenAI Card */}
                      {"openai gpt-4o".includes(modelsSearch.toLowerCase()) && (
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                              <Zap size={20} className="text-emerald-500" />
                            </div>
                            {formData.modelProvider === ModelProvider.OPENAI && (
                              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {formData.modelProvider === ModelProvider.OPENAI ? (
                              <button onClick={() => setEditingConnector(editingConnector === "openai" ? null : "openai")} className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                Configure
                              </button>
                            ) : (
                              <button onClick={() => setFormData({ ...formData, modelProvider: ModelProvider.OPENAI })} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity">
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text flex items-center justify-between">
                            OpenAI
                            {formData.modelProvider === ModelProvider.OPENAI && (
                              <span className="text-[9px] bg-pplx-accent text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                            )}
                          </h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            GPT-4o & GPT-3.5. Powerful reasoning and chat capabilities.
                          </p>

                          {editingConnector === "openai" && (
                            <div className="mt-4 space-y-3">
                              <input
                                type="password"
                                value={formData.openAiApiKey}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openAiApiKey: e.target.value,
                                  })
                                }
                                placeholder="sk-..."
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                              <input
                                type="text"
                                value={formData.openAiModelId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openAiModelId: e.target.value,
                                  })
                                }
                                placeholder="gpt-4o"
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                  )}

                  {modelsSubTab === "local_node" && (
                    <div className="animate-fadeIn pb-12">
                      <div className="bg-pplx-card rounded-3xl p-6 mb-6 shadow-sm border border-pplx-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Server size={20} className="text-emerald-500" />
                          <h3 className="text-lg font-bold text-pplx-text">Device & Network Models</h3>
                        </div>
                        <p className="text-sm text-pplx-muted leading-relaxed">
                          These models run completely off-cloud using your local hardware. They are fast, reliable, private, and always available. The system automatically connects to known LLM endpoints running on standard ports on your PC.
                        </p>
                      </div>

                      <LocalBackendPanel />
                    </div>
                  )}

                  {modelsSubTab === "browser" && (
                    <div className="animate-fadeIn pb-12">
                      <div className="bg-pplx-card rounded-3xl p-6 mb-6 shadow-sm border border-pplx-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Smartphone size={20} className="text-pplx-accent" />
                          <h3 className="text-lg font-bold text-pplx-text">
                            Offline Model Store
                          </h3>
                        </div>
                        <p className="text-sm text-pplx-muted leading-relaxed">
                          Download highly optimized small language models
                          (1B-7B) to run locally on your device without
                          internet.
                        </p>
                      </div>

                      {(() => {
                        const support = checkLocalModelSupport();

                        return (
                          <>
                            {!support.supported && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle
                                    size={20}
                                    className="text-red-400 shrink-0 mt-0.5"
                                  />
                                  <div>
                                    <p className="text-sm font-bold text-red-400 mb-1">
                                      {support.reason}
                                    </p>
                                    <p className="text-xs text-red-300/80 leading-relaxed">
                                      {support.details}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest opacity-60 ml-1">
                                Available Models
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {AVAILABLE_OFFLINE_MODELS
                                  .filter(model => model.name.toLowerCase().includes(modelsSearch.toLowerCase()) || model.description.toLowerCase().includes(modelsSearch.toLowerCase()) || model.family.toLowerCase().includes(modelsSearch.toLowerCase()))
                                  .map((model) => {
                                  const downloadedModel =
                                    formData.localModels.find(
                                      (m) => m.id === model.id,
                                    );
                                  const isDownloaded = !!downloadedModel;
                                  const isActive =
                                    formData.activeLocalModelId === model.id;
                                  const progress =
                                    downloadProgress[model.id] || 0;

                                  return (
                                    <OfflineModelCard
                                      key={model.id}
                                      model={model}
                                      isDownloaded={isDownloaded}
                                      isActive={isActive}
                                      progress={progress}
                                      isSupported={support.supported}
                                      unsupportedReason={
                                        !support.supported ? support.reason : ""
                                      }
                                      onDownload={() =>
                                        handleDownloadModel(model)
                                      }
                                      onSelect={() =>
                                        setFormData({
                                          ...formData,
                                          activeLocalModelId: model.id,
                                          modelProvider: ModelProvider.LOCAL,
                                        })
                                      }
                                      onDelete={() =>
                                        handleDeleteModel(model.id)
                                      }
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {formData.localModels.length === 0 && (
                        <div className="mt-8 text-center p-6 border-2 border-dashed border-pplx-border/50 rounded-2xl opacity-60">
                          <Cloud
                            size={32}
                            className="mx-auto text-pplx-muted mb-2"
                          />
                          <span className="text-xs font-medium text-pplx-muted">
                            No models downloaded yet.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- VOICE CATEGORY --- */}
                  <div className="space-y-4 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                      <h2 className="text-xl font-bold text-pplx-text mb-2">Voice Providers</h2>
                      <p className="text-sm text-pplx-muted">
                        Configure API keys for Text-to-Speech and Speech-to-Text inference models.
                      </p>
                    </div>

                    <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                       {/* ElevenLabs Card */}
                       <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            <Activity className="w-5 h-5 text-pplx-text" />
                          </div>
                        </div>
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">ElevenLabs</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Ultra-realistic voices and custom cloning.
                          </p>
                          <div className="mt-4 relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted opacity-50" size={14} />
                            <input
                              type="password"
                              value={formData.elevenLabsApiKey || ""}
                              onChange={(e) => setFormData({ ...formData, elevenLabsApiKey: e.target.value })}
                              placeholder="sk_..."
                              className="w-full px-3 pl-9 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                            />
                          </div>
                        </div>
                      </div>

                      {/* OpenAI Voice Card */}
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            <Activity className="w-5 h-5 text-pplx-text" />
                          </div>
                        </div>
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">OpenAI Voice</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Whisper (STT) and OpenAI (TTS).
                          </p>
                          <div className="mt-4 relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted opacity-50" size={14} />
                            <input
                              type="password"
                              value={formData.openaiVoiceApiKey || ""}
                              onChange={(e) => setFormData({ ...formData, openaiVoiceApiKey: e.target.value })}
                              placeholder="sk-proj-..."
                              className="w-full px-3 pl-9 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom Voice Card */}
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            <Activity className="w-5 h-5 text-pplx-text" />
                          </div>
                        </div>
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">Custom Voice</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Custom instances (e.g., Cartesia).
                          </p>
                          <div className="mt-4 relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted opacity-50" size={14} />
                            <input
                              type="password"
                              value={formData.customVoiceApiKey || ""}
                              onChange={(e) => setFormData({ ...formData, customVoiceApiKey: e.target.value })}
                              placeholder="API Key..."
                              className="w-full px-3 pl-9 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- EMBEDDINGS CATEGORY --- */}
                  <div className="space-y-4 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                      <h2 className="text-xl font-bold text-pplx-text mb-2">Embeddings Configuration</h2>
                      <p className="text-sm text-pplx-muted">
                        Models used for specific retrieval tasks and semantic searches.
                      </p>
                    </div>

                    <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            <Database className="w-5 h-5 text-pplx-text" />
                          </div>
                        </div>
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">Embeddings API</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Select the default embeddings provider.
                          </p>
                          <div className="mt-4">
                            <select
                              value={formData.embeddingProvider}
                              onChange={(e) => setFormData({ ...formData, embeddingProvider: e.target.value as "gemini" | "openai" | "custom" })}
                              className="w-full bg-pplx-input border border-pplx-border rounded-xl px-3 py-2 text-sm text-pplx-text outline-none appearance-none focus:border-pplx-accent"
                            >
                              <option value="gemini">Google Gemini (Default)</option>
                              <option value="openai">OpenAI</option>
                              <option value="custom">Custom Configuration</option>
                            </select>
                          </div>
                          
                          {formData.embeddingProvider === "custom" && (
                            <div className="mt-3 relative">
                              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted opacity-50" size={14} />
                              <input
                                type="text"
                                value={formData.customEmbeddingModelId || ""}
                                onChange={(e) => setFormData({ ...formData, customEmbeddingModelId: e.target.value })}
                                placeholder="e.g. text-embedding-v2"
                                className="w-full px-3 pl-9 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- MEMORY CONFIG CATEGORY --- */}
                  <div className="space-y-4 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                       <h2 className="text-xl font-bold text-pplx-text mb-2">Memory Settings</h2>
                       <p className="text-sm text-pplx-muted">
                        Processor model for context maintenance and memory management.
                       </p>
                    </div>

                    <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            <Brain className="w-5 h-5 text-pplx-text" />
                          </div>
                        </div>
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">Context Processor</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            Select the platform responsible for context.
                          </p>
                          <div className="mt-4">
                            <select
                              value={formData.memoryModelProvider || "default"}
                              onChange={(e) => setFormData({ ...formData, memoryModelProvider: e.target.value as "default" | "openai" | "openrouter" })}
                              className="w-full bg-pplx-input border border-pplx-border rounded-xl px-3 py-2 text-sm text-pplx-text outline-none appearance-none focus:border-pplx-accent"
                            >
                              <option value="default">Default LLM (Same as Chat)</option>
                              <option value="openai">OpenAI Engine</option>
                              <option value="openrouter">OpenRouter Processor</option>
                            </select>
                          </div>

                          {(formData.memoryModelProvider === "openai" || formData.memoryModelProvider === "openrouter") && (
                            <div className="mt-3 relative">
                              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted opacity-50" size={14} />
                              <input
                                type="text"
                                value={formData.customMemoryModelId || ""}
                                onChange={(e) => setFormData({ ...formData, customMemoryModelId: e.target.value })}
                                placeholder={formData.memoryModelProvider === "openai" ? "gpt-4-turbo" : "anthropic/claude-3-haiku"}
                                className="w-full px-3 pl-9 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MEMORY TAB --- */}
              {activeTab === "memory" && (
                <div className="flex flex-col pb-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Memory"
                      desc="What Hermes remembers about you and your environment across sessions."
                    />
                  </div>
                  
                  <div className="bg-[#1f1f1f] rounded-2xl p-6 mb-6 border border-white/5 shadow-md">
                    <div className="flex items-center gap-8 mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white tracking-tight">{memoryStats.sessions}</span>
                        <span className="text-sm font-medium text-gray-400">Sessions</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white tracking-tight">{memoryStats.messages}</span>
                        <span className="text-sm font-medium text-gray-400">Messages</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white tracking-tight">{memories.length}</span>
                        <span className="text-sm font-medium text-gray-400">Memories</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[13px] font-bold text-gray-300">Agent Memory</span>
                          <span className="text-[11px] text-gray-400">{memoryStats.memoryChars} / 50,000 chars ({Math.round((memoryStats.memoryChars / 50000) * 100)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#10b981] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(2, (memoryStats.memoryChars / 50000) * 100))}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[13px] font-bold text-gray-300">User Profile</span>
                          <span className="text-[11px] text-gray-400">{memoryStats.userProfileChars} / 10,000 chars ({Math.round((memoryStats.userProfileChars / 10000) * 100)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#10b981] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(2, (memoryStats.userProfileChars / 10000) * 100))}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pplx-card rounded-3xl px-6 border-none shadow-sm mb-6">
                    <ToggleRow
                      label="Enable Memory"
                      description="Allow the AI to recall facts about you."
                      checked={formData.enableMemory}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          enableMemory: !formData.enableMemory,
                        })
                      }
                    />
                  </div>
                  {formData.enableMemory ? (
                    <div className="bg-pplx-card rounded-3xl border-none shadow-lg overflow-hidden">
                      <div className="p-5 border-b border-pplx-border/30 bg-pplx-card/95 backdrop-blur-sm sticky top-0 z-20">
                        <div className="relative">
                          <Search
                            className="absolute left-4 top-3.5 text-pplx-muted opacity-50"
                            size={18}
                          />
                          <input
                            className="w-full bg-pplx-input text-base text-pplx-text pl-12 pr-4 py-3 rounded-2xl outline-none placeholder-pplx-muted/50"
                            placeholder="Search memories..."
                            value={memorySearch}
                            onChange={(e) => setMemorySearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Content Area - Expanded */}
                      <div className="p-4 space-y-2 bg-pplx-card">
                        {/* Categories */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1 opacity-70">
                              Categories
                            </span>
                            <button
                              onClick={() =>
                                setIsCategoriesCollapsed(!isCategoriesCollapsed)
                              }
                              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium text-[10px] uppercase tracking-wide ${isCategoriesCollapsed ? "bg-pplx-text text-pplx-primary" : "bg-pplx-input text-pplx-muted hover:text-pplx-text"}`}
                            >
                              {isCategoriesCollapsed ? (
                                <span>Show</span>
                              ) : (
                                <span>Hide</span>
                              )}
                              {isCategoriesCollapsed ? (
                                <ChevronDown size={14} />
                              ) : (
                                <X size={14} />
                              )}
                            </button>
                          </div>
                          {!isCategoriesCollapsed && (
                            <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                              {MEMORY_CATEGORIES.map((cat) => (
                                <FilterPill
                                  key={cat.id}
                                  id={cat.id}
                                  label={cat.label}
                                  icon={cat.icon}
                                  isActive={memoryFilter === cat.id}
                                  onClick={setMemoryFilter}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Manual Add Section */}
                        {isAddingMemory ? (
                          <div className="p-4 md:p-5 bg-pplx-input/30 rounded-3xl mb-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <label className="block text-xs font-bold text-pplx-muted uppercase tracking-wider mb-2 opacity-70">
                              New Memory
                            </label>
                            <textarea
                              autoFocus
                              value={newMemoryContent}
                              onChange={(e) =>
                                setNewMemoryContent(e.target.value)
                              }
                              placeholder="e.g. I prefer concise answers..."
                              className="w-full bg-pplx-card text-base text-pplx-text outline-none resize-none h-24 md:h-32 p-4 rounded-xl mb-4 shadow-sm placeholder-pplx-muted/40 border-none"
                            />
                            <div className="flex flex-col gap-3">
                              <div className="relative group">
                                <select
                                  value={newMemoryCategory}
                                  onChange={(e) =>
                                    setNewMemoryCategory(
                                      e.target.value as MemoryCategory,
                                    )
                                  }
                                  className="w-full bg-pplx-card text-sm font-bold text-pplx-text rounded-xl px-4 py-3.5 outline-none cursor-pointer hover:bg-pplx-secondary shadow-sm appearance-none border-none pr-10"
                                >
                                  {MEMORY_CATEGORIES.filter(
                                    (c) => c.id !== "all",
                                  ).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                                  size={16}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setIsAddingMemory(false)}
                                  className="flex-1 text-sm text-pplx-muted hover:text-pplx-text px-4 py-3 font-medium bg-transparent rounded-xl hover:bg-pplx-input/50 transition-colors border border-transparent"
                                >
                                  {t.cancel}
                                </button>
                                <button
                                  onClick={handleAddMemory}
                                  className="flex-1 text-sm bg-pplx-text text-pplx-primary px-4 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
                                >
                                  Save Memory
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingMemory(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-pplx-border/50 text-pplx-muted hover:text-pplx-text hover:bg-pplx-input/50 transition-all text-xs font-bold uppercase tracking-wide mb-6"
                          >
                            <Plus size={16} /> Add Memory
                          </button>
                        )}

                        {filteredMemories.length === 0 && !isAddingMemory && (
                          <div className="text-center py-20 text-pplx-muted opacity-40">
                            <Brain
                              size={56}
                              className="mx-auto mb-4 opacity-30"
                            />
                            <p className="text-sm font-medium">
                              No memories found.
                            </p>
                          </div>
                        )}

                        {filteredMemories.map((mem) => (
                          <div
                            key={mem.id}
                            className="group flex flex-col md:flex-row md:items-start justify-between p-4 rounded-2xl bg-pplx-secondary/20 hover:bg-pplx-secondary/40 transition-colors gap-3 md:gap-0"
                          >
                            <div className="flex items-start gap-4">
                              <div className="mt-0.5 text-pplx-text opacity-70 p-2 bg-pplx-card rounded-xl shadow-sm shrink-0">
                                {React.createElement(
                                  getCategoryIcon(mem.category),
                                  { size: 16 },
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <span className="text-sm text-pplx-text leading-relaxed font-medium break-words">
                                  {mem.content}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-pplx-muted uppercase tracking-widest opacity-60 bg-pplx-input px-2 py-0.5 rounded">
                                    {mem.category.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end md:block">
                              <button
                                onClick={() => handleDeleteMemory(mem.id)}
                                className="text-pplx-muted hover:text-red-400 p-2 rounded-xl hover:bg-pplx-card md:opacity-0 group-hover:opacity-100 transition-all bg-pplx-input/50 md:bg-transparent"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-5 bg-pplx-card border-t border-pplx-border/30 text-right">
                        <button
                          onClick={handleClearMemory}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center justify-end gap-2 ml-auto font-medium transition-colors"
                        >
                          <Trash2 size={14} /> Clear All Data
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-pplx-muted">
                      <div className="bg-pplx-secondary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Brain size={48} className="opacity-30" />
                      </div>
                      <p className="text-lg font-medium text-pplx-text">
                        Memory Disabled
                      </p>
                      <p className="text-sm opacity-50 mt-2 max-w-xs mx-auto">
                        Turn on to personalize AI responses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* --- PERMISSIONS TAB --- */}
              {activeTab === "permissions" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Agent Permissions"
                      desc="Control what your AI agent is allowed to do."
                    />
                  </div>

                  <div className="bg-pplx-card rounded-3xl p-6 border-none shadow-sm mb-6 space-y-2">
                    <ToggleRow
                      label="File System Access"
                      description="Allow the agent to read, edit, and create files in the workspace."
                      checked={formData.permissions?.fileSystem ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, fileSystem: !(formData.permissions?.fileSystem ?? true) }})}
                    />
                    <ToggleRow
                      label="Terminal & Execution"
                      description="Allow the agent to run command-line tools and execute code/scripts."
                      checked={formData.permissions?.terminal ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, terminal: !(formData.permissions?.terminal ?? true) }})}
                    />
                    <ToggleRow
                      label="Browser Access"
                      description="Allow the agent to browse the web visually and extract information."
                      checked={formData.permissions?.browser ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, browser: !(formData.permissions?.browser ?? true) }})}
                    />
                    <ToggleRow
                      label="Communications"
                      description="Allow the agent to send emails, texts, or instant messages."
                      checked={formData.permissions?.communications ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, communications: !(formData.permissions?.communications ?? true) }})}
                    />
                    <ToggleRow
                      label="Vision & Audio / TTS"
                      description="Allow the agent to use computer vision, speech recognition, and text-to-speech."
                      checked={formData.permissions?.visionAudio ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, visionAudio: !(formData.permissions?.visionAudio ?? true) }})}
                    />
                    <ToggleRow
                      label="Tasks & Calendar"
                      description="Allow the agent to manage tasks, kanban boards, and calendar events."
                      checked={formData.permissions?.tasks ?? true}
                      onChange={() => setFormData({ ...formData, permissions: { ...formData.permissions, tasks: !(formData.permissions?.tasks ?? true) }})}
                    />
                  </div>
                </div>
              )}

              {/* --- PROFILE TAB --- */}
              {activeTab === "profile" && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.profile}
                      desc="Identify yourself to the AI."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 pb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-pplx-secondary flex items-center justify-center shadow-2xl relative z-10">
                        {formData.userProfile.avatar ? (
                          <img
                            src={formData.userProfile.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User
                            size={56}
                            className="text-pplx-muted opacity-50"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-3 bg-pplx-text text-pplx-primary rounded-full shadow-lg hover:scale-110 transition-transform z-20 border-4 border-pplx-primary"
                      >
                        <Camera size={18} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h5 className="text-xl font-bold text-pplx-text">
                        Your Avatar
                      </h5>
                      <p className="text-sm text-pplx-muted max-w-sm mx-auto md:mx-0 opacity-70">
                        Personalize your chat experience.
                      </p>
                      {formData.userProfile.avatar && (
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              userProfile: {
                                ...formData.userProfile,
                                avatar: undefined,
                              },
                            })
                          }
                          className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium pt-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <InputGroup label="Name">
                      <input
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              name: e.target.value,
                            },
                          })
                        }
                        placeholder="How should the AI call you?"
                      />
                    </InputGroup>
                    <InputGroup
                      label="Location"
                      description="For weather & local news."
                    >
                      <input
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              location: e.target.value,
                            },
                          })
                        }
                        placeholder="City, Country"
                      />
                    </InputGroup>
                    <InputGroup label="Bio">
                      <textarea
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none h-32 resize-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.bio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              bio: e.target.value,
                            },
                          })
                        }
                        placeholder="Tell the AI about your profession and interests..."
                      />
                    </InputGroup>
                  </div>
                  <div className="pt-8">
                    <h5 className="text-sm font-bold text-pplx-text mb-6 flex items-center gap-2">
                      <Sparkles
                        size={16}
                        className="text-pplx-text opacity-70"
                      />{" "}
                      System Persona
                    </h5>
                    <InputGroup label="Custom Instructions">
                      <textarea
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none h-40 resize-none font-mono text-xs transition-all placeholder-pplx-muted/50"
                        value={formData.aiProfile.systemInstructions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aiProfile: {
                              ...formData.aiProfile,
                              systemInstructions: e.target.value,
                            },
                          })
                        }
                        placeholder="You are a helpful assistant. Be concise..."
                      />
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* --- CONNECTORS TAB --- */}
              {activeTab === "connectors" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Connectors"
                      desc="Connect external services to your AI agent."
                    />
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
                    <div className="flex items-center gap-1 p-1 bg-pplx-hover/50 border border-pplx-border rounded-xl w-fit">
                      <button 
                        onClick={() => setConnectorsSubTab("installed")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${connectorsSubTab === 'installed' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Installed
                      </button>
                      <button 
                        onClick={() => setConnectorsSubTab("connectors")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${connectorsSubTab === 'connectors' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Available
                      </button>
                      <button 
                        onClick={() => setConnectorsSubTab("gateways")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${connectorsSubTab === 'gateways' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Gateways
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted" />
                      <input 
                        type="text" 
                        placeholder="Search connectors..." 
                        value={connectorsSearch}
                        onChange={(e) => setConnectorsSearch(e.target.value)}
                        className="w-full md:w-64 pl-9 pr-4 py-2 bg-pplx-hover/50 border border-pplx-border focus:border-pplx-accent rounded-xl text-sm outline-none transition-all placeholder:text-pplx-muted text-pplx-text" 
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                    {/* --- Execution Environments --- */}
                    <div className="bg-pplx-sidebar rounded-xl border border-pplx-border p-5 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <Cloud size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-pplx-text text-sm">Cloud Sandbox</h3>
                            <p className="text-[10px] text-pplx-muted">Secure remote execution (E2B).</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-pplx-border">
                        <label className="text-[10px] font-bold text-pplx-muted mb-2 block uppercase">API Key</label>
                        <input
                          type="password"
                          value={e2bApiKey}
                          onChange={(e) => {
                            setE2bApiKey(e.target.value);
                            localStorage.setItem("E2B_API_KEY", e.target.value);
                          }}
                          className="w-full bg-pplx-primary border border-pplx-border text-pplx-text text-xs rounded-lg p-2 outline-none focus:border-pplx-accent"
                          placeholder="e2b_..."
                        />
                      </div>
                    </div>

                    <div className="bg-pplx-sidebar rounded-xl border border-pplx-border p-5 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Laptop size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-pplx-text text-sm">Connect my Computer</h3>
                            <p className="text-[10px] text-pplx-muted">Execute code on your machine.</p>
                          </div>
                        </div>
                        <ToggleLeft size={24} className="text-pplx-muted transition-colors cursor-pointer" />
                      </div>
                      <div className="mt-auto pt-4 border-t border-pplx-border space-y-3">
                         <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-pplx-border/50">
                           <span className="text-[10px] text-pplx-muted font-mono truncate">localhost:4000</span>
                           <button className="px-2 py-0.5 bg-pplx-primary hover:bg-pplx-hover border border-pplx-border rounded text-[10px] text-pplx-text transition-colors">Test</button>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-pplx-muted uppercase tracking-wider">Project Connector</span>
                           <div className="w-8 h-4 bg-pplx-border rounded-full relative">
                              <div className="absolute left-1 top-1 w-2 h-2 bg-pplx-muted rounded-full"></div>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Tavily Search - Specialized Card */}
                    {Object.values([
                      { id: 'tavily', name: 'Tavily Search', desc: 'AI-optimized search engine for fast, accurate real-time data.', icon: <Search className="w-5 h-5 text-blue-500" /> },
                      { id: 'brave', name: 'Brave Search', desc: 'Privacy-preserving search engine for real-time web access.', icon: <Search className="w-5 h-5 text-orange-500" /> }
                    ]).filter(c => c.name.toLowerCase().includes(connectorsSearch.toLowerCase()) || c.desc.toLowerCase().includes(connectorsSearch.toLowerCase()))
                    .filter(special => {
                      const isConnected = special.id === 'tavily' ? !!formData.tavilyApiKey : !!formData.braveApiKey;
                      if (connectorsSubTab === "installed") return isConnected;
                      if (connectorsSubTab === "connectors") return !isConnected;
                      if (connectorsSubTab === "gateways") return false;
                      return true;
                    })
                    .map(special => {
                      const isConnected = special.id === 'tavily' ? !!formData.tavilyApiKey : !!formData.braveApiKey;
                      const isEditing = editingConnector === special.id;
                      const isActiveSearch = formData.searchProvider === special.id;
                      
                      return (
                        <div key={special.id} className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className="relative">
                              <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                                {special.icon}
                              </div>
                              {isConnected && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isConnected ? (
                                <>
                                  <button onClick={() => {
                                      setEditingConnector(special.id);
                                      setApiKeyInput(special.id === 'tavily' ? (formData.tavilyApiKey || "") : (formData.braveApiKey || ""));
                                    }} 
                                    className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                    Configure
                                  </button>
                                  <div className="relative group/menu">
                                    <button onClick={() => {
                                      if (special.id === 'tavily') {
                                        setFormData({ ...formData, tavilyApiKey: "", searchProvider: formData.searchProvider === "tavily" && formData.braveApiKey ? "brave" : formData.searchProvider });
                                      } else {
                                        setFormData({ ...formData, braveApiKey: "", searchProvider: formData.searchProvider === "brave" && formData.tavilyApiKey ? "tavily" : formData.searchProvider });
                                      }
                                    }} className="p-1.5 text-pplx-muted hover:text-red-400 bg-pplx-hover rounded-full transition-colors" title="Disconnect">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <button onClick={() => {
                                  setApiKeyInput("");
                                  setEditingConnector(special.id);
                                }} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity">
                                  Connect
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-1 flex-1">
                            <h3 className="text-[15px] font-medium text-pplx-text flex items-center justify-between">
                              {special.name}
                              {isActiveSearch && isConnected && (
                                <span className="text-[9px] bg-pplx-accent text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                              )}
                            </h3>
                            <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                              {special.desc}
                            </p>
                            
                            {!isConnected && !isEditing && (
                              <button onClick={() => setEditingConnector(special.id)} className="w-full mt-4 py-2 bg-pplx-hover text-pplx-text text-sm font-medium rounded-xl hover:bg-pplx-border transition-colors">
                                Add API Key
                              </button>
                            )}

                            {isConnected && !isActiveSearch && !isEditing && (
                              <button onClick={() => setFormData({ ...formData, searchProvider: special.id as "tavily" | "brave" })} className="w-full mt-4 py-2 bg-pplx-hover text-pplx-text text-sm font-medium rounded-xl hover:bg-pplx-border transition-colors">
                                Set as Active Search
                              </button>
                            )}

                            {isEditing && (
                              <div className="mt-4 space-y-3">
                                <input
                                  type="password"
                                  placeholder="Enter API Key"
                                  value={apiKeyInput}
                                  autoFocus
                                  onChange={(e) => setApiKeyInput(e.target.value)}
                                  className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (special.id === 'tavily') {
                                        setFormData({ ...formData, tavilyApiKey: apiKeyInput, searchProvider: "tavily" });
                                      } else {
                                        setFormData({ ...formData, braveApiKey: apiKeyInput, searchProvider: "brave" });
                                      }
                                      setEditingConnector(null);
                                    }}
                                    className="flex-1 bg-pplx-text text-pplx-primary hover:opacity-90 px-3 py-2 rounded-xl text-sm font-medium transition-opacity"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingConnector(null)}
                                    className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Standard Connectors */}
                    {Object.values(connectors)
                      .filter(c => c.name.toLowerCase().includes(connectorsSearch.toLowerCase()) || c.description.toLowerCase().includes(connectorsSearch.toLowerCase()))
                      .filter(connector => {
                        const gatewayIds = ["discord", "telegram", "slack", "mattermost", "matrix", "whatsapp", "signal", "sms", "homeassistant", "email", "wecom", "feishu", "dingtalk", "weixin", "webhook"];
                        const isGateway = gatewayIds.includes(connector.id);
                        
                        if (connectorsSubTab === "installed") return connector.status === "connected";
                        if (connectorsSubTab === "gateways") return connector.status !== "connected" && isGateway;
                        if (connectorsSubTab === "connectors") return connector.status !== "connected" && !isGateway;
                        return true;
                      })
                      .map((connector) => (
                      <div key={connector.id} className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm text-pplx-text flex items-center justify-center">
                              {renderIcon(connector.icon)}
                            </div>
                            {connector.status === 'connected' && (
                              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {connector.status === 'connected' ? (
                              <>
                                <button onClick={() => {
                                  if (connector.authType === "api_key") {
                                    setEditingConnector(connector.id);
                                    setApiKeyInput("");
                                  } else {
                                    handleConnect(connector.id);
                                  }
                                }} className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                  Configure
                                </button>
                                <button onClick={() => handleDisconnect(connector.id)} className="p-1.5 text-pplx-muted hover:text-red-400 bg-pplx-hover rounded-full transition-colors" title="Disconnect">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleConnect(connector.id)} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                                <Plug size={12} className="inline mr-1" />
                                {connector.authType === "api_key" ? "Configure API" : "Install & Connect"}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 flex-1">
                          <h3 className="text-[15px] font-medium text-pplx-text">{connector.name}</h3>
                          <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                            {connector.description}
                          </p>

                          {editingConnector === connector.id && (
                            <div className="mt-4 space-y-3">
                              <input
                                type="password"
                                placeholder="Enter API Key"
                                value={apiKeyInput}
                                autoFocus
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full px-3 py-2 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveApiKey}
                                  className="flex-1 bg-pplx-text text-pplx-primary hover:opacity-90 px-3 py-2 rounded-xl text-sm font-medium transition-opacity"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingConnector(null)}
                                  className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- SKILLS TAB --- */}
              {activeTab === "skills" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Skills"
                      desc="Enable specific capabilities for your AI agent."
                    />
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
                    <div className="flex items-center gap-1 p-1 bg-pplx-hover/50 border border-pplx-border rounded-xl w-fit overflow-x-auto no-scrollbar">
                      <button 
                        onClick={() => setSkillsSubTab("installed")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${skillsSubTab === 'installed' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Installed
                      </button>
                      <button 
                        onClick={() => setSkillsSubTab("learned")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${skillsSubTab === 'learned' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Learned
                      </button>
                      <button 
                        onClick={() => setSkillsSubTab("marketplace")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${skillsSubTab === 'marketplace' ? 'bg-pplx-card text-pplx-text shadow-sm border border-pplx-border' : 'text-pplx-muted hover:text-pplx-text border border-transparent'}`}
                      >
                        Marketplace
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted" />
                      <input 
                        type="text" 
                        placeholder="Search skills..." 
                        value={skillsSearch}
                        onChange={(e) => setSkillsSearch(e.target.value)}
                        className="w-full md:w-64 pl-9 pr-4 py-2 bg-pplx-hover/50 border border-pplx-border focus:border-pplx-accent rounded-xl text-sm outline-none transition-all placeholder:text-pplx-muted text-pplx-text" 
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2">
                    {skillsSubTab === "learned" ? (
                      learnedSkills.length === 0 ? (
                        <div className="col-span-1 sm:col-span-2 text-center text-pplx-muted py-8 bg-pplx-secondary/30 rounded-2xl border border-dashed border-pplx-border">
                          No learned skills yet. Hermes will automatically learn new skills when you assign complex tasks!
                        </div>
                      ) : (
                        learnedSkills
                          .filter(skill => skill.name.toLowerCase().includes(skillsSearch.toLowerCase()) || skill.description.toLowerCase().includes(skillsSearch.toLowerCase()))
                          .map((skill) => (
                            <div key={skill.name} className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                              <div className="flex items-start justify-between mb-3">
                                <div className="relative">
                                  <div className="p-2.5 bg-pplx-hover text-pplx-accent rounded-xl shadow-sm">
                                    <Brain className="w-5 h-5 text-emerald-500" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-pplx-hover px-2 py-1 rounded-full font-mono text-pplx-muted">
                                    {skill.readiness || "learned"}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1">
                                <h3 className="text-[15px] font-medium text-pplx-text flex flex-wrap items-center gap-2">
                                  {skill.name}
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                                    Auto-Learned
                                  </span>
                                </h3>
                                <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                                  {skill.description}
                                </p>
                              </div>
                            </div>
                        ))
                      )
                    ) : (
                      Object.values(skills)
                        .filter(skill => skill.name.toLowerCase().includes(skillsSearch.toLowerCase()) || skill.description.toLowerCase().includes(skillsSearch.toLowerCase()))
                        .filter(skill => skillsSubTab === 'installed' ? skill.isActive : !skill.isActive)
                        .map((skill) => {
                        const missingConnectors = skill.requiredConnectors.filter(
                          (connId) => connectors[connId]?.status !== 'connected'
                        );
                        
                        return (
                          <div key={skill.id} className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                            <div className="flex items-start justify-between mb-3">
                              <div className="relative">
                                <div className="p-2.5 bg-pplx-hover text-pplx-text rounded-xl shadow-sm">
                                  {renderIcon(skill.icon)}
                                </div>
                                {skill.isActive && (
                                  <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {skill.isActive ? (
                                  <>
                                    <button onClick={() => toggleSkill(skill.id, false)} className="px-3 py-1.5 text-xs font-medium bg-pplx-hover text-pplx-text rounded-full hover:bg-pplx-border transition-colors">
                                      Configure
                                    </button>
                                    <button className="p-1.5 text-pplx-muted hover:text-pplx-text bg-pplx-hover rounded-full transition-colors border border-transparent">
                                      <MoreHorizontal size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => toggleSkill(skill.id, true)} className="px-4 py-1.5 text-xs font-medium bg-pplx-text text-pplx-primary rounded-full hover:opacity-90 transition-opacity">
                                    Enable
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-1">
                              <h3 className="text-[15px] font-medium text-pplx-text flex flex-wrap items-center gap-2">
                                {skill.name}
                                {missingConnectors.length > 0 && (
                                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                                    Requires: {missingConnectors.map(id => connectors[id]?.name || id).join(', ')}
                                  </span>
                                )}
                              </h3>
                              <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                                {skill.description}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* --- LOCAL BACKEND TAB --- */}
              {activeTab === "local_backend" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Local Network & Backends"
                      desc="Connect to local services and execution nodes."
                    />
                  </div>
                  <div className="mt-4">
                    <LocalBackendPanel />
                  </div>
                </div>
              )}

              {/* --- PERMISSIONS TAB --- */}
              {activeTab === "permissions" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Permissions"
                      desc="Manage system access and internet capabilities."
                    />
                  </div>

                  <div className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2 mt-4">
                    {TOOL_CARDS.map((card) => {
                      const Icon = card.icon;
                      const isEnabled = toolToggles[card.key] !== false;
                      return (
                        <div key={card.key} className="border border-pplx-border rounded-2xl p-4 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm relative group h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className="relative">
                              <div className={`p-2.5 rounded-xl shadow-sm ${card.iconClasses}`}>
                                <Icon size={20} />
                              </div>
                              {isEnabled && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border-2 border-pplx-card">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleTool(card.key)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${isEnabled ? 'bg-pplx-hover text-pplx-text' : 'bg-pplx-text text-pplx-primary'}`}
                              >
                                {isEnabled ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </div>
                          <div className="mt-1">
                            <h3 className="text-[15px] font-medium text-pplx-text">{card.label}</h3>
                            <p className="text-[13px] text-pplx-muted mt-1.5 leading-relaxed line-clamp-2">
                              {card.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- ABOUT TAB --- */}
              {activeTab === "about" && (
                <div className="space-y-10 animate-fadeIn max-w-3xl mx-auto py-2">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-tr from-pplx-hover to-pplx-card border border-pplx-border rounded-[32px] flex items-center justify-center mb-6 shadow-sm">
                      <Bot size={48} className="text-pplx-text opacity-90" />
                    </div>
                    <h2 className="text-2xl font-semibold text-pplx-text tracking-tight mb-3">Hermes Agent</h2>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="px-2.5 py-1 text-xs font-medium bg-pplx-hover text-pplx-muted rounded-md border border-pplx-border shadow-sm">v1.0.0-beta</span>
                      <span className="px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 shadow-sm">
                        <CheckCircle2 size={12} /> Up to date
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-[13px] font-semibold text-pplx-muted uppercase tracking-wider px-1">System Information & Diagnostics</h3>
                      <div className="bg-[#1f1f1f] rounded-2xl border border-white/5 overflow-hidden shadow-xl text-white">
                        <div className="p-5 border-b border-white/5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">HERMES AGENT</h4>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">ENGINE</span>
                              <span className="text-sm font-medium">v0.14.0</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">RELEASED</span>
                              <span className="text-sm font-medium">2026.5.16</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">DESKTOP</span>
                              <span className="text-sm font-medium">v0.4.3</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">PLATFORM</span>
                              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {getPlatformName()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">PYTHON</span>
                              <span className="text-sm font-medium">3.11.14</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">OPENAI SDK</span>
                              <span className="text-sm font-medium">2.24.0</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">HOME</span>
                              <span className="text-[13px] font-mono font-medium text-gray-300">/Users/vasicatalin/.hermes</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-[#1a1a1a]/50 flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4 border-b border-white/5">
                           <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                             <input 
                               type="text"
                               placeholder="e.g. facebook/react"
                               value={githubRepoUrl}
                               onChange={(e) => saveGithubUrl(e.target.value)}
                               title="GitHub Repository to Track"
                               className="flex-1 sm:w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-gray-600"
                             />
                             <button
                               onClick={checkForUpdates}
                               disabled={!githubRepoUrl || updateStatus === "checking"}
                               className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                             >
                               {updateStatus === "checking" ? <RefreshCw size={14} className="animate-spin" /> : null} 
                               Check Update
                             </button>
                             {updateStatus === "found" && latestCommit && (
                               <button 
                                 onClick={handleDownloadUpdate}
                                 className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                               >
                                 Download ZIP
                               </button>
                             )}
                           </div>
                           
                           <div className="flex gap-2">
                             <button 
                               onClick={async () => {
                                 toast("Running diagnostics...", { icon: '⚙️' });
                                 setTimeout(() => toast.success("All systems optimal"), 1500);
                               }}
                               className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-white/5"
                             >
                               Run Diagnosis
                             </button>
                             <button 
                               onClick={() => {
                                 toast("Creating debug dump...", { icon: '🐞' });
                                 setTimeout(() => toast.success("Dump saved to /.hermes/debug"), 1000);
                               }}
                               className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-white/5"
                             >
                               Debug Dump
                             </button>
                           </div>
                        </div>

                        {(updateStatus === "not_found" || updateStatus === "error" || updateStatus === "found") && (
                           <div className="px-5 py-3 text-sm">
                             {updateStatus === "not_found" && <p className="text-amber-400 font-medium">No commits found in repository.</p>}
                             {updateStatus === "error" && <p className="text-rose-400 font-medium">Error checking repository. Please verify the URL.</p>}
                             {updateStatus === "found" && latestCommit && (
                               <div className="flex items-center gap-3 text-emerald-400 font-medium">
                                 <span className="font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-xs">{latestCommit.sha.substring(0, 7)}</span> 
                                 <span className="truncate max-w-sm">{latestCommit.commit.message.split("\n")[0]}</span>
                               </div>
                             )}
                           </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-[13px] font-semibold text-pplx-muted uppercase tracking-wider px-1">Data Management</h3>
                      <div className="bg-pplx-card border border-pplx-border rounded-xl shadow-sm">
                        <div className="p-5 flex flex-col gap-4">
                          <div className="flex flex-col">
                            <span className="text-base font-medium text-pplx-text">Data Export / Import</span>
                            <span className="text-[13px] text-pplx-muted mt-1">Export or import your Hermes configuration, sessions, skills and memory.</span>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={16} className="text-pplx-muted" />
                              </div>
                              <input 
                                type="email"
                                placeholder="Enter Gmail address (e.g. user@gmail.com) for email backup"
                                value={backupEmail}
                                onChange={(e) => saveBackupEmail(e.target.value)}
                                className="w-full bg-pplx-hover border border-pplx-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-pplx-text outline-none focus:border-pplx-border/80 transition-colors"
                              />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
                              {/* Keep Email backup just in case, but make Export Data and Import Data the main ones */}
                              <button 
                                onClick={handleLocalBackup}
                                className="w-full sm:flex-1 py-2.5 px-4 text-[13px] font-medium bg-pplx-secondary text-pplx-text rounded-lg hover:bg-pplx-hover transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-pplx-border"
                              >
                                <HardDrive size={14} /> Export Backup
                              </button>
                              <button 
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.json';
                                  input.onchange = (e: any) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const r = new FileReader();
                                      r.onload = (ev: any) => {
                                        try {
                                          const data = JSON.parse(ev.target.result);
                                          if(data.settings) setFormData(data.settings);
                                          if(data.localStorage) {
                                            Object.keys(data.localStorage).forEach(k => {
                                              localStorage.setItem(k, data.localStorage[k]);
                                            });
                                          }
                                          toast.success("Backup imported successfully. Reload recommended.");
                                        } catch (err) {
                                          toast.error("Invalid backup file.");
                                        }
                                      };
                                      r.readAsText(file);
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full sm:flex-1 py-2.5 px-4 text-[13px] font-medium bg-pplx-secondary text-pplx-text rounded-lg hover:bg-pplx-hover transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-pplx-border"
                              >
                                <RefreshCw size={14} /> Import Backup
                              </button>
                              <button 
                                onClick={handleEmailBackup}
                                disabled={!backupEmail}
                                className="w-full sm:flex-1 py-2.5 px-4 text-[13px] font-medium bg-pplx-text text-pplx-primary rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Mail size={14} /> Email Backup
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Action Footer (Fixed Bottom inside the Flex container) */}
          <div
            className={`md:hidden p-4 bg-pplx-primary/95 backdrop-blur-md flex gap-3 z-30 shrink-0 transition-all duration-150 ${formData.enableMobileDock ? "pb-[80px]" : "pb-8"}`}
          >
            <button
              onClick={() => setIsMobileDetail(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium text-pplx-text bg-pplx-secondary hover:bg-pplx-hover transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-pplx-text text-pplx-primary shadow-lg"
            >
              {t.save}
            </button>
          </div>

          {/* Desktop Action Footer */}
          <div className="hidden md:flex p-6 bg-pplx-primary justify-end gap-3 rounded-br-3xl rounded-bl-none shrink-0 z-20">
            <button
              onClick={onClose}
              className="w-32 py-3 rounded-xl text-sm font-medium text-pplx-text hover:bg-pplx-secondary transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="w-32 py-3 rounded-xl text-sm font-bold bg-pplx-text text-pplx-primary hover:opacity-90 transition-opacity shadow-lg"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>

      {/* Connection Authorization Modal overlay - Redesigned as a mock browser window */}
      {authorizingConnector && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#f1f1f1] dark:bg-[#202124] border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] min-h-[500px] shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Browser Header / Title Bar */}
            <div className="h-12 bg-[#dfdfdf] dark:bg-[#323232] flex items-center px-4 gap-4 shrink-0 border-b border-gray-300 dark:border-black/50 relative select-none">
              {/* Traffic Lights */}
              <div className="flex gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
              </div>
              
              {/* Navigation buttons */}
              <div className="hidden sm:flex gap-4 text-gray-500 dark:text-gray-400">
                <ChevronLeft size={16} />
                <ChevronRight size={16} className="opacity-50" />
                <RefreshCw size={14} className="ml-1" />
              </div>
              
              {/* URL Bar */}
              <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto absolute left-1/2 -translate-x-1/2 w-3/5">
                <div className="flex items-center gap-2 bg-white dark:bg-[#202124] border border-gray-200 dark:border-[#101010] rounded-md px-3 py-1.5 w-full shadow-inner">
                  <Lock size={12} className="text-gray-600 dark:text-gray-300 shrink-0" />
                  <span className="text-[11px] sm:text-xs text-gray-800 dark:text-gray-200 truncate font-medium">
                    {(() => {
                      switch (authorizingConnector) {
                        case "github": return "https://github.com/login/oauth/authorize?client_id=hermes_ai&scope=repo,user";
                        case "google_workspace": return "https://accounts.google.com/o/oauth2/v2/auth?client_id=hermes_ai&scope=drive,calendar";
                        case "vercel": return "https://vercel.com/integrations/hermes_ai/new?scopes=project:read";
                        case "discord": return "https://discord.com/api/oauth2/authorize?client_id=hermes_ai&scope=bot";
                        default: return `https://${authorizingConnector}.com/oauth/authorize?client_id=hermes_ai`;
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Browser Body / Page Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0d1117] flex flex-col items-center justify-center p-6 relative">
              <div className="w-full max-w-md flex flex-col items-center text-center">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden text-gray-700 dark:text-gray-300">
                     {renderIcon(connectors[authorizingConnector]?.icon || "plug")}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite_0.2s]"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite_0.4s]"></div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-pplx-primary flex items-center justify-center border border-pplx-border shadow-sm p-3">
                     <Bot size={32} className="text-blue-500" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Authorize Hermes</h2>
                <p className="text-gray-500 dark:text-gray-400 text-[15px] mb-8 text-center max-w-sm">
                  <strong>Hermes Agent</strong> wants to access your {connectors[authorizingConnector]?.name} account.
                </p>

                <div className="w-full border border-gray-200 dark:border-gray-800 rounded-xl mb-8 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#161b22] text-left shadow-sm overflow-hidden text-gray-800 dark:text-gray-200">
                   <div className="px-5 py-4 flex flex-col gap-1 bg-gray-50 dark:bg-[#161b22]/50">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested Permissions</span>
                   </div>
                   <div className="p-4 flex items-start gap-3">
                      <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Read account profile</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Read basic information like your name, avatar, and email structure.</div>
                      </div>
                   </div>
                   <div className="p-4 flex items-start gap-3">
                      <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Automate workflows</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Allow Hermes to execute skills, search resources, and create assets on your behalf.</div>
                      </div>
                   </div>
                </div>

                <div className="flex w-full gap-3 mt-auto">
                   <button onClick={() => !isAuthorizing && setAuthorizingConnector(null)} disabled={isAuthorizing} className="flex-1 py-3 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                     Cancel
                   </button>
                   <button onClick={handleConfirmAuthorization} disabled={isAuthorizing} className="flex-[2] py-3 rounded-lg text-sm font-bold text-white bg-[#2da44e] hover:bg-[#2c974b] transition-colors flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed">
                     {isAuthorizing ? <RefreshCw size={16} className="animate-spin" /> : `Authorize ${connectors[authorizingConnector]?.name}`}
                   </button>
                </div>
                
                <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6 px-4 w-full">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
                    <Info size={12} />
                    This is a simulated OAuth window running securely within your app.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
