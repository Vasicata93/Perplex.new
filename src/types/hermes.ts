/**
 * Hermes Agent Core Types
 * Inspired by NousResearch/hermes-agent Python types
 * Converted to TypeScript for the Hermes Agent Integration project
 */

// ============================================================
// Memory Provider Interface (from agent/memory_provider.py)
// ============================================================
export interface MemoryProvider {
  name: string;
  getToolSchemas(): ToolSchema[];
  systemPromptBlock(): string;
  prefetch(query: string, sessionId?: string): Promise<string>;
  queuePrefetch(query: string, sessionId?: string): void;
  syncTurn(userContent: string, assistantContent: string, sessionId?: string): Promise<void>;
  handleToolCall(toolName: string, args: Record<string, any>, kwargs?: Record<string, any>): Promise<string>;
  onTurnStart(turnNumber: number, message: string, kwargs?: Record<string, any>): void;
  onSessionEnd(messages: any[]): void;
  onPreCompress(messages: any[]): string;
  onMemoryWrite?(action: string, target: string, content: string, metadata?: Record<string, any>): void;
  onDelegation?(task: string, result: string, childSessionId?: string): void;
  shutdown(): void;
  initialize(sessionId: string, kwargs?: Record<string, any>): Promise<void>;
}

// ============================================================
// Tool Schema & Registration (from tools/registry.py)
// ============================================================
export interface ToolSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: any;
  required?: boolean;
  properties?: Record<string, ToolSchemaProperty>;
  items?: ToolSchemaProperty;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolSchemaProperty>;
    required?: string[];
  };
}

export interface RegisteredTool {
  name: string;
  toolset: string;
  schema: ToolSchema;
  handler: (args: Record<string, any>, context?: ToolExecutionContext) => Promise<ToolResult>;
  checkFn?: () => boolean;
  emoji?: string;
  requires?: string[];
  fallbackFor?: string[];
  isWrite?: boolean;
}

export interface ToolExecutionContext {
  llmService?: any;
  sessionId?: string;
  agent?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  summary?: string;
  externalized?: boolean;
}

// ============================================================
// Trajectory & Learning Loop (from agent/trajectory.py)
// ============================================================
export interface TrajectoryStep {
  turnNumber: number;
  timestamp: number;
  input: string;
  intent: string;
  toolCalls: ToolCallRecord[];
  llmCalls: number;
  tokensUsed: number;
  result: string;
  outcome: 'success' | 'partial' | 'failure' | 'cancelled';
  duration: number;
  corrections?: number;
}

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  result: ToolResult;
  duration: number;
  success: boolean;
}

export interface Trajectory {
  sessionId: string;
  startTime: number;
  steps: TrajectoryStep[];
  totalTokens: number;
  totalLlmCalls: number;
  skillsCreated: CreatedSkill[];
}

export interface CreatedSkill {
  name: string;
  category: string;
  description: string;
  createdAt: number;
  sourceTrajectoryId: string;
  content: string;
  usageCount: number;
  lastUsedAt?: number;
  effectiveness: number; // 0-1 success rate
}

// ============================================================
// Skill System (from tools/skills_tool.py, agent/skill_utils.py)
// ============================================================
export interface SkillFrontmatter {
  name?: string;
  description?: string;
  category?: string;
  platforms?: string[];
  requires?: string[];
  fallbackFor?: string[];
  conditions?: {
    requires?: string[];
    fallbackFor?: string[];
  };
  prerequisites?: {
    envVars?: string[];
    commands?: string[];
  };
  setup?: {
    help?: string;
    collectSecrets?: Array<{
      name: string;
      description?: string;
      optional?: boolean;
    }>;
  };
  tags?: string | string[];
  disabled?: boolean;
}

export interface SkillEntry {
  name: string;
  description: string;
  category: string;
  platforms?: string[];
  path: string;
  isPlugin?: boolean;
  namespace?: string;
  frontmatter?: SkillFrontmatter;
  readinessStatus?: 'available' | 'setup_needed' | 'unsupported';
  setupHelp?: string;
  missingEnvVars?: string[];
}

