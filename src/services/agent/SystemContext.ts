/**
 * System Context & Prompt Builder
 * Inspired by NousResearch/hermes-agent agent/prompt_builder.py
 * Assembles system prompt from: identity, platform hints, skills index,
 * context files (.hermes.md, AGENTS.md, CLAUDE.md, .cursorrules), memory block, and tool guidance.
 * Two-layer caching: in-process LRU + IndexedDB snapshot persistence.
 */

import { PromptCacher } from './PromptCacher';
import { SITUATIONAL_SKILLS } from './SkillRegistry';
// Removed unused imports
import { SystemPromptComponents, PlatformHint, ContextFileEntry } from '../../types/hermes';

// ============================================================
// Identity & Constants (from prompt_builder.py)
// ============================================================

const DEFAULT_AGENT_IDENTITY = `You are Hermes Agent, an autonomous AI assistant with persistent memory, tools, and self-improving capabilities. You reason carefully, use tools proactively, and learn from experience.`;

const MEMORY_GUIDANCE = `
MEMORY USAGE:
- You have persistent memory across sessions.
- Memory stores facts, preferences, project context, and learned patterns.
- When you learn something new about the user, save it to memory.
- Before answering, check memory for relevant context.
- Memory is automatically retrieved for relevant queries.
`;

const SKILLS_GUIDANCE = `
SKILLS:
- Skills are reusable instructions that improve your performance on specific tasks.
- You can create new skills from successful workflows (learning loop).
- When a task succeeds, consider if it could become a reusable skill.
- Skills are loaded on-demand based on the current task context.
`;

const TOOL_USE_ENFORCEMENT = `
TOOL USE ENFORCEMENT:
- You MUST use tools when they are relevant to the task.
- Do NOT skip tool calls just because you think you know the answer.
- Keep calling tools until: (1) the task is complete, AND (2) you have verified the result.
- If a tool fails, try an alternative approach before giving up.
`;


// ============================================================
// Platform Hints (from prompt_builder.py PLATFORM_HINTS dict)
// ============================================================

export const PLATFORM_HINTS: Record<string, PlatformHint> = {
  whatsapp: {
    name: 'WhatsApp',
    guidance: 'Keep messages concise and chat-friendly. Avoid excessive formatting.',
    mediaSupport: true,
    attachmentSyntax: 'Send files using MEDIA:/absolute/path/to/file',
  },
  telegram: {
    name: 'Telegram',
    guidance: 'Supported: **bold**, *italic*, ~~strikethrough~~, ||spoiler||, and `code`.',
    mediaSupport: true,
    attachmentSyntax: 'Send files using MEDIA:/absolute/path/to/file',
  },
  discord: {
    name: 'Discord',
    guidance: 'Include MEDIA:/absolute/path/to/file to send files.',
    mediaSupport: true,
    attachmentSyntax: 'MEDIA:/absolute/path/to/file',
  },
  cli: {
    name: 'CLI',
    guidance: 'File delivery: there is no attachment channel - the user reads your text output directly. Use file paths and terminal-friendly formatting.',
    mediaSupport: false,
  },
  web: {
    name: 'Web',
    guidance: 'Full HTML rendering is available in chat. You can generate custom UI easily: use ```html or ```react with Tailwind CSS to build custom web pages, interactable charts (Recharts/ChartJS/D3 injected) and highly polished widgets inline for a premium user experience. You MUST support both light and dark themes using Tailwind `dark:` classes.',
    mediaSupport: true,
  },
  default: {
    name: 'Default',
    guidance: 'Use standard Markdown formatting. Be professional, direct, and comprehensive.',
    mediaSupport: false,
  },
};

// ============================================================
// Context Threat Detection (from prompt_builder.py _CONTEXT_THREAT_PATTERNS)
// ============================================================

const CONTEXT_THREAT_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'ignore-instructions', pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/gi },
  { id: 'system-prompt', pattern: /system\s*prompt|you\s+are\s+now|pretend\s+you\s+are/gi },
  { id: 'role-play', pattern: /roleplay\s+as|act\s+as\s+(if|a)|new\s+persona/gi },
  { id: 'forget', pattern: /forget\s+(everything|all|previous)|start\s+(fresh|over|again)/gi },
  { id: 'developer-mode', pattern: /developer\s*mode|debug\s*mode|admin\s*mode/gi },
  { id: 'jailbreak', pattern: /jailbreak|bypass\s+(safety|filter|restriction)| DAN\b/gi },
  { id: 'hidden-instruction', pattern: /\[INST\]|\[\/INST\]|<<SYS>>|<\|im_start\|>|\{\{system\}\}/gi },
  { id: 'injection-command', pattern: /do\s+not\s+follow|disregard\s+(your|the)\s+(instructions|rules|guidelines)/gi },
];

