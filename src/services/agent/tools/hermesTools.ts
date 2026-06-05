import { ToolRegistry } from './ToolRegistry';

export function registerHermesTools() {
  ToolRegistry.register(
    {
      name: 'terminal_tool',
      description: 'Execute shell commands in the agent environment. Requires terminal permissions.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute.'
          },
          cwd: {
            type: 'string',
            description: 'Optional working directory.'
          }
        },
        required: ['command']
      }
    },
    async (args: { command: string, cwd?: string }) => {
      // Mock implementation since we are in browser environment
      // In a real environment, this would call an API or an MCP server
      return {
        success: true,
        data: { 
          output: `Mock execution of: ${args.command}\n$ > \nCommand completed.\n`, 
          exitCode: 0 
        },
        summary: `Executed terminal command: ${args.command}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'browser_tool',
      description: 'Visit a URL and extract text content, metadata, or take a screenshot. Requires browser permissions.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read_page', 'screenshot', 'extract_links'],
            description: 'Action to perform on the browser.'
          },
          url: {
            type: 'string',
            description: 'The URL to visit.'
          }
        },
        required: ['action', 'url']
      }
    },
    async (args: { action: string, url: string }) => {
      // Mock implementation
      return {
        success: true,
        data: {
          url: args.url,
          action: args.action,
          content: `Mock extracted content from ${args.url}. This represents the visible text on the page.`
        },
        summary: `Successfully executed browser action ${args.action} on ${args.url}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'send_message_tool',
      description: 'Send a message via configured integrations (Telegram, Discord, Slack, Feishu, WeCom, DingTalk, Mattermost, etc.).',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            description: 'The platform to send the message to (e.g., telegram, discord, slack).'
          },
          target: {
            type: 'string',
            description: 'The target channel, user ID, or chat ID.'
          },
          message: {
            type: 'string',
            description: 'The message content to send.'
          }
        },
        required: ['platform', 'target', 'message']
      }
    },
    async (args: { platform: string, target: string, message: string }) => {
      // Mock implementation
      return {
        success: true,
        data: {
          platform: args.platform,
          target: args.target,
          status: 'sent'
        },
        summary: `Message sent via ${args.platform} to ${args.target}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'vision_tools',
      description: 'Analyze an image or take a screenshot of the user\'s screen.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['analyze_image', 'take_screenshot'],
          },
          imageUrl: {
            type: 'string',
            description: 'Optional URL of the image to analyze.'
          },
          prompt: {
            type: 'string',
            description: 'Prompt describing what to look for in the image.'
          }
        },
        required: ['action', 'prompt']
      }
    },
    async (args: { action: string, prompt: string, imageUrl?: string }) => {
      return {
        success: true,
        data: {
          analysis: `Mock vision analysis for prompt: "${args.prompt}". Describes the visual elements requested.`
        },
        summary: `Performed vision action: ${args.action}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'tts_tool',
      description: 'Convert text to speech (TTS) using configured providers (ElevenLabs, OpenAI, etc).',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to convert to speech.'
          },
          voiceId: {
            type: 'string',
            description: 'Optional voice ID.'
          }
        },
        required: ['text']
      }
    },
    async (_args: { text: string, voiceId?: string }) => {
      return {
        success: true,
        data: {
          audioUrl: 'mock_audio_url.mp3',
          durationMs: 4500
        },
        summary: `Synthesized audio for text.`
      };
    }
  );
}
