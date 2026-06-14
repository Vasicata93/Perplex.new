import React, { useState } from "react";
import { Space, SubAgentConfig } from "../../types";
import { Bot, Code, Search, Activity, MoreHorizontal, Minus, Plus, X, Save, ArrowLeft, ArrowRight, Trash2, Users, Monitor, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";
import { Office3DMode } from "./office3d/Office3DMode";
import { SidebarToggle } from "../SidebarToggle";

interface AgentOrgChartProps {
  space: Space;
  onManageTeam?: () => void;
  onUpdateSpace?: (space: Space) => void;
  onClose?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AgentOrgChart: React.FC<AgentOrgChartProps> = ({ 
  space, 
  onUpdateSpace, 
  onClose,
  onToggleSidebar,
  isSidebarOpen = false
}) => {
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
        {/* Unified Sticky Header - Styled exactly like ChatHeader to match in position, height, shape, and blur filter */}
        <div className="sticky top-0 z-40 flex items-center justify-between w-full px-4 pt-3 pb-3 md:px-6 md:pt-4 md:pb-4 bg-pplx-primary/80 backdrop-blur-md transition-all shrink-0">
          
          {/* Left: Navigation Actions (SidebarToggle & Back/Close) */}
          <div className="flex items-center gap-1.5 shrink-0 z-10">
            {onToggleSidebar && !isSidebarOpen && (
              <SidebarToggle
                onClick={onToggleSidebar}
                className="mr-1 hover:bg-transparent"
                size={20}
              />
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full transition-all duration-300 text-pplx-text bg-pplx-secondary/85 backdrop-blur-md md:bg-transparent border-transparent shadow-sm md:shadow-none hover:bg-pplx-hover flex items-center justify-center cursor-pointer"
                title="Back to Chat"
              >
                <ChevronLeft size={20} className="md:stroke-[2.2]" />
              </button>
            )}
          </div>

          {/* Center: Switcher Pill (Matching the exact capsule look, size, and centering of Chat's space title pill) */}
          <div className="flex-1 flex justify-center px-1 min-w-0 z-10 select-none">
            <div className="bg-[#121212]/90 backdrop-blur-md border border-white/5 shadow-md rounded-full p-0.5 flex items-center gap-1 max-w-full">
              <button 
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'chart' ? 'bg-[#e8dcc4] text-black shadow-inner font-extrabold scale-100' : 'text-white/60 hover:text-white'}`}
              >
                <Users size={12} strokeWidth={2.5} /> Chart
              </button>
              <button 
                onClick={() => setViewMode('office')}
                className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'office' ? 'bg-[#e8dcc4] text-black shadow-inner font-extrabold scale-100' : 'text-white/60 hover:text-white'}`}
              >
                <Monitor size={12} strokeWidth={2.5} /> 3D Office
              </button>
            </div>
          </div>

          {/* Right: Actions Segment (Add Agent or Spacers) */}
          <div className="flex items-center shrink-0 w-[42px] md:w-[120px] justify-end z-10">
            <>
              <button 
                onClick={handleAddAgent} 
                className="p-2 rounded-full transition-all duration-300 text-pplx-text bg-pplx-secondary/85 backdrop-blur-md border-transparent shadow-sm hover:bg-pplx-hover flex items-center justify-center cursor-pointer md:hidden"
                title="Add Agent"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={handleAddAgent} 
                className="px-3 py-1.5 rounded-full border border-pplx-border hover:bg-pplx-hover text-xs font-semibold tracking-wide items-center gap-1.5 transition-all hidden md:flex cursor-pointer bg-pplx-card/45"
                title="Add Agent"
              >
                <Plus size={14} /> Add Agent
              </button>
            </>
          </div>
        </div>

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