const CONTEXT_INVISIBLE_CHARS = new Set([
  '\u200B', // Zero-width space
  '\u200C', // Zero-width non-joiner
  '\u200D', // Zero-width joiner
  '\u200E', // Left-to-right mark
  '\u200F', // Right-to-left mark
  '\u2060', // Word joiner
  '\u2061', // Function application
  '\u2062', // Invisible times
  '\u2063', // Invisible separator
  '\u2064', // Invisible plus
]);

/**
 * Scan context file content for prompt injection and invisible characters.
 */
function scanContextContent(content: string, filename: string): string {
  for (const { id, pattern } of CONTEXT_THREAT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      console.warn(`[SystemContext] Context file ${filename} blocked: threat ${id}`);
      return `[BLOCKED: ${filename} contained potential prompt injection (${id}). Content not loaded.]`;
    }
  }

  // Check for invisible Unicode characters
  const hasInvisible = [...content].some(char => CONTEXT_INVISIBLE_CHARS.has(char));
  if (hasInvisible) {
    console.warn(`[SystemContext] Context file ${filename} contains invisible Unicode characters.`);
    return `[BLOCKED: ${filename} contained invisible Unicode characters. Content not loaded.]`;
  }

  return content;
}

// ============================================================
// Context File Discovery (from prompt_builder.py build_context_files_prompt)
// ============================================================

const CONTEXT_FILE_MAX_CHARS = 20000;

/**
 * Load and validate context files in priority order:
 * .hermes.md / HERMES.md > AGENTS.md > CLAUDE.md > .cursorrules
 */
function loadContextFiles(): ContextFileEntry[] {
  const files: ContextFileEntry[] = [];

  // In browser context, we check localStorage and IndexedDB for context files
  // Priority 1: .hermes.md / HERMES.md
  const hermesMd = localStorage.getItem('hermes_context_md');
  if (hermesMd) {
    const scanned = scanContextContent(hermesMd, '.hermes.md');
    files.push({
      path: '.hermes.md',
      content: scanned,
      source: 'hermes_md',
      blocked: scanned.startsWith('[BLOCKED'),
    });
  }

  // Priority 2: AGENTS.md (from project config)
  const agentsMd = localStorage.getItem('agents_context_md');
  if (agentsMd) {
    const scanned = scanContextContent(agentsMd, 'AGENTS.md');
    files.push({
      path: 'AGENTS.md',
      content: scanned,
      source: 'agents_md',
      blocked: scanned.startsWith('[BLOCKED'),
    });
  }

  return files;
}

/**
 * Truncate content using head (70%) / tail (20%) strategy with marker.
 */
function truncateContent(content: string, filename: string, maxChars: number = CONTEXT_FILE_MAX_CHARS): string {
  if (content.length <= maxChars) return content;

  const headSize = Math.floor(maxChars * 0.7);
  const tailSize = Math.floor(maxChars * 0.2);

  const head = content.substring(0, headSize);
  const tail = content.substring(content.length - tailSize);

  console.warn(`[SystemContext] Context file ${filename} truncated: ${content.length} -> ${maxChars} chars`);
  return `${head}\n\n... [${content.length - headSize - tailSize} characters removed] ...\n\n${tail}`;
}

// ============================================================
// Skills Index Builder (from prompt_builder.py build_skills_system_prompt)
// ============================================================

/**
 * Build the skills system prompt section.
 * Uses caching for performance.
 */
function buildSkillsIndex(): string {
  // Get situational skills from SkillRegistry
  const skills = SITUATIONAL_SKILLS as Record<string, string>;

  if (!skills || Object.keys(skills).length === 0) return '';

  const entries = Object.entries(skills).map(([name, content]) => ({
    name,
    description: content.substring(0, 100).replace(/\n/g, ' '),
  }));

  const lines = entries.map(s => `- ${s.name}: ${s.description}`);
  return `AVAILABLE SKILLS:\n${lines.join('\n')}`;
}

