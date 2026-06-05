import React, { useState, useEffect } from "react";
import { Brain, Zap, Database, Activity, Play, Square, RotateCcw, Plug, Cpu, AlertTriangle, Clock, Server, ShieldCheck, CheckCircle, RefreshCw, Terminal, Bot } from "lucide-react";
import { globalTracker } from "../services/agent/AgentEngine";
import { Trajectory } from "../types/hermes";
import { AppSettings } from "../types";

interface DashboardViewProps {
  onClose?: () => void;
  settings?: AppSettings;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onClose, settings, onUpdateSettings }) => {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{ status: string, latency: string, memory: string, errors: number, cpu: string, network: string, uptime: string } | null>(null);
  const [showMoreExtensions, setShowMoreExtensions] = useState(false);

  useEffect(() => {
    // Initial fetch
    setTrajectory(globalTracker.getFullTrajectory());

    // Pull updates periodically
    const interval = setInterval(() => {
      setTrajectory(globalTracker.getFullTrajectory());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const activeStep = trajectory?.steps.length ? trajectory.steps[trajectory.steps.length - 1] : null;
  const isAgentActive = activeStep?.duration === 0 || false; // Approximation if it hasn't finished
  const now = Date.now();
  
  // Aggregate agent nodes
  const agentNodes = trajectory?.steps.length ? Array.from(
    trajectory.steps
      .slice(-50)
      .reduce((acc, step) => {
         const subAgentCalls = step.toolCalls.filter(tc => tc.toolName.startsWith('sub_agent_'));
         const agentsInThisStep = subAgentCalls.length > 0 
           ? Array.from(new Set(subAgentCalls.map(tc => tc.toolName.replace('sub_agent_', ''))))
           : ['Core Router'];

         const tokensPerAgent = Math.floor((step.tokensUsed || 0) / agentsInThisStep.length);
         const llMsPerAgent = Math.floor((step.llmCalls || 0) / agentsInThisStep.length);

         agentsInThisStep.forEach(agentName => {
            if (!acc.has(agentName)) {
               acc.set(agentName, { name: agentName, calls: 0, lastRun: 0, success: 0, fail: 0, logs: [], tokens: 0, llmCalls: 0 });
            }
            const node = acc.get(agentName)!;
            node.tokens += tokensPerAgent;
            node.llmCalls += llMsPerAgent;
         });

         step.toolCalls.forEach(tc => {
            const agentName = tc.toolName.startsWith('sub_agent_') ? tc.toolName.replace('sub_agent_', '') : 'Core Router';
            if (!acc.has(agentName)) {
               acc.set(agentName, { name: agentName, calls: 0, lastRun: 0, success: 0, fail: 0, logs: [], tokens: 0, llmCalls: 0 });
            }
            const node = acc.get(agentName)!;
            node.calls++;
            if (tc.success) node.success++;
            else node.fail++;
            node.lastRun = Math.max(node.lastRun, step.timestamp);
            
            let actionDetails = tc.toolName;
            let resultData = tc.result?.summary;
            
            if (tc.toolName.startsWith('sub_agent_')) {
               actionDetails = `Task: ${tc.args.task || 'Assigned sub-task'}`;
            } else if (tc.toolName === 'execute_code') {
               actionDetails = `Executed code in sandbox.`;
            } else {
               actionDetails = `Used ${tc.toolName}`;
            }

            if (!resultData && tc.result?.data) {
               resultData = JSON.stringify(tc.result.data).substring(0, 150) + '...';
            }

            node.logs.push({
               time: step.timestamp,
               action: actionDetails,
               status: tc.success ? 'OK' : 'FAIL',
               intent: step.intent,
               resultData: resultData || "Completed.",
               duration: tc.duration || 0
            });
         });
         return acc;
      }, new Map<string, any>())
      .values()
  ).sort((a, b: any) => (b as any).lastRun - (a as any).lastRun) : [];

  if (agentNodes.length === 0) {
    agentNodes.push({ name: "Core Router", calls: 0, lastRun: now, success: 0, fail: 0, logs: [], tokens: 0, llmCalls: 0, status: 'idle' });
  }

  const defaultSelectedAgent = selectedAgent || (agentNodes[0] as any)?.name;
  const currentAgentData = agentNodes.find((n: any) => n.name === defaultSelectedAgent) || agentNodes[0] as any;

  const runDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnosticResult(null);
    setTimeout(() => {
        setIsDiagnosing(false);
        const errs = agentNodes.reduce((acc: number, n: any) => acc + n.fail, 0);
        setDiagnosticResult({
            status: errs > 0 ? 'Warning' : 'Healthy',
            latency: Math.floor(Math.random() * 20 + 30) + 'ms',
            memory: Math.floor(Math.random() * 50 + 100) + 'MB',
            errors: errs,
            cpu: Math.floor(Math.random() * 30 + 5) + '%',
            network: Math.floor(Math.random() * 100 + 10) + ' Kbps',
            uptime: '99.9%'
        });
    }, 1500);
  };

  // More detailed overall KPIs
  const totalSteps = trajectory?.steps.length || 0;
  const totalTokens = trajectory?.totalTokens || 0;
  const totalLlmCalls = trajectory?.totalLlmCalls || 0;
  const totalCorrections = trajectory?.steps.reduce((acc, step) => acc + (step.corrections || 0), 0) || 0;
  
  const successfulSteps = trajectory?.steps.filter(s => s.outcome === 'success').length || 0;
  const successRate = totalSteps > 0 ? Math.round((successfulSteps / totalSteps) * 100) : 100;
  
  const startTime = trajectory?.startTime || now;
  const lastTime = trajectory?.steps.length ? trajectory.steps[trajectory.steps.length - 1].timestamp : now;
  const activeDurationMins = Math.max(0, Math.round((lastTime - startTime) / 60000));
  const avgTokensPerTask = totalSteps > 0 ? Math.round(totalTokens / totalSteps) : 0;

  // Mocked active extensions based on settings
  const baseExtensions = [
    { id: 'ctx', name: 'Context Engine', emoji: '🧠', enabled: settings?.enableContextProvider !== false },
    { id: 'core', name: 'Core OS Tools', emoji: '💻', enabled: settings?.enableCoreTools !== false },
    { id: 'skills', name: 'Custom Skills', emoji: '⚡', enabled: settings?.enableCustomSkills !== false },
    { id: 'conn', name: 'Connectors', emoji: '🔌', enabled: settings?.enableConnectors !== false },
  ];

  const extendedExtensions = [
    ...baseExtensions,
    { id: 'web', name: 'Web Search', emoji: '🌐', enabled: true },
    { id: 'db', name: 'Vector DB', emoji: '🗄️', enabled: true },
    { id: 'sec', name: 'Security Audit', emoji: '🛡️', enabled: false },
    { id: 'sync', name: 'Cloud Sync', emoji: '☁️', enabled: true },
  ];

  const extensions = showMoreExtensions ? extendedExtensions : baseExtensions;

  return (
    <div className="flex flex-col h-full w-full bg-pplx-primary text-pplx-text font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-4 md:py-8">
        
        {/* Header - now scrolls with content and fits mobile */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-pplx-border gap-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-pplx-secondary border border-pplx-border rounded-lg shadow-sm">
               <Server size={18} className="text-pplx-text" />
             </div>
             <div>
               <h1 className="text-sm font-bold tracking-widest uppercase text-pplx-text">System Dashboard</h1>
               <p className="text-[10px] md:text-xs text-pplx-muted font-mono mt-0.5 opacity-80">workspace/agent-telemetry</p>
             </div>
             <span className={`w-2 h-2 rounded-full ml-2 md:ml-4 shadow-sm ${isAgentActive ? 'bg-emerald-500 animate-pulse outline outline-emerald-500/20' : 'bg-gray-400'}`} title={isAgentActive ? 'Active' : 'Standby'}></span>
          </div>
          <div className="flex items-center w-full md:w-auto">
             {onClose && (
               <button onClick={onClose} className="w-full md:w-auto flex items-center justify-center text-xs font-bold uppercase tracking-wider text-pplx-muted hover:text-pplx-text transition-colors px-4 py-2 rounded-lg hover:bg-pplx-hover border border-transparent hover:border-pplx-border">
                 Close
               </button>
             )}
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto flex flex-col-reverse xl:flex-row-reverse gap-6 md:gap-8">
           
           {/* Right Sidebar (previously Left Sidebar) */}
           <div className="w-full xl:w-64 flex flex-col gap-8 shrink-0">
              {/* Agent Nodes (Channels) */}
              <div>
                 <h3 className="text-[10px] font-bold text-pplx-muted uppercase tracking-[0.2em] mb-4 pl-2 border-l-2 border-pplx-accent/50">Active Nodes</h3>
                 <div className="space-y-1">
                    {agentNodes.map((node: any) => {
                       const isSelected = defaultSelectedAgent === node.name;
                       const recentlyActive = now - node.lastRun < 10000;
                       
                       return (
                         <button 
                           key={node.name}
                           onClick={() => setSelectedAgent(node.name)}
                           className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border ${isSelected ? 'bg-pplx-card border-pplx-border shadow-sm text-pplx-accent' : 'border-transparent hover:bg-pplx-hover text-pplx-text/70'}`}
                         >
                            <div className="flex items-center gap-3">
                               <span className="text-pplx-muted">
                                  {node.name === 'Core Router' ? <Brain size={16} /> : <Bot size={16} />}
                               </span>
                               <span className="text-sm font-medium tracking-wide">{node.name}</span>
                            </div>
                            {recentlyActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                         </button>
                       )
                    })}
                 </div>
              </div>

              {/* Extensions */}
              <div>
                 <h3 className="text-[10px] font-bold text-pplx-muted uppercase tracking-[0.2em] mb-4 pl-2 border-l-2 border-purple-500/50">Extensions</h3>
                 <div className="space-y-2">
                    {extensions.map(ext => (
                       <div key={ext.id} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-pplx-secondary border border-pplx-border">
                          <div className="flex items-center gap-3 opacity-90 text-pplx-muted">
                             <Plug size={14} />
                             <span className="text-xs font-medium text-pplx-text">{ext.name}</span>
                          </div>
                          <button 
                             onClick={() => {
                                if (ext.id === 'ctx') onUpdateSettings?.({ enableContextProvider: !ext.enabled });
                                if (ext.id === 'core') onUpdateSettings?.({ enableCoreTools: !ext.enabled });
                                if (ext.id === 'skills') onUpdateSettings?.({ enableCustomSkills: !ext.enabled });
                                if (ext.id === 'conn') onUpdateSettings?.({ enableConnectors: !ext.enabled });
                             }}
                             className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm transition-colors ${ext.enabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-pplx-muted bg-pplx-card'}`}
                          >
                             {ext.enabled ? 'ON' : 'OFF'}
                          </button>
                       </div>
                    ))}
                    <button 
                       onClick={() => setShowMoreExtensions(!showMoreExtensions)}
                       className="w-full mt-2 flex items-center justify-center gap-2 text-xs text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover py-2.5 rounded-xl transition-colors border border-dashed border-pplx-border font-medium"
                    >
                       {showMoreExtensions ? "Show Less" : "More / Advanced"}
                    </button>
                 </div>
              </div>
           </div>

           {/* Main Area */}
           <div className="flex-1 flex flex-col gap-8 min-w-0">

              {/* Quick Diagnosis / KPI Banner */}
              <div className="flex flex-wrap gap-4 items-stretch bg-pplx-card border border-pplx-border p-3 rounded-2xl shadow-sm">
                  
                  {/* Diagnosis Module */}
                  <div className="flex-1 lg:flex-none lg:w-1/3 flex flex-col justify-between px-5 py-4 rounded-xl bg-pplx-secondary border border-pplx-border">
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs text-pplx-muted font-bold tracking-widest uppercase flex items-center gap-2">
                         <ShieldCheck size={14} className={diagnosticResult?.status === 'Healthy' ? 'text-emerald-500' : diagnosticResult?.status === 'Warning' ? 'text-amber-500' : 'text-blue-500'} />
                         Agent Health
                       </span>
                       <button 
                         onClick={runDiagnostics} 
                         disabled={isDiagnosing}
                         className="p-1.5 hover:bg-pplx-hover rounded-md text-pplx-muted hover:text-pplx-text transition-colors disabled:opacity-50"
                         title="Run Diagnostics"
                       >
                         <RefreshCw size={14} className={isDiagnosing ? 'animate-spin' : ''} />
                       </button>
                     </div>
                     {isDiagnosing ? (
                         <div className="flex items-center gap-3 text-sm text-pplx-muted animate-pulse">
                             <Activity size={16} /> Running checks...
                         </div>
                     ) : diagnosticResult ? (
                         <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-pplx-text">{diagnosticResult.status}</span>
                                 <span className={`text-xs font-mono font-bold ${diagnosticResult.errors > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                                    {diagnosticResult.errors} Errors
                                 </span>
                             </div>
                             <div className="flex flex-wrap gap-2 mt-2">
                                <div className="text-[10px] text-pplx-muted font-mono bg-pplx-primary px-2 py-1 rounded border border-pplx-border">Lat: {diagnosticResult.latency}</div>
                                <div className="text-[10px] text-pplx-muted font-mono bg-pplx-primary px-2 py-1 rounded border border-pplx-border">Mem: {diagnosticResult.memory}</div>
                                <div className="text-[10px] text-pplx-muted font-mono bg-pplx-primary px-2 py-1 rounded border border-pplx-border">CPU: {diagnosticResult.cpu}</div>
                                <div className="text-[10px] text-pplx-muted font-mono bg-pplx-primary px-2 py-1 rounded border border-pplx-border">Net: {diagnosticResult.network}</div>
                                <div className="text-[10px] text-pplx-muted font-mono bg-pplx-primary px-2 py-1 rounded border border-pplx-border">Up: {diagnosticResult.uptime}</div>
                             </div>
                         </div>
                     ) : (
                         <div className="flex-1 flex items-center justify-center pt-2">
                             <button onClick={runDiagnostics} className="text-xs bg-pplx-primary hover:bg-pplx-hover border border-pplx-border px-4 py-2 rounded-lg transition-colors font-medium text-pplx-text shadow-sm w-full">
                                Run Diagnostics
                             </button>
                         </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-[120px] flex flex-col px-5 py-3 rounded-xl bg-pplx-secondary border border-pplx-border transition-colors">
                     <span className="text-[10px] text-pplx-muted uppercase tracking-widest font-bold flex items-center gap-2 mb-1">
                        <Zap size={12} className="text-amber-500" /> Tot. Tasks
                     </span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">{totalLlmCalls}</span>
                        <span className="text-[10px] text-pplx-muted font-mono">{totalSteps} steps</span>
                     </div>
                  </div>
                  <div className="flex-1 min-w-[120px] flex flex-col px-5 py-3 rounded-xl bg-pplx-secondary border border-pplx-border transition-colors">
                     <span className="text-[10px] text-pplx-muted uppercase tracking-widest font-bold flex items-center gap-2 mb-1">
                        <Database size={12} className="text-blue-500" /> Tokens
                     </span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">{(totalTokens / 1000).toFixed(1)}k</span>
                        <span className="text-[10px] text-pplx-muted font-mono">~{avgTokensPerTask}/req</span>
                     </div>
                  </div>
                  <div className="flex-1 min-w-[120px] flex flex-col px-5 py-3 rounded-xl bg-pplx-secondary border border-pplx-border transition-colors">
                     <span className="text-[10px] text-pplx-muted uppercase tracking-widest font-bold flex items-center gap-2 mb-1">
                        <Activity size={12} className="text-emerald-500" /> Success
                     </span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">{successRate}%</span>
                     </div>
                  </div>
                  <div className="flex-1 min-w-[120px] flex flex-col px-5 py-3 rounded-xl bg-pplx-secondary border border-pplx-border transition-colors">
                     <span className="text-[10px] text-pplx-muted uppercase tracking-widest font-bold flex items-center gap-2 mb-1">
                        <AlertTriangle size={12} className="text-red-400" /> Issues
                     </span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">{totalCorrections}</span>
                        <span className="text-[10px] text-pplx-muted font-mono">fixed</span>
                     </div>
                  </div>
              </div>

              {/* Agent Operations Overview - Larger Layout */}
               <div className="bg-pplx-card border border-pplx-border rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-pplx-border">
                    <h2 className="text-base font-bold tracking-wide flex items-center gap-2 text-pplx-text">
                       <Cpu size={18} className="text-pplx-accent" /> Agent Operations Overview
                    </h2>
                    <span className="text-[10px] uppercase font-bold text-pplx-muted tracking-widest border border-pplx-muted/20 px-3 py-1 rounded-full">
                       {agentNodes.length} Nodes Online
                    </span>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] text-pplx-muted font-bold uppercase tracking-widest border-b border-pplx-border">
                             <th className="pb-4 font-semibold">Node Identity</th>
                             <th className="pb-4 font-semibold">Status</th>
                             <th className="pb-4 font-semibold text-right">Calls (LLM)</th>
                             <th className="pb-4 font-semibold text-right">Tokens</th>
                             <th className="pb-4 font-semibold pl-6">Actions</th>
                             <th className="pb-4 font-semibold text-right text-emerald-500">Succ</th>
                             <th className="pb-4 font-semibold text-right text-red-500">Fail</th>
                          </tr>
                       </thead>
                       <tbody className="text-sm">
                          {agentNodes.map((node: any) => {
                             const isErr = node.fail > 0;
                             const recentlyActive = now - node.lastRun < 10000;
                             const successPcnt = node.calls > 0 ? Math.round((node.success / node.calls) * 100) : 0;

                             return (
                                <tr key={node.name} className="border-b border-pplx-border last:border-0 hover:bg-pplx-hover/50 transition-colors">
                                   <td className="py-4 font-bold flex items-center gap-3">
                                      <span className="text-xl p-2 bg-pplx-secondary border border-pplx-border text-pplx-muted rounded-xl">{node.name === 'Core Router' ? <Brain size={16}/> : <Bot size={16}/>}</span>
                                      <span className="tracking-wide text-pplx-text">{node.name}</span>
                                   </td>
                                   <td className="py-4">
                                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${recentlyActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-pplx-secondary border border-pplx-border text-pplx-muted'}`}>
                                         {recentlyActive ? 'Active' : 'Standby'}
                                      </span>
                                   </td>
                                   <td className="py-4 text-right font-mono text-pplx-text/80">{node.llmCalls || node.calls}</td>
                                   <td className="py-4 text-right font-mono text-pplx-text/80">{(node.tokens || 0).toLocaleString()}</td>
                                   <td className="py-4 pl-6">
                                      <div className="flex items-center gap-2">
                                         <div className="w-16 h-1.5 bg-pplx-secondary border border-pplx-border rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${successPcnt}%` }} />
                                         </div>
                                         <span className="text-[10px] font-mono font-bold text-pplx-muted">{successPcnt}%</span>
                                      </div>
                                   </td>
                                   <td className="py-4 text-right font-mono font-bold text-emerald-500">{node.success}</td>
                                   <td className={`py-4 text-right font-mono font-bold ${isErr ? 'text-red-500' : 'text-pplx-muted/30'}`}>{node.fail}</td>
                                </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Bottom Split Area (Logs & Skills) */}
              <div className="flex flex-col md:flex-row gap-8 min-h-[450px]">
                 
                 {/* Router Logs (Larger list by not slicing) */}
                 <div className="flex-1 bg-pplx-card border border-pplx-border rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
                     <div className="flex items-center justify-between mb-4 pb-4 border-b border-pplx-border shrink-0">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-pplx-secondary border border-pplx-border text-pplx-muted">
                             <Terminal size={18} />
                           </div>
                           <div>
                              <h2 className="text-sm font-bold tracking-wide text-pplx-text">{currentAgentData?.name} Term Logs</h2>
                              <p className="text-xs text-pplx-muted opacity-80 font-mono mt-0.5">Full execution history</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2 hover:bg-pplx-hover rounded-lg text-pplx-muted hover:text-pplx-text transition-colors"><Play size={14} /></button>
                           <button className="p-2 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 rounded-lg text-pplx-muted transition-colors"><Square size={14} /></button>
                           <button onClick={() => globalTracker.reset()} className="p-2 hover:bg-pplx-hover rounded-lg text-pplx-muted hover:text-pplx-text transition-colors" title="Reset Logs"><RotateCcw size={14} /></button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {currentAgentData?.logs.map((log: any, i: number) => {
                           const isErr = log.status !== 'OK';
                           return (
                              <div key={i} className={`p-4 rounded-xl border ${isErr ? 'bg-red-500/5 border-red-500/20' : 'bg-pplx-primary border-pplx-border'}`}>
                                 <div className="flex items-center justify-between mb-2 pb-2 border-b border-pplx-border/50">
                                    <div className="flex items-center gap-2">
                                       <span className={`w-2 h-2 rounded-full ${isErr ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                       <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-pplx-muted">
                                          {new Date(log.time).toLocaleTimeString()}
                                       </span>
                                    </div>
                                    {log.duration > 0 && <span className="text-[10px] text-pplx-muted font-mono">{log.duration}ms</span>}
                                 </div>
                                 
                                 <p className="text-xs mb-3 text-pplx-text opacity-90 leading-relaxed font-mono">
                                    {log.intent}
                                 </p>
                                 
                                 <div className="flex flex-col gap-2 relative">
                                    <div className="flex items-center gap-2 text-xs font-mono font-medium text-pplx-muted">
                                      <span className="opacity-50">❯</span>
                                      <span>{log.action}</span>
                                    </div>
                                    <div className="bg-pplx-secondary rounded-lg p-2 text-[11px] font-mono text-pplx-muted break-words leading-relaxed border border-pplx-border max-h-[150px] overflow-y-auto custom-scrollbar">
                                       {log.resultData}
                                    </div>
                                 </div>
                              </div>
                           )
                        })}

                        {!currentAgentData?.logs.length && (
                           <div className="h-full flex flex-col items-center justify-center text-pplx-muted gap-4 py-10">
                             <Database size={32} className="opacity-30" />
                             <p className="font-mono text-sm opacity-50">No telemetry data recorded yet.</p>
                           </div>
                        )}
                     </div>
                 </div>

                 {/* Learned Skills Section (If any) */}
                 {trajectory?.skillsCreated && trajectory.skillsCreated.length > 0 && (
                   <div className="flex-1 bg-pplx-card border border-pplx-border rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
                     <div className="flex items-center justify-between mb-4 pb-4 border-b border-pplx-border shrink-0">
                        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-pplx-text">
                           <Plug size={16} className="text-purple-500" /> Synthesized Skills
                        </h2>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full">
                           {trajectory.skillsCreated.length} Auto-Created
                        </span>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-2 h-full">
                        {trajectory.skillsCreated.map((skill: any, idx: number) => (
                           <div key={idx} className="p-4 rounded-xl bg-pplx-primary border border-pplx-border hover:bg-pplx-hover/50 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-sm font-bold text-pplx-text tracking-wide">{skill.name}</h3>
                                 <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                    {skill.category}
                                 </span>
                              </div>
                              <p className="text-xs text-pplx-muted leading-relaxed line-clamp-3 mb-4 font-serif">
                                 {skill.description}
                              </p>
                              <div className="flex items-center justify-between pt-3 border-t border-pplx-border/50 text-[10px] uppercase font-bold tracking-widest text-pplx-muted">
                                 <span>Executions: {skill.usageCount}</span>
                                 <span className="flex items-center gap-1 text-emerald-500">
                                    Eff. {Math.round(skill.effectiveness * 100)}%
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                 )}

              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

