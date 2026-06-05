import { ToolRegistry } from './ToolRegistry';

const activeJobs = new Map<string, any>();

export function registerJobTools() {
  ToolRegistry.register(
    {
      name: 'schedule_job',
      description: 'Schedule a recurring or deferred background task (cron job) for the agent.',
      parameters: {
        type: 'object',
        properties: {
          job_name: { type: 'string' },
          cron_expression: { type: 'string', description: 'Cron expression for scheduling.' },
          action_prompt: { type: 'string', description: 'What the agent should do when the job runs.' }
        },
        required: ['job_name', 'cron_expression', 'action_prompt']
      }
    },
    async (args: { job_name: string, cron_expression: string, action_prompt: string }) => {
      const jobId = `job_${Date.now()}`;
      activeJobs.set(jobId, { ...args, id: jobId, status: 'scheduled' });
      return {
        success: true,
        data: { job_id: jobId, details: args },
        summary: `Scheduled background job ${args.job_name}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'list_jobs',
      description: 'List all active background jobs.',
      parameters: { type: 'object', properties: {} }
    },
    async () => {
      return {
        success: true,
        data: { jobs: Array.from(activeJobs.values()) },
        summary: `Listed ${activeJobs.size} active jobs.`
      };
    }
  );
}
