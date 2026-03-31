
import React, { useState } from 'react';
import { ChevronDown, Brain, Sparkles } from 'lucide-react';

interface TornadoIndicatorProps {
    isThinking: boolean;
    reasoning?: string;
    currentStep?: string;
}

export const TornadoIndicator: React.FC<TornadoIndicatorProps> = ({ isThinking, reasoning, currentStep }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Only show if there is reasoning to show (even if thinking is false)
    if (!reasoning && !isThinking) return null;
    
    // Simplify step text for premium look
    const simplifyStep = (step: string) => {
        if (!step) return 'Thinking...';
        
        // Remove common prefixes to keep it clean
        let clean = step.replace(/^(Step \d+:|Action:|Thought:)\s*/i, '');
        
        // If it's a search query, it's already descriptive
        if (clean.toLowerCase().includes('searching for')) {
            return clean;
        }

        // Truncate at 80 chars for a better balance of information and clean UI
        return clean.length > 80 ? `${clean.substring(0, 80)}...` : clean;
    };

    const displayStep = currentStep ? simplifyStep(currentStep) : 'Thinking...';

    return (
        <div className="flex flex-col my-3">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 group cursor-pointer transition-all w-fit py-2 px-4 rounded-full border border-pplx-border/20 bg-pplx-secondary/10 hover:bg-pplx-secondary/30 hover:border-pplx-border/40 shadow-sm backdrop-blur-sm"
            >
                {isThinking ? (
                    <div className="relative flex items-center justify-center w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pplx-accent opacity-30"></span>
                        <Sparkles size={12} className="text-pplx-accent animate-pulse" />
                    </div>
                ) : (
                    <Brain size={13} className="text-pplx-muted group-hover:text-pplx-accent transition-colors" />
                )}

                <span className={`text-[12px] font-medium tracking-tight ${isThinking ? 'text-pplx-accent' : 'text-pplx-muted group-hover:text-pplx-text'}`}>
                    {isThinking ? displayStep : 'Thought Process'}
                </span>
                
                <ChevronDown 
                    size={12} 
                    className={`text-pplx-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                />
            </button>

            {isExpanded && reasoning && (
                <div className="mt-3 border-l-2 border-pplx-accent/30 animate-in fade-in slide-in-from-top-2 duration-500 w-full max-w-2xl">
                    <div className="bg-pplx-secondary/5 rounded-r-2xl p-5 text-[13px] text-pplx-text/90 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar ml-4 backdrop-blur-md border border-pplx-border/10 shadow-inner">
                        {reasoning.split('\n').filter(Boolean).map((step, i) => (
                            <div key={i} className="mb-3 last:mb-0 flex gap-4 items-start group/step">
                                <span className="text-[10px] font-mono opacity-20 mt-1.5 shrink-0 group-hover/step:opacity-50 transition-opacity">{String(i + 1).padStart(2, '0')}</span>
                                <span className="flex-1 border-b border-transparent group-hover/step:border-pplx-border/10 transition-all pb-1">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
