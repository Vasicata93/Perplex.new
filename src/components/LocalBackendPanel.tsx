import React, { useEffect, useState } from 'react';
import { RefreshCw, Server, AlertCircle, XCircle, HardDrive, Code, Database, Download } from 'lucide-react';
import { useLocalBackendStore } from '../store/useLocalBackendStore';
import { toast } from 'react-hot-toast';

export const LocalBackendPanel: React.FC = () => {
  const { 
    agents, 
    isScanning, 
    scanLocalNetwork, 
    isExecutionEngineConnected, 
    executionEngineUrl, 
    connectExecutionEngine,
    disconnectExecutionEngine
  } = useLocalBackendStore();
  
  const [customUrl, setCustomUrl] = useState(executionEngineUrl);
  const [connecting, setConnecting] = useState(false);
  
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
     // Initial scan
     if (agents.length === 0 && !isScanning) {
         scanLocalNetwork();
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanNetwork = async () => {
    toast.loading("Scanning local network for engines...", { id: "scan-toast" });
    await scanLocalNetwork();
    
    const count = useLocalBackendStore.getState().agents.length;
    if (count > 0) {
      toast.success(`Scan complete! Found ${count} agent(s).`, { id: "scan-toast" });
    } else {
      toast.error("Scan complete. No agents or models found.", { id: "scan-toast" });
    }
  };

  const eeAgent = agents.find(a => a.type === 'execution_engine');

  const startDownload = async () => {
    if (!eeAgent || !downloadUrl || !downloadFilename) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const res = await fetch(`${eeAgent.url}/download`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ url: downloadUrl, filename: downloadFilename })
      });
      const data = await res.json();
      if (!data.success) {
         toast.error(data.error || "Failed to start download");
         setIsDownloading(false);
         return;
      }
      
      toast.success("Download started!");
      
      const poll = setInterval(async () => {
         const statRes = await fetch(`${eeAgent.url}/download/${downloadFilename}`).catch(()=>null);
         if (statRes && statRes.ok) {
            const statData = await statRes.json();
            setDownloadProgress(statData.progress || 0);
            if (statData.status === 'completed') {
               clearInterval(poll);
               setIsDownloading(false);
               setDownloadProgress(100);
               toast.success("Model downloaded successfully!");
               scanLocalNetwork(); // refresh models
               setDownloadUrl('');
               setDownloadFilename('');
            } else if (statData.status === 'error') {
               clearInterval(poll);
               setIsDownloading(false);
               toast.error("Download failed: " + statData.error);
            }
         }
      }, 2000);

    } catch(e) {
      toast.error("Failed to connect to local node");
      setIsDownloading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    const success = await connectExecutionEngine(customUrl);
    setConnecting(false);
    if (success) {
      toast.success('Connected to Local Execution Node');
    } else {
      toast.error('Failed to connect. Is the backend running?');
    }
  };

  const recommendedModels = [
    { name: 'Gemma-4-2B-Instruct.gguf', url: 'https://huggingface.co/google/gemma-4-2b-it-GGUF/resolve/main/gemma-4-2b-it-q4_k_m.gguf' },
    { name: 'Gemma-4-4B-Instruct.gguf', url: 'https://huggingface.co/google/gemma-4-4b-it-GGUF/resolve/main/gemma-4-4b-it-q4_k_m.gguf' },
    { name: 'Gemma-4-9B-Instruct.gguf', url: 'https://huggingface.co/google/gemma-4-9b-it-GGUF/resolve/main/gemma-4-9b-it-q4_k_m.gguf' },
    { name: 'Gemma-4-27B-Instruct.gguf', url: 'https://huggingface.co/google/gemma-4-27b-it-GGUF/resolve/main/gemma-4-27b-it-q4_k_m.gguf' },
    { name: 'Qwen-3.1-3B-Instruct.gguf', url: 'https://huggingface.co/Qwen/Qwen3.1-3B-Instruct-GGUF/resolve/main/qwen3.1-3b-instruct-q4_k_m.gguf' },
    { name: 'Qwen-3.5-8B-Instruct.gguf', url: 'https://huggingface.co/Qwen/Qwen3.5-8B-Instruct-GGUF/resolve/main/qwen3.5-8b-instruct-q4_k_m.gguf' },
    { name: 'Qwen-3.6-10B-Instruct.gguf', url: 'https://huggingface.co/Qwen/Qwen3.6-10B-Instruct-GGUF/resolve/main/qwen3.6-10b-instruct-q4_k_m.gguf' },
    { name: 'Qwen-3.6-27B-Instruct.gguf', url: 'https://huggingface.co/Qwen/Qwen3.6-27B-Instruct-GGUF/resolve/main/qwen3.6-27b-instruct-q4_k_m.gguf' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold text-pplx-text">Local Network & Devices</h3>
         <button 
           onClick={handleScanNetwork}
           disabled={isScanning}
           className="px-3 py-1.5 flex items-center gap-2 rounded-lg bg-pplx-secondary hover:bg-pplx-hover text-sm font-medium transition-colors border border-pplx-border disabled:opacity-50"
         >
           <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
           {isScanning ? 'Scanning...' : 'Scan Now'}
         </button>
      </div>

      <div className="bg-pplx-primary border border-pplx-border rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-semibold mb-4 text-emerald-500 uppercase tracking-widest">Execution Engine</h4>
        <p className="text-sm text-pplx-muted mb-6 leading-relaxed">
           Connecting a Local Execution Node allows the app to perform computer control actions implicitly requested. 
           Requirements include providing standard permissions like reading/writing local files and terminal execution.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
           <div className="w-full">
             <label className="text-xs font-bold text-pplx-muted uppercase tracking-widest mb-2 block ml-1">Node API URL</label>
             <input
               type="text"
               value={customUrl}
               onChange={(e) => setCustomUrl(e.target.value)}
               placeholder="http://127.0.0.1:8123"
               className="w-full bg-pplx-secondary border border-pplx-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pplx-accent/50"
             />
           </div>
           
           <div className="shrink-0 flex gap-2">
             {isExecutionEngineConnected ? (
               <button onClick={disconnectExecutionEngine} className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold transition-colors flex items-center gap-2 border border-red-500/20 text-sm">
                 <XCircle size={16} /> Disconnect
               </button>
             ) : (
               <button onClick={handleConnect} disabled={connecting} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-70 text-sm">
                 {connecting ? <RefreshCw size={16} className="animate-spin" /> : <HardDrive size={16} />} 
                 {connecting ? 'Connecting...' : 'Connect node'}
               </button>
             )}
           </div>
        </div>

        {!isExecutionEngineConnected && (
           <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
             <div className="flex items-start gap-3">
               <AlertCircle size={16} className="text-amber-500 mt-0.5" />
               <div className="space-y-2">
                 <h5 className="text-sm font-bold text-amber-500 uppercase tracking-wide">Install Local Backend</h5>
                 <p className="text-sm text-pplx-text/90">
                   If you don't have the backend installed locally yet, you can easily install and start it with this command:
                 </p>
                 <div className="bg-black/50 p-3 rounded-md border border-amber-500/20 font-mono text-xs flex mt-2 overflow-x-auto text-emerald-400">
                    <code>curl -O {window.location.origin}/local-node.cjs && npm install cors express node-llama-cpp robotjs && node local-node.cjs</code>
                 </div>
               </div>
             </div>
           </div>
        )}
      </div>

      {/* Model Downloader (Requires Local Node) */}
      {isExecutionEngineConnected && (
        <div className="bg-pplx-primary border border-pplx-border rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-semibold mb-4 text-cyan-500 uppercase tracking-widest flex items-center gap-2">
            <Download size={16} /> Optional: Download Local AI Models (.gguf)
          </h4>
          <p className="text-sm text-pplx-muted mb-4 leading-relaxed">
             Download models directly to your local file system for privacy-first inference without browser limits. Models run efficiently on CPU/GPU via node-llama-cpp.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {recommendedModels.map((m) => (
              <button 
                key={m.name}
                onClick={() => { setDownloadUrl(m.url); setDownloadFilename(m.name); }}
                className="text-left px-4 py-3 bg-pplx-secondary border border-pplx-border hover:border-cyan-500/50 rounded-xl transition-colors"
              >
                <div className="text-sm font-bold text-pplx-text truncate">{m.name}</div>
                <div className="text-xs text-pplx-muted truncate mt-1">{m.url}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full">
               <label className="text-xs font-bold text-pplx-muted uppercase tracking-widest mb-2 block ml-1">Or enter model HuggingFace URL</label>
               <input
                 type="text"
                 value={downloadUrl}
                 onChange={(e) => setDownloadUrl(e.target.value)}
                 placeholder="https://huggingface.co/.../model.gguf"
                 className="w-full bg-pplx-secondary border border-pplx-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 mb-3"
               />
               <input
                 type="text"
                 value={downloadFilename}
                 onChange={(e) => setDownloadFilename(e.target.value)}
                 placeholder="model_filename.gguf"
                 className="w-full bg-pplx-secondary border border-pplx-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50"
               />
             </div>
             
             <div className="shrink-0 flex gap-2">
                 <button 
                  onClick={startDownload} 
                  disabled={isDownloading || !downloadUrl || !downloadFilename} 
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-70 text-sm"
                 >
                   {isDownloading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />} 
                   {isDownloading ? `${downloadProgress}%` : 'Download'}
                 </button>
             </div>
          </div>
          {isDownloading && (
            <div className="mt-4 w-full bg-pplx-secondary rounded-full h-2 overflow-hidden border border-pplx-border hidden">
              <div className="bg-cyan-500 h-2 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
         <h3 className="text-xs font-bold text-pplx-muted uppercase tracking-widest ml-1">Discovered Agents & Engines ({agents.length})</h3>
         
         {isScanning && (
           <div className="bg-pplx-secondary/50 border border-pplx-border/50 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center animate-pulse">
             <RefreshCw size={24} className="text-cyan-500 mb-3 animate-spin" />
             <p className="text-sm font-bold text-pplx-text">Scanning local network...</p>
             <p className="text-xs text-pplx-muted mt-1">Checking standard ports (11434, 1234, 8000, 8123) for active AI engines and agents.</p>
           </div>
         )}
         
         {!isScanning && agents.length === 0 ? (
            <div className="bg-pplx-secondary/50 border border-pplx-border/50 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <Server size={32} className="text-pplx-border mb-3" />
              <p className="text-sm text-pplx-muted font-medium">No local agents detected.</p>
              <p className="text-xs text-pplx-muted/70 mt-1">Make sure they are running on standard ports.</p>
            </div>
         ) : !isScanning && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {agents.map(agent => (
                 <div key={agent.id} className="bg-pplx-primary border border-pplx-border hover:border-pplx-accent/50 transition-colors rounded-xl p-4 flex flex-col group shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {agent.type === 'ollama' ? <Database className="w-5 h-5 text-pplx-accent" /> :
                         agent.type === 'lm_studio' ? <Database className="w-5 h-5 text-purple-500" /> :
                         agent.type === 'hermes' ? <Server className="w-5 h-5 text-indigo-500" /> :
                         agent.type === 'execution_engine' ? <HardDrive className="w-5 h-5 text-emerald-500" /> :
                         <Code className="w-5 h-5 text-cyan-500" />}
                        <div className="flex flex-col overflow-hidden max-w-[150px]">
                           <span className="text-sm font-bold text-pplx-text truncate">{agent.name}</span>
                           <span className="text-[11px] text-pplx-muted mt-0.5 truncate">{agent.url}</span>
                        </div>
                      </div>
                      <div className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                         Online
                      </div>
                    </div>

                    {agent.models && Array.isArray(agent.models) && agent.models.length > 0 && (
                       <div className="mt-4 pt-3 border-t border-pplx-border/50">
                         <div className="text-[10px] uppercase font-bold text-pplx-muted mb-2 tracking-widest flex items-center justify-between">
                           <span>Available Models</span>
                           <span className="bg-pplx-primary border border-pplx-border px-1.5 py-0.5 rounded text-[9px]">{agent.models.length}</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                           {agent.models.map((model, idx) => {
                             const modelStr = typeof model === 'string' ? model : (model as any)?.name || (model as any)?.id || 'unknown model';
                             return (
                               <div key={`${modelStr}-${idx}`} className="px-2 py-1 text-[11px] bg-pplx-secondary text-pplx-text rounded border border-pplx-border truncate max-w-[200px]" title={modelStr}>
                                 {modelStr}
                               </div>
                             );
                           })}
                         </div>
                       </div>
                    )}
                 </div>
               ))}
            </div>
         )}
      </div>

    </div>
  );
};

