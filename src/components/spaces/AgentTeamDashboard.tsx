import React from "react";
import { Space, Thread } from "../../types";
import { Bot, Activity, Search, Code, Settings2 } from "lucide-react";

interface AgentTeamDashboardProps {
  space: Space;
  activeThread: Thread | null;
  isGenerating?: boolean; // To know if the team is active right now
  onManageTeam?: () => void;
  variant?: "minimal" | "expanded";
}

export const AgentTeamDashboard: React.FC<AgentTeamDashboardProps> = ({ 
  space, 
  activeThread, 
  isGenerating, 
  onManageTeam,
  variant = "minimal"
}) => {
  if (!space.isTeamMode) return null;

  const hasAgents = space.subAgents && space.subAgents.length > 0;

  return (
    <div className={`bg-transparent shrink-0 group ${variant === "expanded" ? "w-full" : ""}`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5 mt-1">
          <div className="flex items-center gap-2">
             <h2 className="text-[13px] font-bold text-pplx-text tracking-widest uppercase opacity-60">
                Agent Team
             </h2>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             {isGenerating && (
                <div className="flex items-center gap-1.5 text-emerald-500 pr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block opacity-90 transition-opacity">Syncing</span>
                </div>
             )}
             
             {onManageTeam && (
               <button 
                 onClick={onManageTeam}
                 className="flex items-center gap-1.5 px-2.5 py-1 text-pplx-muted hover:text-pplx-text bg-pplx-secondary/15 hover:bg-pplx-secondary/30 rounded-lg transition-all border border-pplx-border/10"
                 title="Manage Team"
               >
                 <Settings2 size={13} className="opacity-70" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Manager</span>
               </button>
             )}
          </div>
        </div>
        
        {!hasAgents ? (
           <div className="py-8 px-4 flex items-center justify-center border border-dashed border-pplx-border/20 rounded-2xl bg-pplx-secondary/5 transition-colors">
              <p className="text-[11px] text-pplx-muted font-bold uppercase tracking-[0.2em] opacity-40">
                 No active units
              </p>
           </div>
        ) : (
          <div className={`grid gap-6 ${variant === "expanded" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {/* Main Orchestrator */}
            <div className={`group/agent transition-all duration-700 flex items-center gap-5 relative group`}>
               <div className={`p-3 rounded-2xl transition-all duration-700 relative overflow-hidden flex items-center justify-center shadow-sm ${isGenerating ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-pplx-secondary/50 text-pplx-muted/50 group-hover/agent:text-emerald-500/60 group-hover/agent:bg-pplx-secondary/80'}`}>
                  <Bot size={22} strokeWidth={1.2} />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-3 mb-0.5">
                    <h4 className="font-bold text-pplx-text text-[16px] truncate font-serif tracking-tight">
                       Orchestrator
                    </h4>
                    {isGenerating && <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>}
                 </div>
                 <p className="text-[11px] text-pplx-muted font-bold truncate tracking-widest uppercase opacity-40 group-hover/agent:opacity-70 transition-opacity">Lead Executive</p>
                 {variant === "expanded" && (
                   <p className="text-[10px] text-pplx-muted mt-1.5 leading-relaxed opacity-60">Supervises task decomposition and delegates to specialized sub-agents.</p>
                 )}
               </div>
            </div>
 
            {/* Sub Agents */}
            {space.subAgents && space.subAgents.map((agent, i) => {
               const isAgentActive = isGenerating && (i % 2 === Math.floor(Date.now() / 2000) % 2); 
               const isMentioned = isGenerating && activeThread?.messages[activeThread.messages.length - 1]?.content.includes(agent.name);
               const activeNow = isGenerating && (isMentioned || isAgentActive);
 
               return (
                 <div key={agent.id} className={`group/agent transition-all duration-700 flex items-center gap-5 relative`}>
                    <div className={`p-3 rounded-2xl transition-all duration-700 relative overflow-hidden flex items-center justify-center shadow-sm ${activeNow ? 'bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20' : 'bg-pplx-secondary/50 text-pplx-muted/50 group-hover/agent:text-cyan-500/60 group-hover/agent:bg-pplx-secondary/80'}`}>
                       {agent.role.toLowerCase().includes('code') || agent.role.toLowerCase().includes('dev') ? <Code size={22} strokeWidth={1.2} /> : 
                        agent.role.toLowerCase().includes('search') || agent.role.toLowerCase().includes('research') ? <Search size={22} strokeWidth={1.2} /> : 
                        <Activity size={22} strokeWidth={1.2} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <h4 className="font-bold text-pplx-text text-[16px] truncate font-serif tracking-tight">
                           {agent.name}
                        </h4>
                        {activeNow && <span className="block h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.5)]"></span>}
                      </div>
                      <p className="text-[11px] text-pplx-muted font-bold truncate tracking-widest uppercase opacity-40 group-hover/agent:opacity-70 transition-opacity">{agent.role}</p>
                      {variant === "expanded" && agent.profile && (
                        <p className="text-[10px] text-pplx-muted mt-1.5 leading-relaxed opacity-60 line-clamp-2 italic">{agent.profile}</p>
                      )}
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
