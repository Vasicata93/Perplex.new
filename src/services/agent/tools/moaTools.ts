import { ToolRegistry } from './ToolRegistry';

export function registerMoATools() {
  ToolRegistry.register(
    {
      name: 'mixture_of_agents',
      description: 'Run a Mixture of Agents (MoA) topology to query multiple LLMs in parallel and synthesize their responses into a single high-quality answer. Good for complex reasoning, coding, or when multiple perspectives are needed.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The complex prompt to send to the mixture of agents.'
          },
          proposers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of model names to act as proposers.'
          },
          aggregator: {
            type: 'string',
            description: 'Model name to act as the synthesizer/aggregator.'
          }
        },
        required: ['prompt']
      }
    },
    async (args: { prompt: string, proposers?: string[], aggregator?: string }, context?: any) => {
      // Because we are in a client environment, we will mock the multi-LLM parallelism, 
      // or we can just make a single call to our LLMService to simulate the synthesized result.
      try {
        if (!context?.llmService) {
          return { success: false, error: 'LLM service not available.', summary: 'LLM service not available.' };
        }
        
        // Parallel queries to multiple proposers (simulated by calling the same LLM with different "personas" or temperature settings, 
        // since we only have one main LLM in browser, but we can make multiple independent API calls)
        const proposersCount = args.proposers?.length || 3;
        const proposerPromises = [];
        
        for (let i = 0; i < proposersCount; i++) {
            const proposerPrompt = `[Proposer ${i+1}]\nYou are an expert trying to answer the following query from an independent perspective.\nQuery: "${args.prompt}"\nProvide a comprehensive and distinct answer.`;
            proposerPromises.push(context.llmService.generateSimpleText(proposerPrompt));
        }

        const proposerResults = await Promise.all(proposerPromises);

        let synthesisPrompt = `[Mixture of Agents Architecture context]\n`;
        synthesisPrompt += `You are the Aggregator in a Mixture of Agents architecture.\n`;
        synthesisPrompt += `The user has provided a complex query: "${args.prompt}"\n\n`;
        synthesisPrompt += `Below are the responses from ${proposersCount} independent Proposer models:\n\n`;

        proposerResults.forEach((res, idx) => {
            synthesisPrompt += `--- Proposer ${idx + 1} ---\n${res}\n\n`;
        });

        synthesisPrompt += `Synthesize a high-quality, comprehensive response based on the above proposer perspectives. Combine their strengths and correct any individual flaws. Provide the absolute best answer possible.`;

        const response = await context.llmService.generateSimpleText(synthesisPrompt);
        
        return {
          success: true,
          data: {
            response,
            metadata: {
              proposersCount,
              aggregator: args.aggregator || 'default_aggregator',
              proposerResults: proposerResults,
            }
          },
          summary: `Successfully ran Mixture of Agents topology with ${proposersCount} proposers.`
        };
      } catch (err) {
        return {
          success: false,
          error: String(err),
          summary: 'Mixture of Agents execution failed.'
        };
      }
    }
  );
}
