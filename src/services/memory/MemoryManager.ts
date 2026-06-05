/**
 * Memory Manager (Enhanced)
 * Inspired by NousResearch/hermes-agent agent/memory_manager.py
 * Multi-provider memory orchestration with fail-tolerant fan-out pattern.
 * Built-in provider (Dexie/IndexedDB) + optional external plugin provider.
 */

import { db } from './db';
import { SemanticMemory } from '../../types/memory';
import { extractKeywords } from '../agent/localHeuristics';
import { MemoryProvider, ToolSchema } from '../../types/hermes';
import { buildMemoryContextBlock } from './MemoryProvider';

// ============================================================
// MemoryManager Class (Hermes-style)
// ============================================================

export class MemoryManager {
  private providers: MemoryProvider[] = [];
  private toolToProvider: Map<string, MemoryProvider> = new Map();
  private hasExternal: boolean = false;
  private static _instance: MemoryManager | null = null;

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager._instance) {
      MemoryManager._instance = new MemoryManager();
    }
    return MemoryManager._instance;
  }

  // ==========================================
  // Provider Management
  // ==========================================

  /**
   * Register a memory provider. Built-in always accepted; only ONE external allowed.
   */
  addProvider(provider: MemoryProvider): void {
    const isBuiltIn = provider.name === 'builtin';
    if (!isBuiltIn && this.hasExternal) {
      console.warn(`[MemoryManager] External provider "${provider.name}" rejected: only ONE external provider allowed.`);
      return;
    }

    this.providers.push(provider);
    if (!isBuiltIn) {
      this.hasExternal = true;
    }

    // Index tool names -> provider
    try {
      const schemas = provider.getToolSchemas();
      for (const schema of schemas) {
        this.toolToProvider.set(schema.name, provider);
      }
    } catch (err) {
      console.warn(`[MemoryManager] Failed to get schemas from provider "${provider.name}":`, err);
    }

    console.log(`[MemoryManager] Registered provider: ${provider.name}`);
  }

  getProviders(): MemoryProvider[] {
    return [...this.providers];
  }

  getProvider(name: string): MemoryProvider | undefined {
    return this.providers.find(p => p.name === name);
  }

  // ==========================================
  // System Prompt (Hermes: MemoryManager.build_system_prompt)
  // ==========================================

  /**
   * Collect system prompt blocks from all providers.
   */
  buildSystemPrompt(): string {
    const blocks: string[] = [];
    for (const provider of this.providers) {
      try {
        const block = provider.systemPromptBlock();
        if (block && block.trim()) {
          blocks.push(block);
        }
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" failed to build system prompt:`, err);
      }
    }
    return blocks.join('\n\n');
  }

  // ==========================================
  // Prefetch (Pre-turn, Hermes: MemoryManager.prefetch_all)
  // ==========================================

  /**
   * Merge prefetch context from all providers.
   */
  async prefetchAll(query: string, sessionId?: string): Promise<string> {
    const contexts: string[] = [];

    for (const provider of this.providers) {
      try {
        const context = await provider.prefetch(query, sessionId);
        if (context && context.trim()) {
          contexts.push(context);
        }
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" prefetch failed:`, err);
      }
    }

    // Also fetch from built-in Dexie
    const builtinContext = await MemoryManager.getRelevantContext(query);
    if (builtinContext.semantic.length > 0 || builtinContext.procedural.length > 0) {
      contexts.push(formatBuiltinContext(builtinContext));
    }

    const merged = contexts.join('\n\n');
    return buildMemoryContextBlock(merged);
  }

  /**
   * Queue background prefetch for next turn.
   */
  queuePrefetchAll(query: string, sessionId?: string): void {
    for (const provider of this.providers) {
      try {
        provider.queuePrefetch(query, sessionId);
      } catch (err) {
        // Silent fail for background queue
      }
    }
  }

  // ==========================================
  // Sync (Post-turn, Hermes: MemoryManager.sync_all)
  // ==========================================

  /**
   * Sync completed turn to all providers.
   */
  async syncAll(userContent: string, assistantContent: string, sessionId?: string): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.syncTurn(userContent, assistantContent, sessionId);
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" sync failed:`, err);
      }
    }
  }

  // ==========================================
  // Tool Call Routing (Hermes: MemoryManager.handle_tool_call)
  // ==========================================

  /**
   * Get all tool schemas from all providers, deduplicated by name.
   */
  getAllToolSchemas(): ToolSchema[] {
    const seen = new Set<string>();
    const schemas: ToolSchema[] = [];

    for (const provider of this.providers) {
      try {
        for (const schema of provider.getToolSchemas()) {
          if (!seen.has(schema.name)) {
            seen.add(schema.name);
            schemas.push(schema);
          }
        }
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" schema retrieval failed:`, err);
      }
    }

    return schemas;
  }

  getAllToolNames(): Set<string> {
    return new Set(this.getAllToolSchemas().map(s => s.name));
  }

  hasTool(toolName: string): boolean {
    return this.toolToProvider.has(toolName);
  }

  /**
   * Route tool call to correct provider.
   */
  async handleToolCall(toolName: string, args: Record<string, any>, kwargs?: Record<string, any>): Promise<string> {
    const provider = this.toolToProvider.get(toolName);
    if (!provider) {
      return JSON.stringify({ error: `No memory provider handles tool: ${toolName}` });
    }

    try {
      return await provider.handleToolCall(toolName, args, kwargs);
    } catch (err) {
      return JSON.stringify({ error: `Tool call failed: ${err}` });
    }
  }

  // ==========================================
  // Lifecycle Hooks (Hermes: MemoryManager.on_turn_start, etc.)
  // ==========================================

  onTurnStart(turnNumber: number, message: string, kwargs?: Record<string, any>): void {
    for (const provider of this.providers) {
      try {
        provider.onTurnStart(turnNumber, message, kwargs);
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" onTurnStart failed:`, err);
      }
    }
  }

  onSessionEnd(messages: any[]): void {
    for (const provider of this.providers) {
      try {
        provider.onSessionEnd(messages);
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" onSessionEnd failed:`, err);
      }
    }
  }

  onPreCompress(messages: any[]): string {
    const results: string[] = [];
    for (const provider of this.providers) {
      try {
        const text = provider.onPreCompress(messages);
        if (text) results.push(text);
      } catch (err) {
        // Silent
      }
    }
    return results.join('\n\n');
  }

  /**
   * Notify external providers when built-in memory writes.
   */
  onMemoryWrite(action: string, target: string, content: string, metadata?: Record<string, any>): void {
    for (const provider of this.providers) {
      try {
        if (provider.name !== 'builtin' && provider.onMemoryWrite) {
          provider.onMemoryWrite(action, target, content, metadata);
        }
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" onMemoryWrite failed:`, err);
      }
    }
  }

  /**
   * Notify providers of sub-agent completion.
   */
  onDelegation(task: string, result: string, childSessionId?: string): void {
    for (const provider of this.providers) {
      try {
        if (provider.onDelegation) {
          provider.onDelegation(task, result, childSessionId);
        }
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" onDelegation failed:`, err);
      }
    }
  }

  // ==========================================
  // Initialization & Shutdown
  // ==========================================

  async initializeAll(sessionId: string, kwargs?: Record<string, any>): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.initialize(sessionId, { ...kwargs, hermes_home: '~/.hermes' });
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${provider.name}" initialization failed:`, err);
      }
    }
  }

  shutdownAll(): void {
    // Shutdown in REVERSE order (Hermes pattern)
    for (let i = this.providers.length - 1; i >= 0; i--) {
      try {
        this.providers[i].shutdown();
      } catch (err) {
        console.warn(`[MemoryManager] Provider "${this.providers[i].name}" shutdown failed:`, err);
      }
    }
  }

  // ==========================================
  // LAYER 10: LEARNING - SYNC (Critical Updates)
  // ==========================================

  /**
   * Updates semantic memory synchronously.
   * Used for facts that MUST be available immediately for the next reasoning step.
   */
  static async syncUpdateSemantic(category: SemanticMemory['category'], key: string, value: string): Promise<void> {
    try {
      const existing = await db.semantic.where({ category, key }).first();
      if (existing && existing.id) {
        await db.semantic.update(existing.id, { value, updatedAt: Date.now() });
        console.log(`[Memory:SYNC] Updated semantic fact: ${key} = ${value}`);
      } else {
        await db.semantic.add({ category, key, value, updatedAt: Date.now() });
        console.log(`[Memory:SYNC] Added semantic fact: ${key} = ${value}`);
      }

      // Notify external providers
      MemoryManager.getInstance().onMemoryWrite('update', key, value, { category });
    } catch (error) {
      console.error('[Memory:SYNC] Failed to update semantic memory:', error);
    }
  }

  // ==========================================
  // LAYER 10: LEARNING - ASYNC (Background)
  // ==========================================

  /**
   * Saves a conversation episode asynchronously.
   * Fire-and-forget: doesn't block the UI or agent response.
   */
  static asyncSaveEpisode(topic: string, summary: string, outcome: string): void {
    db.episodic.add({
      date: Date.now(),
      topic,
      summary,
      outcome
    }).then(() => {
      console.log(`[Memory:ASYNC] Saved episode: ${topic}`);
      MemoryManager.pruneEpisodicMemory(50);
    }).catch(err => {
      console.error('[Memory:ASYNC] Failed to save episode:', err);
    });
  }

  /**
   * Cleans up older episodic entries to keep DB lightweight and fast.
   */
  static async pruneEpisodicMemory(maxEntries: number = 50): Promise<void> {
    try {
      const count = await db.episodic.count();
      if (count > maxEntries) {
        const excess = count - maxEntries;
        const oldestRecords = await db.episodic.orderBy('date').limit(excess).toArray();
        const idsToDelete = oldestRecords.map(r => r.id!).filter(id => id !== undefined);
        if (idsToDelete.length > 0) {
          await db.episodic.bulkDelete(idsToDelete);
          console.log(`[Memory:ASYNC] Pruned ${idsToDelete.length} old episodic memories.`);
        }
      }
    } catch (err) {
      console.error('[Memory:ASYNC] Failed to prune episodic memory:', err);
    }
  }

  /**
   * Updates procedural memory (patterns and preferences) asynchronously.
   * Prevents duplicates by incrementing weight instead.
   */
  static async asyncUpdateProcedural(pattern: string, action: string, initialWeight: number = 1): Promise<void> {
    try {
      const existing = await db.procedural
        .filter(p => p.pattern === pattern && p.action === action)
        .first();

      if (existing && existing.id) {
        await db.procedural.update(existing.id, { weight: existing.weight + 1 });
        console.log(`[Memory:ASYNC] Updated procedure weight: When [${pattern}] -> Do [${action}] (New weight: ${existing.weight + 1})`);
      } else {
        await db.procedural.add({
          pattern,
          action,
          weight: initialWeight
        });
        console.log(`[Memory:ASYNC] Learned new procedure: When [${pattern}] -> Do [${action}]`);
      }
    } catch (err) {
      console.error('[Memory:ASYNC] Failed to save procedural memory:', err);
    }
  }

  // ==========================================
  // LAYER 2: MEMORY RETRIEVAL (Selective)
  // ==========================================

  /**
   * Retrieves relevant context for the current session.
   * Filters semantic memory based on keywords from currentMessage or returns most recent.
   */
  static async getRelevantContext(currentMessage?: string): Promise<{
    semantic: any[];
    procedural: any[];
    recentEpisodes: any[];
  }> {
    try {
      let semantic = await db.semantic.toArray();
      const procedural = await db.procedural.orderBy('weight').reverse().limit(10).toArray();

      if (currentMessage) {
        const keywords = extractKeywords(currentMessage);
        if (keywords.length > 0) {
          semantic = semantic.filter(s => {
            const keyLower = s.key.toLowerCase();
            const valLower = s.value.toLowerCase();
            return keywords.some(kw => keyLower.includes(kw) || valLower.includes(kw));
          });

          if (semantic.length === 0) {
            semantic = await db.semantic.orderBy('updatedAt').reverse().limit(15).toArray();
          }
        } else {
          semantic = await db.semantic.orderBy('updatedAt').reverse().limit(15).toArray();
        }
      } else {
        semantic = await db.semantic.orderBy('updatedAt').reverse().limit(15).toArray();
      }

      const recentEpisodes = await db.episodic.orderBy('date').reverse().limit(5).toArray();

      return { semantic, procedural, recentEpisodes };
    } catch (error) {
      console.error('[Memory] Failed to retrieve context:', error);
      return { semantic: [], procedural: [], recentEpisodes: [] };
    }
  }
}

