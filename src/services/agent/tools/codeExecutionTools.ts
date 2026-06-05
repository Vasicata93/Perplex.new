import { ToolRegistry } from './ToolRegistry';
import { Sandbox } from '@e2b/code-interpreter';

export function registerCodeExecutionTools() {
  ToolRegistry.register(
    {
      name: 'execute_code',
      description: 'Execute Python, JS, or Shell scripts. Automatically routes to Cloud Sandbox (E2B) or Local Client based on user environment settings.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'The code or script to execute.' },
          language: { type: 'string', description: 'python, javascript, bash, or sh' },
          use_browser: { type: 'boolean', description: 'If true, provides Puppeteer/Playwright environment and returns screenshots' }
        },
        required: ['code', 'language']
      }
    },
    async (args: { code: string, language: string, use_browser?: boolean }) => {
      // SCENARIU 1: Desktop App / Local Client (Varianta 1 & 2)
      // Check if local endpoint is active (mocked as true for local demo)
      const LOCAL_ENDPOINT = "http://localhost:4000/execute";
      let localAvailable = false;
      
      try {
        // Ping local
        const check = await fetch("http://localhost:4000/ping", { method: 'GET' }).catch(() => null);
        if (check && check.ok) localAvailable = true;
      } catch(e) {}

      if (localAvailable) {
        try {
          const res = await fetch(LOCAL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: args.code, language: args.language, use_browser: args.use_browser })
          });
          const result = await res.json();
          return {
            success: true,
            data: result,
            summary: `Executed ${args.language} locally`
          };
        } catch (error: any) {
          return { success: false, error: 'Local execution failed: ' + error.message, summary: 'Local execution failed' };
        }
      }

      // SCENARIU 2: Cloud Sandbox (E2B / Daytona)
      const e2bApiKey = localStorage.getItem("E2B_API_KEY"); // Or from settings store
      if (e2bApiKey) {
        try {
          const sandbox = await Sandbox.create({ apiKey: e2bApiKey });
          let stdout = "";
          let stderr = "";
          
          if (args.language === 'python' || args.language === 'javascript') {
            const execution = await sandbox.runCode(args.code, { language: args.language === 'javascript' ? 'js' : args.language });
            stdout = execution.logs.stdout.join('\n');
            stderr = execution.logs.stderr.join('\n');
          } else {
            // Bash/sh execution
            const result = await sandbox.commands.run(args.code);
            stdout = result.stdout;
            stderr = result.stderr;
          }
          
          await sandbox.kill();
          return { 
            success: true, 
            data: { stdout, stderr },
            summary: `Executed ${args.language} in E2B Sandbox`
          };
        } catch (err: any) {
           return { success: false, error: 'E2B Sandbox execution failed: ' + err.message, summary: 'E2B execution failed' };
        }
      }

      // Fallback
      return {
        success: false,
        data: {
          output: "Please configure Execution Environment (E2B Cloud Key or Start Local Client) in Agent Engine settings.",
        },
        summary: `Execution pending configuration`
      };
    }
  );
}
