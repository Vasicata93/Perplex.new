/**
 * Tool Registry (Enhanced)
 * Inspired by NousResearch/hermes-agent tools/registry.py
 * Multi-toolset support, check functions, emoji metadata, conditional availability.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  summary: string;
  externalized?: boolean;
}

export type ToolFunction = (args: any, context?: any) => Promise<ToolResult>;

/**
 * Extended tool entry matching Hermes' registry.register() pattern.
 */
export interface ExtendedToolEntry {
  definition: ToolDefinition;
  execute: ToolFunction;
  toolset?: string;          // Which toolset this belongs to (e.g., 'core', 'skills', 'memory', 'browser')
  checkFn?: () => boolean;   // Availability check function
  emoji?: string;            // Display emoji for UI
  isWrite?: boolean;         // Whether this is a write tool (requires confirmation)
  requires?: string[];       // Required capabilities/features
  fallbackFor?: string[];    // Only show when these tools are NOT available
  priority?: number;         // Execution priority (lower = earlier)
}

export class ToolRegistry {
  private static tools: Map<string, ExtendedToolEntry> = new Map();
  private static toolsets: Map<string, Set<string>> = new Map(); // toolset -> tool names

  // ============================================================
  // Registration (Hermes-style)
  // ============================================================

  /**
   * Register a tool with extended metadata (Hermes pattern).
   */
  static register(
    definition: ToolDefinition,
    execute: ToolFunction,
    options?: {
      toolset?: string;
      checkFn?: () => boolean;
      emoji?: string;
      isWrite?: boolean;
      requires?: string[];
      fallbackFor?: string[];
      priority?: number;
    }
  ): void {
    const entry: ExtendedToolEntry = {
      definition,
      execute,
      toolset: options?.toolset || 'core',
      checkFn: options?.checkFn,
      emoji: options?.emoji,
      isWrite: options?.isWrite || false,
      requires: options?.requires,
      fallbackFor: options?.fallbackFor,
      priority: options?.priority || 100,
    };

    this.tools.set(definition.name, entry);

    // Add to toolset index
    const toolset = entry.toolset || 'default';
    if (!this.toolsets.has(toolset)) {
      this.toolsets.set(toolset, new Set());
    }
    this.toolsets.get(toolset)!.add(definition.name);

    console.log(`[ToolRegistry] Registered tool: ${definition.name} (toolset: ${toolset})`);
  }

  /**
   * Backward-compatible registration without options.
   */
  static registerSimple(definition: ToolDefinition, execute: ToolFunction): void {
    this.register(definition, execute);
  }

  // ============================================================
  // Query
  // ============================================================

  /**
   * Defines overrides from local storage keys for tools.
   */
  private static overrideKeys: Record<string, string> = {
    'execute_code': 'setting_code_execution',
    'session_goals': 'setting_session_goals',
    'session_search': 'setting_session_search',
    'clarify': 'setting_clarify',
    'osv_check': 'setting_osv_check',
    'data_redaction': 'setting_data_redaction',
    'schema_sanitizer': 'setting_data_redaction',
    'mini_swe_runner': 'setting_mini_swe',
    'schedule_job': 'setting_background_scheduler',
    'list_jobs': 'setting_background_scheduler',
    'generate_image': 'setting_image_gen',
    'check_budget': 'setting_budget',
    'scrape_website': 'setting_web_policies',
    'add_todo': 'setting_todo',
    'complete_todo': 'setting_todo',
    'list_todos': 'setting_todo',
    'mixture_of_agents': 'setting_moa',
    'create_checkpoint': 'setting_checkpoint',
    'restore_checkpoint': 'setting_checkpoint',
    'memory_retrieval': 'setting_memory_retrieval',
    'perform_search': 'setting_web_search',
    'library_tool': 'setting_library',
    'workspace_tool': 'setting_workspace',
    'portfolio_tool': 'setting_portfolio',
    'safe_digital_tool': 'setting_safe_digital',
    'code_execution': 'setting_core_code_execution',
    'calendar_tool': 'setting_calendar',
    'get_calendar_holidays': 'setting_calendar',
    'terminal_tool': 'setting_terminal',
    'browser_tool': 'setting_browser',
    'send_message_tool': 'setting_send_message',
    'vision_tools': 'setting_vision',
    'tts_tool': 'setting_tts',
    'generate_insights': 'setting_insights',
    'kanban_show': 'setting_kanban',
    'kanban_create': 'setting_kanban',
    'kanban_complete': 'setting_kanban',
    'kanban_block': 'setting_kanban'
  };

