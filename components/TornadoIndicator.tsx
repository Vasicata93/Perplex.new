
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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

        // Truncate at 40 chars for a better balance of information and clean UI
        return clean.length > 40 ? `${clean.substring(0, 40)}...` : clean;
    };

    const displayStep = currentStep ? simplifyStep(currentStep) : 'Thinking...';

    return (
        <div className="flex flex-col my-1">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 group cursor-pointer transition-all w-fit py-1 px-0 hover:opacity-80"
            >
                <span className={`text-[11px] font-medium tracking-tight ${isThinking ? 'text-pplx-accent' : 'text-pplx-muted group-hover:text-pplx-text'}`}>
                    {isThinking ? displayStep : 'Thought Process'}
                </span>
                
                <ChevronDown 
                    size={12} 
                    className={`text-pplx-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                />
            </button>

            {isExpanded && reasoning && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-500 w-full max-w-2xl">
                    <div className="p-0 text-[11px] italic text-pplx-text/80 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar ml-0">
                        {reasoning.split('\n').filter(Boolean).map((step, i) => (
                            <div key={i} className="mb-2 last:mb-0 flex gap-3 items-start group/step">
                                <span className="text-[9px] font-mono opacity-20 mt-1 shrink-0 group-hover/step:opacity-50 transition-opacity">{String(i + 1).padStart(2, '0')}</span>
                                <span className="flex-1 border-b border-transparent group-hover/step:border-pplx-border/10 transition-all pb-1">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