// ============================================================
// Main SystemContext Class
// ============================================================

export interface SystemContextData {
  identity: {
    personality: string;
    capabilities: string[];
    values: string[];
    soulMd?: string;
  };
  coreSkills: {
    [skillName: string]: string;
  };
  toolDefinitions: {
    readTools: string[];
    writeTools: string[];
  };
  behavioralRules: string[];
  platformHint?: string;
  skillsIndex?: string;
  contextFiles?: string;
  memoryGuidance?: string;
  skillsGuidance?: string;
  toolUseEnforcement?: string;
  toolGuidance?: string;
}

export class SystemContext {
  private static cachedContext: string | null = null;
  private static cachedComponents: SystemPromptComponents | null = null;
  private static platform: string = 'web';
  private static customIdentity: string | null = null;
  private static customSoulMd: string | null = null;

  // ============================================================
  // Configuration
  // ============================================================

  /**
   * Set the current platform for platform-specific hints.
   */
  static setPlatform(platform: string): void {
    this.platform = platform;
    this.clearCache();
  }

  /**
   * Set a custom agent identity (replaces DEFAULT_AGENT_IDENTITY).
   */
  static setIdentity(identity: string): void {
    this.customIdentity = identity;
    this.clearCache();
  }

  /**
   * Set SOUL.md content (personality/persona override).
   * From Hermes: loads SOUL.md from HERMES_HOME.
   */
  static setSoulMd(content: string): void {
    const scanned = scanContextContent(content, 'SOUL.md');
    if (!scanned.startsWith('[BLOCKED')) {
      this.customSoulMd = scanned;
      this.clearCache();
    }
  }

  // ============================================================
  // Context Building
  // ============================================================

  /**
   * Build all system prompt components.
   * This is the main entry point, matching Hermes' prompt_builder.py assembly.
   */
  static buildComponents(): SystemPromptComponents {
    if (this.cachedComponents) return this.cachedComponents;

    const components: SystemPromptComponents = {
      identity: this.buildIdentity(),
      platformHints: this.buildPlatformHints(),
      skillsIndex: buildSkillsIndex(),
      contextFiles: this.buildContextFilesBlock(),
      memoryBlock: MEMORY_GUIDANCE,
      toolGuidance: TOOL_USE_ENFORCEMENT,
      modelGuidance: this.buildModelGuidance(),
    };

    this.cachedComponents = components;
    return components;
  }

  /**
   * Build the identity block from SOUL.md or default identity.
   */
  static buildIdentity(): string {
    let identity = this.customIdentity || DEFAULT_AGENT_IDENTITY;

    if (this.customSoulMd) {
      identity = this.customSoulMd;
    }

    return identity;
  }

  /**
   * Build platform-specific hints.
   */
  static buildPlatformHints(): string {
    const hint = PLATFORM_HINTS[this.platform] || PLATFORM_HINTS['default'];
    if (!hint || this.platform === 'default') return '';

    return `PLATFORM: ${hint.name}\n${hint.guidance}`;
  }

  /**
   * Build context files block from discovered context files.
   */
  static buildContextFilesBlock(): string {
    const files = loadContextFiles();
    if (files.length === 0) return '';

    const blocks = files
      .filter(f => !f.blocked)
      .map(f => {
        const truncated = truncateContent(f.content, f.path);
        return `--- ${f.path} ---\n${truncated}`;
      });

    return blocks.length > 0 ? `CONTEXT FILES:\n${blocks.join('\n\n')}` : '';
  }

