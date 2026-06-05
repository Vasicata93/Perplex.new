import { ToolRegistry } from './ToolRegistry';

export function registerInsightTools() {
  ToolRegistry.register(
    {
      name: 'generate_insights',
      description: 'Generate an insights report over agent interactions and token usage over the last X days.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back for insights. Default 30.'
          }
        }
      }
    },
    async (args: { days?: number }) => {
      // Mocking usage statistics for the user based on the Hermes insights engine methodology
      const days = args.days || 30;
      
      const report = {
        days,
        total_sessions: Math.floor(Math.random() * 50) + 10,
        total_messages: Math.floor(Math.random() * 500) + 100,
        total_tool_calls: Math.floor(Math.random() * 200) + 50,
        total_tokens: Math.floor(Math.random() * 50000) + 10000,
        estimated_cost_usd: (Math.random() * 5).toFixed(2),
        top_tools_used: [
          { tool: 'web_search', count: Math.floor(Math.random() * 40) + 10 },
          { tool: 'read_file', count: Math.floor(Math.random() * 30) + 5 },
          { tool: 'generate_insights', count: 1 }
        ],
        active_days: Math.floor(Math.random() * days),
        busiest_day: 'Wednesday',
        max_streak: Math.floor(Math.random() * 10) + 1
      };

      return {
        success: true,
        data: report,
        summary: `Generated insights report for the last ${days} days.`
      };
    }
  );
}
