import { ToolRegistry } from './ToolRegistry';

export function registerClarifyTools() {
  ToolRegistry.register(
    {
      name: 'clarify',
      description: 'Ask the user a question when you need clarification, feedback, or a decision before proceeding. Supports multiple-choice or open-ended questions.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to present to the user.' },
          choices: { 
             type: 'array', 
             items: { type: 'string' }, 
             description: 'Up to 4 answer choices. Omit for open-ended.'
          }
        },
        required: ['question']
      }
    },
    async (args: { question: string, choices?: string[] }) => {
      // In a real flow, this would pause execution and emit a UI event to prompt the user
      // For now, it returns a mock to signal the UI layer to intercept.
      return {
        success: true,
        data: {
          clarify_prompt: {
            question: args.question,
            choices_offered: args.choices || []
          }
        },
        summary: `Asked user for clarification: ${args.question}`
      };
    }
  );
}
