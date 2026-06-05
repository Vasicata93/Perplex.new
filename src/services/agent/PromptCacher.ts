/**
 * Prompt Cacher
 * Inspired by NousResearch/hermes-agent agent/prompt_caching.py
 * Two-layer caching: in-process LRU + snapshot disk persistence.
 */

import { PromptCacheEntry, ContextFileEntry } from '../../types/hermes';

export class PromptCacher {
  private static cache = new Map<string, PromptCacheEntry>();
  private static readonly MAX_CACHE_SIZE = 8;
  private static readonly SNAPSHOT_VERSION = 1;
  private static readonly SNAPSHOT_KEY = '__hermes_prompt_cache_snapshot__';

  // ============================================================
  // In-Process LRU Cache
  // ============================================================

  /**
   * Get a cached prompt by key.
   */
  static get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access metadata
    entry.accessCount++;
    this.touchEntry(key);

    return entry.value;
  }

  /**
   * Store a prompt in cache.
   */
  static set(key: string, value: string): void {
    // Evict if at capacity
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      value,
      createdAt: Date.now(),
      accessCount: 1,
      size: value.length,
    });

    this.touchEntry(key);
  }

  /**
   * Check if a key exists in cache.
   */
  static has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Build a cache key from the relevant parameters.
   */
  static buildKey(params: {
    type: string;
    identity?: string;
    platform?: string;
    tools?: string;
    toolsets?: string[];
    disabledSkills?: string[];
    contextFilesHash?: string;
    sessionId?: string;
  }): string {
    const sortedParams = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('|');
    return sortedParams;
  }

  /**
   * Clear the entire cache.
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  static getStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; size: number; accessCount: number }>;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.values()).map(e => ({
        key: e.key.substring(0, 50) + (e.key.length > 50 ? '...' : ''),
        size: e.size,
        accessCount: e.accessCount,
      })),
    };
  }

  // ============================================================
  // Snapshot Persistence (IndexedDB)
  // ============================================================

  /**
   * Save cache snapshot to IndexedDB.
   */
  static async saveSnapshot(): Promise<void> {
    try {
      const { db } = await import('../memory/db');
      const snapshot = {
        version: this.SNAPSHOT_VERSION,
        entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
          key,
          value: entry.value,
          createdAt: entry.createdAt,
          accessCount: entry.accessCount,
          size: entry.size,
        })),
        savedAt: Date.now(),
      };

      await db.semantic.put({
        category: 'rag_cache',
        key: this.SNAPSHOT_KEY,
        value: JSON.stringify(snapshot),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[PromptCacher] Failed to save snapshot:', err);
    }
  }

  /**
   * Load cache snapshot from IndexedDB.
   * Validates version and restores if compatible.
   */
  static async loadSnapshot(): Promise<boolean> {
    try {
      const { db } = await import('../memory/db');
      const entry = await db.semantic.where('key').equals(this.SNAPSHOT_KEY).first();

      if (!entry || !entry.value) return false;

      const snapshot = JSON.parse(entry.value);
      if (snapshot.version !== this.SNAPSHOT_VERSION) return false;

      // Restore entries
      for (const e of snapshot.entries) {
        this.cache.set(e.key, {
          key: e.key,
          value: e.value,
          createdAt: e.createdAt,
          accessCount: e.accessCount,
          size: e.size,
        });
      }

      return this.cache.size > 0;
    } catch (err) {
      console.warn('[PromptCacher] Failed to load snapshot:', err);
      return false;
    }
  }

  /**
   * Clear the persisted snapshot.
   */
  static async clearSnapshot(): Promise<void> {
    try {
      const { db } = await import('../memory/db');
      await db.semantic.where('key').equals(this.SNAPSHOT_KEY).delete();
    } catch (err) {
      console.warn('[PromptCacher] Failed to clear snapshot:', err);
    }
  }

  // ============================================================
  // Context File Caching
  // ============================================================

  /**
   * Build a hash of context file entries for cache invalidation.
   */
  static buildContextFilesHash(files: ContextFileEntry[]): string {
    const sorted = [...files]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(f => `${f.path}:${f.content.length}:${f.blocked ? 'B' : 'A'}`)
      .join('|');
    return this.simpleHash(sorted);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Move an entry to the end (most recently used).
   */
  private static touchEntry(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    this.cache.delete(key);
    this.cache.set(key, entry);
  }

  /**
   * Simple string hash for cache keys.
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
