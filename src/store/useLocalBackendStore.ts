import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationsStore } from './useNotificationsStore';

export type LocalAgentType = 'ollama' | 'hermes' | 'execution_engine' | 'open_code' | 'unknown' | 'lm_studio';

export interface LocalAgent {
  id: string;
  name: string;
  type: LocalAgentType;
  url: string;
  status: 'online' | 'offline';
  version?: string;
  port: number;
  models?: string[];
}

interface LocalBackendState {
  isScanning: boolean;
  agents: LocalAgent[];
  isExecutionEngineConnected: boolean;
  executionEngineUrl: string;
  
  scanLocalNetwork: () => Promise<void>;
  connectExecutionEngine: (url?: string) => Promise<boolean>;
  disconnectExecutionEngine: () => void;
  removeAgent: (id: string) => void;
}

// Ports to scan
const SCAN_TARGETS = [
  { port: 11434, type: 'ollama' as const, name: 'Ollama Local' },
  { port: 1234, type: 'lm_studio' as const, name: 'LM Studio' },
  { port: 8000, type: 'hermes' as const, name: 'Hermes Agent' },
  { port: 8123, type: 'execution_engine' as const, name: 'Local Execution Node' },
  { port: 3001, type: 'open_code' as const, name: 'Open Code Backend' },
];

export const useLocalBackendStore = create<LocalBackendState>()(
  persist(
    (set, get) => ({
      isScanning: false,
      agents: [],
      isExecutionEngineConnected: false,
      executionEngineUrl: 'http://127.0.0.1:8123',

      scanLocalNetwork: async () => {
        set({ isScanning: true });
        
        const scanTarget = async (target: typeof SCAN_TARGETS[0], host: string): Promise<LocalAgent | null> => {
           try {
              const url = `http://${host}:${target.port}`;
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 1000);
              
              const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal,
              }).catch(() => null);
              
              clearTimeout(timeoutId);
              
              if (response) {
                 let models: string[] = [];
                 try {
                     if (target.type === 'ollama') {
                         const modelRes = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
                         if (modelRes && modelRes.ok) {
                             const data = await modelRes.json();
                             models = data.models?.map((m: any) => m.name) || [];
                         }
                     } else if (target.type === 'lm_studio') {
                         const modelRes = await fetch(`${url}/v1/models`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
                         if (modelRes && modelRes.ok) {
                             const data = await modelRes.json();
                             models = data.data?.map((m: any) => m.id) || [];
                         }
                     } else if (target.type === 'execution_engine') {
                         const modelRes = await fetch(`${url}/models`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
                         if (modelRes && modelRes.ok) {
                             const data = await modelRes.json();
                             models = data.models || [];
                         }
                     }
                 } catch (e) {}

                 return {
                   id: crypto.randomUUID(),
                   name: target.name,
                   type: target.type,
                   url: url,
                   status: 'online',
                   port: target.port,
                   models: models,
                 };
              }
           } catch {
             // ignore
           }
           return null;
        };

        const promises: Promise<LocalAgent | null>[] = [];
        for (const target of SCAN_TARGETS) {
            promises.push(scanTarget(target, '127.0.0.1'));
            promises.push(scanTarget(target, 'localhost'));
        }

        const results = await Promise.all(promises);
        
        // Artificial delay for better UX (at least 1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const validAgents = results.filter((a): a is LocalAgent => a !== null);
        const uniqueAgentsMap = new Map<number, LocalAgent>();
        
        for (const agent of validAgents) {
            if (!uniqueAgentsMap.has(agent.port)) {
                uniqueAgentsMap.set(agent.port, agent);
            } else {
                const existing = uniqueAgentsMap.get(agent.port);
                if (existing?.url.includes('localhost') && agent.url.includes('127.0.0.1')) {
                    uniqueAgentsMap.set(agent.port, agent);
                }
            }
        }
        
        const detectedAgents = Array.from(uniqueAgentsMap.values());
        
        set({ 
           agents: detectedAgents, 
           isScanning: false,
           isExecutionEngineConnected: detectedAgents.some(a => a.type === 'execution_engine' && a.status === 'online')
        });

        if (detectedAgents.length > 0) {
            useNotificationsStore.getState().addNotification({
              title: "Local Scan Complete",
              message: `Found ${detectedAgents.length} local services active.`,
              type: "system"
            });
        } else {
            useNotificationsStore.getState().addNotification({
              title: "Local Scan Complete",
              message: `No local engines detected. If it's running, your browser might be blocking local connections (Private Network Access / Mixed Content).`,
              type: "system"
            });
        }
      },
      
      connectExecutionEngine: async (customUrl) => {
        const url = customUrl || get().executionEngineUrl;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const response = await fetch(`${url}/health`, {
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (response.ok || response.type === 'opaque') {
            set((state) => {
              const newAgents = state.agents.filter(a => a.type !== 'execution_engine');
              newAgents.push({
                 id: crypto.randomUUID(),
                 name: 'Local Execution Node',
                 type: 'execution_engine',
                 url: url,
                 status: 'online',
                 port: parseInt(url.split(':').pop() || '8123')
              });
              
              return { 
                isExecutionEngineConnected: true, 
                executionEngineUrl: url,
                agents: newAgents
              };
            });
            return true;
          }
          return false;
        } catch (error) {
          set({ isExecutionEngineConnected: false });
          return false;
        }
      },
      
      disconnectExecutionEngine: () => {
         set((state) => ({ 
             isExecutionEngineConnected: false,
             agents: state.agents.map(a => a.type === 'execution_engine' ? { ...a, status: 'offline' } : a)
         }));
      },
      
      removeAgent: (id: string) => {
         set((state) => ({
             agents: state.agents.filter(a => a.id !== id)
         }));
      }
    }),
    {
      name: 'local-backend-storage',
      partialize: (state) => ({ 
         executionEngineUrl: state.executionEngineUrl // Only persist the URL, status should be checked dynamically
      }),
    }
  )
);
