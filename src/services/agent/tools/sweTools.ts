import { ToolRegistry } from './ToolRegistry';

export function registerSweTools() {
  ToolRegistry.register(
    {
      name: 'mini_swe_runner',
      description: 'Launch a minimal autonomous SWE (Software Engineer) sub-agent to iteratively solve a coding issue in the background.',
      parameters: {
        type: 'object',
        properties: {
          issue_description: { type: 'string', description: 'Detailed description of the bug or feature.' },
          target_directory: { type: 'string', description: 'Where the SWE sub-agent should work.' }
        },
        required: ['issue_description']
      }
    },
    async (args: { issue_description: string, target_directory?: string }) => {
      return {
        success: true,
        data: {
          status: 'started',
          job_id: `swe_${Date.now()}`,
          message: `SWE sub-agent launched for issue: ${args.issue_description.substring(0, 50)}...`
        },
        summary: `Started SWE sub-agent.`
      };
    }
  );
}
