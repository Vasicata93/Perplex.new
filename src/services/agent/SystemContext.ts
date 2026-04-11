export interface SystemContextData {
  identity: {
    personality: string;
    capabilities: string[];
    values: string[];
  };
  coreSkills: {
    [skillName: string]: string;
  };
  toolDefinitions: {
    readTools: string[];
    writeTools: string[];
  };
  behavioralRules: string[];
}

export class SystemContext {
  private static cachedContext: string | null = null;

  /**
   * Builds the Layer 1 System Context.
   * Static, cached, built once per session.
   * Deterministic JSON serialization with sorted keys.
   * Timestamp is NOT included here.
   */
  static getContext(): string {
    if (this.cachedContext) {
      return this.cachedContext;
    }

    const contextData: SystemContextData = {
      behavioralRules: [
        "Errors remain in context as resources for recovery.",
        "Append-only context.",
        "If observation > 5000 tokens, externalize to RAG.",
        "Fallback protocol (if tool fails, try alternative)."
      ],
      coreSkills: {
        "Răspuns în limba userului": "Auto-detect limbă la fiecare mesaj",
        "Calendar awareness": "Protocol complet pentru operațiuni pe calendar",
        "Library / Notion operations": "Read/write pe pagini, blocuri, tabele",
        "Widget și vizualizare": "Grafice, diagrame, componente UI interactive",
        "Safety protocol": "Write ops cer confirmare. Excepție: execute_code în sandbox"
      },
      identity: {
        capabilities: [
          "Web Search & Information Retrieval",
          "Workspace File Management",
          "Calendar Management",
          "Data Visualization & Widgets",
          "Local and Cloud LLM Execution"
        ],
        personality: "Professional, concise, helpful, and highly analytical.",
        values: [
          "Accuracy over speed",
          "User privacy and data security",
          "Transparency in actions"
        ]
      },
      toolDefinitions: {
        readTools: [
          "perform_search",
          "search_workspace_files",
          "read_workspace_files",
          "get_workspace_map",
          "semantic_search_workspace",
          "list_calendar_events",
          "get_calendar_holidays",
          "get_page_structure"
        ],
        writeTools: [
          "save_to_library",
          "insert_block",
          "replace_block",
          "delete_block",
          "update_table_cell",
          "add_calendar_event",
          "update_calendar_event",
          "delete_calendar_event",
          "manage_complex_module"
        ]
      }
    };

    // Deterministic JSON serialization with sorted keys
    this.cachedContext = this.deterministicStringify(contextData);
    return this.cachedContext;
  }

  private static deterministicStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      const arrStr = obj.map(item => this.deterministicStringify(item)).join(',');
      return `[${arrStr}]`;
    }

    const keys = Object.keys(obj).sort();
    const keyValStrs = keys.map(key => {
      const valStr = this.deterministicStringify(obj[key]);
      return `"${key}":${valStr}`;
    });
    return `{${keyValStrs.join(',')}}`;
  }

  static clearCache() {
    this.cachedContext = null;
  }
}