export interface SkillCategory {
  name: string;
  description?: string;
  skills: SkillEntry[];
}

export interface SkillIndexSnapshot {
  version: number;
  manifest: Record<string, [number, number]>; // path -> [mtime_ns, size]
  entries: Array<{
    name: string;
    category: string;
    platforms: string[];
    conditions: any;
  }>;
  categoryDescriptions: Record<string, string>;
  generatedAt: number;
}

// ============================================================
// Context Engine (from agent/context_engine.py)
// ============================================================
export interface ContextBlock {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tokens?: number;
}

export interface CompressionResult {
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  method: 'summary' | 'extraction' | 'truncation';
}

export interface PromptCacheEntry {
  key: string;
  value: string;
  createdAt: number;
  accessCount: number;
  size: number;
}

// ============================================================
// Error Classification (from agent/error_classifier.py)
// ============================================================
export type ErrorSeverity = 'transient' | 'retryable' | 'permanent' | 'rate_limit' | 'auth' | 'timeout' | 'context_overflow';

export interface ClassifiedError {
  originalError: Error;
  severity: ErrorSeverity;
  userMessage: string;
  shouldRetry: boolean;
  retryDelay: number;
  suggestedAction: string;
  toolName?: string;
}

// ============================================================
// Credential Pool (from agent/credential_pool.py)
// ============================================================
export interface CredentialEntry {
  id: string;
  provider: string;
  apiKey?: string;
  refreshToken?: string;
  expiresAt?: number;
  metadata?: Record<string, any>;
  isRateLimited: boolean;
  rateLimitResetAt?: number;
  usageCount: number;
  lastUsedAt?: number;
}

export interface CredentialSource {
  name: string;
  type: 'env' | 'file' | 'oauth' | 'static';
  getCredentials: () => Promise<CredentialEntry[]>;
}

// ============================================================
// Delegate Task (from tools/delegate_tool.py)
// ============================================================
export interface DelegateTask {
  id: string;
  description: string;
  parentSessionId: string;
  childSessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  startTime?: number;
  endTime?: number;
  maxIterations?: number;
  delegatedTools?: string[];
}

// ============================================================
// Agent Lifecycle Hooks (from agent/context_engine.py)
// ============================================================
export type AgentLifecycleEvent =
  | 'session_start'
  | 'turn_start'
  | 'pre_tool'
  | 'post_tool'
  | 'pre_compress'
  | 'post_compress'
  | 'turn_end'
  | 'session_end'
  | 'error'
  | 'skill_created'
  | 'delegation_start'
  | 'delegation_end';

export interface AgentLifecycleHook {
  event: AgentLifecycleEvent;
  handler: (context: any) => void | Promise<void>;
  priority?: number; // Lower = earlier execution
}

// ============================================================
// Platform Hints (from agent/prompt_builder.py PLATFORM_HINTS)
// ============================================================
export interface PlatformHint {
  name: string;
  guidance: string;
  mediaSupport?: boolean;
  formattingRules?: string;
  attachmentSyntax?: string;
}

// ============================================================
// Model Routing (from agent/model_metadata.py)
// ============================================================
export interface ModelMetadata {
  name: string;
  provider: string;
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  cachingSupported: boolean;
  developerRole?: boolean;
}

export interface ModelRoutingDecision {
  model: string;
  provider: string;
  reason: string;
  estimatedCost: number;
}

// ============================================================
// Prompt Builder Components (from agent/prompt_builder.py)
// ============================================================
export interface SystemPromptComponents {
  identity: string;
  platformHints: string;
  skillsIndex: string;
  contextFiles: string;
  memoryBlock: string;
  toolGuidance: string;
  modelGuidance: string;
  sessionContext?: string;
}

export interface ContextFileEntry {
  path: string;
  content: string;
  source: 'hermes_md' | 'agents_md' | 'claude_md' | 'cursorrules' | 'soul_md' | 'project';
  truncated?: boolean;
  blocked?: boolean;
  blockReason?: string;
}
