import { create } from 'zustand';

export type AgentHubState = 'idle' | 'working' | 'dancing' | 'walking' | 'playing_ping_pong';

export interface AgentRealtimeState {
  state: AgentHubState;
  thought?: string;
  targetPos?: [number, number, number];
}

interface HubState {
  isConnected: boolean;
  hubUrl: string;
  agentsState: Record<string, AgentRealtimeState>;
  setConnectionStatus: (isConnected: boolean) => void;
  setHubUrl: (url: string) => void;
  updateAgentState: (agentId: string, state: AgentRealtimeState) => void;
}

export const useHubStore = create<HubState>((set) => ({
  isConnected: false,
  hubUrl: 'ws://localhost:8123/ws', // Default Execution Node WebSocket
  agentsState: {},
  setConnectionStatus: (isConnected) => set({ isConnected }),
  setHubUrl: (hubUrl) => set({ hubUrl }),
  updateAgentState: (agentId, stateUpdate) =>
    set((state) => ({
      agentsState: {
        ...state.agentsState,
        [agentId]: {
          ...(state.agentsState[agentId] || { state: 'idle' }),
          ...stateUpdate,
        },
      },
    })),
}));