  /**
   * Build model-specific guidance.
   * From Hermes: different models get different behavioral instructions.
   */
  static buildModelGuidance(): string {
    // Generic guidance applicable to all models
    return `MODEL GUIDANCE:
- Think step-by-step for complex problems.
- When using tools, verify the result before proceeding.
- If you make an error, acknowledge it and correct course.
- System state: use terminal_tool to check OS, CPU, memory, disk, ports, processes.
- Correctness: does the output satisfy every stated requirement?
- Grounding: are factual claims backed by tool outputs or provided context?
- Safety: if the next step has side effects, confirm with the user first.
- **YouTube & Direct Media/URL Synchronization Protocol (CRITICAL)**:
  Când utilizatorul cere să asculte o melodie, să vadă un videoclip sau să caute ceva pe YouTube (de exemplu, un clip cu Chris Brown):
  1. Apelează întotdeauna mai întâi unealta ` + '`search_youtube`' + ` cu termenul de căutare potrivit.
  2. Din rezultatele primite de la ` + '`search_youtube`' + `, identifică link-ul potrivit (de obicei primul rezultat).
  3. Apelează IMEDIAT și OBLIGATORIU unealta ` + '`open_browser_url`' + ` transmițând URL-ul identificat în parametrul ` + '`url`' + ` și titlul corespunzător în parametrul ` + '`title`' + `. Această acțiune va deschide automat Browser Companion-ul de pe partea dreaptă pentru utilizator cu melodia selectată!
  4. Sincronizează perfect textul răspunsului tău cu videoclipul pe care îl deschizi. De exemplu, scrie: "Desigur! Am deschis automat videoclipul [Nume Video] pe partea dreaptă în Browser Companion pentru tine."

- Live Browsing Companion Execution Loop (Fallback): Pentru navigare generală pe site-uri de știri sau alte site-uri care nu sunt YouTube, folosește în ordine următorul flux de unelte:
  1. ` + '`browser_navigate`' + ` ca să încarci URL-ul dorit (de ex. 'https://www.google.com' sau o căutare Google).
  2. ` + '`browser_get_content`' + ` ca să citești structura paginii curente, să vezi ce text este vizibil și să afli selectorii elementelor interactive (butoane, linkuri, text clickable).
  3. Dacă vezi un cookie popup sau un overlay consent wall (de ex: "Înainte de a continua", "De acord", "Acceptă tot", "Accept all"), dă click pe butoanele corespunzătoare folosind ` + '`browser_click`' + ` cu selectorul format "button:has-text(\"Acceptă tot\")" sau similare, ori folosește ` + '`browser_bypass_consent`' + ` pentru autodeblocare.
  4. Pentru a căuta sau introduce text, folosește ` + '`browser_type`' + ` transmițând textul dori și opțional selectorul exact (de ex. "input[name=\"search_query\"]", "input[id=\"search\"]", "input[name=\"q\"]" sau orice altă casetă indicată de ` + '`browser_get_content`' + `). Setează press_enter pe true ca să trimiți căutarea instantaneu.
  5. Pentru a scrola pagina în jos sau în sus (când utilizatorul îți cere explicit să scrolezi sau dorești să explorezi mai mult din pagină), folosește ` + '`browser_scroll`' + ` transmițând valoarea deltaY (ex: 400 pentru scroll în jos, -400 pentru scroll în sus).
  6. Folosește ` + '`browser_get_content`' + ` din nou ca să citești noile rezultate, apoi folosește ` + '`browser_click`' + ` pe selectorul elementului dorit (de ex. linkul sau titlul clipului dorit).
  7. Continuă acest ciclu interactiv până când ai parcurs pașii cu succes și poți raporta ce se întâmplă live în companion utilizatorului.`;
  }

  // ============================================================
  // Public API (backward compatible)
  // ============================================================

