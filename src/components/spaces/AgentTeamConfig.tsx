import React from "react";
import { Plus, Trash2, Bot, Shield, Zap, Search, Code, Cpu, MessageSquare, ListChecks, ArrowRight, UserCircle, Users } from "lucide-react";
import { Space, AppSettings, SubAgentConfig } from "../../types";

interface AgentTeamConfigProps {
  editingSpace: Partial<Space>;
  setEditingSpace: (space: any) => void;
  settings: AppSettings;
}

const SPECIALTIES = [
  { id: "research", name: "Research", icon: <Search size={14} />, color: "text-blue-400" },
  { id: "coding", name: "Coding", icon: <Code size={14} />, color: "text-emerald-400" },
  { id: "writing", name: "Writing", icon: <MessageSquare size={14} />, color: "text-amber-400" },
  { id: "technical", name: "Technical", icon: <Cpu size={14} />, color: "text-purple-400" },
  { id: "planning", name: "Planning", icon: <ListChecks size={14} />, color: "text-rose-400" },
];

export const AgentTeamConfig: React.FC<AgentTeamConfigProps> = ({
  editingSpace,
  setEditingSpace,
  settings,
}) => {
  const toggleTeamMode = () => {
    const newTeamMode = !editingSpace.isTeamMode;
    const defaultSubAgents: SubAgentConfig[] = [
      {
        id: Math.random().toString(36).substring(2, 9),
        name: "Researcher",
        role: "Expert Researcher",
        profile: "Deep-dive into technical topics and current events. Provide comprehensive summaries.",
        modelId: "auto",
      },
      {
        id: Math.random().toString(36).substring(2, 9),
        name: "Specialist",
        role: "Subject Matter Expert",
        profile: "Detail-oriented execution based on the researcher's findings.",
        modelId: "auto",
      },
    ];

    setEditingSpace({
      ...editingSpace,
      isTeamMode: newTeamMode,
      subAgents: newTeamMode 
        ? (editingSpace.subAgents?.length ? editingSpace.subAgents : defaultSubAgents) 
        : undefined,
    });
  };

  const addAgent = () => {
    const newAgent: SubAgentConfig = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      role: "",
      profile: "",
      modelId: "auto",
    };
    setEditingSpace({
      ...editingSpace,
      subAgents: [...(editingSpace.subAgents || []), newAgent],
    });
  };

  const updateAgent = (idx: number, updates: Partial<SubAgentConfig>) => {
    const updatedAgents = [...(editingSpace.subAgents || [])];
    updatedAgents[idx] = { ...updatedAgents[idx], ...updates };
    setEditingSpace({ ...editingSpace, subAgents: updatedAgents });
  };

  const removeAgent = (idx: number) => {
    setEditingSpace({
      ...editingSpace,
      subAgents: editingSpace.subAgents?.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Toggle Header */}
      <div 
        className={`p-6 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
          editingSpace.isTeamMode 
            ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]" 
            : "border-pplx-border bg-pplx-secondary/20 hover:border-pplx-accent/30"
        }`}
      >
        {/* Animated background element */}
        {editingSpace.isTeamMode && (
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        )}

        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
              editingSpace.isTeamMode 
                ? "bg-cyan-500 text-black scale-110 rotate-3" 
                : "bg-pplx-secondary text-pplx-muted grayscale opacity-50"
            }`}>
              <Bot size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold tracking-tight mb-2 transition-colors ${editingSpace.isTeamMode ? "text-cyan-400" : "text-pplx-text"}`}>
                Professional Agent Team
              </h3>
              <p className="text-sm text-pplx-muted leading-relaxed max-w-lg">
                Orchestrate multiple specialized LLMs to work concurrently. The Leader decomposes tasks and delegates to specialized Workers for superior results.
              </p>
            </div>
          </div>
          
          <button 
            onClick={toggleTeamMode}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${
              editingSpace.isTeamMode ? "bg-cyan-500" : "bg-pplx-border"
            }`}
          >
            <span className="sr-only">Toggle Team Mode</span>
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                editingSpace.isTeamMode ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {editingSpace.isTeamMode && (
          <div className="mt-8 flex items-center gap-4 py-3 px-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
             <Shield size={16} className="text-cyan-400 animate-pulse" />
             <span className="text-xs font-semibold text-cyan-200 uppercase tracking-widest">Team Mode Active: High-precision orchestration enabled</span>
          </div>
        )}
      </div>

      {editingSpace.isTeamMode && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Team Vision & Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 rounded-3xl bg-pplx-secondary/10 border border-pplx-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-cyan-400" />
                <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest">Team Mission Statement</h4>
              </div>
              <textarea
                className="w-full h-24 bg-pplx-input border border-pplx-border rounded-2xl px-4 py-3 text-sm text-pplx-text focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-pplx-muted/30"
                placeholder="Define the core objective of this agent fleet. This guides high-level reasoning across all members."
                value={editingSpace.description || ""}
                onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })}
              />
            </div>
            
            <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-cyan-400" />
                <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest">Synergy Protocol</h4>
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-left transition-all hover:bg-cyan-500/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-cyan-400">Hierarchical</span>
                    <span className="text-[10px] text-pplx-muted">Leader delegates to workers</span>
                  </div>
                  <ArrowRight size={14} className="text-cyan-400" />
                </button>
                <div className="p-3 rounded-xl border border-pplx-border bg-pplx-secondary/20 opacity-50 cursor-not-allowed">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-pplx-muted">Swarm Intelligence</span>
                    <span className="text-[10px] text-pplx-muted">Peer-to-peer collaboration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Visualization */}
          <div className="flex items-center justify-center gap-4 py-8 px-4 rounded-3xl bg-pplx-secondary/10 border border-pplx-border/50">
             <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                   <Bot size={20} />
                </div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">Leader</span>
             </div>
             <ArrowRight size={20} className="text-pplx-muted animate-pulse" />
             <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2 opacity-60">
                    <div className="w-10 h-10 rounded-lg border border-pplx-border bg-pplx-primary flex items-center justify-center text-pplx-muted">
                       <UserCircle size={18} />
                    </div>
                  </div>
                ))}
             </div>
             <ArrowRight size={20} className="text-pplx-muted animate-pulse" />
             <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                   <Zap size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Result</span>
             </div>
          </div>

          {/* Leader Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
               <Bot size={18} className="text-cyan-400" />
               <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest">Team Leader (Orchestrator)</h4>
            </div>
            
            <div className="p-6 rounded-3xl border border-pplx-border bg-pplx-primary shadow-sm hover:border-cyan-500/30 transition-all group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-2 ml-1">Brain (Model)</label>
                      <select
                        className="w-full bg-pplx-input border border-pplx-border rounded-2xl px-4 py-3 text-sm text-pplx-text outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                        value={editingSpace.modelId || "auto"}
                        onChange={(e) => setEditingSpace({ ...editingSpace, modelId: e.target.value })}
                      >
                        <option value="auto">System Default (Intelligent Routing)</option>
                        <optgroup label="Cloud Intelligence">
                          <option value="gemini-pro">Google Gemini Pro 1.5</option>
                          <option value="openai">GPT-4o (OpenAI)</option>
                        </optgroup>
                        <optgroup label="Local Hardware">
                          {settings.localModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </optgroup>
                      </select>
                    </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-2 ml-1">Orchestration Protocols (Instructions)</label>
                   <textarea
                    className="w-full h-32 bg-pplx-input border border-pplx-border rounded-2xl px-4 py-4 text-sm text-pplx-text focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-pplx-muted/30"
                    placeholder="Define how the leader should delegate tasks, review worker output, and synthesize the final result."
                    value={editingSpace.systemInstructions}
                    onChange={(e) => setEditingSpace({ ...editingSpace, systemInstructions: e.target.value })}
                  />
                </div>
            </div>
          </section>

          {/* Workers Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest">Specialized Workers ({editingSpace.subAgents?.length || 0})</h4>
               </div>
               <button
                onClick={addAgent}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-pplx-accent transition-all text-xs font-bold shadow-[0_5px_15px_rgba(255,255,255,0.15)] active:scale-95"
              >
                <Plus size={14} /> Recruitment
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {editingSpace.subAgents?.map((agent, idx) => (
                <div 
                  key={agent.id} 
                  className="relative p-6 rounded-3xl border border-pplx-border bg-pplx-primary/50 hover:bg-pplx-primary transition-all duration-300 hover:shadow-xl hover:border-cyan-500/20 group"
                >
                  <button 
                    onClick={() => removeAgent(idx)}
                    className="absolute top-4 right-4 p-2 text-pplx-muted hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* Identity Column */}
                     <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-pplx-secondary flex items-center justify-center text-cyan-400 border border-pplx-border group-hover:border-cyan-500/30 transition-all">
                              {agent.name ? <span className="text-xl font-black">{agent.name.charAt(0).toUpperCase()}</span> : <Bot size={24} />}
                           </div>
                           <div className="flex-1 space-y-1">
                              <input
                                className="w-full bg-transparent text-lg font-bold text-pplx-text outline-none placeholder:text-pplx-muted/20"
                                placeholder="Agent Alias"
                                value={agent.name}
                                onChange={(e) => updateAgent(idx, { name: e.target.value })}
                              />
                              <input
                                className="w-full bg-transparent text-xs text-cyan-500 font-bold uppercase tracking-tight outline-none placeholder:text-cyan-500/20"
                                placeholder="Designated Role"
                                value={agent.role}
                                onChange={(e) => updateAgent(idx, { role: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-pplx-muted uppercase ml-1">Worker Model</label>
                              <select
                                className="w-full bg-pplx-input border border-pplx-border rounded-xl px-3 py-2 text-xs text-pplx-text outline-none focus:border-cyan-500 appearance-none"
                                value={agent.modelId || "auto"}
                                onChange={(e) => updateAgent(idx, { modelId: e.target.value })}
                              >
                                <option value="auto">System Optimized</option>
                                <option value="gemini-pro">Gemini Pro</option>
                                <option value="openai">GPT-4o</option>
                                {settings.localModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-pplx-muted uppercase ml-1">Specialties</label>
                              <div className="flex flex-wrap gap-2">
                                 {SPECIALTIES.map(s => (
                                   <button 
                                     key={s.id}
                                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                       agent.role.toLowerCase().includes(s.id) 
                                         ? `${s.color} border-current bg-current/10` 
                                         : "border-pplx-border text-pplx-muted hover:border-pplx-accent/30"
                                     }`}
                                     onClick={() => {
                                        // Simple heuristic: append to role if not there
                                        if (!agent.role.toLowerCase().includes(s.id)) {
                                           updateAgent(idx, { role: (agent.role + (agent.role ? " " : "") + s.name).trim() });
                                        }
                                     }}
                                   >
                                      {s.icon} {s.name}
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Profile Column */}
                     <div className="lg:col-span-8 space-y-2">
                        <label className="text-[10px] font-bold text-pplx-muted uppercase ml-1 flex items-center gap-2">
                           <Shield size={12} className="text-cyan-400" />
                           Operational Directives (Profile)
                        </label>
                        <textarea
                          className="w-full h-full min-h-[160px] bg-pplx-input border border-pplx-border rounded-3xl p-5 text-sm text-pplx-text focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-pplx-muted/20 leading-relaxed"
                          placeholder="What are this agent's specific instructions, tone, and constraints?"
                          value={agent.profile}
                          onChange={(e) => updateAgent(idx, { profile: e.target.value })}
                        />
                     </div>
                  </div>
                </div>
              ))}

              {(!editingSpace.subAgents || editingSpace.subAgents.length === 0) && (
                <div className="text-center py-16 bg-pplx-secondary/10 rounded-[2.5rem] border-2 border-dashed border-pplx-border/50 group hover:border-cyan-500/30 transition-all">
                  <div className="w-20 h-20 mx-auto bg-pplx-primary rounded-3xl flex items-center justify-center text-pplx-muted mb-4 shadow-xl border border-pplx-border group-hover:scale-110 transition-transform">
                     <Users size={32} />
                  </div>
                  <h5 className="text-lg font-bold text-pplx-text mb-2">No Active Workers</h5>
                  <p className="text-sm text-pplx-muted max-w-sm mx-auto leading-relaxed">
                    Deploy specialized agents to handle autonomous tasks. A team performs 4x better on complex multi-step workflows.
                  </p>
                  <button 
                    onClick={addAgent}
                    className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Recruit First Agent
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Quick Tips */}
          <div className="p-6 rounded-3xl bg-pplx-accent/5 border border-pplx-accent/20 flex gap-4 items-start">
             <Zap size={20} className="text-pplx-accent shrink-0 mt-1" />
             <div className="space-y-1">
                <h5 className="text-sm font-bold text-pplx-accent">Pro Strategy</h5>
                <p className="text-xs text-pplx-muted leading-relaxed">
                  Assign clear, non-overlapping roles. For best results, use GPT-4o or Gemini 1.5 Pro for the Leader role, and faster models (Gemma, Llama) for specific Worker tasks.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
