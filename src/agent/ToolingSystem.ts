import { ToolDefinition, ToolResult, AgentContext } from './types';
import { TavilyService } from '../../services/tavilyService';
import { db, STORES } from '../../services/db';
import { getHolidays } from '../services/holidayService';
import { CalendarEvent } from '../../types';
import * as math from 'mathjs';

export class ToolingSystem {
    private tools: Map<string, ToolDefinition> = new Map();

    constructor() {
        this.registerDefaultTools();
    }

    private registerDefaultTools() {
        // Search Tool
        this.register({
            name: 'perform_search',
            description: 'Searches the web for real-time information. REQUIRED for current events, news, weather, or specific facts not in your training data.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The optimal search query to find the information.' }
                },
                required: ['query'],
                additionalProperties: false
            },
            execute: async (args: { query: string }, context: AgentContext) => {
                if (!context.config.searchApiKey) throw new Error("Search API Key missing");
                const result = await TavilyService.search(args.query, context.config.searchApiKey, context.config.searchProvider);
                return result;
            }
        });

        // Save Tool
        this.register({
            name: 'save_to_library',
            description: "Creates a new page in the library. Use this when the user explicitly asks to 'save', 'create page', or 'remember'.",
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Title of the page.' },
                    content: { type: 'string', description: 'Markdown content.' },
                    action: { type: 'string', enum: ['create', 'update'], description: 'Action type.' }
                },
                required: ['title', 'content', 'action'],
                additionalProperties: false
            },
            execute: async (args: any, _context: AgentContext) => {
                return {
                    pendingAction: {
                        type: args.action === 'update' ? 'update_page' : 'create_page',
                        data: { title: args.title, content: args.content }
                    }
                };
            }
        });

        // Wikipedia Tool
        this.register({
            name: 'wikipedia_search',
            description: 'Searches Wikipedia for a given topic and returns a summary.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The topic to search for on Wikipedia.' }
                },
                required: ['query'],
                additionalProperties: false
            },
            execute: async (args: { query: string }, _context: AgentContext) => {
                try {
                    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(args.query)}&utf8=&format=json&origin=*`;
                    const searchResponse = await fetch(searchUrl);
                    const searchData = await searchResponse.json();
                    
                    if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                        const topResult = searchData.query.search[0];
                        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${encodeURIComponent(topResult.title)}&format=json&origin=*`;
                        const extractResponse = await fetch(extractUrl);
                        const extractData = await extractResponse.json();
                        
                        const pages = extractData.query.pages;
                        const pageId = Object.keys(pages)[0];
                        
                        if (pageId !== '-1') {
                            return {
                                title: pages[pageId].title,
                                extract: pages[pageId].extract,
                                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pages[pageId].title.replace(/ /g, '_'))}`
                            };
                        }
                    }
                    return { error: 'No results found on Wikipedia.' };
                } catch (error: any) {
                    return { error: `Wikipedia search failed: ${error.message}` };
                }
            }
        });

        // Calculator Tool
        this.register({
            name: 'calculator',
            description: 'Evaluates mathematical expressions.',
            parameters: {
                type: 'object',
                properties: {
                    expression: { type: 'string', description: 'The mathematical expression to evaluate.' }
                },
                required: ['expression'],
                additionalProperties: false
            },
            execute: async (args: { expression: string }, _context: AgentContext) => {
                try {
                    const result = math.evaluate(args.expression);
                    return { result: result, expression: args.expression };
                } catch (error: any) {
                    return { error: `Calculation error: ${error.message}` };
                }
            }
        });

        // Workspace Tools
        this.register({
            name: 'read_workspace_files',
            description: 'Reads the full content of specific files from the workspace.',
            parameters: {
                type: 'object',
                properties: {
                    filenames: { type: 'array', items: { type: 'string' }, description: 'List of filenames to read.' }
                },
                required: ['filenames'],
                additionalProperties: false
            },
            execute: async (args: { filenames: string[] }, context: AgentContext) => {
                const attachments = context.attachments || [];
                const requestedFiles = attachments.filter(f => args.filenames.includes(f.name));
                if (requestedFiles.length > 0) {
                    let content = "";
                    requestedFiles.forEach(f => {
                        content += `\n[File: ${f.name}]\n${f.content}\n`;
                    });
                    return { content };
                } else {
                    return { error: "Requested files not found in workspace." };
                }
            }
        });

        this.register({
            name: 'search_workspace_files',
            description: 'Searches for specific keywords or phrases within workspace files.',
            parameters: {
                type: 'object',
                properties: {
                    queries: { type: 'array', items: { type: 'string' }, description: 'List of keywords to search for.' }
                },
                required: ['queries'],
                additionalProperties: false
            },
            execute: async (args: { queries: string[] }, context: AgentContext) => {
                const queries = args.queries.map(q => q.toLowerCase());
                let foundCount = 0;
                let results = `Search results for [${queries.join(', ')}] in workspace files:\n`;
                const attachments = context.attachments || [];

                attachments.forEach(f => {
                    if (f.type !== 'text' || !f.content) return;
                    const lines = f.content.split('\n');
                    lines.forEach((line, idx) => {
                        const lowerLine = line.toLowerCase();
                        if (queries.some(q => lowerLine.includes(q))) {
                            foundCount++;
                            const start = Math.max(0, idx - 1);
                            const end = Math.min(lines.length - 1, idx + 1);
                            results += `\n[File: ${f.name}, Line ${idx + 1}]\n`;
                            for (let i = start; i <= end; i++) {
                                results += `${i === idx ? '>> ' : '   '}${lines[i]}\n`;
                            }
                        }
                    });
                });

                if (foundCount === 0) return { message: "No matches found." };
                return { results };
            }
        });

        this.register({
            name: 'get_workspace_map',
            description: 'Returns a high-level overview of all files in the workspace.',
            parameters: {
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            execute: async (_args: any, context: AgentContext) => {
                let map = "WORKSPACE KNOWLEDGE BASE MAP:\n";
                const attachments = context.attachments || [];
                attachments.forEach(f => {
                    const snippet = (f.content || "").substring(0, 300).replace(/\n/g, ' ');
                    const sizeKb = Math.round((f.content?.length || 0) / 1024);
                    map += `\n- FILE: ${f.name} (${sizeKb} KB)\n`;
                    map += `  PREVIEW: ${snippet}...\n`;
                });
                return { map };
            }
        });

        // Calendar Tools
        this.register({
            name: 'list_calendar_events',
            description: 'Lists calendar events for a given date range.',
            parameters: {
                type: 'object',
                properties: {
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' }
                },
                required: ['startDate', 'endDate'],
                additionalProperties: false
            },
            execute: async (args: { startDate: string, endDate: string }, _context: AgentContext) => {
                let startDate = new Date(args.startDate);
                let endDate = new Date(args.endDate);
                if (endDate.getTime() === startDate.getTime()) {
                    endDate.setHours(23, 59, 59, 999);
                }
                const allEvents = await db.get<CalendarEvent[]>(STORES.CALENDAR, 'all_events') || [];
                const filteredEvents = allEvents.filter(e => {
                    const eStart = new Date(e.startDate);
                    const eEnd = new Date(e.endDate);
                    return eStart <= endDate && eEnd >= startDate;
                });
                return filteredEvents.map(e => ({
                    ...e,
                    startDate: new Date(e.startDate).toLocaleString(),
                    endDate: new Date(e.endDate).toLocaleString()
                }));
            }
        });

        this.register({
            name: 'add_calendar_event',
            description: 'Adds a new event to the calendar.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    description: { type: 'string' }
                },
                required: ['title', 'startDate', 'endDate'],
                additionalProperties: false
            },
            execute: async (args: any, _context: AgentContext) => {
                return { pendingAction: { type: 'calendar_event', data: { operation: 'add', args } } };
            }
        });

        this.register({
            name: 'update_calendar_event',
            description: 'Updates an existing calendar event.',
            parameters: {
                type: 'object',
                properties: {
                    eventId: { type: 'string' },
                    updates: { type: 'object' }
                },
                required: ['eventId', 'updates'],
                additionalProperties: false
            },
            execute: async (args: any, _context: AgentContext) => {
                return { pendingAction: { type: 'calendar_event', data: { operation: 'update', args } } };
            }
        });

        this.register({
            name: 'delete_calendar_event',
            description: 'Deletes a calendar event.',
            parameters: {
                type: 'object',
                properties: {
                    eventId: { type: 'string' }
                },
                required: ['eventId'],
                additionalProperties: false
            },
            execute: async (args: any, _context: AgentContext) => {
                return { pendingAction: { type: 'calendar_event', data: { operation: 'delete', args } } };
            }
        });

        this.register({
            name: 'get_current_time',
            description: 'Returns the current system time.',
            parameters: {
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            execute: async (_args: any, _context: AgentContext) => {
                return { time: new Date().toLocaleString() };
            }
        });

        this.register({
            name: 'get_calendar_holidays',
            description: 'Returns holidays for a given year and country.',
            parameters: {
                type: 'object',
                properties: {
                    year: { type: 'number' },
                    country: { type: 'string' }
                },
                required: ['year', 'country'],
                additionalProperties: false
            },
            execute: async (args: { year: number, country: string }, _context: AgentContext) => {
                return getHolidays(args.year, args.country);
            }
        });
    }

    public register(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
    }

    public getTool(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    public getAllTools(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    public async executeTool(name: string, args: any, context: AgentContext): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { toolName: name, args, output: null, status: 'error', error: `Tool ${name} not found` };
        }

        try {
            const output = await tool.execute(args, context);
            return { toolName: name, args, output, status: 'success' };
        } catch (error: any) {
            return { toolName: name, args, output: null, status: 'error', error: error.message };
        }
    }
}
