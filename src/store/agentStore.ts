// src/store/agentStore.ts
import { create } from 'zustand';
import { AgentState, Perception, SubTask, ActionFeedItem, AgentMode, ToolState, ConfidenceScore } from '../types/agent';

interface AgentStore extends AgentState {
  // Actions
  setPerception: (perception: Perception) => void;
  setMode: (mode: AgentMode) => void;
  setToolState: (state: ToolState) => void;
  
  // Plan Panel Actions
  setPlan: (tasks: SubTask[]) => void;
  updateTaskStatus: (taskId: string, status: SubTask['status']) => void;
  
  // Action Feed Actions
  addAction: (action: ActionFeedItem) => void;
  updateAction: (actionId: string, updates: Partial<ActionFeedItem>) => void;
  
  // Thinking Actions
  setThinkingStep: (step: number, total: number, description: string) => void;
  
  // Response Actions
  setConfidence: (score: ConfidenceScore) => void;
  
  // Safety Actions
  incrementRecursion: () => void;
  resetRecursion: () => void;
  setFrustration: (level: number) => void;
  setViolation: (violation: AgentState['lastViolation']) => void;
  
  // Reset
  resetSession: () => void;
}

const initialState: AgentState = {
  currentPerception: null,
  mode: 'idle',
  toolState: 'idle',
  planPanel: [],
  actionFeed: [],
  currentStep: 0,
  totalSteps: 0,
  stepDescription: '',
  confidenceScore: null,
  recursionCount: 0,
  frustrationLevel: 0,
  lastViolation: null,
};

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,

  setPerception: (perception) => set({ currentPerception: perception }),
  
  setMode: (mode) => set({ mode }),
  
  setToolState: (toolState) => set({ toolState }),
  
  setPlan: (tasks) => set({ planPanel: tasks }),
  
  updateTaskStatus: (taskId, status) => 
    set((state) => ({
      planPanel: state.planPanel.map((task) => 
        task.id === taskId ? { ...task, status } : task
      )
    })),
    
  addAction: (action) => 
    set((state) => ({
      actionFeed: [action, ...state.actionFeed] // Prepend new actions
    })),
    
  updateAction: (actionId, updates) =>
    set((state) => ({
      actionFeed: state.actionFeed.map((action) =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    })),
    
  setThinkingStep: (currentStep, totalSteps, stepDescription) =>
    set({ currentStep, totalSteps, stepDescription }),
    
  setConfidence: (confidenceScore) => set({ confidenceScore }),
  
  incrementRecursion: () => set((state) => ({ recursionCount: state.recursionCount + 1 })),
  
  resetRecursion: () => set({ recursionCount: 0 }),
  
  setFrustration: (frustrationLevel) => set({ frustrationLevel }),
  
  setViolation: (lastViolation) => set({ lastViolation }),
  
  resetSession: () => set(initialState),
}));

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).agentStore = useAgentStore;
}
