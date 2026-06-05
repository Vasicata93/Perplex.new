import { useEffect, useRef } from 'react';
import { useHubStore, AgentHubState } from './useHubStore';
import { useLocalBackendStore } from './useLocalBackendStore';

export const useHubConnection = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { hubUrl, setConnectionStatus, updateAgentState } = useHubStore();
  const isExecutionEngineConnected = useLocalBackendStore(state => state.isExecutionEngineConnected);
  // Attempt to use the detected execution engine URL, converted to ws://
  const executionEngineUrl = useLocalBackendStore(state => state.executionEngineUrl);

  useEffect(() => {
    // Determine connection URL (Prefer local execution node if connected)
    let wsUrl = hubUrl;
    if (isExecutionEngineConnected && executionEngineUrl) {
       wsUrl = executionEngineUrl.replace(/^http/, 'ws') + '/ws/hub';
    }

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log(`[Hub] Connected to ${wsUrl}`);
          setConnectionStatus(true);
        };

        ws.onclose = () => {
          console.log(`[Hub] Disconnected from ${wsUrl}`);
          setConnectionStatus(false);
          // Auto reconnect
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error('[Hub] WebSocket error:', error);
          ws.close();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Expected Backend Event Format:
            // { type: 'agent_state_update', payload: { agentId: '...', state: 'working', thought: 'Analyzing...' } }
            // { type: 'ping_pong_event', payload: { ... } } // maybe trigger janitor or agents to dance
            
            if (data.type === 'agent_state_update' && data.payload) {
              updateAgentState(data.payload.agentId, {
                state: data.payload.state as AgentHubState,
                thought: data.payload.thought
              });
            } else if (data.type === 'hub_event') {
               // broadcast event to all agents (e.g. success -> dance)
               if (data.payload?.event === 'success') {
                  const state = useHubStore.getState();
                  Object.keys(state.agentsState).forEach(id => {
                     updateAgentState(id, { state: 'dancing', thought: 'Woohoo!' });
                  });
               }
            }
          } catch (e) {
            console.error('[Hub] Parse error:', e);
          }
        };
      } catch (err) {
        console.error('[Hub] Connection error:', err);
        setConnectionStatus(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [hubUrl, isExecutionEngineConnected, executionEngineUrl, setConnectionStatus, updateAgentState]);

  return { isConnected: useHubStore(state => state.isConnected) };
};
