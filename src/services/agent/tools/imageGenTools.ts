import { ToolRegistry } from './ToolRegistry';

export function registerImageGenTools() {
  ToolRegistry.register(
    {
      name: 'generate_image',
      description: 'Generate an image based on a prompt using configured providers (DALL-E, Midjourney, etc).',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed description of the image to generate.' },
          provider: { type: 'string', description: 'Optional specific provider to use (e.g., dall-e-3).' },
          size: { type: 'string', description: 'Image size, e.g., 1024x1024.' }
        },
        required: ['prompt']
      }
    },
    async (args: { prompt: string, provider?: string, size?: string }) => {
      // Mock Image generation
      return {
        success: true,
        data: {
          url: 'https://images.unsplash.com/photo-1678326266205-027ba613cc92?q=80&w=1024&auto=format&fit=crop',
          prompt_adjusted: args.prompt,
          provider: args.provider || 'default'
        },
        summary: `Generated image for prompt: "${args.prompt.substring(0, 30)}..."`
      };
    }
  );
}
