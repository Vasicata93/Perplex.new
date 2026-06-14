import React, { useState, useEffect, useRef } from "react";
import {
  Library,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  MessageSquareText,
  Plus,
  SquarePen,
  Trash2,
  MoreHorizontal,
  Bot,
  Copy,
  FolderInput,
  ChevronLeft,
  Star,
  PanelLeftClose,
  FileText,
  Image,
  Video,
  File,
  Folder,
  Home,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { UI_STRINGS } from "../constants";
import { Tooltip } from "./Tooltip";
import { Thread, Space, Note, UserProfile } from "../types";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  threads: Thread[];
  spaces: Space[];
  notes: Note[];
  userProfile: UserProfile;
  activeThreadId: string | null;
  activeSpaceId: string | null;
  activeNoteId: string | null;
  activeView:
    | "chat"
    | "library"
    | "spaces"
    | "calendar"
    | "search"
    | "dashboard"
    | "tasks"
    | "trash"
    | "agent"
    | "team_dashboard"
    | "mix";
  onSelectThread: (id: string) => void;
  onSelectSpace: (id: string | null) => void; // null = home/default
  onSelectNote: (id: string) => void;
  onChangeView: (
    view:
      | "chat"
      | "library"
      | "spaces"
      | "calendar"
      | "search"
      | "dashboard"
      | "tasks"
      | "trash"
      | "agent",
  ) => void;
  onNewThread: () => void;
  onNewNote: (parentId?: string) => void;
  onNewSpace: (parentId?: string) => void;
  onOpenSpaceFiles?: (id: string) => void;
  onManageSpaces: (id?: string) => void;
  onDuplicateSpace: (id: string) => void;
  onDeleteSpace: (id: string) => void;
  openSettings: (tab?: string) => void;
  onDeleteThread: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onMoveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  showFavorites?: boolean;
  setShowFavorites?: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  sidebarWidth,
  setSidebarWidth,
  threads,
  spaces,
  notes,
  userProfile,
  activeThreadId,
  activeSpaceId,
  activeNoteId,
  activeView,
  onSelectThread,
  onSelectSpace,
  onSelectNote,
  onChangeView,
  onNewThread,
  onNewNote,
  onNewSpace,
  onOpenSpaceFiles,
  onManageSpaces,
  onDuplicateSpace,
  onDeleteSpace,
  openSettings,
  onDeleteThread,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  setSidebarOpen,
  expandedSection,
  setExpandedSection,
  showFavorites,
  setShowFavorites,
}) => {
  const [lang, setLang] = useState<"en" | "ro">("en");
  const [isResizing, setIsResizing] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // State for Library Item Menu
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [activeMenuSpaceId, setActiveMenuSpaceId] = useState<string | null>(
    null,
  );
  // const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when active
  useEffect(() => {
    if (activeView === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeView]);
  const spaceMenuRef = useRef<HTMLDivElement>(null);

  // Swipe to Close Logic
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    // If swipe is from right to left (deltaX < -50) and it's horizontal
    if (deltaX < -50 && Math.abs(deltaX) > deltaY) {
      setSidebarOpen(false);
    }
  };

  // State for Mobile Library Full Screen
  const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);
  const [mobileLibraryFilter, setMobileLibraryFilter] = useState<
    "all" | "favorites"
  >("all");

  // Effect to handle showFavorites prop
  useEffect(() => {
    if (showFavorites && setShowFavorites) {
      if (window.innerWidth < 768) {
        setIsMobileLibraryOpen(true);
        setMobileLibraryFilter("favorites");
      } else {
        setExpandedSection("library");
      }
      // Reset the trigger after handling
      setShowFavorites(false);
    }
  }, [showFavorites, setShowFavorites, setExpandedSection]);

  // Close mobile library when navigating away from library view or to a specific note
  useEffect(() => {
    if (activeView !== "library" || activeNoteId !== null) {
      setIsMobileLibraryOpen(false);
    }
  }, [activeView, activeNoteId]);

  // Listen to settings changes for language (hacky way to update without full context)
  useEffect(() => {
    const saved = localStorage.getItem("pplx_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.interfaceLanguage) setLang(parsed.interfaceLanguage);
    }
  }, [isOpen]); // Update when sidebar opens/closes

  const t = UI_STRINGS[lang] || UI_STRINGS.en;

  const categoriesList = [
    { id: "all", label: lang === "ro" ? "Recente" : "Recents", icon: <Library size={13} className="text-gray-400" /> },
    { id: "favorites", label: lang === "ro" ? "Favorite" : "Favorites", icon: <Star size={13} className="text-red-400 fill-red-400" /> },
    { id: "notes", label: lang === "ro" ? "Notițe" : "Notes", icon: <FileText size={13} className="text-[#00ffff]" /> },
    { id: "image", label: lang === "ro" ? "Imagini" : "Images", icon: <Image size={13} className="text-blue-400" /> },
    { id: "video", label: lang === "ro" ? "Videoclipuri" : "Videos", icon: <Video size={13} className="text-purple-400" /> },
    { id: "pdf", label: lang === "ro" ? "PDF-uri" : "PDFs", icon: <File size={13} className="text-red-400" /> },
    { id: "docs", label: lang === "ro" ? "Documente" : "Docs", icon: <Folder size={13} className="text-amber-400" /> },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuNoteId(null);
      }
      if (
        spaceMenuRef.current &&
        !spaceMenuRef.current.contains(event.target as Node)
      ) {
        setActiveMenuSpaceId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Support both left (0) and right (2) click for resizing as per user request
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth = e.clientX;

      // Allow shrinking completely (to 0) or to icons-only range (46px to 70px)
      if (newWidth < 30) {
        newWidth = 0;
      } else if (newWidth < 100) {
        // Flexible icons-only width between 46px and 70px
        newWidth = Math.max(46, Math.min(newWidth, 70));
      }

      if (newWidth > 600) newWidth = 600;

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.cursor = "default";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    // Auto-collapse logic removed as per user request
    return () => {};
  }, []);

  const currentWidth = sidebarWidth;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[150] bg-pplx-sidebar shadow-[4px_0_24px_rgba(0,0,0,0.5)] h-full
    w-[280px] max-w-[85vw] md:w-[var(--sidebar-width)] md:max-w-none md:static md:shadow-none md:translate-x-0
    md:my-3 md:ml-3 md:mr-1 md:h-[calc(100%-24px)] md:rounded-r-xl md:rounded-l-xl md:border md:border-pplx-border/50
    rounded-r-[24px] md:rounded-r-xl
    ${isOpen ? "translate-x-0 md:w-[var(--sidebar-width)] border-r border-pplx-border/30" : "-translate-x-full md:w-0 md:border-transparent md:overflow-hidden md:ml-0 md:my-0 md:h-full md:border-l-0"}
    flex flex-col
    ${!isResizing ? "transition-all duration-150 cubic-bezier(0.4, 0, 0.2, 1)" : ""}
  `;

  const handleNavClick = (action?: () => void) => {
    if (action) action();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Generate User Initials
  const getUserInitials = (name: string) => {
    return name ? name.substring(0, 1).toUpperCase() : "U";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] md:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={sidebarClasses}
        style={
          { "--sidebar-width": `${currentWidth}px` } as React.CSSProperties
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-pplx-accent/50 transition-colors z-50 hidden md:block"
        />

        <div className="h-full flex flex-col overflow-hidden w-full md:w-[var(--sidebar-width)]">
          {/* Top Profile / Settings Section (replaces Hermes) */}
          <div className="pt-5 pb-3 px-4 md:pt-4 md:pb-2 md:px-3 shrink-0">
            <div
              className={`text-sm text-pplx-text flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-2"} py-2 rounded-lg transition-colors group cursor-pointer hover:bg-pplx-hover`}
            >
              <div 
                onClick={() => openSettings("profile")}
                className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : "flex-1"} truncate`}
              >
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-pplx-primary flex items-center justify-center text-pplx-text text-[17px] font-bold shrink-0 border border-pplx-border">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getUserInitials(userProfile.name)
                  )}
                </div>
                {!isCollapsed && (
                  <span className="font-medium truncate text-[19px]">
                    {userProfile.name || "User"}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSettings();
                    }}
                    onMouseEnter={() => setHoveredTooltip("settings")}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary rounded-md transition-colors active:scale-90 shrink-0"
                  >
                    <Settings size={21} />
                  </button>
                  {hoveredTooltip === "settings" && (
                    <Tooltip text="Settings" position="right" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Nav */}
          <nav
            className={`flex-1 overflow-y-auto no-scrollbar pt-0.5 pb-2 ${isCollapsed ? "px-1" : "px-3"} space-y-1 overscroll-contain`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Chat (History) */}
            <div className="flex flex-col">
              <div className="flex flex-col w-full group relative">
                <NavItem
                  icon={<MessageSquareText size={20} />}
                  label={t.chat}
                  onClick={() => {
                    toggleSection("chat");
                    onChangeView("chat");
                  }}
                  isOpen={expandedSection === "chat"}
                  active={
                    activeView === "chat" &&
                    (!!activeThreadId || expandedSection === "chat")
                  }
                  isCollapsed={isCollapsed}
                  actions={!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeView("chat");
                        onNewThread();
                        if (expandedSection !== "chat") toggleSection("chat");
                      }}
                      onMouseEnter={() => setHoveredTooltip("new-chat")}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors active:scale-90"
                    >
                      <SquarePen size={16} />
                      {hoveredTooltip === "new-chat" && (
                        <Tooltip text="New Conversation" position="right" />
                      )}
                    </button>
                  )}
                />
              </div>

              {expandedSection === "chat" && !isCollapsed && (
                <div className="ml-4 pl-2.5 border-l border-pplx-border space-y-0.5 mt-0.5 animate-fadeIn duration-150">
                  {threads.filter((t) => !t.spaceId).length === 0 && (
                    <div className="px-2 py-1.5 text-[10px] text-pplx-muted">
                      {t.noHistory}
                    </div>
                  )}
                  {threads
                    .filter((t) => !t.spaceId)
                    .slice(0, 10)
                    .map((thread) => (
                      <div
                        key={thread.id}
                        className="relative group flex items-center"
                      >
                        <button
                          onClick={() =>
                            handleNavClick(() => {
                              onChangeView("chat");
                              onSelectThread(thread.id);
                            })
                          }
                          className={`w-full text-left flex items-start space-x-2 px-2 py-2 text-xs rounded-lg transition-colors leading-normal pr-7 ${
                            activeThreadId === thread.id
                              ? "bg-pplx-hover text-pplx-text font-medium"
                              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
                          }`}
                        >
                          <span className="truncate text-sm">
                            {thread.title}
                          </span>
                        </button>
                        {/* Discrete Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="absolute right-1.5 p-1 text-pplx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-pplx-hover active:scale-90"
                          title="Delete chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            
            {/* Workspace & Threads */}
            <div className="h-px bg-pplx-border/50 my-2 mx-3" />
            
            {/* Spaces Accordion (Moved above Library) */}
            <div
              className={`flex flex-col ${activeMenuSpaceId ? "z-[110] relative pointer-events-none" : ""}`}
            >
              <div className="flex items-center w-full group relative">
                <NavItem
                  icon={<LayoutGrid size={20} />}
                  label={t.spaces}
                  onClick={() => {
                    handleNavClick(() => {
                      if (expandedSection !== "spaces") toggleSection("spaces");
                      onChangeView("spaces");
                    });
                  }}
                  onChevronClick={() => toggleSection("spaces")}
                  hasChevron={!isCollapsed}
                  isOpen={expandedSection === "spaces"}
                  active={activeView === "spaces"}
                  isCollapsed={isCollapsed}
                  actions={!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewSpace();
                        if (expandedSection !== "spaces") toggleSection("spaces");
                      }}
                      onMouseEnter={() => setHoveredTooltip("new-space")}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <Plus size={16} />
                      {hoveredTooltip === "new-space" && (
                        <Tooltip text="New Space" position="right" />
                      )}
                    </button>
                  )}
                />
              </div>

              {expandedSection === "spaces" && !isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-1 animate-fadeIn duration-150 relative">
                  {spaces
                    .filter((s) => !s.parentId)
                    .map((space) => (
                      <SpaceItem
                        key={space.id}
                        space={space}
                        allSpaces={spaces}
                        activeSpaceId={activeSpaceId}
                        onSelectSpace={(id: string | null) =>
                          handleNavClick(() => {
                            onChangeView("chat");
                            onSelectSpace(id);
                          })
                        }
                        onDuplicateSpace={onDuplicateSpace}
                        onDeleteSpace={onDeleteSpace}
                        onEditSpace={onManageSpaces}
                        onOpenSpaceFiles={onOpenSpaceFiles}
                        activeMenuSpaceId={activeMenuSpaceId}
                        setActiveMenuSpaceId={setActiveMenuSpaceId}
                        menuRef={spaceMenuRef}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Library (Pages/Notes) */}
            <div
              className={`flex flex-col ${activeMenuNoteId ? "z-[110] relative pointer-events-none" : ""}`}
            >
              <div className="flex items-center w-full group relative">
                <NavItem
                  icon={<Library size={20} />}
                  label={t.library}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                      setIsMobileLibraryOpen(true);
                      setMobileLibraryFilter("all");
                    } else {
                      if (expandedSection !== "library") toggleSection("library");
                      onSelectNote(""); // Reset active note to view library root
                      onChangeView("library");
                    }
                  }}
                  onChevronClick={() => toggleSection("library")}
                  hasChevron={!isCollapsed}
                  isOpen={expandedSection === "library"}
                  active={activeView === "library"}
                  isCollapsed={isCollapsed}
                  actions={!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewNote();
                        if (expandedSection !== "library") toggleSection("library");
                      }}
                      onMouseEnter={() => setHoveredTooltip("new-page")}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <Plus size={16} />
                      {hoveredTooltip === "new-page" && (
                        <Tooltip text="New Page" position="right" />
                      )}
                    </button>
                  )}
                />
              </div>

              {expandedSection === "library" && !isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-1 animate-fadeIn duration-150 relative">
                  
                  {/* Favorites Section */}
                  {notes.some((n) => n.isFavorite && (n.category === "notes" || n.category === "docs" || !n.category || n.category === "none") && n.emoji !== "📁") && (
                    <div className="mb-3 mt-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-pplx-muted uppercase tracking-wider flex items-center gap-1.5 opacity-70">
                        <Star
                          size={10}
                          className="text-yellow-400 fill-yellow-400"
                        />{" "}
                        {lang === "ro" ? "FAVORITE" : "FAVORITES"}
                      </div>
                      {notes
                        .filter((n) => n.isFavorite && (n.category === "notes" || n.category === "docs" || !n.category || n.category === "none") && n.emoji !== "📁")
                        .map((note) => (
                          <NoteItem
                            key={`fav-${note.id}`}
                            note={note}
                            allNotes={notes}
                            activeNoteId={activeNoteId}
                            onSelectNote={(id: string) =>
                              handleNavClick(() => onSelectNote(id))
                            }
                            onDuplicateNote={onDuplicateNote}
                            onMoveNote={onMoveNote}
                            onDeleteNote={onDeleteNote}
                            onNewNote={onNewNote}
                            activeMenuNoteId={activeMenuNoteId}
                            setActiveMenuNoteId={setActiveMenuNoteId}
                            menuRef={menuRef}
                          />
                        ))}
                      <div className="h-px bg-pplx-border/50 my-2 mx-3" />
                    </div>
                  )}

                  {/* Pages Header */}
                  <div className="px-3 py-1 text-[10px] font-bold text-pplx-muted uppercase tracking-wider flex items-center gap-1.5 opacity-70">
                    📄 {lang === "ro" ? "PAGINI" : "PAGES"}
                  </div>

                  {notes.filter((n) => !n.parentId && (n.category === "notes" || n.category === "docs" || !n.category || n.category === "none") && n.emoji !== "📁").length === 0 && (
                    <div className="px-3 py-2 text-xs text-pplx-muted italic">
                      {t.noPages}
                    </div>
                  )}
                  {notes
                    .filter((n) => !n.parentId && (n.category === "notes" || n.category === "docs" || !n.category || n.category === "none") && n.emoji !== "📁")
                    .map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        allNotes={notes}
                        activeNoteId={activeNoteId}
                        onSelectNote={(id: string) =>
                          handleNavClick(() => onSelectNote(id))
                        }
                        onDuplicateNote={onDuplicateNote}
                        onMoveNote={onMoveNote}
                        onDeleteNote={onDeleteNote}
                        onNewNote={onNewNote}
                        activeMenuNoteId={activeMenuNoteId}
                        setActiveMenuNoteId={setActiveMenuNoteId}
                        menuRef={menuRef}
                      />
                    ))}
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Area (Recycle Bin, Profile/Settings) */}
          <div
            className={`pb-4 ${isCollapsed ? "flex flex-col items-center px-1" : "px-3"} shrink-0 bg-pplx-sidebar pt-2`}
          >
            <div className={`flex ${isCollapsed ? "flex-col items-center gap-2" : "flex-row items-center justify-between px-2"} w-full mb-1`}>
              <div className="relative">
                <button
                  onClick={() => handleNavClick(() => onChangeView("trash"))}
                  onMouseEnter={() => setHoveredTooltip("trash")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors active:scale-95 ${activeView === "trash" ? "text-pplx-accent bg-pplx-hover" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover"}`}
                >
                  <Trash2 size={isCollapsed ? 23 : 20} />
                  {!isCollapsed && <span className="text-sm font-medium">Trash</span>}
                </button>
                {hoveredTooltip === "trash" && (
                  <Tooltip text="Trash" position="right" />
                )}
              </div>
            </div>

            {/* Profile / Settings Button removed from bottom to be unified at top */}
          </div>
        </div>

        {/* Floating Green Mobile New Chat Button */}
        {isOpen && (
          <button
            onClick={() => {
              onChangeView("chat");
              onSelectSpace(null);
              onNewThread();
              setSidebarOpen(false);
            }}
            className="md:hidden absolute bottom-5 right-5 z-[160] flex items-center justify-center gap-1.5 bg-[#10a37f] hover:bg-[#10a37f]/90 text-white font-bold px-3.5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(16,163,127,0.3)] active:scale-95 transition-all text-xs border border-[#10a37f] scale-[0.8] origin-bottom-right"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Conversație nouă</span>
          </button>
        )}
      </div>
      {isMobileLibraryOpen && (
        <div className="fixed inset-0 z-[150] bg-[#121212] flex flex-col md:hidden overflow-x-hidden text-white font-sans animate-in slide-in-from-bottom-4 duration-150 select-none pb-28">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 bg-[#121212] z-10 border-b border-white/[0.03]">
            {/* Round User Avatar & Title Group */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => {
                  openSettings("profile");
                  setIsMobileLibraryOpen(false);
                  setSidebarOpen(false);
                }}
                className="w-9 h-9 rounded-full overflow-hidden bg-white/5 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-white/10 active:scale-90 transition-transform cursor-pointer"
              >
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getUserInitials(userProfile.name)
                )}
              </div>
              <span className="text-base font-semibold tracking-tight text-white/95">Library</span>
            </div>

            {/* Muted Close Button */}
            <button
              onClick={() => setIsMobileLibraryOpen(false)}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full active:scale-90 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-16 px-5 space-y-6 pt-3">
            {/* Recents Section */}
            <div className="flex flex-col">
              <h3 className="text-white/40 text-[11px] font-semibold tracking-wider uppercase mb-3">
                Recents
              </h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 snap-x scroll-smooth">
                {[...notes]
                  .filter((n) => n.category !== "folder" && n.emoji !== "📁")
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .slice(0, 5)
                  .map((note) => (
                    <div
                      key={`recent-card-${note.id}`}
                      onClick={() => {
                        onSelectNote(note.id);
                        setIsMobileLibraryOpen(false);
                      }}
                      className="flex-shrink-0 w-[110px] h-[95px] bg-[#18181a] border border-[#2d2d2d] rounded-[14px] overflow-hidden flex flex-col snap-start cursor-pointer active:scale-95 transition-transform shadow-lg relative"
                    >
                      {/* Card Header Top portion */}
                      <div className="h-[52%] w-full bg-[#1e1e21] flex items-center justify-center relative border-b border-[#2d2d2d]/30">
                        {note.cover && (
                          <img
                            src={note.cover}
                            alt=""
                            className="w-full h-full object-cover opacity-30 absolute inset-0"
                          />
                        )}
                        <span className="text-lg drop-shadow-md">
                          {note.emoji || "📄"}
                        </span>
                      </div>
                      {/* Card title lower portion */}
                      <div className="p-2 h-[48%] flex flex-col justify-center bg-[#131315]">
                        <span className="text-[10px] font-medium text-white/90 line-clamp-2 leading-tight">
                          {note.title || "Untitled"}
                        </span>
                      </div>
                    </div>
                  ))}
                {[...notes].filter((n) => n.category !== "folder" && n.emoji !== "📁").length === 0 && (
                  <div className="text-xs text-white/40 italic py-2">No recent documents.</div>
                )}
              </div>
            </div>

            {/* Favourites Section */}
            <div className="flex flex-col">
              <h3 className="text-white/40 text-[11px] font-semibold tracking-wider uppercase mb-2">
                Favourites
              </h3>
              <div className="flex flex-col">
                {notes
                  .filter((n) => n.isFavorite && n.category !== "folder" && n.emoji !== "📁")
                  .map((note) => (
                    <div
                      key={`fav-row-${note.id}`}
                      onClick={() => {
                        onSelectNote(note.id);
                        setIsMobileLibraryOpen(false);
                      }}
                      className="flex items-center justify-between py-2.5 border-b border-white/5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ChevronRight size={14} className="text-white/30 shrink-0" />
                        <span className="text-base shrink-0 select-none">
                          {note.emoji || "📄"}
                        </span>
                        <span className="text-sm font-medium text-white/90 truncate">
                          {note.title || "Untitled"}
                        </span>
                      </div>
                      
                      {/* Row Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuNoteId(
                              activeMenuNoteId === note.id ? null : note.id
                            );
                          }}
                          className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 active:scale-90 transition-all shrink-0"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewNote(note.id);
                          }}
                          className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 active:scale-90 transition-all shrink-0"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Popup Menu */}
                      {activeMenuNoteId === note.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-10 z-[160] w-40 border border-white/10 shadow-2xl rounded-xl overflow-hidden bg-[#1a1a1c] pointer-events-auto text-left"
                        >
                          <div className="flex flex-col py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                            >
                              <Copy size={12} /> Duplicate
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                            >
                              <FolderInput size={12} /> Move
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {notes.filter((n) => n.isFavorite && n.category !== "folder" && n.emoji !== "📁").length === 0 && (
                  <div className="text-xs text-white/40 italic py-2 pl-6">No starred documents.</div>
                )}
              </div>
            </div>

            {/* Private Section (All other non-folder notes) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                <span className="text-white/40 text-[11px] font-semibold tracking-wider uppercase">Private</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1 text-white/40 hover:text-white rounded transition-colors active:scale-90"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewNote();
                    }}
                    className="p-1 text-white/40 hover:text-white rounded transition-colors active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                {notes
                  .filter((n) => !n.parentId && n.category !== "folder" && n.emoji !== "📁")
                  .map((note) => (
                    <div
                      key={`private-row-${note.id}`}
                      onClick={() => {
                        onSelectNote(note.id);
                        setIsMobileLibraryOpen(false);
                      }}
                      className="flex items-center justify-between py-2.5 border-b border-white/5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ChevronRight size={14} className="text-white/30 shrink-0" />
                        <span className="text-base shrink-0 select-none">
                          {note.emoji || "📄"}
                        </span>
                        <span className="text-sm font-medium text-white/90 truncate">
                          {note.title || "Untitled"}
                        </span>
                      </div>
                      
                      {/* Row Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuNoteId(
                              activeMenuNoteId === note.id ? null : note.id
                            );
                          }}
                          className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 active:scale-90 transition-all shrink-0"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewNote(note.id);
                          }}
                          className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 active:scale-90 transition-all shrink-0"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Popup Menu */}
                      {activeMenuNoteId === note.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-10 z-[160] w-40 border border-[#2d2d2d] shadow-2xl rounded-xl overflow-hidden bg-[#1a1a1c] pointer-events-auto text-left"
                        >
                          <div className="flex flex-col py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                            >
                              <Copy size={12} /> Duplicate
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                            >
                              <FolderInput size={12} /> Move
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                                setActiveMenuNoteId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {notes.filter((n) => !n.parentId && n.category !== "folder" && n.emoji !== "📁").length === 0 && (
                  <div className="text-xs text-white/40 italic py-2 pl-6">No private documents.</div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Bottom Control Bar - Glassmorphism, transparent wrapper, individual rounded items */}
          <div className="absolute bottom-5 left-5 right-5 z-[151] flex items-center gap-3 bg-transparent p-0 border-none rounded-none shadow-none pointer-events-none">
            {/* Search Button */}
            <button
              onClick={() => {
                if (activeView === "library" && activeNoteId) {
                  window.dispatchEvent(new CustomEvent("trigger-page-search"));
                } else {
                  onChangeView("search");
                }
                setIsMobileLibraryOpen(false);
                setSidebarOpen(false);
              }}
              className="pointer-events-auto w-11 h-11 rounded-full bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90 shadow-2xl shrink-0"
            >
              <Search size={18} />
            </button>
            
            {/* Ask AI Capsule */}
            <button
              onClick={() => {
                onChangeView("chat");
                setIsMobileLibraryOpen(false);
                setSidebarOpen(false);
              }}
              className="pointer-events-auto flex-1 h-11 px-4 bg-[#1c1c1e] border border-white/10 rounded-full flex items-center justify-center gap-2 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all shadow-2xl"
            >
              <Sparkles size={14} className="text-[#00ffff]" />
              <span>Ask AI</span>
            </button>

            {/* Compose Button (SquarePen) */}
            <button
              onClick={() => {
                onNewNote();
                setIsMobileLibraryOpen(false);
                setSidebarOpen(false);
              }}
              className="pointer-events-auto w-11 h-11 rounded-full bg-[#00ffff] flex items-center justify-center text-black hover:bg-[#00ffff]/90 transition-all active:scale-90 shadow-[0_0_15px_rgba(0,255,255,0.25)] shrink-0"
            >
              <SquarePen size={18} />
            </button>
          </div>
        </div>
      )}
      {(activeMenuNoteId || activeMenuSpaceId) && (
        <div
          className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setActiveMenuNoteId(null);
            setActiveMenuSpaceId(null);
          }}
        />
      )}
    </>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  onChevronClick,
  hasChevron = false,
  isOpen = false,
  isCollapsed = false,
  actions,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onChevronClick?: () => void;
  hasChevron?: boolean;
  isOpen?: boolean;
  isCollapsed?: boolean;
  actions?: React.ReactNode;
}) => (
  <div
    className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "px-1.5"} py-0.5 rounded-lg text-sm transition-colors group relative ${
      active ? "bg-pplx-hover" : "hover:bg-pplx-hover"
    }`}
  >
    <button
      onClick={onClick}
      className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-2.5 px-1"} flex-1 text-left py-2 active:scale-[0.98]`}
    >
      <span
        className={`${active ? "text-pplx-accent" : "text-pplx-muted group-hover:text-pplx-text"} flex items-center justify-center w-8 shrink-0`}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span
          className={`flex-1 text-sm ${active ? "text-pplx-text font-medium" : "text-pplx-muted group-hover:text-pplx-text"} truncate`}
        >
          {label}
        </span>
      )}
    </button>
    {!isCollapsed && actions && (
      <div className="flex items-center mr-1">
        {actions}
      </div>
    )}
    {hasChevron && !isCollapsed && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onChevronClick) onChevronClick();
          else if (onClick) onClick();
        }}
        className="text-pplx-muted transition-opacity p-1.5 hover:bg-pplx-secondary rounded-md active:scale-90"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
    )}
  </div>
);

