import { ToolRegistry } from './ToolRegistry';
import { MemoryService } from '../../memoryService';

export function registerSessionSearchTools() {
  ToolRegistry.register(
    {
      name: 'session_search',
      description: 'Search long-term memory of past conversations and summarize them. Use proactively when the user references previous sessions or topics.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query - keywords or phrases to find in past sessions.' },
          limit: { type: 'integer', description: 'Max sessions to summarize (default: 3).' }
        },
        required: ['query']
      }
    },
    async (args: { query: string, limit?: number }) => {
      // Mock session search using MemoryService pattern
      const allMemories = await MemoryService.getMemories();
      const memories = allMemories.filter((m: any) => m.text.toLowerCase().includes(args.query.toLowerCase()));
      if (memories.length === 0) {
        return { success: true, data: { message: "No matching sessions found." }, summary: "No sessions found" };
      }
      
      const sessionResults = memories.map((m: any) => ({
        session_id: "chk_last",
        when: new Date(m.timestamp).toISOString(),
        summary: `Matched content: ${m.text}`
      }));
      
      return {
        success: true,
        data: {
           query: args.query,
           results: sessionResults,
           count: sessionResults.length
        },
        summary: `Found ${sessionResults.length} sessions matching "${args.query}"`
      };
    }
  );
}
