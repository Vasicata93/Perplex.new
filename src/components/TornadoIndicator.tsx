import React, { useState, useEffect } from "react";
import { ChevronDown, CheckCircle2, Circle, Loader2, XCircle, Terminal, Clock } from "lucide-react";
import { useAgentStore } from "../store/agentStore";

interface TornadoIndicatorProps {
  isThinking: boolean;
  reasoning?: string;
  currentStep?: string;
  agentPlan?: any[];
  agentActions?: any[];
}

export const TornadoIndicator: React.FC<TornadoIndicatorProps> = ({
  isThinking,
  reasoning,
  currentStep,
  agentPlan,
  agentActions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Subscribe to store
  const storeMode = useAgentStore(state => state.mode);
  const storePlan = useAgentStore(state => state.planPanel);
  const storeActions = useAgentStore(state => state.actionFeed);
  const storeStepDesc = useAgentStore(state => state.stepDescription);
  const storeCurrentStep = useAgentStore(state => state.currentStep);
  const storeTotalSteps = useAgentStore(state => state.totalSteps);

  // Determine active data sources
  const isAgentModeActive = isThinking ? storeMode === 'agent' : (agentPlan && agentPlan.length > 0) || (agentActions && agentActions.length > 0);
  const plan = isThinking ? storePlan : agentPlan;
  const actions = isThinking ? storeActions : agentActions;
  
  // Combine reasoning from props with live agent steps
  const [liveReasoning, setLiveReasoning] = useState<string[]>([]);
  
  useEffect(() => {
    if (isThinking && storeMode === 'agent' && storeStepDesc) {
      setLiveReasoning(prev => {
        if (prev[prev.length - 1] !== storeStepDesc) {
          return [...prev, storeStepDesc];
        }
        return prev;
      });
    }
    if (!isThinking) {
      setLiveReasoning([]);
    }
  }, [storeStepDesc, isThinking, storeMode]);

  const displayReasoning = isThinking && storeMode === 'agent'
    ? liveReasoning.join('\n') 
    : reasoning;

  // Only show if there is reasoning to show or if it's an agent message with a plan/actions
  if (!displayReasoning && !isThinking && !isAgentModeActive) return null;

  // Simplify step text for premium look
  const simplifyStep = (step: string) => {
    if (!step) return "";
    let clean = step.replace(/^(Step \d+:|Action:|Thought:)\s*/i, "");
    if (clean.toLowerCase().includes("searching for")) {
      return clean;
    }
    return clean.length > 40 ? `${clean.substring(0, 40)}...` : clean;
  };

  const activeStepText = isThinking && storeMode === 'agent'
    ? `[${storeCurrentStep}/${storeTotalSteps}] ${simplifyStep(storeStepDesc)}`
    : (currentStep ? simplifyStep(currentStep) : "");

  return (
    <div className="flex flex-col my-1 w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 group cursor-pointer transition-all w-fit py-0.5 px-0 hover:opacity-80"
      >
        <span
          className={`text-[12px] italic font-medium tracking-tight ${isThinking ? "text-pplx-accent" : "text-pplx-muted group-hover:text-pplx-text"}`}
        >
          {isThinking 
            ? (isAgentModeActive ? `Agent Mode: ${activeStepText || "Thinking..."}` : activeStepText || "Thinking...") 
            : (isAgentModeActive ? "Agent Mode: Completed" : "Thought Process")}
        </span>

        <ChevronDown
          size={13}
          className={`text-pplx-muted transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300 w-full max-w-3xl flex flex-col gap-4">
          
          {/* Chain of Thoughts (Reasoning) */}
          {displayReasoning && (
            <div className="text-[12px] text-pplx-muted italic leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar ml-6">
              {displayReasoning
                .split("\n")
                .filter(Boolean)
                .map((step, i) => (
                  <div
                    key={i}
                    className="mb-2 last:mb-0 flex gap-3 items-start group/step"
                  >
                    <span className="text-[10px] font-mono opacity-30 mt-1 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{step}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Agent Plan & Actions */}
          {isAgentModeActive && ((plan && plan.length > 0) || (actions && actions.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 mt-2">
              {/* Plan Panel */}
              {plan && plan.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-mono text-pplx-muted uppercase tracking-wider">Agent Plan</h3>
                  <div className="flex flex-col gap-2">
                    {plan.map((task: any) => (
                      <div key={task.id} className="flex items-start gap-2 text-[12px]">
                        <div className="mt-0.5 shrink-0">
                          {task.status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
                          {task.status === 'in_progress' && <Loader2 size={12} className="text-pplx-accent animate-spin" />}
                          {task.status === 'failed' && <XCircle size={12} className="text-red-500" />}
                          {task.status === 'pending' && <Circle size={12} className="text-pplx-muted" />}
                        </div>
                        <span className={`flex-1 ${task.status === 'completed' ? 'text-pplx-muted line-through' : 'text-pplx-text'}`}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Feed */}
              {actions && actions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-mono text-pplx-muted uppercase tracking-wider">Action Feed</h3>
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar bg-[#1E1E1E]/50 rounded p-2 border border-pplx-border/50">
                    {actions.map((action: any) => (
                      <div key={action.id} className="flex flex-col gap-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-pplx-muted">
                          <div className="flex items-center gap-1.5">
                            <Terminal size={10} />
                            <span className="text-pplx-accent">{action.toolName || action.tool}</span>
                          </div>
                          {action.durationMs && (
                            <div className="flex items-center gap-1 opacity-50">
                              <Clock size={10} />
                              <span>{action.durationMs}ms</span>
                            </div>
                          )}
                        </div>
                        <div className="text-pplx-text pl-4 opacity-80 line-clamp-2">
                          {action.summary || action.input}
                        </div>
                        {(action.resultPreview || action.result) && (
                          <div className="text-pplx-muted pl-4 border-l border-pplx-border/50 ml-1.5 mt-1 line-clamp-3">
                            {action.resultPreview || action.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