// Space Item Component for Sidebar
const SpaceItem = ({
  space,
  allSpaces,
  level = 0,
  activeSpaceId,
  onSelectSpace,
  onDuplicateSpace,
  onDeleteSpace,
  onEditSpace,
  onOpenSpaceFiles,
  activeMenuSpaceId,
  setActiveMenuSpaceId,
  menuRef,
  isMobile = false,
}: any) => {
  const children = allSpaces.filter((s: Space) => s.parentId === space.id);
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative group flex items-center w-full ${activeMenuSpaceId === space.id ? "z-[100]" : "z-0"}`}
      >
        {/* Chevron */}
        <div className="w-6 flex justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <button
          onClick={() => onSelectSpace(space.id)}
          className={`flex-1 min-w-0 flex items-center space-x-2 py-2 pr-14 rounded-lg text-xs transition-colors text-left active:scale-[0.98] ${
            activeSpaceId === space.id
              ? "bg-pplx-hover text-pplx-text font-medium"
              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
          }`}
        >
          <span className="text-base leading-none shrink-0">
            {space.emoji || "📁"}
          </span>
          <span className="truncate text-sm flex-1">
            {space.title || "Untitled"}
          </span>
        </button>

        <div
          className={`absolute right-1 flex items-center ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {/* Plus Button for Uploading/Managing Files */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSpaceFiles) onOpenSpaceFiles(space.id);
            }}
            className="p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90"
            title="Upload Files"
          >
            <Plus size={16} />
          </button>

          {/* Discrete More Options Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuSpaceId(
                activeMenuSpaceId === space.id ? null : space.id,
              );
            }}
            className={`p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90 ${activeMenuSpaceId === space.id ? "bg-pplx-hover text-pplx-text" : ""}`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Popup Menu for Space Items */}
        {activeMenuSpaceId === space.id && (
          <div
            ref={menuRef}
            className="absolute right-8 top-8 z-[120] w-40 border border-pplx-border shadow-2xl rounded-lg overflow-hidden animate-fadeIn duration-150 bg-white dark:bg-[#191a1a] pointer-events-auto"
            style={{ opacity: 1 }}
          >
            <div className="flex flex-col py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Settings size={12} /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Copy size={12} /> Duplicate
              </button>
              <div className="h-px bg-pplx-border/50 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-pplx-hover text-left"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-3 border-l border-pplx-border/50 pl-1 flex flex-col">
          {children.map((child: Space) => (
            <SpaceItem
              key={child.id}
              space={child}
              allSpaces={allSpaces}
              level={level + 1}
              activeSpaceId={activeSpaceId}
              onSelectSpace={onSelectSpace}
              onDuplicateSpace={onDuplicateSpace}
              onDeleteSpace={onDeleteSpace}
              onEditSpace={onEditSpace}
              onOpenSpaceFiles={onOpenSpaceFiles}
              activeMenuSpaceId={activeMenuSpaceId}
              setActiveMenuSpaceId={setActiveMenuSpaceId}
              menuRef={menuRef}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NoteItem = ({
  note,
  allNotes,
  level = 0,
  activeNoteId,
  onSelectNote,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  onNewNote,
  activeMenuNoteId,
  setActiveMenuNoteId,
  menuRef,
  isMobile = false,
}: any) => {
  const children = allNotes.filter((n: Note) => n.parentId === note.id);
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative group flex items-center w-full ${activeMenuNoteId === note.id ? "z-[100]" : "z-0"}`}
      >
        {/* Chevron */}
        <div className="w-6 flex justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <button
          onClick={() => onSelectNote(note.id)}
          className={`flex-1 min-w-0 flex items-center space-x-2 py-2 pr-14 rounded-lg text-xs transition-colors text-left active:scale-[0.98] ${
            activeNoteId === note.id
              ? "bg-pplx-hover text-pplx-text font-medium"
              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
          }`}
        >
          <span className="text-base leading-none shrink-0">
            {note.emoji || "📄"}
          </span>
          <span className="truncate text-sm flex-1">
            {note.title || "Untitled"}
          </span>
        </button>

        <div
          className={`absolute right-1 flex items-center ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {/* Plus Button for Nested Page */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNewNote) onNewNote(note.id);
              setIsExpanded(true);
            }}
            className="p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90"
          >
            <Plus size={16} />
          </button>

          {/* Discrete More Options Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuNoteId(
                activeMenuNoteId === note.id ? null : note.id,
              );
            }}
            className={`p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90 ${activeMenuNoteId === note.id ? "bg-pplx-hover text-pplx-text" : ""}`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Popup Menu for Library Items */}
        {activeMenuNoteId === note.id && (
          <div
            ref={menuRef}
            className="absolute right-8 top-8 z-[120] w-40 border border-pplx-border shadow-2xl rounded-lg overflow-hidden animate-fadeIn duration-150 bg-white dark:bg-[#191a1a] pointer-events-auto"
            style={{ opacity: 1 }}
          >
            <div className="flex flex-col py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <FolderInput size={12} /> Move
              </button>
              <div className="h-px bg-pplx-border/50 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-pplx-hover text-left"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-3 border-l border-pplx-border/50 pl-1 flex flex-col">
          {children.map((child: Note) => (
            <NoteItem
              key={child.id}
              note={child}
              allNotes={allNotes}
              level={level + 1}
              activeNoteId={activeNoteId}
              onSelectNote={onSelectNote}
              onDuplicateNote={onDuplicateNote}
              onMoveNote={onMoveNote}
              onDeleteNote={onDeleteNote}
              onNewNote={onNewNote}
              activeMenuNoteId={activeMenuNoteId}
              setActiveMenuNoteId={setActiveMenuNoteId}
              menuRef={menuRef}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
