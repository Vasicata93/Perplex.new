/**
 * Memory Provider Abstract Interface
 * Inspired by NousResearch/hermes-agent agent/memory_provider.py
 */

import { MemoryProvider, ToolSchema } from '../../types/hermes';

/**
 * Abstract base class for memory providers.
 * Each provider manages its own storage and retrieval logic.
 * The MemoryManager orchestrates multiple providers.
 */
export abstract class BaseMemoryProvider implements MemoryProvider {
  abstract name: string;

  // ============================================================
  // Schema & System Prompt
  // ============================================================

  /**
   * Return tool schemas this provider handles (for function calling).
   */
  abstract getToolSchemas(): ToolSchema[];

  /**
   * Return a system prompt block to inject into the LLM context.
   * This describes to the LLM how to use memory tools.
   */
  abstract systemPromptBlock(): string;

  // ============================================================
  // Prefetch (Pre-turn)
  // ============================================================

  /**
   * Synchronously fetch relevant memory context for the current query.
   * This runs BEFORE the LLM call to inject relevant memory into context.
   */
  abstract prefetch(query: string, sessionId?: string): Promise<string>;

  /**
   * Queue a background prefetch for the next turn.
   * Non-blocking - runs in parallel with LLM generation.
   */
  abstract queuePrefetch(query: string, sessionId?: string): void;

  // ============================================================
  // Sync (Post-turn)
  // ============================================================

  /**
   * Synchronize completed turn data into memory.
   * Called after each user-assistant exchange.
   */
  abstract syncTurn(userContent: string, assistantContent: string, sessionId?: string): Promise<void>;

  // ============================================================
  // Tool Call Handling
  // ============================================================

  /**
   * Handle a tool call from the LLM.
   * Returns a JSON string result.
   */
  abstract handleToolCall(toolName: string, args: Record<string, any>, kwargs?: Record<string, any>): Promise<string>;

  // ============================================================
  // Lifecycle Hooks
  // ============================================================

  /**
   * Called when a new turn starts.
   */
  onTurnStart(_turnNumber: number, _message: string, _kwargs?: Record<string, any>): void {
    // Default: no-op
  }

  /**
   * Called when a session ends.
   */
  onSessionEnd(_messages: any[]): void {
    // Default: no-op
  }

  /**
   * Called before context compression.
   * Return text that should be preserved through compression.
   */
  onPreCompress(_messages: any[]): string {
    return '';
  }

  /**
   * Called when the built-in memory writes a fact.
   * External providers use this to stay in sync.
   */
  onMemoryWrite(_action: string, _target: string, _content: string, _metadata?: Record<string, any>): void {
    // Default: no-op
  }

  /**
   * Called when a delegation (sub-agent task) completes.
   */
  onDelegation(_task: string, _result: string, _childSessionId?: string): void {
    // Default: no-op
  }

  // ============================================================
  // Lifecycle Management
  // ============================================================

  /**
   * Shut down the provider gracefully.
   */
  abstract shutdown(): void;

  /**
   * Initialize the provider for a new session.
   */
  abstract initialize(sessionId: string, kwargs?: Record<string, any>): Promise<void>;
}

// ============================================================
// Context Sanitization (from memory_manager.py)
// ============================================================

const FENCE_TAG_RE = /<\/?memory-context>/g;
const INTERNAL_CONTEXT_RE = /<memory-context>[\s\S]*?<\/memory-context>/g;
const INTERNAL_NOTE_RE = /^\[System note:.*?\]\s*/gm;

/**
 * Strip internal memory-context fence tags and system notes from text.
 * Used before displaying memory content to prevent LLM confusion.
 */
export function sanitizeContext(text: string): string {
  let cleaned = text.replace(INTERNAL_CONTEXT_RE, '');
  cleaned = cleaned.replace(FENCE_TAG_RE, '');
  cleaned = cleaned.replace(INTERNAL_NOTE_RE, '');
  return cleaned.trim();
}

/**
 * Build a memory context block wrapped in fence tags.
 * Empty input returns empty string.
 */
export function buildMemoryContextBlock(rawContext: string): string {
  if (!rawContext || !rawContext.trim()) return '';
  return `<memory-context>\n[System note: This section contains relevant memory retrieved for the current query. Use it to personalize your response.]\n\n${rawContext}\n</memory-context>`;
}