// ============================================================
// Helper: Format built-in context for display
// ============================================================

function formatBuiltinContext(context: { semantic: any[]; procedural: any[]; recentEpisodes: any[] }): string {
  const parts: string[] = [];

  if (context.recentEpisodes.length > 0) {
    parts.push('EPISODIC MEMORY (Recent):');
    parts.push(...context.recentEpisodes.map(e => `[${new Date(e.date).toLocaleDateString()}] [${e.topic}] ${e.summary} -> ${e.outcome}`));
  }

  if (context.semantic.length > 0) {
    parts.push('SEMANTIC MEMORY (Facts):');
    parts.push(...context.semantic.map(s => `- [${s.category}] ${s.key}: ${s.value}`));
  }

  if (context.procedural.length > 0) {
    parts.push('PROCEDURAL MEMORY (Patterns):');
    parts.push(...context.procedural.map(p => `- When [${p.pattern}] -> Do [${p.action}] (Weight: ${p.weight})`));
  }

  return parts.join('\n');
}

// Backward-compatible singleton export
export const MemoryManagerStatic = {
  syncUpdateSemantic: MemoryManager.syncUpdateSemantic,
  asyncSaveEpisode: MemoryManager.asyncSaveEpisode,
  pruneEpisodicMemory: MemoryManager.pruneEpisodicMemory,
  asyncUpdateProcedural: MemoryManager.asyncUpdateProcedural,
  getRelevantContext: MemoryManager.getRelevantContext,
};

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).MemoryManager = MemoryManagerStatic;
  (window as any).MemoryManagerInstance = MemoryManager.getInstance();
  (window as any).agentDb = db;
}