  /**
   * Builds the Layer 1 System Context.
   * Static, cached, built once per session.
   * Now includes all Hermes-style components: identity, platform hints,
   * skills index, context files, memory guidance, tool guidance.
   */
  static getContext(): string {
    if (this.cachedContext) {
      return this.cachedContext;
    }

    const contextData: SystemContextData = {
      behavioralRules: [
        "Errors remain in context as resources for recovery.",
        "Append-only context.",
        "If observation > 5000 tokens, externalize to RAG.",
        "Fallback protocol (if tool fails, try alternative).",
        "Learn from experience: create skills from successful workflows.",
        "Verify results before delivering to the user.",
      ],
      coreSkills: {
        "Language Detection": "Auto-detect language and respond in user's language",
        "Calendar awareness": "Full protocol for calendar operations",
        "Library / Notion operations": "Read/write pages, blocks, tables",
        "Widget and Visualization": "Charts, diagrams, interactive UI components",
        "Safety protocol": "Write ops require confirmation. Exception: execute_code in sandbox",
        "Learning Loop": "Auto-create skills from successful complex task patterns",
        "Memory Management": "Persistent cross-session memory with semantic/episodic/procedural layers",
      },
      identity: {
        capabilities: [
          "Web Search & Information Retrieval",
          "Workspace File Management",
          "Calendar Management",
          "Data Visualization & Widgets",
          "Local and Cloud LLM Execution",
          "Persistent Cross-Session Memory",
          "Self-Improving Skills System",
          "Context Compression & RAG",
          "Multi-Provider Model Routing",
          "Task Decomposition & Planning",
        ],
        personality: "Professional, direct, comprehensive, helpful, and highly analytical. Provide detailed answers and minimize asking questions unless absolutely necessary for clarification.",
        values: [
          "Accuracy over speed",
          "User privacy and data security",
          "Transparency in actions",
          "Continuous self-improvement",
        ],
        soulMd: this.customSoulMd || undefined,
      },
      toolDefinitions: {
        readTools: [
          "perform_search",
          "workspace_tool",
          "calendar_tool",
          "get_calendar_holidays",
          "portfolio_tool",
          "safe_digital_tool",
          "memory_retrieval",
        ],
        writeTools: [
          "library_tool",
          "calendar_tool",
          "portfolio_tool",
          "safe_digital_tool",
          "memory_retrieval",
        ],
      },
      platformHint: PLATFORM_HINTS[this.platform]?.guidance,
      skillsIndex: buildSkillsIndex(),
      contextFiles: this.buildContextFilesBlock(),
      memoryGuidance: MEMORY_GUIDANCE,
      skillsGuidance: SKILLS_GUIDANCE,
      toolUseEnforcement: TOOL_USE_ENFORCEMENT,
      toolGuidance: TOOL_USE_ENFORCEMENT,
    };

    // Deterministic JSON serialization with sorted keys
    this.cachedContext = this.deterministicStringify(contextData);
    return this.cachedContext;
  }

  /**
   * Minimal context for Chat Mode and simple conversational routing.
   */
  static getMinimalContext(): string {
    const fullContext = JSON.parse(this.getContext());
    const minimalData = {
      identity: {
        personality: fullContext.identity.personality,
      },
      behavioralRules: fullContext.behavioralRules,
      memoryGuidance: fullContext.memoryGuidance,
    };
    return this.deterministicStringify(minimalData);
  }

  /**
   * Get the full assembled system prompt for LLM consumption.
   * This is the Hermes-style prompt builder output.
   */
  static getFullSystemPrompt(memoryBlock?: string): string {
    const components = this.buildComponents();
    const parts: string[] = [];

    parts.push(`<identity>\n${components.identity}\n</identity>`);

    if (components.platformHints) {
      parts.push(`<platform>\n${components.platformHints}\n</platform>`);
    }

    if (components.memoryBlock) {
      parts.push(`<memory-guidance>\n${components.memoryBlock}\n</memory-guidance>`);
    }

    if (memoryBlock) {
      parts.push(memoryBlock);
    }

    if (components.skillsIndex) {
      parts.push(`<skills>\n${components.skillsIndex}\n</skills>`);
    }

    if (components.contextFiles) {
      parts.push(`<context-files>\n${components.contextFiles}\n</context-files>`);
    }

    parts.push(`<tool-guidance>\n${components.toolGuidance}\n</tool-guidance>`);
    parts.push(`<model-guidance>\n${components.modelGuidance}\n</model-guidance>`);

    return parts.join('\n\n');
  }

  static getReadTools(): string[] {
    const contextData = JSON.parse(this.getContext());
    return contextData.toolDefinitions.readTools || [];
  }

  static getWriteTools(): string[] {
    const contextData = JSON.parse(this.getContext());
    return contextData.toolDefinitions.writeTools || [];
  }

  static isWriteTool(toolName: string): boolean {
    const writeTools = this.getWriteTools();
    return writeTools.includes(toolName);
  }

  private static deterministicStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      const arrStr = obj.map(item => item === undefined ? 'null' : this.deterministicStringify(item)).join(',');
      return `[${arrStr}]`;
    }

    const keys = Object.keys(obj).sort();
    const keyValStrs = keys
      .filter(key => obj[key] !== undefined)
      .map(key => {
        const valStr = this.deterministicStringify(obj[key]);
        return `"${key}":${valStr}`;
      });
    return `{${keyValStrs.join(',')}}`;
  }

  static clearCache(): void {
    this.cachedContext = null;
    this.cachedComponents = null;
    PromptCacher.clear();
  }
}
