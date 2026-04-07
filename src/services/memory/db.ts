import Dexie, { Table } from 'dexie';
import { EpisodicMemory, SemanticMemory, ProceduralMemory } from '../../types/memory';

export class AgentDatabase extends Dexie {
  episodic!: Table<EpisodicMemory, number>;
  semantic!: Table<SemanticMemory, number>;
  procedural!: Table<ProceduralMemory, number>;

  constructor() {
    super('PerplexAgentDB');
    
    // Define schema
    this.version(1).stores({
      episodic: '++id, date, topic',
      semantic: '++id, category, key', // 'key' is indexed for fast lookups
      procedural: '++id, pattern'
    });
  }
}

export const db = new AgentDatabase();
