// src/types/agent.ts

export type ConfidenceScore = 'high' | 'medium' | 'low';

export type AgentMode = 'chat' | 'agent' | 'idle';

export type ToolState = 'idle' | 'writing' | 'confirming' | 'error' | 'blocked';

export interface SafetyViolation {
  type: 'recursion' | 'sensitive_data' | 'write_blocked' | 'frustration' | 'sanity_check';
  message: string;
  severity: 'warning' | 'critical';
}

export interface GuardResult {
  isSafe: boolean;
  violation?: SafetyViolation;
}

export interface Perception {
  timestamp: number;
  literalInput: string;
  realIntent: string;
  tone: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SubTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ActionFeedItem {
  id: string;
  timestamp: number;
  toolName: string;
  summary: string;
  status: 'pending' | 'success' | 'error';
  resultPreview?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface AgentState {
  // Perception
  currentPerception: Perception | null;
  
  // Routing & Mode
  mode: AgentMode;
  toolState: ToolState;
  
  // UI Panels
  planPanel: SubTask[];
  actionFeed: ActionFeedItem[];
  
  // Thinking Indicator
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  
  // Response
  confidenceScore: ConfidenceScore | null;

  // Safety & Performance
  recursionCount: number;
  frustrationLevel: number; // 0-10
  lastViolation: SafetyViolation | null;
}
