import React, { useState } from "react";
import { Space, SubAgentConfig } from "../../types";
import { Bot, Code, Search, Activity, MoreHorizontal, Minus, Plus, X, Save, ArrowLeft, ArrowRight, Trash2, Users, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";
import { Office3DMode } from "./office3d/Office3DMode";

interface AgentOrgChartProps {
  space: Space;
  onManageTeam?: () => void;
  onUpdateSpace?: (space: Space) => void;
  onClose?: () => void;
}

export const AgentOrgChart: React.FC<AgentOrgChartProps> = ({ space, onUpdateSpace, onClose }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubAgentConfig>>({});
  const [orchestratorForm, setOrchestratorForm] = useState({
    role: space.orchestratorRole || "CEO • Lead Executive",
    profile: space.systemInstructions || ""
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'office'>('chart');

  if (!space.isTeamMode) return null;
  const agents = space.subAgents || [];

  const handleSelectAgent = (agent: SubAgentConfig) => {
    setSelectedAgentId(agent.id);
    setEditForm({ ...agent });
  };

  const handleSelectOrchestrator = () => {
    setSelectedAgentId("orchestrator");
    setOrchestratorForm({
      role: space.orchestratorRole || "CEO • Lead Executive",
      profile: space.systemInstructions || ""
    });
  };

  const handleClosePanel = () => {
    setSelectedAgentId(null);
    setEditForm({});
  };

  const handleAddAgent = () => {
    if (!onUpdateSpace) return;
    const newAgent: SubAgentConfig = {
      id: `agent-${Date.now()}`,
      name: "New Worker",
      role: "Specialized Task",
      profile: "Instructions for this worker...",
      modelId: "gemini-3.1-pro-preview"
    };
    onUpdateSpace({
      ...space,
      subAgents: [...agents, newAgent]
    });
    // Open edit panel for the newly created agent
    setSelectedAgentId(newAgent.id);
    setEditForm({ ...newAgent });
  };

  const handleSaveAgent = () => {
    if (!onUpdateSpace || !selectedAgentId) return;

    if (selectedAgentId === "orchestrator") {
      onUpdateSpace({
        ...space,
        orchestratorRole: orchestratorForm.role,
        systemInstructions: orchestratorForm.profile
      });
    } else {
      const updatedSubAgents = agents.map(a => 
        a.id === selectedAgentId ? { ...a, ...editForm } as SubAgentConfig : a
      );
      onUpdateSpace({
        ...space,
        subAgents: updatedSubAgents
      });
    }
    handleClosePanel();
  };

  const handleMoveAgent = (direction: 'left' | 'right') => {
    if (!onUpdateSpace || !selectedAgentId || selectedAgentId === "orchestrator") return;
    
    const idx = agents.findIndex(a => a.id === selectedAgentId);
    if (idx < 0) return;
    
    const newAgents = [...agents];
    if (direction === 'left' && idx > 0) {
      [newAgents[idx - 1], newAgents[idx]] = [newAgents[idx], newAgents[idx - 1]];
    } else if (direction === 'right' && idx < newAgents.length - 1) {
      [newAgents[idx], newAgents[idx + 1]] = [newAgents[idx + 1], newAgents[idx]];
    }
    
    onUpdateSpace({
      ...space,
      subAgents: newAgents
    });
  };

  const handleDeleteAgent = () => {
    setIsDeleting(true);
  };

  const executeDeleteAgent = () => {
    if (!onUpdateSpace || !selectedAgentId || selectedAgentId === "orchestrator") return;

    onUpdateSpace({
      ...space,
      subAgents: agents.filter(a => a.id !== selectedAgentId)
    });
    handleClosePanel();
    setIsDeleting(false);
  };

  return (
    <div className="w-full h-full flex bg-transparent overflow-hidden text-pplx-text">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        {viewMode === 'chart' ? (
          <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-transparent">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-pplx-text opacity-90">Org Chart</h1>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 {agents.length} Agents Live
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-pplx-card border border-pplx-border rounded-lg p-0.5">
                <button 
                  onClick={() => setViewMode('chart')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide flex items-center gap-2 transition-all bg-pplx-hover text-emerald-400`}
                >
                  <Users size={14} /> Chart
                </button>
                <button 
                  onClick={() => setViewMode('office')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide flex items-center gap-2 transition-all text-pplx-muted hover:text-pplx-text`}
                >
                  <Monitor size={14} /> 3D Office
                </button>
              </div>
              <button onClick={handleAddAgent} className="px-3 py-1.5 rounded-lg border border-pplx-border hover:bg-pplx-hover transition-colors text-xs font-semibold tracking-wide flex items-center gap-2">
                <Plus size={14} /> Add Agent
              </button>
              {onClose && (
                <button onClick={onClose} className="p-1.5 rounded-md hover:bg-pplx-hover text-pplx-muted hover:text-pplx-text transition-colors">
                   <span className="sr-only">Close</span>
                   <X size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Office Mode Floating Controls */
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between pointer-events-none px-6">
            <div className="flex-1" />
            <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-xl pointer-events-auto">
              <button 
                onClick={() => setViewMode('chart')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wider flex items-center gap-2 transition-all text-white/60 hover:text-white`}
              >
                <Users size={14} /> Org Chart
              </button>
              <button 
                onClick={() => setViewMode('office')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wider flex items-center gap-2 transition-all bg-white/15 text-emerald-400 shadow-inner`}
              >
                <Monitor size={14} /> 3D Office
              </button>
            </div>
            <div className="flex-1 flex justify-end pointer-events-auto">
              {onClose && (
                <button onClick={onClose} className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all shadow-xl">
                   <span className="sr-only">Close</span>
                   <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className={`flex-1 relative overflow-hidden flex items-center justify-center p-0 ${viewMode === 'office' ? 'absolute inset-0 z-0' : 'min-h-[600px]'}`}>
          
          {viewMode === 'office' ? (
            <Office3DMode space={space} onBack={() => setViewMode('chart')} />
          ) : (
            <div className="w-full h-full overflow-auto custom-scrollbar p-8 relative flex items-center justify-center">
              {/* Floating Controls (Top Right of canvas) */}
              <div className="absolute top-6 right-6 flex flex-col items-center bg-pplx-card border border-pplx-border rounded-xl overflow-hidden shadow-sm z-10 hidden md:flex">
                 <button className="p-3 hover:bg-pplx-hover transition-colors text-pplx-muted hover:text-pplx-text border-b border-pplx-border"><Plus size={16} /></button>
                 <button className="p-3 hover:bg-pplx-hover transition-colors text-pplx-muted hover:text-pplx-text border-b border-pplx-border"><Minus size={16} /></button>
                 <button className="p-3 hover:bg-pplx-hover transition-colors text-pplx-muted hover:text-pplx-text text-xs font-bold tracking-wider">Fit</button>
              </div>

              {/* The Org Chart Nodes */}
              <div className="flex flex-col items-center gap-8 md:gap-16 w-max mx-auto py-10 scale-[0.85] md:scale-100 origin-top">
                
                {/* Level 1: CEO / Orchestrator */}
                <div className="relative flex flex-col items-center">
                  <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     onClick={handleSelectOrchestrator}
                     className={`w-64 bg-pplx-card shadow-sm rounded-2xl p-4 flex items-center gap-4 relative z-10 transition-all cursor-pointer group ${selectedAgentId === "orchestrator" ? 'border-2 border-emerald-500/50 scale-105' : 'border border-pplx-border hover:border-pplx-accent/50'}`}
                  >
                     <div className="w-10 h-10 rounded-xl bg-pplx-secondary flex items-center justify-center shadow-inner relative border border-pplx-border/50">
                        <Bot size={20} className="text-pplx-text opacity-80" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-pplx-card bg-amber-500 shadow-sm"></span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <h2 className="text-sm font-bold text-pplx-text tracking-wide truncate">Orchestrator</h2>
                       <p className="text-[11px] text-pplx-muted font-medium truncate">{space.orchestratorRole || 'CEO • Lead Executive'}</p>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); handleSelectOrchestrator(); }} className={`p-1 rounded hover:bg-pplx-hover absolute top-3 right-3 transition-opacity ${selectedAgentId === "orchestrator" ? 'opacity-100 text-pplx-text' : 'opacity-0 group-hover:opacity-100 text-pplx-muted'}`}>
                       <MoreHorizontal size={14}/>
                     </button>
                  </motion.div>
                  
                  {/* Vertical Line down from CEO */}
                  {agents.length > 0 && (
                    <div className="w-px h-8 md:h-16 bg-pplx-border"></div>
                  )}
                </div>

                {/* Level 2: Sub-Agents Container */}
                {agents.length > 0 && (
                  <div className="relative flex justify-center gap-6 md:gap-12 w-max">
                     {/* Horizontal Top Connection Line */}
                     {agents.length > 1 && (
                       <div 
                         className="absolute top-0 h-px bg-pplx-border" 
                         style={{ 
                           left: `calc(50% / ${agents.length} + 1.5rem)`, 
                           right: `calc(50% / ${agents.length} + 1.5rem)`
                         }}
                       />
                     )}
                     
                     {agents.map((agent, idx) => {
                       const isCode = agent.role.toLowerCase().includes('code') || agent.role.toLowerCase().includes('dev');
                       const isSearch = agent.role.toLowerCase().includes('search') || agent.role.toLowerCase().includes('research');
                       const Icon = isCode ? Code : isSearch ? Search : Activity;
                       
                       const colorClass = isCode ? 'bg-cyan-500' : isSearch ? 'bg-emerald-500' : 'bg-purple-500';
                       const isSelected = selectedAgentId === agent.id;

                       return (
                         <div key={agent.id} className="relative flex flex-col items-center">
                           {/* Vertical connection to horizontal line */}
                           <div className="w-px h-8 bg-pplx-border absolute -top-8"></div>
                           
                           <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 * (idx + 1) }}
                              onClick={() => handleSelectAgent(agent)}
                              className={`w-64 bg-pplx-card shadow-sm rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer group ${isSelected ? 'border-2 border-emerald-500/50 scale-105' : 'border border-pplx-border hover:border-pplx-accent/50'}`}
                           >
                              <div className="w-10 h-10 rounded-xl bg-pplx-secondary border border-pplx-border/50 flex items-center justify-center relative shadow-inner">
                                 <Icon size={18} className="text-pplx-text opacity-70" />
                                 <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-pplx-card shadow-sm ${colorClass}`}></span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-pplx-text tracking-wide truncate">{agent.name}</h2>
                                <p className="text-[11px] text-pplx-muted font-medium truncate">{agent.role}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleSelectAgent(agent); }} className={`p-1 rounded hover:bg-pplx-hover transition-opacity ${isSelected ? 'opacity-100 text-pplx-text' : 'opacity-0 group-hover:opacity-100 text-pplx-muted'}`}>
                                <MoreHorizontal size={14}/>
                              </button>
                           </motion.div>
                         </div>
                       );
                     })}
                  </div>
                )}
                
                {agents.length === 0 && (
                   <div className="mt-8 text-center px-4">
                     <p className="text-sm font-medium text-pplx-muted">No agents assigned yet.</p>
                     <button onClick={handleAddAgent} className="mt-4 px-4 py-2 rounded-lg bg-pplx-secondary hover:bg-pplx-hover border border-pplx-border transition-colors text-xs font-semibold">
                       Add your first agent
                     </button>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side Edit Panel */}
      <AnimatePresence>
        {selectedAgentId && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="border-l border-pplx-border bg-pplx-card flex flex-col shrink-0 overflow-hidden shadow-2xl"
          >
            <div className="w-[380px] h-full flex flex-col">
              {/* Panel Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-pplx-border bg-pplx-primary">
                 <h2 className="text-sm font-bold tracking-[0.1em] uppercase text-pplx-text opacity-90">
                   {selectedAgentId === "orchestrator" ? "Edit Orchestrator" : "Edit Sub-Agent"}
                 </h2>
                 <button onClick={handleClosePanel} className="p-1.5 rounded-md hover:bg-pplx-hover text-pplx-muted hover:text-pplx-text transition-colors">
                    <X size={16} />
                 </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
                {selectedAgentId !== "orchestrator" && (
                  /* Organize / Move Segment */
                  <div className="flex items-center justify-between bg-pplx-primary p-3 rounded-xl border border-pplx-border">
                     <div className="flex flex-col">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-pplx-muted mb-1">Organize</span>
                       <span className="text-xs text-pplx-text opacity-80">Change order in the Org Chart</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <button onClick={() => handleMoveAgent('left')} title="Move Left" className="p-1.5 rounded-lg hover:bg-pplx-hover transition-colors text-pplx-muted hover:text-pplx-text border border-transparent hover:border-pplx-border"><ArrowLeft size={14} /></button>
                       <button onClick={() => handleMoveAgent('right')} title="Move Right" className="p-1.5 rounded-lg hover:bg-pplx-hover transition-colors text-pplx-muted hover:text-pplx-text border border-transparent hover:border-pplx-border"><ArrowRight size={14} /></button>
                     </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="flex flex-col gap-4">
                   {selectedAgentId !== "orchestrator" && (
                     <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-bold uppercase tracking-wider text-pplx-muted ml-1">Agent Name</label>
                       <input 
                         type="text" 
                         value={editForm.name || ""} 
                         onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                         className="w-full bg-pplx-primary border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-pplx-muted"
                         placeholder="e.g., CodeBot, ResearchBot"
                       />
                     </div>
                   )}
                   
                   <div className="flex flex-col gap-2">
                     <label className="text-[11px] font-bold uppercase tracking-wider text-pplx-muted ml-1">
                       {selectedAgentId === "orchestrator" ? "Orchestrator Role" : "Agent Role"}
                     </label>
                     <input 
                       type="text" 
                       value={selectedAgentId === "orchestrator" ? orchestratorForm.role : (editForm.role || "")} 
                       onChange={(e) => selectedAgentId === "orchestrator" 
                         ? setOrchestratorForm({ ...orchestratorForm, role: e.target.value }) 
                         : setEditForm({ ...editForm, role: e.target.value })}
                       className="w-full bg-pplx-primary border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-pplx-muted"
                       placeholder={selectedAgentId === "orchestrator" ? "e.g., CEO, Tech Lead" : "e.g., Software Engineer, Data Analyst"}
                     />
                   </div>

                   <div className="flex flex-col gap-2">
                     <label className="text-[11px] font-bold uppercase tracking-wider text-pplx-muted ml-1">
                       Profile & Instructions
                     </label>
                     <textarea 
                       value={selectedAgentId === "orchestrator" ? orchestratorForm.profile : (editForm.profile || "")} 
                       onChange={(e) => selectedAgentId === "orchestrator" 
                         ? setOrchestratorForm({ ...orchestratorForm, profile: e.target.value }) 
                         : setEditForm({ ...editForm, profile: e.target.value })}
                       className="w-full bg-pplx-primary border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-pplx-muted min-h-[160px] custom-scrollbar resize-y"
                       placeholder={selectedAgentId === "orchestrator" ? "Overall strategy and space instructions..." : "Detailed instructions for this agent's behavior and personality..."}
                     />
                     {selectedAgentId !== "orchestrator" && (
                       <p className="text-[10px] text-pplx-muted leading-relaxed max-w-[95%] mt-1 ml-1 opacity-80">
                         The orchestrator will simulate this agent using the profile defined above when its expertise is required.
                       </p>
                     )}
                   </div>
                </div>

                {selectedAgentId !== "orchestrator" && (
                  <div className="mt-8">
                    <button onClick={handleDeleteAgent} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[13px] font-semibold px-2 py-1 transition-colors hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={14} /> Remove Agent
                    </button>
                  </div>
                )}
              </div>

              {/* Panel Footer */}
              <div className="p-6 border-t border-pplx-border bg-pplx-primary">
                <button 
                  onClick={handleSaveAgent}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl py-3 transition-colors shadow-sm"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isDeleting && (
        <ConfirmDeleteModal
          title="Remove Agent"
          description="Are you sure you want to remove this agent from your team? This cannot be undone."
          onCancel={() => setIsDeleting(false)}
          onConfirm={executeDeleteAgent}
        />
      )}
    </div>
  );
};
