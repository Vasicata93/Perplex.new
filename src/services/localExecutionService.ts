import { useLocalBackendStore } from '../store/useLocalBackendStore';

export type LocalToolName = 
  | 'execute_command' 
  | 'read_file' 
  | 'write_file' 
  | 'list_directory'
  | 'mouse_move'
  | 'mouse_click'
  | 'keyboard_type'
  | 'capture_screen';

export interface ToolCallPayload {
  tool: LocalToolName;
  params: Record<string, any>;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: string;
  data?: any;
  error?: string;
}

class LocalExecutionService {
  private getBaseUrl(): string | null {
    const state = useLocalBackendStore.getState();
    if (!state.isExecutionEngineConnected || !state.executionEngineUrl) {
        return null;
    }
    return state.executionEngineUrl;
  }

  /**
   * Universal method to send a command to the local execution engine
   */
  async executeTool(payload: ToolCallPayload): Promise<ToolExecutionResult> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      return {
        success: false,
        error: "Local execution engine is not connected. Please connect it in the settings.",
      };
    }

    try {
      const response = await fetch(`${baseUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Execution failed with status ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        output: data.output,
        data: data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Network error while connecting to local execution engine.",
      };
    }
  }

  // --- Convenience Wrappers for specific tools ---

  async executeCommand(command: string, cwd?: string): Promise<ToolExecutionResult> {
    return this.executeTool({
      tool: 'execute_command',
      params: { command, cwd }
    });
  }

  async readFile(filePath: string): Promise<ToolExecutionResult> {
    return this.executeTool({
      tool: 'read_file',
      params: { path: filePath }
    });
  }

  async writeFile(filePath: string, content: string): Promise<ToolExecutionResult> {
    return this.executeTool({
      tool: 'write_file',
      params: { path: filePath, content }
    });
  }

  async typeText(text: string): Promise<ToolExecutionResult> {
    return this.executeTool({
      tool: 'keyboard_type',
      params: { text }
    });
  }
}

export const localExecutionService = new LocalExecutionService();