  /**
   * Check if an entry is available considering local storage overrides.
   */
  static isEntryAvailable(entry: ExtendedToolEntry): boolean {
    const overrideKey = this.overrideKeys[entry.definition.name];
    if (overrideKey) {
      if (localStorage.getItem(overrideKey) === 'false') {
        return false;
      }
    }
    if (entry.checkFn && !entry.checkFn()) return false;
    return true;
  }

  static getTool(name: string): ExtendedToolEntry | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions, filtering out unavailable tools via checkFn and user settings.
   */
  static getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(entry => this.isEntryAvailable(entry))
      .map(entry => entry.definition);
  }

  /**
   * Get tools by toolset.
   */
  static getByToolset(toolset: string): ToolDefinition[] {
    const names = this.toolsets.get(toolset);
    if (!names) return [];

    return Array.from(names)
      .map(name => this.tools.get(name))
      .filter((entry): entry is ExtendedToolEntry => entry !== undefined && this.isEntryAvailable(entry))
      .map(entry => entry.definition);
  }

  /**
   * Get all available toolsets.
   */
  static getToolsets(): string[] {
    return Array.from(this.toolsets.keys());
  }

  /**
   * Get all tool names.
   */
  static getAllToolNames(): Set<string> {
    return new Set(this.tools.keys());
  }

  /**
   * Check if a specific tool exists and is available.
   */
  static isToolAvailable(name: string): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;
    return this.isEntryAvailable(entry);
  }

  /**
   * Get tools filtered by conditional visibility.
   * Hermes: tool requires specific features, or is a fallback for missing features.
   */
  static getFilteredTools(availableFeatures?: Set<string>): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(entry => {
        // Check availability via override and checkFn
        if (!this.isEntryAvailable(entry)) return false;

        // Check requires
        if (entry.requires && entry.requires.length > 0) {
          if (!availableFeatures) return false;
          const hasAll = entry.requires.every(req => availableFeatures.has(req));
          if (!hasAll) return false;
        }

        // Check fallbackFor
        if (entry.fallbackFor && entry.fallbackFor.length > 0) {
          if (availableFeatures) {
            const hasAny = entry.fallbackFor.some(fb => availableFeatures.has(fb));
            if (hasAny) return false;
          }
        }

        return true;
      })
      .map(entry => entry.definition);
  }

  /**
   * Check if any tool is a write tool.
   */
  static isWriteTool(name: string): boolean {
    const entry = this.tools.get(name);
    return entry?.isWrite === true;
  }

  // ============================================================
  // Execution
  // ============================================================

  static async executeTool(name: string, args: any, context?: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found.`,
        summary: `Failed to find tool ${name}`,
      };
    }

    // Check availability before execution
    if (!this.isEntryAvailable(tool)) {
      return {
        success: false,
        error: `Tool '${name}' is disabled by user settings or currently unavailable.`,
        summary: `Tool ${name} unavailable`,
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        summary: `Error executing ${name}`,
      };
    }
  }

  // ============================================================
  // Management
  // ============================================================

  /**
   * Unregister a tool by name.
   */
  static unregister(name: string): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;

    this.tools.delete(name);

    // Remove from toolset
    if (entry.toolset) {
      this.toolsets.get(entry.toolset)?.delete(name);
    }

    return true;
  }

  /**
   * Get registry statistics.
   */
  static getStats(): {
    totalTools: number;
    availableTools: number;
    toolsets: Record<string, number>;
    writeTools: string[];
  } {
    const allTools = Array.from(this.tools.values());
    const available = allTools.filter(e => !e.checkFn || e.checkFn());
    const writeTools = allTools.filter(e => e.isWrite).map(e => e.definition.name);

    const toolsetCounts: Record<string, number> = {};
    Array.from(this.toolsets.entries()).forEach(([name, set]) => {
      toolsetCounts[name] = set.size;
    });

    return {
      totalTools: allTools.length,
      availableTools: available.length,
      toolsets: toolsetCounts,
      writeTools,
    };
  }
}
