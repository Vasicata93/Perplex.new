import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Bell, LayoutDashboard, CheckCircle, MessageSquare, FileText, Calendar, LayoutGrid, X, Users, HardDrive, Globe, PanelLeftClose, Menu } from "lucide-react";
import { SidebarToggle } from "./SidebarToggle";
import { NotificationsPanel } from "./NotificationsPanel";
import { Tooltip } from "./Tooltip";
import { useAgentStore } from "../store/agentStore";
import { useLocalBackendStore } from "../store/useLocalBackendStore";
import { Thread, Note, CalendarEvent, Space } from "../types";
import { useNotificationsStore } from "../store/useNotificationsStore";
import { motion, AnimatePresence } from "framer-motion";

interface DesktopMenuBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  threads: Thread[];
  notes: Note[];
  events: CalendarEvent[];
  spaces: Space[];
  activeSpaceId?: string;
  activeThread?: Thread | null;
  isGenerating?: boolean;
  onSelectThread: (id: string) => void;
  onSelectNote: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onSelectSpace: (id: string) => void;
  onManageTeam?: () => void;
  isCompanionOpen?: boolean;
  onToggleCompanion?: () => void;
}

type ResultType = "chat" | "note" | "event" | "space";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  description?: string;
  date?: number;
  icon?: string;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({ 
  activeView, 
  setActiveView, 
  sidebarOpen, 
  onToggleSidebar, 
  searchQuery, 
  setSearchQuery,
  threads,
  notes,
  events,
  spaces,
  activeSpaceId,
  onSelectThread,
  onSelectNote,
  onSelectEvent,
  onSelectSpace,
  isCompanionOpen = false,
  onToggleCompanion,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { notifications } = useNotificationsStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const { isExecutionEngineConnected } = useLocalBackendStore();

  const agentMode = useAgentStore((state) => state.mode);
  
  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const isTeamActive = agentMode !== "idle" && activeSpace?.isTeamMode && activeSpace.subAgents && activeSpace.subAgents.length > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    threads.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.messages.some((m) => m.content.toLowerCase().includes(q))) {
        allResults.push({
          id: t.id,
          type: "chat",
          title: t.title || "Untitled Chat",
          description: t.messages[t.messages.length - 1]?.content.substring(0, 60) + "...",
          date: t.updatedAt,
        });
      }
    });

    notes.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        allResults.push({
          id: n.id,
          type: "note",
          title: n.title || "Untitled Page",
          description: n.content.substring(0, 60).replace(/[#*`]/g, "") + "...",
          date: n.updatedAt,
          icon: n.emoji,
        });
      }
    });

    events.forEach((e) => {
      if (e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)) {
        allResults.push({
          id: e.id,
          type: "event",
          title: e.title,
          description: e.description?.substring(0, 60),
          date: e.startDate,
        });
      }
    });

    spaces.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
        allResults.push({
          id: s.id,
          type: "space",
          title: s.title,
          description: s.description.substring(0, 60),
          date: s.createdAt,
          icon: s.emoji,
        });
      }
    });

    return allResults.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5);
  }, [searchQuery, threads, notes, events, spaces]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "chat": onSelectThread(result.id); break;
      case "note": onSelectNote(result.id); break;
      case "event": onSelectEvent(result.id); break;
      case "space": onSelectSpace(result.id); break;
    }
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const getIcon = (type: ResultType, icon?: string) => {
    if (icon) return <span className="text-[10px]">{icon}</span>;
    switch (type) {
      case "chat": return <MessageSquare size={10} className="text-blue-400" />;
      case "note": return <FileText size={10} className="text-emerald-400" />;
      case "event": return <Calendar size={10} className="text-amber-400" />;
      case "space": return <LayoutGrid size={10} className="text-purple-400" />;
    }
  };

  const formattedDate = currentTime.toLocaleDateString('ro-RO', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute top-0 left-0 right-0 h-10 z-50 hidden md:flex items-center justify-between px-4 bg-pplx-primary border-transparent text-xs font-medium text-pplx-text group">
      {/* Left side: Sidebar Toggle & System Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-pplx-hover rounded-lg text-pplx-muted hover:text-pplx-text transition-all flex items-center justify-center cursor-pointer"
          title={sidebarOpen ? "Închide Meniu" : "Deschide Meniu"}
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
        </button>
        
        {/* Workspace Title */}
        {activeSpace && (
          <div 
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-pplx-text hover:bg-pplx-hover transition-colors relative cursor-default"
            onMouseEnter={() => setHoveredTooltip("workspace")}
            onMouseLeave={() => setHoveredTooltip(null)}
          >
            <span>{activeSpace.emoji}</span>
            <span className="font-semibold text-[13px]">{activeSpace.title}</span>
            {hoveredTooltip === "workspace" && (
              <Tooltip text="Active Workspace" position="bottom" />
            )}
          </div>
        )}

        {/* Separator if Workspace exists */}
        {activeSpace && (
          <div className="w-[1px] h-4 bg-pplx-border opacity-50 mx-1"></div>
        )}

        {/* Agent Status */}
        <div 
          className="flex items-center gap-1.5 px-1 py-1 text-pplx-muted cursor-default relative"
          onMouseEnter={() => setHoveredTooltip("status")}
          onMouseLeave={() => setHoveredTooltip(null)}
        >
          <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
          <span className="capitalize text-[13.8px]">{agentMode || 'Idle'}</span>
          {hoveredTooltip === "status" && (
            <Tooltip text="System Status" position="bottom" />
          )}
        </div>
      </div>

      {/* Right side: Search, Icons, Date, Time */}
      <div className="flex items-center gap-3">
        {/* Team Status (Active Space Team) */}
        {activeSpace?.isTeamMode && (
          <div 
            className="relative" 
            onMouseEnter={() => setHoveredTooltip("team")}
            onMouseLeave={() => setHoveredTooltip(null)}
          >
            <button 
              onClick={() => {
                setActiveView("team_dashboard");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isTeamActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-transparent text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text'}`}
            >
              <Users size={16} className={isTeamActive ? 'animate-pulse' : ''} />
              <span className="font-semibold text-[13px]">{activeSpace.subAgents?.length || 0} Agents</span>
              {isTeamActive && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </button>
            {hoveredTooltip === "team" && (
              <Tooltip text="Org Chart & Team Status" position="bottom" />
            )}
          </div>
        )}
        
        {/* Separator if Team Status exists */}
        {activeSpace?.isTeamMode && (
          <div className="w-[1px] h-4 bg-pplx-border opacity-50 mx-1"></div>
        )}

        {/* Search */}
        <div 
          ref={searchContainerRef} 
          className="relative"
          onMouseEnter={() => !isSearchFocused && setHoveredTooltip("search")}
          onMouseLeave={() => setHoveredTooltip(null)}
        >
          <div 
            className={`bg-transparent hover:bg-pplx-hover border border-transparent hover:border-pplx-border/50 rounded-lg flex items-center px-3 py-1.5 transition-all ${isSearchFocused ? 'w-64 border-pplx-accent bg-pplx-primary shadow-lg ring-1 ring-pplx-accent/20' : 'w-[140px]'}`}
          >
            <Search size={16} className={`mr-2 shrink-0 ${isSearchFocused ? 'text-pplx-accent' : 'text-pplx-muted'}`} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsSearchFocused(true);
                setHoveredTooltip(null);
              }}
              className="bg-transparent border-none outline-none text-[13px] text-pplx-text flex-1 w-full"
            />
            {searchQuery && isSearchFocused && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-pplx-hover rounded-full text-pplx-muted"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {hoveredTooltip === "search" && !isSearchFocused && (
             <Tooltip text="Search across space" position="bottom" />
          )}

          {/* Results Dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-2 w-72 bg-pplx-card border border-pplx-border shadow-2xl rounded-xl overflow-hidden py-2"
              >
                {results.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-pplx-muted font-bold border-b border-pplx-border/50 mb-1">
                      Quick Results
                    </div>
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-start gap-3 px-3 py-2 hover:bg-pplx-hover transition-colors text-left group mx-1 rounded-lg"
                      >
                        <div className="w-8 h-8 shrink-0 bg-pplx-secondary/50 border border-pplx-border rounded-lg flex items-center justify-center group-hover:border-pplx-accent/30 transition-colors shadow-sm">
                          {getIcon(result.type, result.icon)}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center justify-between gap-2 overflow-hidden mb-1">
                            <span className="text-[12px] font-serif font-bold text-pplx-text truncate group-hover:text-pplx-accent transition-colors leading-none">{result.title}</span>
                            {result.date && (
                              <span className="text-[9px] font-black text-pplx-muted shrink-0 tabular-nums uppercase opacity-60">
                                {new Date(result.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-[10px] text-pplx-muted truncate font-light leading-snug opacity-80">{result.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    <div className="p-1 px-2 border-t border-pplx-border/50 mt-2">
                      <button
                        onClick={() => {
                          setActiveView("search");
                          setIsSearchFocused(false);
                        }}
                        className="w-full py-2 text-center text-[11px] font-black uppercase tracking-[0.1em] text-pplx-muted hover:text-pplx-accent hover:bg-pplx-hover rounded-lg transition-all"
                      >
                        Search across everything
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[11px] text-pplx-muted">No matches found for "{searchQuery}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-pplx-border opacity-50 mx-1"></div>

        {/* Buttons Group */}
        <div className="flex items-center gap-1">
           {/* Local Execution Node Icon */}
           {isExecutionEngineConnected && (
             <div className="relative">
               <button 
                 className="p-2 text-emerald-500 hover:bg-emerald-500/10 transition-colors rounded-lg flex items-center justify-center relative cursor-default"
                 onMouseEnter={() => setHoveredTooltip("local-node")}
                 onMouseLeave={() => setHoveredTooltip(null)}
               >
                 <HardDrive size={18} />
                 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
               </button>
               {hoveredTooltip === "local-node" && (
                  <Tooltip text="Local Control Active" position="bottom" />
               )}
             </div>
           )}

           {/* Task Icon */}
           <div className="relative">
             <button 
               className={`p-2 text-pplx-muted hover:text-pplx-text transition-colors rounded-lg hover:bg-pplx-hover ${activeView === "tasks" ? "text-pplx-text bg-pplx-hover/50 shadow-sm" : ""}`}
               onClick={() => setActiveView("tasks")}
               onMouseEnter={() => setHoveredTooltip("tasks-menu")}
               onMouseLeave={() => setHoveredTooltip(null)}
             >
               <CheckCircle size={18} />
             </button>
             {hoveredTooltip === "tasks-menu" && (
                <Tooltip text="Tasks" position="bottom" />
             )}
           </div>
   
           {/* Dashboard Icon */}
           <div className="relative">
             <button 
               className={`p-2 text-pplx-muted hover:text-pplx-text transition-colors rounded-lg hover:bg-pplx-hover ${activeView === "dashboard" ? "text-pplx-text bg-pplx-hover/50 shadow-sm" : ""}`}
               onClick={() => setActiveView("dashboard")}
               onMouseEnter={() => setHoveredTooltip("dashboard-menu")}
               onMouseLeave={() => setHoveredTooltip(null)}
             >
               <LayoutDashboard size={18} />
             </button>
             {hoveredTooltip === "dashboard-menu" && (
                <Tooltip text="System Dashboard" position="bottom" />
             )}
           </div>
   
           {/* Notification Bell */}
           <div className="relative">
             <button 
               className={`p-2 text-pplx-muted hover:text-pplx-text transition-colors relative rounded-lg hover:bg-pplx-hover ${showNotifications ? "text-pplx-text bg-pplx-hover shadow-sm" : ""}`}
               onClick={() => setShowNotifications(!showNotifications)}
               onMouseEnter={() => setHoveredTooltip("notifications")}
               onMouseLeave={() => setHoveredTooltip(null)}
             >
               <Bell size={18} />
               {unreadCount > 0 && (
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pplx-accent" />
               )}
             </button>
             {hoveredTooltip === "notifications" && !showNotifications && (
               <Tooltip text="Notifications" position="bottom" />
             )}
             <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
           </div>

           {/* Live Browser Button */}
           {onToggleCompanion && (
             <div className="relative">
               <button 
                 className={`p-2 text-pplx-muted hover:text-pplx-text transition-colors relative rounded-lg hover:bg-pplx-hover ${isCompanionOpen ? "text-pplx-text bg-pplx-hover shadow-sm" : ""}`}
                 onClick={onToggleCompanion}
                 onMouseEnter={() => setHoveredTooltip("companion_menu")}
                 onMouseLeave={() => setHoveredTooltip(null)}
               >
                 <Globe size={18} className={isCompanionOpen ? "animate-spin-[12s]" : ""} />
               </button>
               {hoveredTooltip === "companion_menu" && (
                 <Tooltip text="Live Browser" position="bottom" />
               )}
             </div>
           )}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-pplx-border opacity-50 mx-1"></div>

        {/* Date and Time */}
        <button 
          onClick={() => setActiveView("calendar")}
          className="flex items-center gap-2 tabular-nums text-[13px] font-semibold relative cursor-pointer px-2 py-1.5 rounded-lg hover:bg-pplx-hover/50 transition-colors"
          onMouseEnter={() => setHoveredTooltip("datetime")}
          onMouseLeave={() => setHoveredTooltip(null)}
        >
          <span className="text-pplx-muted group-hover:text-pplx-text transition-colors pointer-events-none capitalize">{formattedDate}</span>
          <span className="pointer-events-none">{formattedTime}</span>
          {hoveredTooltip === "datetime" && (
            <Tooltip text="Calendar" position="bottom" />
          )}
        </button>
      </div>
    </div>
  );
};

