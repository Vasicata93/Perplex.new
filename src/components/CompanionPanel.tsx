import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Keyboard,
  MousePointerClick,
  MonitorCheck,
  Cookie,
  ChevronUp,
  ChevronDown,
  CornerDownLeft,
  MousePointer,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  Menu,
  History,
  SquarePen,
  Send,
  Paperclip,
  Share2,
  Activity,
  CheckCircle2,
  Upload,
  Lock,
  ArrowUpLeft,
} from "lucide-react";

interface CompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  url?: string;
  title?: string;
  geminiApiKey?: string;
  isInline?: boolean;
}

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  isOpen,
  onClose,
  onWidthChange,
  url,
  title,
  geminiApiKey,
  isInline = false,
}) => {
  // We default width to 750px for a clean browser-only look next to the main chat!
  const [width, setWidth] = useState(750);
  const [showOperator, setShowOperator] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [frame, setFrame] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("https://www.google.com");
  const [currentTitle, setCurrentTitle] = useState<string>("Live Browser");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const [inputUrl, setInputUrl] = useState<string>("https://www.google.com");
  const [typingText, setTypingText] = useState<string>("");
  const [isBypassing, setIsBypassing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Operator Agent States
  const [operatorInput, setOperatorInput] = useState("");
  const [operatorMessages, setOperatorMessages] = useState<any[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Bună! Sunt Operator, asistentul tău autonom în browser. Scrie-mi orice acțiune dorești (de ex: 'caută pe Google hoteluri în Brașov' sau 'caută cel mai ieftin cort pe emag') și o voi executa automat direct în fața ta!"
    }
  ]);
  const [operatorSteps, setOperatorSteps] = useState<any[]>([]);
  const [isAgentProgressing, setIsAgentProgressing] = useState(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState(true);
  const [agentObjective, setAgentObjective] = useState("");
  const [agentLoopPaused, setAgentLoopPaused] = useState(false);
  const [agentStepThoughts, setAgentStepThoughts] = useState<any[]>([]);

  // Active view toggle on narrow layouts (under 760px)
  const [activeTab, setActiveTab] = useState<"operator" | "browser">("browser");

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when message arrives
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [operatorMessages, operatorSteps]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    wsRef.current?.send(JSON.stringify({ type: "toggle-play" }));
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    wsRef.current?.send(JSON.stringify({ type: "toggle-mute" }));
  };

  const handleSkipAd = () => {
    wsRef.current?.send(JSON.stringify({ type: "skip-ad" }));
  };

  // Manual Trigger to bypass cookie popups/consent screens on the page
  const handleBypassConsent = async () => {
    setIsBypassing(true);
    setStatusMessage("Bypassing consent screens...");
    try {
      const response = await fetch("/api/browser/bypass-consent", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        setStatusMessage("Consent successfully bypassed!");
      } else {
        setStatusMessage("Consent bypass finished.");
      }
    } catch (err: any) {
      console.error("Consent bypass error:", err);
      setStatusMessage("Failed to bypass consent.");
    } finally {
      setIsBypassing(false);
    }
  };

  const handleScrollManual = (direction: "up" | "down") => {
    const deltaY = direction === "up" ? -300 : 300;
    wsRef.current?.send(JSON.stringify({ type: "scroll", deltaY }));
  };

  const handleQuickKey = (key: string) => {
    wsRef.current?.send(JSON.stringify({ type: "key", key }));
  };

  // Connect to the WebSocket Server
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setIsConnecting(true);
    setConnectionError(null);
    setStatusMessage("Opening network connection...");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/browser-sync`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setStatusMessage("Browser initialized!");
      
      // If there is an outstanding url prop when we connect, navigate immediately
      if (url) {
        socket.send(JSON.stringify({ type: "navigate", url }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "frame":
            setFrame(msg.data);
            break;
          case "url":
            setCurrentUrl(msg.url);
            setInputUrl(msg.url);
            break;
          case "title":
            setCurrentTitle(msg.title || "Live Browser");
            break;
          case "status":
            setStatusMessage(msg.text);
            break;
          case "error":
            setStatusMessage("Browser Alert");
            setConnectionError(msg.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      if (!event.wasClean) {
        setConnectionError("Browser session closed unexpectedly. Retrying...");
        setTimeout(() => {
          if (isOpen) connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError("WebSocket connection failed.");
    };
  };

  // Connect when panel opens, disconnect when it closes
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]);

  // Handle updates to the `url` and `title` prop from parent
  useEffect(() => {
    if (isOpen && url && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "navigate", url }));
    } else if (url) {
      setCurrentUrl(url);
      setInputUrl(url);
    }
  }, [url, isOpen]);

  // Sidebar resize dragging handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 320 && newWidth < 1200) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Sync width prop
  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(isOpen ? width : 0);
    }
  }, [width, isOpen, onWidthChange]);

  if (!isOpen) return null;

  // Browser Navigation commands
  const handleBack = () => {
    wsRef.current?.send(JSON.stringify({ type: "back" }));
  };

  const handleForward = () => {
    wsRef.current?.send(JSON.stringify({ type: "forward" }));
  };

  const handleRefresh = () => {
    wsRef.current?.send(JSON.stringify({ type: "refresh" }));
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && inputUrl) {
      wsRef.current.send(JSON.stringify({ type: "navigate", url: inputUrl }));
    }
  };

  // Direct viewport interaction handlers
  const handleScreenClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Calculate click coordinates as percentages (0 to 1) 
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    wsRef.current.send(JSON.stringify({ type: "click", x, y }));
    
    // Focus the hidden screen handle or main container to receive hardware inputs if needed
    containerRef.current?.focus();
  };

  const handleScreenWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    e.preventDefault();
    wsRef.current.send(JSON.stringify({ type: "scroll", deltaY: e.deltaY }));
  };

  const handleHardwareKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Prevent default scrolling keys
    if (["ArrowUp", "ArrowDown", "Space"].includes(e.key)) {
      e.preventDefault();
    }

    // Do not capture keyboard event if actively typing in address bar or helper bar
    if (
      document.activeElement?.id === "companion_url_address_input" || 
      document.activeElement?.id === "typing_helper_input" ||
      document.activeElement?.id === "operator_chat_textarea"
    ) {
      return;
    }

    wsRef.current.send(JSON.stringify({ type: "key", key: e.key }));
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && typingText) {
      wsRef.current.send(JSON.stringify({ type: "type", text: typingText }));
      setTypingText("");
    }
  };

  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  // Operator Intelligent Agent Process Loop
  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorInput.trim() || isAgentProgressing) return;

    const goal = operatorInput;
    setOperatorInput("");
    setAgentObjective(goal);
    setAgentStepThoughts([]);
    setOperatorSteps([]);

    // Add user message to UI
    const newUserMsg = {
      id: Date.now().toString(),
      role: "user",
      content: goal
    };
    setOperatorMessages((prev) => [...prev, newUserMsg]);
    setIsAgentProgressing(true);
    setAgentLoopPaused(false);

    // Call recursive step agent
    triggerAgentLoop(goal, []);
  };

  const triggerAgentLoop = async (goal: string, history: any[]) => {
    let activeHistory = [...history];
    let isFinished = false;
    let iterations = 0;
    const maxIterations = 15;

    while (!isFinished && iterations < maxIterations) {
      // Handle paused loop gracefully
      if (agentLoopPaused) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      iterations++;

      // Render a pending step indicating Gemini analysis in progress
      const pendingStepId = `step_${iterations}_${Date.now()}`;
      setOperatorSteps((prev) => [
        ...prev,
        {
          id: pendingStepId,
          label: "Analizez pagina curentă pentru acțiunea optimă...",
          status: "running"
        }
      ]);

      try {
        const response = await fetch("/api/browser/agent-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, history: activeHistory, geminiApiKey })
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.step) {
          throw new Error(data.error || "Failed to parse next agent decision.");
        }

        const { thought, label, action, args } = data.step;

        // Push to thoughts so we retain state representation
        activeHistory.push({ thought, label, action, args });

        // Update the visual representation of this step
        setOperatorSteps((prev) =>
          prev.map((s) => (s.id === pendingStepId ? { ...s, label: label || "Acțiune în curs...", status: "completed" } : s))
        );

        // Execute the visual interactive browser automation!
        if (action === "navigate" && args.url) {
          wsRef.current?.send(JSON.stringify({ type: "navigate", url: args.url }));
        } 
        else if (action === "click" && args.selector) {
          await fetch("/api/browser/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selector: args.selector })
          });
        } 
        else if (action === "type" && args.text) {
          await fetch("/api/browser/type", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: args.text,
              selector: args.selector,
              press_enter: args.press_enter !== false
            })
          });
        } 
        else if (action === "scroll") {
          wsRef.current?.send(JSON.stringify({ type: "scroll", deltaY: args.deltaY || 300 }));
        } 
        else if (action === "bypass") {
          await fetch("/api/browser/bypass-consent", { method: "POST" });
        } 
        else if (action === "finish") {
          isFinished = true;
          // Append summary to chat messages list
          setOperatorMessages((prev) => [
            ...prev,
            {
              id: `assistant_finish_${Date.now()}`,
              role: "assistant",
              content: args.summary || "Am terminat căutarea și am extras toate datele solicitate."
            }
          ]);
          break;
        }

        // Sleep to allow frames and Puppeteer transitions to correctly load
        await new Promise((resolve) => setTimeout(resolve, 2500));

      } catch (err: any) {
        console.error("Agent automation failure:", err);
        setOperatorSteps((prev) =>
          prev.map((s) => (s.id === pendingStepId ? { ...s, label: `Eroare: ${err.message}`, status: "error" } : s))
        );
        isFinished = true;
        break;
      }
    }

    setIsAgentProgressing(false);
  };

  const handleToggleAgentPlaying = () => {
    setAgentLoopPaused((prev) => !prev);
  };

  const isWideLayout = width >= 760;
  const shouldShowOperator = false; // Always disabled as the main chat contains the agent
  const shouldShowBrowser = true; // Always show browser viewport

  return (
    <div
      id="companion_panel_viewport"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleHardwareKeyDown}
      className={`${
        isInline
          ? "relative border-l border-zinc-200/80 dark:border-white/5"
          : "fixed inset-y-0 right-0 z-[75] border-l border-zinc-200/80 dark:border-white/5 shadow-2xl"
      } flex flex-col bg-[#f4f4f6] dark:bg-pplx-primary text-zinc-800 dark:text-pplx-text h-full transition-[width] duration-150 focus:outline-none max-w-full`}
      style={{ width: isDesktop ? `${width}px` : "100%" }}
    >
      {/* Resize handle bar */}
      <div
        id="resize_handle_horizontal"
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#2563eb]/30 transition-colors z-50"
        onMouseDown={(e) => {
          e.preventDefault();
          isResizing.current = true;
          document.body.style.cursor = "col-resize";
        }}
      />

      {/* Primary Top Header Frame - Styled EXACTLY like screenshot, lowered on desktop */}
      <div className="flex items-center justify-between px-6 pt-4 pb-4 md:pt-14 md:pb-4 select-none shrink-0 bg-transparent">
        <div className="flex items-center gap-2 overflow-hidden">
          <ArrowUpLeft 
            size={16} 
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer shrink-0" 
          />
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-white tracking-tight truncate">
            {currentTitle || "Campsite search request"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="close_companion_button"
            onClick={onClose}
            className="p-1.5 hover:text-red-500 text-zinc-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors ml-1"
            title="Close Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Dual-Column Split view or single Tab view */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================== */}
        {/* COL 1: LEFT SIDE - AGENT OPERATOR CHAT & LOGS */}
        {/* ========================================== */}
        {shouldShowOperator && (
          <div className="flex flex-col flex-1 md:flex-none md:w-[420px] shrink-0 bg-[#09090b] border-r border-white/5 overflow-hidden h-full">
            {/* Operator Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0b0b0d] shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <button className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  <Menu size={13} />
                </button>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-[#2563eb] font-bold">
                  Operator Client
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Tasks log">
                  <History size={13} />
                </button>
                <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="New task">
                  <SquarePen size={13} />
                </button>
              </div>
            </div>

            {/* Chat list viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {operatorMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end animate-in slide-in-from-right-3 duration-200" : "justify-start animate-in slide-in-from-left-3 duration-200"}`}
                >
                  <div
                    className={`${
                      msg.role === "user"
                        ? "bg-[#18181b] border border-white/5 text-zinc-100 px-4 py-2.5 rounded-2xl max-w-[85%]"
                        : "text-zinc-300 font-sans leading-relaxed text-[13px] max-w-[95%] py-1 px-0.5"
                    } text-[13px] shadow-sm select-text`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-line font-sans">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-xs text-zinc-300">
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* AUTOMATION STEPPER FOLDER CONTAINER (Perfect representation matching screenshot!) */}
              {operatorSteps.length > 0 && (
                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-200 shadow-md">
                  <div
                    onClick={() => setIsStepsExpanded(!isStepsExpanded)}
                    className="flex items-center justify-between cursor-pointer select-none border-b border-white/5 pb-2"
                  >
                    <div className="flex items-center gap-2">
                      {isAgentProgressing ? (
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      )}
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">
                        {isAgentProgressing ? "Procesez pași de automatizare" : "Pași finalizați"}
                      </span>
                    </div>
                    {isStepsExpanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                  </div>

                  {isStepsExpanded && (
                    <div className="mt-3 pl-2.5 border-l border-white/5 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                      {operatorSteps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2.5 text-xs">
                          <div className="mt-1 flex items-center justify-center shrink-0">
                            {step.status === "running" ? (
                              <Loader2 size={12} className="text-[#2563eb] animate-spin" />
                            ) : step.status === "completed" ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ring-4 ring-emerald-500/10" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block ring-4 ring-red-500/10" />
                            )}
                          </div>
                          <span className="text-zinc-300 font-sans tracking-tight pr-1">
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Operator Message Box */}
            <div className="p-4 border-t border-white/5 bg-[#0b0b0d] shrink-0">
              <form onSubmit={handleOperatorSubmit} className="relative flex flex-col gap-2">
                <div className="relative flex items-center bg-[#121214] border border-white/10 rounded-2xl p-2.5 shadow-inner focus-within:border-[#2563eb]/45 transition-colors">
                  <button type="button" className="p-1 px-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <Paperclip size={15} />
                  </button>
                  <input
                    id="operator_chat_textarea"
                    type="text"
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                    placeholder="Message Operator..."
                    disabled={isAgentProgressing}
                    className="flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder-zinc-500 disabled:opacity-55"
                  />
                  {isAgentProgressing ? (
                    <button
                      type="button"
                      onClick={handleToggleAgentPlaying}
                      className="p-1.5 bg-[#2563eb]/20 hover:bg-[#2563eb]/30 border border-[#2563eb]/30 rounded-xl text-[#3b82f6] transition-colors"
                      title={agentLoopPaused ? "Play task" : "Pause task"}
                    >
                      {agentLoopPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!operatorInput.trim()}
                      className="p-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 rounded-xl text-white transition-colors"
                    >
                      <Send size={11} />
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-zinc-500 text-center leading-normal px-2 block select-none">
                  Operator retains screenshots of its actions. Please monitor its work. It can make mistakes.
                </span>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* COL 2: RIGHT SIDE - BROWSER VIEWPORT & ADDR */}
        {/* ========================================== */}
        {shouldShowBrowser && (
          <div className="flex-grow flex flex-col px-6 pb-6 overflow-hidden h-full z-10 bg-[#f4f4f6] dark:bg-pplx-primary">
            
            {/* INSET FLOATING CARD DESIGN FOR MOCK BROWSER */}
            <div className="flex-1 flex flex-col bg-white dark:bg-pplx-secondary rounded-2xl border border-zinc-200/85 dark:border-white/5 shadow-md overflow-hidden min-h-0">
              
              {/* Google Chrome Tab bar */}
              <div className="flex items-center bg-[#eaecef] dark:bg-pplx-primary border-b border-zinc-200/60 dark:border-white/5 px-3 h-9 select-none shrink-0 gap-1.5 pt-1.5">
                <div className="flex items-center gap-1 bg-white dark:bg-pplx-secondary border-t border-x border-zinc-250/20 dark:border-white/5 px-3 py-1.5 rounded-t-lg text-zinc-800 dark:text-pplx-text text-[11px] font-medium shadow-2xs max-w-[280px] truncate">
                  <Globe size={11} className="text-[#2563eb] shrink-0" />
                  <span className="truncate">{currentTitle || "Hipcamp | Tent Camping, RV Spots, Cabins & Glamping"}</span>
                  <button className="ml-2 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full p-0.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors">
                    <X size={10} />
                  </button>
                </div>
                <button className="p-1 rounded-md hover:bg-zinc-250 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors font-semibold" title="New Tab">
                  <span className="text-xs">+</span>
                </button>
              </div>

              {/* Address bar search navigation */}
              <div className="px-4 py-2.5 bg-white dark:bg-pplx-secondary border-b border-zinc-200/80 dark:border-white/5 shrink-0 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    id="browser_back_btn"
                    type="button"
                    onClick={handleBack}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-pplx-hover text-zinc-600 dark:text-pplx-muted hover:text-zinc-900 dark:hover:text-pplx-text transition-colors"
                    title="Go Back"
                  >
                    <ChevronLeft size={15} className="stroke-[2.2]" />
                  </button>
                  <button
                    id="browser_fwd_btn"
                    type="button"
                    onClick={handleForward}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-pplx-hover text-zinc-600 dark:text-pplx-muted hover:text-zinc-900 dark:hover:text-pplx-text transition-colors"
                    title="Go Forward"
                  >
                    <ChevronRight size={15} className="stroke-[2.2]" />
                  </button>
                  <button
                    id="browser_refresh_btn"
                    type="button"
                    onClick={handleRefresh}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-pplx-hover text-zinc-600 dark:text-pplx-muted hover:text-zinc-900 dark:hover:text-pplx-text transition-colors"
                    title="Reload"
                  >
                    <RefreshCw size={13} className="stroke-[2.2]" />
                  </button>
                </div>

                <form onSubmit={handleUrlSubmit} className="flex-1 relative flex flex-row items-center">
                  <div className="w-full flex items-center bg-[#f1f3f4] dark:bg-pplx-primary border border-transparent rounded-lg py-1 px-3 gap-2 focus-within:bg-white dark:focus-within:bg-pplx-secondary focus-within:border-[#2563eb]/40 dark:focus-within:border-pplx-accent/40 shadow-3xs transition-all">
                    <Lock size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                    {currentUrl ? (
                      <span className="text-[9px] text-[#2563eb] bg-[#2563eb]/5 border border-[#2563eb]/10 dark:border-white/5 px-1.5 py-0.5 rounded font-mono select-none font-semibold shrink-0">
                        {getDomain(currentUrl)}
                      </span>
                    ) : null}
                    <input
                      id="companion_url_address_input"
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1 text-xs bg-transparent outline-none text-zinc-800 dark:text-pplx-text font-mono py-0.5"
                      placeholder="Search or enter URL to browse..."
                    />
                  </div>
                </form>
              </div>

              {/* Main Interactive Screencast iframe screenshot area */}
              <div
                id="companion_screencast_viewport"
                onWheel={handleScreenWheel}
                className="flex-1 relative overflow-hidden bg-[#eaecef] dark:bg-pplx-primary flex flex-col justify-center items-center select-none group min-h-0"
              >
                {frame ? (
                  <div className="relative max-w-full max-h-full flex items-center justify-center p-2">
                    <img
                      ref={screenRef}
                      src={frame}
                      alt="Live Browser Screencast"
                      onClick={handleScreenClick}
                      className="max-w-full max-h-full object-contain cursor-crosshair rounded-xl border border-zinc-200/80 dark:border-white/5 shadow-lg"
                      draggable={false}
                    />
                    
                    <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-mono text-zinc-200 border border-white/5 shadow-lg select-none z-10">
                      <span className="flex items-center gap-1.5">
                        <MousePointer size={12} className="text-[#3b82f6] animate-pulse" />
                        <span>Control: Click & Scroll direct pe pagină</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 dark:text-pplx-muted bg-white dark:bg-pplx-secondary w-full h-full">
                    {isConnecting ? (
                      <>
                        <Loader2 size={32} className="stroke-[1.5] mb-4 text-[#2563eb] animate-spin" />
                        <p className="text-sm font-semibold text-zinc-800 dark:text-pplx-text">Starting Headless Chromium Session</p>
                        <p className="text-xs text-zinc-400 dark:text-pplx-muted mt-2 max-w-[280px]">
                          Setting up sandboxed Chrome process. This typically takes up to a few seconds...
                        </p>
                      </>
                    ) : connectionError ? (
                      <>
                        <AlertCircle size={32} className="stroke-[1.5] mb-4 text-red-500" />
                        <p className="text-sm font-semibold text-zinc-800 dark:text-pplx-text">Session Standby</p>
                        <p className="text-xs text-red-400/90 mt-2 max-w-[320px] font-mono whitespace-normal">
                          {connectionError}
                        </p>
                        <button
                          type="button"
                          onClick={connectWebSocket}
                          className="mt-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer animate-in zoom-in-95"
                        >
                          Reconnect Browser
                        </button>
                      </>
                    ) : (
                      <>
                        <Globe size={32} className="stroke-[1.5] mb-4 text-zinc-300 dark:text-zinc-650 animate-pulse" />
                        <p className="text-sm font-semibold text-zinc-700 dark:text-pplx-text">Browser Ready</p>
                        <p className="text-xs text-zinc-400 dark:text-pplx-muted mt-2 max-w-[280px]">
                          Ask the Agent to search something online, or enter a web address to load browser view.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Direct Interactions in mock-browser canvas footer */}
              {isConnected && frame && (
                <div className="flex flex-col border-t border-zinc-200 dark:border-zinc-850 bg-[#fbfbfb] dark:bg-[#070707] shrink-0 select-none">
                  
                  {/* Single beautiful compact bar with all buttons and controls inline */}
                  <div className="px-3 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                    
                    {/* Live indicator and main manual typist field */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1 shrink-0 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/20">
                        <span className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-500/80 animate-ping" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Live</span>
                      </div>

                      {/* Inline typing field form for mechanical input */}
                      <form onSubmit={handleSendText} className="flex-1 flex items-center gap-1">
                        <div className="relative flex-1 flex items-center">
                          <input
                            id="typing_helper_input"
                            type="text"
                            value={typingText}
                            onChange={(e) => setTypingText(e.target.value)}
                            className="w-full text-xs h-8 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-8 outline-none focus:ring-1 focus:ring-pplx-accent/50 focus:border-pplx-accent text-zinc-800 dark:text-zinc-100 font-sans tracking-wide transition-all placeholder-zinc-400 dark:placeholder-zinc-650"
                            placeholder="Scrie text sau apasă taste..."
                          />
                          <button
                            type="submit"
                            disabled={!typingText}
                            className="absolute right-1 leading-none p-1 bg-pplx-accent hover:opacity-90 disabled:opacity-30 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white dark:text-black rounded-md shrink-0 transition-opacity cursor-pointer flex items-center justify-center"
                            title="Submit Text"
                          >
                            <Send size={11} className={!typingText ? "text-zinc-500" : ""} />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Action controls button area (flexible wrapping) */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      
                      {/* Inline helper keys - Tab, Bksp */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickKey("Tab")}
                          className="text-[10px] h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 font-sans font-medium transition-all shadow-sm active:scale-95"
                          title="Tasta Tab"
                        >
                          Tab
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickKey("Backspace")}
                          className="text-[10px] h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 font-sans font-medium transition-all shadow-sm active:scale-95 flex items-center gap-1"
                          title="Tasta Backspace"
                        >
                          <span>Bksp</span>
                        </button>
                      </div>

                      {/* Cookie Auto bypass overlay button */}
                      <button
                        type="button"
                        onClick={handleBypassConsent}
                        disabled={isBypassing}
                        className={`flex items-center justify-center h-8 px-2.5 rounded-lg border text-xs cursor-pointer transition-all shadow-sm active:scale-95 ${
                          isBypassing 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                            : "bg-white dark:bg-[#0c0c0c] border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/20 hover:text-amber-700 dark:hover:text-amber-400"
                        }`}
                        title="Auto-Accept Cookie Walls"
                      >
                        {isBypassing ? (
                          <Loader2 size={12} className="animate-spin text-amber-500 mr-1" />
                        ) : (
                          <Cookie size={12} className="mr-1" />
                        )}
                        <span className="text-[10px] font-medium hidden xs:inline">Bypass Cookie</span>
                      </button>

                      {/* Web manual scroll triggers */}
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#0c0c0c] p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleScrollManual("up")}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-850 dark:text-zinc-450 dark:hover:text-zinc-200 transition-all active:scale-90"
                          title="Scroll Sus"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScrollManual("down")}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-850 dark:text-zinc-450 dark:hover:text-zinc-200 transition-all active:scale-90"
                          title="Scroll Jos"
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>

                      {/* Video Media controls */}
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#0c0c0c] p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={handleTogglePlay}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md text-zinc-650 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-90"
                          title={isPlaying ? "Pauză" : "Redă"}
                        >
                          {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md text-zinc-650 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-90"
                          title={isMuted ? "Sunet Pornit" : "Sunet Oprit"}
                        >
                          {isMuted ? <Volume2 size={11} /> : <VolumeX size={11} />}
                        </button>
                      </div>

                      {/* YouTube Skip Ad trigger */}
                      <button
                        type="button"
                        onClick={handleSkipAd}
                        className="flex items-center justify-center gap-1 px-2.5 h-8 rounded-lg bg-red-650/10 hover:bg-red-600/20 text-red-600 dark:text-red-450 border border-red-500/20 text-[10px] font-bold cursor-pointer transition-all shadow-sm active:scale-95"
                        title="Skip Ads YouTube"
                      >
                        <SkipForward size={11} />
                        <span className="hidden sm:inline font-medium">Skip Ad</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
