import { db } from './db';
import { SemanticMemory } from '../../types/memory';
import { extractKeywords } from '../agent/localHeuristics';

export const MemoryManager = {
  // ==========================================
  // LAYER 10: LEARNING - SYNC (Critical Updates)
  // ==========================================
  
  /**
   * Updates semantic memory synchronously. 
   * Used for facts that MUST be available immediately for the next reasoning step.
   */
  syncUpdateSemantic: async (category: SemanticMemory['category'], key: string, value: string): Promise<void> => {
    try {
      const existing = await db.semantic.where({ category, key }).first();
      if (existing && existing.id) {
        await db.semantic.update(existing.id, { value, updatedAt: Date.now() });
        console.log(`[Memory:SYNC] Updated semantic fact: ${key} = ${value}`);
      } else {
        await db.semantic.add({ category, key, value, updatedAt: Date.now() });
        console.log(`[Memory:SYNC] Added semantic fact: ${key} = ${value}`);
      }
    } catch (error) {
      console.error('[Memory:SYNC] Failed to update semantic memory:', error);
    }
  },

  // ==========================================
  // LAYER 10: LEARNING - ASYNC (Background)
  // ==========================================

  /**
   * Saves a conversation episode asynchronously.
   * Fire-and-forget: doesn't block the UI or agent response.
   */
  asyncSaveEpisode: (topic: string, summary: string, outcome: string): void => {
    db.episodic.add({
      date: Date.now(),
      topic,
      summary,
      outcome
    }).then(() => {
      console.log(`[Memory:ASYNC] Saved episode: ${topic}`);
    }).catch(err => {
      console.error('[Memory:ASYNC] Failed to save episode:', err);
    });
  },

  /**
   * Updates procedural memory (patterns and preferences) asynchronously.
   */
  asyncUpdateProcedural: (pattern: string, action: string, weight: number = 1): void => {
    db.procedural.add({
      pattern,
      action,
      weight
    }).then(() => {
      console.log(`[Memory:ASYNC] Learned procedure: When [${pattern}] -> Do [${action}]`);
    }).catch(err => {
      console.error('[Memory:ASYNC] Failed to save procedural memory:', err);
    });
  },

  // ==========================================
  // LAYER 2: MEMORY RETRIEVAL (Selective)
  // ==========================================

  /**
   * Retrieves relevant context for the current session.
   * Filters semantic memory based on keywords from currentMessage or returns most recent.
   * In a full implementation, this would use vector search (RAG) for episodic.
   */
  getRelevantContext: async (currentMessage?: string) => {
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

      // Get only the 5 most recent episodes to save token context
      const recentEpisodes = await db.episodic.orderBy('date').reverse().limit(5).toArray();
      
      return { semantic, procedural, recentEpisodes };
    } catch (error) {
      console.error('[Memory] Failed to retrieve context:', error);
      return { semantic: [], procedural: [], recentEpisodes: [] };
    }
  }
};

// Expose to window for testing via console
if (typeof window !== 'undefined') {
  (window as any).MemoryManager = MemoryManager;
  (window as any).agentDb = db;
}
