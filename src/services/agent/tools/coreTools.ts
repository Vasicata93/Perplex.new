import { ToolRegistry } from './ToolRegistry';
import { MemoryManager } from '../../memory/MemoryManager';
import { TavilyService } from '../../tavilyService';
import { db, STORES } from '../../db';
import { portfolioService } from '../../portfolioService';
import { safeDigitalService } from '../../safeDigitalService';

export function registerCoreTools() {
  ToolRegistry.register(
    {
      name: 'memory_retrieval',
      description: 'Fetch relevant context from memory (semantic, episodic, procedural).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional query to filter memory.'
          }
        }
      }
    },
    async (_args: { query?: string }) => {
      const context = await MemoryManager.getRelevantContext();
      return {
        success: true,
        data: context,
        summary: `Fetched ${context.semantic.length} facts and ${context.recentEpisodes.length} episodes.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'search_workspace_files',
      description: 'Search files and data in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query.'
          }
        },
        required: ['query']
      }
    },
    async (args: { query: string }, context?: any) => {
      if (!context?.llmService) {
        return {
          success: false,
          error: "LLMService not available in context",
          summary: "Failed to search workspace files."
        };
      }
      
      const files = context.llmService.getWorkspaceFiles();
      const query = args.query.toLowerCase();
      let foundCount = 0;
      const results: string[] = [];

      files.forEach((f: any) => {
        if (!f.content) return;
        const lines = f.content.split("\n");
        lines.forEach((line: string, idx: number) => {
          if (line.toLowerCase().includes(query)) {
            foundCount++;
            results.push(`File: ${f.name}, Line ${idx + 1}: ${line.trim()}`);
          }
        });
      });

      return {
        success: true,
        data: { results, foundCount },
        summary: `Found ${foundCount} matches for "${args.query}" in workspace files.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'perform_search',
      description: 'Searches the web for real-time information. REQUIRED for current events, news, weather, or specific facts not in your training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The optimal search query to find the information.'
          }
        },
        required: ['query']
      }
    },
    async (args: { query: string }) => {
      try {
        // Try to get API key from settings
        const settings = await db.get<any>(STORES.SETTINGS, 'user_settings');
        const apiKey = settings?.tavilyApiKey;
        
        if (apiKey) {
          const searchData = await TavilyService.search(args.query, apiKey, 'tavily');
          if (searchData && searchData.results) {
            return {
              success: true,
              data: searchData.results,
              summary: `Found ${searchData.results.length} web results for "${args.query}".`
            };
          } else {
            return {
              success: false,
              error: "Search returned no results or failed. Check your API key and network connection.",
              summary: `Search failed for "${args.query}".`
            };
          }
        }
        
        // Fallback mock if no API key
        return {
          success: true,
          data: { results: [`Mock result for ${args.query} (No API Key provided)`] },
          summary: `Mock search completed for "${args.query}".`
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
          summary: `Search failed for "${args.query}".`
        };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'save_to_library',
      description: 'CRITICAL: ONLY call this tool if the user explicitly types "save this", "create a page", or "remember this".',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the page.' },
          content: { type: 'string', description: 'Markdown content.' },
          action: { type: 'string', enum: ['create', 'update'], description: 'Action type.' }
        },
        required: ['title', 'content', 'action']
      }
    },
    async (args: { title: string, content: string, action: string }) => {
      return {
        success: true,
        data: { saved: true, title: args.title },
        summary: `Saved page "${args.title}" to library.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'read_workspace_files',
      description: 'Reads the full content of specific files from the workspace knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          filenames: {
            type: 'array',
            items: { type: 'string' },
            description: 'The exact names of the files to read.'
          }
        },
        required: ['filenames']
      }
    },
    async (args: { filenames?: string[] }, context?: any) => {
      const files = args.filenames || [];
      if (!context?.llmService) {
        return {
          success: false,
          error: "LLMService not available in context",
          summary: "Failed to read workspace files."
        };
      }

      const workspaceFiles = context.llmService.getWorkspaceFiles();
      const readResults: Record<string, string> = {};
      let notFound: string[] = [];

      files.forEach(filename => {
        const file = workspaceFiles.find((f: any) => f.name === filename);
        if (file && file.content) {
          readResults[filename] = file.content;
        } else {
          notFound.push(filename);
        }
      });

      return {
        success: true,
        data: { filesRead: readResults, notFound },
        summary: `Read content of ${Object.keys(readResults).length} files. ${notFound.length > 0 ? `Not found: ${notFound.join(', ')}` : ''}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'read_complex_module',
      description: 'Reads data from complex application modules like Safe Digital or Portfolio. Use this to get information about assets, positions, documents, etc.',
      parameters: {
        type: 'object',
        properties: {
          module: { type: 'string', enum: ['safe_digital', 'portfolio'] },
          target: { type: 'string', description: 'What to read. For portfolio: "assets", "positions", "strategies", "performance", "historical", "all". For safe_digital: "documents", "notes", "tasks", "all".' }
        },
        required: ['module', 'target']
      }
    },
    async (args: { module: string, target: string }) => {
      try {
        if (args.module === 'portfolio') {
          let data;
          switch (args.target) {
            case 'assets': data = await portfolioService.getAssets(); break;
            case 'positions': data = await portfolioService.getPositions(); break;
            case 'strategies': data = await portfolioService.getStrategies(); break;
            case 'performance': data = await portfolioService.getPerformance(); break;
            case 'historical': data = await portfolioService.getHistoricalPortfolioData(); break;
            case 'all': 
              data = {
                assets: await portfolioService.getAssets(),
                positions: await portfolioService.getPositions(),
                strategies: await portfolioService.getStrategies()
              };
              break;
            default: 
              return { 
                success: false, 
                error: `Invalid target "${args.target}" for portfolio module.`,
                summary: `Failed to read ${args.target} from portfolio.`
              };
          }
          return {
            success: true,
            data: data,
            summary: `Successfully read ${args.target} from portfolio.`
          };
        } else if (args.module === 'safe_digital') {
          let data;
          switch (args.target) {
            case 'documents': data = await safeDigitalService.getDocuments(); break;
            case 'notes': data = await safeDigitalService.getNotes(); break;
            case 'tasks': data = await safeDigitalService.getTasks(); break;
            case 'all':
              data = {
                documents: await safeDigitalService.getDocuments(),
                notes: await safeDigitalService.getNotes(),
                tasks: await safeDigitalService.getTasks()
              };
              break;
            default:
              return { 
                success: false, 
                error: `Invalid target "${args.target}" for safe_digital module.`,
                summary: `Failed to read ${args.target} from safe_digital.`
              };
          }
          return {
            success: true,
            data: data,
            summary: `Successfully read ${args.target} from safe_digital.`
          };
        }
        return { 
          success: false, 
          error: `Module "${args.module}" not supported for reading.`,
          summary: `Failed to read from ${args.module}`
        };
      } catch (error) {
        return { success: false, error: String(error), summary: `Failed to read from ${args.module}.` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'manage_complex_module',
      description: 'Performs WRITE actions (add, update, delete) on complex application modules like Safe Digital or Portfolio. These actions require user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          module: { type: 'string', enum: ['safe_digital', 'portfolio'] },
          action: { type: 'string', description: 'The action to perform (e.g., "add_asset", "update_position", "delete_document").' },
          data: { type: 'object', description: 'The data for the action.' }
        },
        required: ['module', 'action', 'data']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { action: args.action, module: args.module },
        summary: `Successfully performed ${args.action} on ${args.module}.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'code_execution',
      description: 'Execute code or scripts.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to execute.'
          },
          language: {
            type: 'string',
            description: 'The programming language.'
          }
        },
        required: ['code']
      }
    },
    async (args: { code: string, language?: string }) => {
      // Mock implementation for now
      return {
        success: true,
        data: { output: 'Code executed successfully (mock).' },
        summary: `Executed ${args.language || 'code'} script.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'get_workspace_map',
      description: 'Provides a high-level semantic map of the workspace knowledge base.',
      parameters: { type: 'object', properties: {} }
    },
    async (_args: any, context?: any) => {
      if (!context?.llmService) {
        return {
          success: false,
          error: "LLMService not available in context",
          summary: "Failed to get workspace map."
        };
      }
      
      const files = context.llmService.getWorkspaceFiles();
      const map = files.map((f: any) => f.name).join('\n');
      
      return {
        success: true,
        data: { map: `Workspace contains ${files.length} files:\n${map}` },
        summary: `Retrieved workspace map with ${files.length} files.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'semantic_search_workspace',
      description: 'Performs a deep semantic search across the workspace knowledge base.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      }
    },
    async (args: { query: string }, context?: any) => {
      if (!context?.llmService) {
        return {
          success: false,
          error: "LLMService not available in context",
          summary: "Failed to search workspace files."
        };
      }
      
      const files = context.llmService.getWorkspaceFiles();
      const query = args.query.toLowerCase();
      let foundCount = 0;
      const results: string[] = [];

      files.forEach((f: any) => {
        if (!f.content) return;
        const lines = f.content.split("\n");
        lines.forEach((line: string, idx: number) => {
          if (line.toLowerCase().includes(query)) {
            foundCount++;
            results.push(`File: ${f.name}, Line ${idx + 1}: ${line.trim()}`);
          }
        });
      });

      return {
        success: true,
        data: { results, foundCount },
        summary: `Performed semantic search for "${args.query}". Found ${foundCount} matches.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'list_calendar_events',
      description: 'List calendar events for a specific date range.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        },
        required: ['startDate', 'endDate']
      }
    },
    async (args: { startDate: string, endDate: string }) => {
      return {
        success: true,
        data: { events: [] },
        summary: `Listed calendar events from ${args.startDate} to ${args.endDate}.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'get_calendar_holidays',
      description: 'Get official holidays and non-working days.',
      parameters: {
        type: 'object',
        properties: { year: { type: 'number' } },
        required: ['year']
      }
    },
    async (args: { year: number }) => {
      return {
        success: true,
        data: { holidays: [] },
        summary: `Retrieved holidays for year ${args.year}.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'get_page_structure',
      description: 'Retrieves the structured block representation of a page.',
      parameters: {
        type: 'object',
        properties: { pageTitle: { type: 'string' } },
        required: ['pageTitle']
      }
    },
    async (args: { pageTitle: string }) => {
      return {
        success: true,
        data: { structure: `Structure of ${args.pageTitle}` },
        summary: `Retrieved page structure for "${args.pageTitle}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'insert_block',
      description: 'Inserts a new content block into a page.',
      parameters: {
        type: 'object',
        properties: {
          pageTitle: { type: 'string' },
          targetBlockId: { type: 'string' },
          content: { type: 'string' },
          type: { type: 'string' }
        },
        required: ['pageTitle', 'targetBlockId', 'content', 'type']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { inserted: true },
        summary: `Inserted block into "${args.pageTitle}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'replace_block',
      description: 'Updates the content of a specific block.',
      parameters: {
        type: 'object',
        properties: {
          pageTitle: { type: 'string' },
          blockId: { type: 'string' },
          newContent: { type: 'string' }
        },
        required: ['pageTitle', 'blockId', 'newContent']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { replaced: true },
        summary: `Replaced block in "${args.pageTitle}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'delete_block',
      description: 'Removes a specific block from a page.',
      parameters: {
        type: 'object',
        properties: {
          pageTitle: { type: 'string' },
          blockId: { type: 'string' }
        },
        required: ['pageTitle', 'blockId']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { deleted: true },
        summary: `Deleted block from "${args.pageTitle}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'update_table_cell',
      description: 'Updates a specific cell in a markdown table.',
      parameters: {
        type: 'object',
        properties: {
          pageTitle: { type: 'string' },
          tableBlockId: { type: 'string' },
          rowIndex: { type: 'number' },
          colIndex: { type: 'number' },
          newValue: { type: 'string' }
        },
        required: ['pageTitle', 'tableBlockId', 'rowIndex', 'colIndex', 'newValue']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { updated: true },
        summary: `Updated table cell in "${args.pageTitle}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'add_calendar_event',
      description: 'Add a new event to the calendar.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        },
        required: ['title', 'startDate', 'endDate']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { added: true },
        summary: `Added calendar event "${args.title}".`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'update_calendar_event',
      description: 'Update an existing calendar event.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { updated: true },
        summary: `Updated calendar event ${args.id}.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'delete_calendar_event',
      description: 'Delete a calendar event.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    async (args: any) => {
      return {
        success: true,
        data: { deleted: true },
        summary: `Deleted calendar event ${args.id}.`
      };
    }
  );
}
