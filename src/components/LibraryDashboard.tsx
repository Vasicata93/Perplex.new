import React, { useState, useMemo, useRef, useEffect } from "react";
import { Note } from "../types";
import { 
  FileText, Plus, Clock, Trash2, LayoutGrid, List, ChevronRight, ChevronDown, 
  Lock, Image as ImageIcon, Video as VideoIcon, File, FolderOpen, Upload, User,
  FolderPlus, Download, Edit2, Save, X, Search, Heart, ArrowLeft, Move, HelpCircle,
  Eye, Check, FolderOpen as FolderIcon
} from "lucide-react";

interface LibraryDashboardProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: (
    parentId?: string,
    initialContent?: string,
    initialTags?: string[],
    initialTitle?: string,
    initialCategory?: string,
    initialEmoji?: string
  ) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote?: (note: Note) => void;
  currentFolderId?: string | null;
  setCurrentFolderId?: (id: string | null) => void;
}

const determineCategory = (filename: string): "image" | "video" | "pdf" | "docs" | "others" => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) {
    return "image";
  }
  if (["mp4", "mov", "avi", "mkv", "webm", "3gp", "flv", "wmv"].includes(ext)) {
    return "video";
  }
  if (ext === "pdf") {
    return "pdf";
  }
  if (["docx", "doc", "txt", "md", "xlsx", "xls", "pptx", "ppt", "csv", "json", "rtf", "tsv", "ini", "yaml", "yml", "xml", "html", "css", "js", "ts", "jsx", "tsx"].includes(ext)) {
    return "docs";
  }
  return "others";
};

const getEmojiForCategory = (category: string): string => {
  switch (category) {
    case "image": return "🖼️";
    case "video": return "🎥";
    case "pdf": return "📕";
    case "docs": return "📄";
    case "folder": return "📁";
    default: return "📦";
  }
};

const getUploadButtonText = (filter: string, lang: "en" | "ro"): string => {
  if (lang === "ro") {
    switch (filter) {
      case "image": return "Încarcă Imagine";
      case "video": return "Încarcă Video";
      case "pdf": return "Încarcă PDF";
      case "docs": return "Încarcă Document";
      default: return "Încarcă Fișiere";
    }
  } else {
    switch (filter) {
      case "image": return "Upload Image";
      case "video": return "Upload Video";
      case "pdf": return "Upload PDF";
      case "docs": return "Upload Document";
      default: return "Upload Files";
    }
  }
};

const getUploadAccept = (filter: string): string => {
  switch (filter) {
    case "image": return "image/*";
    case "video": return "video/*";
    case "pdf": return "application/pdf";
    case "docs": return ".docx,.doc,.txt,.md,.xlsx,.xls,.pptx,.ppt,.csv,.json,.rtf,.tsv,.ini,.yaml,.yml,.xml,.html,.css,.js,.ts,.jsx,.tsx";
    default: return "";
  }
};

export const LibraryDashboard: React.FC<LibraryDashboardProps> = ({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  currentFolderId: currentFolderIdProp,
  setCurrentFolderId: setCurrentFolderIdProp,
}) => {
  const [filter, setFilter] = useState<"all" | "favorites" | "notes" | "image" | "video" | "pdf" | "docs" | "others">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [localCurrentFolderId, setLocalCurrentFolderId] = useState<string | null>(null);
  
  const currentFolderId = currentFolderIdProp !== undefined ? currentFolderIdProp : localCurrentFolderId;
  const setCurrentFolderId = (id: string | null) => {
    if (setCurrentFolderIdProp) {
      setCurrentFolderIdProp(id);
    } else {
      setLocalCurrentFolderId(id);
    }
  };
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<"en" | "ro">("en");

  useEffect(() => {
    const saved = localStorage.getItem("pplx_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.interfaceLanguage) setLang(parsed.interfaceLanguage);
    }
    
    const handleSettingsUpdate = () => {
      const currentSaved = localStorage.getItem("pplx_settings");
      if (currentSaved) {
        const parsed = JSON.parse(currentSaved);
        if (parsed.interfaceLanguage) setLang(parsed.interfaceLanguage);
      }
    };
    
    window.addEventListener("pplx_settings_changed", handleSettingsUpdate);
    return () => window.removeEventListener("pplx_settings_changed", handleSettingsUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem("pplx_library_filter", filter);
  }, [filter]);

  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setFilter(customEvent.detail as any);
      }
    };
    window.addEventListener("pplx_library_filter_changed", handleFilterChange);
    
    const savedFilter = localStorage.getItem("pplx_library_filter");
    if (savedFilter) {
      setFilter(savedFilter as any);
    }
    
    return () => {
      window.removeEventListener("pplx_library_filter_changed", handleFilterChange);
    };
  }, []);

  // Popups and Actions States
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [renameNoteId, setRenameNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingNote, setMovingNote] = useState<Note | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTextContent, setEditTextContent] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const category = determineCategory(file.name);
          const emoji = getEmojiForCategory(category);
          onCreateNote(
            currentFolderId || undefined, // parentId
            content, // initialContent
            [category], // initialTags
            file.name, // initialTitle
            category, // initialCategory
            emoji // initialEmoji
          );
        };
        const ext = file.name.toLowerCase().split('.').pop() || '';
        const isTextFile = ["txt", "md", "json", "csv", "tsv", "xml", "html", "css", "js", "ts", "yaml", "yml", "ini"].includes(ext);
        if (isTextFile && file.size < 1024 * 1024 * 4) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      });
    }
    e.target.value = "";
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folderTags = ["folder"];
    if (filter !== "all") {
      folderTags.push(filter);
    }
    onCreateNote(
      currentFolderId || undefined,
      "",
      folderTags,
      newFolderName.trim(),
      "folder",
      "📁"
    );
    setNewFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleRenameNote = (noteId: string, newTitle: string) => {
    const parentNote = notes.find(n => n.id === noteId);
    if (parentNote && onUpdateNote) {
      onUpdateNote({
        ...parentNote,
        title: newTitle,
        updatedAt: Date.now()
      });
    }
    setRenameNoteId(null);
  };

  const toggleFavorite = (note: Note) => {
    if (onUpdateNote) {
      onUpdateNote({
        ...note,
        isFavorite: !note.isFavorite,
        updatedAt: Date.now()
      });
      // also update the preview modal if opened
      if (previewNote && previewNote.id === note.id) {
        setPreviewNote({
          ...note,
          isFavorite: !note.isFavorite
        });
      }
    }
  };

  const moveNoteToFolder = (note: Note, targetFolderId: string | undefined) => {
    if (onUpdateNote) {
      onUpdateNote({
        ...note,
        parentId: targetFolderId,
        updatedAt: Date.now()
      });
      setMovingNote(null);
    }
  };

  const saveTextEditContent = () => {
    if (previewNote && onUpdateNote) {
      const updated = {
        ...previewNote,
        content: editTextContent,
        updatedAt: Date.now()
      };
      onUpdateNote(updated);
      setPreviewNote(updated);
      setIsEditingText(false);
    }
  };

  // Determine all available folders for moving targets
  const allFolders = useMemo(() => {
    return notes.filter(n => (n.category === "folder" || n.emoji === "📁") && n.title);
  }, [notes]);

  // Compute navigation breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    const trail: Note[] = [];
    let current: Note | undefined = notes.find(n => n.id === currentFolderId);
    while (current) {
      trail.unshift(current);
      const pId = current.parentId;
      current = pId ? notes.find(n => n.id === pId) : undefined;
    }
    return trail;
  }, [currentFolderId, notes]);

  const noteMatchesFilter = (n: Note, currentFilter: string): boolean => {
    if (currentFilter === "all") return true;
    if (currentFilter === "favorites") return !!n.isFavorite;

    const isFolder = n.category === "folder" || n.emoji === "📁";
    if (isFolder) return true; // Keep folders visible so we can expand/enter them

    const ext = (n.title || '').toLowerCase().split('.').pop() || '';
    const isImageExt = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff"].includes(ext);
    const isVideoExt = ["mp4", "mov", "avi", "mkv", "webm", "3gp", "flv", "wmv"].includes(ext);
    const isPdfExt = ext === "pdf";
    const isDocExt = ["docx", "doc", "txt", "md", "xlsx", "xls", "pptx", "ppt", "csv", "json", "rtf", "tsv", "ini", "yaml", "yml", "xml", "html", "css", "js", "ts", "jsx", "tsx"].includes(ext);

    const noteCategory = n.category?.toLowerCase() || '';

    if (currentFilter === "notes") {
      const isMediaOrFolder = isFolder || isImageExt || isVideoExt || isPdfExt || isDocExt || ["image", "video", "pdf", "docs", "doc"].includes(noteCategory);
      return (noteCategory === "notes" || n.tags?.includes("notes") || !noteCategory) && !isMediaOrFolder;
    }
    if (currentFilter === "image") {
      return noteCategory === "image" || n.tags?.includes("image") || isImageExt;
    }
    if (currentFilter === "video") {
      return noteCategory === "video" || n.tags?.includes("video") || isVideoExt;
    }
    if (currentFilter === "pdf") {
      return noteCategory === "pdf" || n.tags?.includes("pdf") || isPdfExt;
    }
    if (currentFilter === "docs") {
      return noteCategory === "docs" || noteCategory === "doc" || n.tags?.includes("docs") || n.tags?.includes("doc") || isDocExt;
    }
    if (currentFilter === "others") {
      const matchesAnyOther = isImageExt || isVideoExt || isPdfExt || isDocExt || 
                        ["image", "video", "pdf", "docs", "doc", "notes"].includes(noteCategory) || 
                        n.tags?.some(tag => ["image", "video", "pdf", "docs", "doc", "notes"].includes(tag.toLowerCase()));
      return !matchesAnyOther;
    }
    return true;
  };

  const filteredNotes = notes.filter((n) => {
    // 1. Text Search query filtration
    const matchesSearch = searchQuery 
      ? (n.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    if (!matchesSearch) return false;

    // 2. Folder level filtering: if not searching globally, respect current folder level
    if (!searchQuery) {
      if (currentFolderId) {
        if (n.parentId !== currentFolderId) return false;
      } else {
        // Root level: show items with no parentId, or whose parent is missing from notes
        const hasValidParent = n.parentId && notes.some(p => p.id === n.parentId);
        if (hasValidParent) return false;
      }
    }

    return noteMatchesFilter(n, filter);
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileSizeString = (note: Note) => {
    if (!note.content) return "0 B";
    if (note.content.startsWith("data:")) {
      const base64Content = note.content.split(",")[1] || "";
      const decodedBytes = base64Content.length * 0.75;
      if (decodedBytes < 1024) return `${Math.round(decodedBytes)} B`;
      if (decodedBytes < 1024 * 1024) return `${(decodedBytes / 1024).toFixed(1)} KB`;
      return `${(decodedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    const bytes = new Blob([note.content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadFile = (note: Note) => {
    const link = document.createElement("a");
    link.href = note.content;
    link.download = note.title || "downloaded_file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedFolders);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedFolders(next);
  };

  const treeNodes = useMemo(() => {
    const getChildrenForFolder = (folderId: string): any[] => {
      return notes
        .filter(n => n.parentId === folderId)
        .filter(n => noteMatchesFilter(n, filter))
        .filter(n => {
          if (searchQuery) {
            return (n.title || "").toLowerCase().includes(searchQuery.toLowerCase());
          }
          return true;
        })
        .map(n => {
          const isF = n.category === "folder" || n.emoji === "📁";
          return {
            ...n,
            children: isF ? getChildrenForFolder(n.id) : []
          };
        });
    };

    return filteredNotes.map(n => {
      const isF = n.category === "folder" || n.emoji === "📁";
      return {
        ...n,
        children: isF ? getChildrenForFolder(n.id) : []
      };
    });
  }, [filteredNotes, notes, searchQuery, filter]);

  const handleSelectOrPreview = (note: Note) => {
    const isFolder = note.category === "folder" || note.emoji === "📁";
    if (isFolder) {
      setCurrentFolderId(note.id);
      return;
    }
    
    // If it's pure text notes/pages or files, support visualizer directly
    setPreviewNote(note);
    setEditTextContent(note.content || "");
    setIsEditingText(false);
  };

  const renderTreeRows = (nodes: any[], depth = 0) => {
    return nodes.map(node => {
      const isFolder = node.category === "folder" || node.emoji === "📁";
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedFolders.has(node.id);
      
      return (
        <React.Fragment key={node.id}>
          <div 
            onClick={() => handleSelectOrPreview(node)}
            className="flex items-center text-xs px-3 py-2.5 hover:bg-pplx-hover/50 border-b border-pplx-border cursor-pointer transition-colors group"
          >
            <div className="flex-1 flex items-center min-w-0" style={{ paddingLeft: `${depth * 20}px` }}>
              <div 
                className={`w-4 h-4 flex items-center justify-center mr-2 shrink-0 ${isFolder || hasChildren ? "cursor-pointer text-pplx-muted hover:text-pplx-text transition-colors" : "opacity-0 pointer-events-none"}`}
                onClick={(e) => {
                  toggleFolder(node.id, e);
                }}
              >
                {isFolder || hasChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
              </div>
              <span className="text-base mr-2 shrink-0">{node.emoji || "📄"}</span>
              
              {renameNoteId === node.id ? (
                <input 
                  type="text"
                  value={renameValue}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameNote(node.id, renameValue);
                    if (e.key === "Escape") setRenameNoteId(null);
                  }}
                  autoFocus
                  className="bg-pplx-secondary border border-pplx-accent px-2 py-0.5 rounded text-white text-[11px] outline-none w-48 font-mono"
                />
              ) : (
                <span className="font-semibold text-[11px] text-pplx-text truncate group-hover:text-pplx-accent transition-all">
                  {node.title || "Untitled"}
                </span>
              )}
            </div>

            <div className="w-[10%] hidden md:flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(node);
                }}
                className={`p-1 rounded text-pplx-muted hover:text-[#00ffff] transition-colors`}
              >
                <Heart size={12} fill={node.isFavorite ? "#00ffff" : "none"} className={node.isFavorite ? "text-[#00ffff]" : "text-pplx-muted"} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMovingNote(node);
                }}
                title="Move file"
                className="p-1 rounded text-pplx-muted hover:text-blue-400 transition-colors"
              >
                <Move size={12} />
              </button>
            </div>
            
            <div className="w-[15%] hidden md:flex items-center gap-2 truncate text-pplx-muted">
              <img src="https://ui-avatars.com/api/?name=vasi+catalin&background=00ffff&color=000&size=20" alt="user" className="w-4 h-4 rounded-full border border-white/10" />
              <span className="truncate text-[10px] font-mono">vasi catalin</span>
            </div>
            
            <div className="w-[15%] hidden lg:flex items-center gap-1.5 truncate text-pplx-muted text-[10px] font-mono">
              {isFolder ? <FolderIcon size={10} className="text-yellow-500" /> : <FileText size={10} />}
              <span className="truncate uppercase">{node.category && node.category !== "none" ? node.category : "doc"}</span>
            </div>

            <div className="w-[12%] hidden sm:flex items-center text-[10px] text-pplx-muted truncate font-mono">
              {isFolder ? "Folder" : getFileSizeString(node)}
            </div>
            
            <div className="w-[12%] hidden sm:flex items-center text-[10px] text-pplx-muted truncate font-mono">
              {formatDate(node.updatedAt)}
            </div>
            
            <div className="w-16 flex justify-end gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameValue(node.title || "");
                    setRenameNoteId(node.id);
                  }}
                  className="p-1 text-pplx-muted hover:text-[#00ffff] bg-pplx-card border border-pplx-border shadow-sm rounded-md transition-colors"
                  title="Rename"
                >
                  <Edit2 size={10} />
                </button>
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(node.id);
                  }}
                  className="p-1 text-pplx-muted hover:text-red-500 bg-pplx-card border border-pplx-border shadow-sm rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
            </div>
          </div>
          {isFolder && isExpanded && node.children && node.children.length > 0 && renderTreeRows(node.children, depth + 1)}
          {isFolder && isExpanded && (!node.children || node.children.length === 0) && (
            <div 
              className="flex items-center text-[11px] text-pplx-muted/65 py-2.5 border-b border-pplx-border select-none"
              style={{ paddingLeft: `${(depth + 1) * 20 + 24}px` }}
            >
              <span>{lang === "ro" ? "Folder gol" : "Empty folder"}</span>
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-pplx-primary overflow-y-auto px-4 md:px-12 pt-6 pb-32 font-sans select-none text-white/90">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        multiple 
        accept={getUploadAccept(filter)}
        style={{ display: 'none' }} 
      />

      <div className="max-w-6xl mx-auto w-full">
        {/* Breadcrumb Path & Search Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
          {/* Path Header */}
          <div className="flex items-center gap-2 flex-wrap text-sm pt-2">
            <button 
              onClick={() => {
                setCurrentFolderId(null);
                setFilter("all");
              }}
              className="text-white/60 hover:text-[#00ffff] leading-none text-base font-semibold flex items-center gap-1 transition-colors"
            >
              📚 Library
            </button>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={14} className="text-white/30 shrink-0" />
                <button 
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`leading-none flex items-center gap-1 max-w-[150px] truncate transition-colors ${
                    i === breadcrumbs.length - 1 ? "text-[#00ffff] font-bold" : "text-white/60 hover:text-[#00ffff]"
                  }`}
                >
                  📁 {crumb.title || "Folder"}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative w-full md:w-64 max-w-sm shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-pplx-card border border-pplx-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-white/95 outline-none focus:border-[#00ffff]/50 transition-all font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs">×</button>
            )}
          </div>
        </div>
           {/* Action Controls & Big Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 border-b border-pplx-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
              {currentFolderId ? (
                <>
                  <FolderIcon size={22} className="text-yellow-500/90" />
                  <span>{notes.find(n => n.id === currentFolderId)?.title || "Folder View"}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">📚</span>
                  <span>{lang === "ro" ? "Librăria mea" : "My Library"}</span>
                </>
              )}
            </h1>
            <p className="text-xs text-pplx-muted">
              {lang === "ro" 
                ? "Organizează fișierele și notele tale în directoare personalizate."
                : "Keep your workflow, folders, and notes structured and simple."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pplx-card text-pplx-text hover:bg-pplx-hover border border-pplx-border rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <FolderPlus size={13} />
              <span>{lang === "ro" ? "Folder Nou" : "New Folder"}</span>
            </button>
            {filter !== "notes" && filter !== "favorites" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pplx-secondary text-pplx-text hover:bg-pplx-hover border border-pplx-border rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Upload size={13} />
                <span>{getUploadButtonText(filter, lang)}</span>
              </button>
            )}
            {(filter === "all" || filter === "notes") && (
              <button
                onClick={() => onCreateNote(currentFolderId || undefined)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-black hover:bg-white/95 rounded-xl text-xs font-bold transition-colors shadow-sm active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>{lang === "ro" ? "Notiță Nouă" : "New Page"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Tab-like bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium mb-6 bg-pplx-card border border-pplx-border p-1.5 rounded-xl select-none">
           <button onClick={() => setFilter("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "all" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <Clock size={13} />
             <span>{lang === "ro" ? "Toate" : "Browse All"}</span>
           </button>
           <button onClick={() => setFilter("favorites")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "favorites" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <Heart size={13} className={filter === "favorites" ? "text-red-400 fill-red-400" : "text-red-400"} />
             <span>{lang === "ro" ? "Favorite" : "Favorites"}</span>
           </button>
           <button onClick={() => setFilter("notes")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "notes" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <FileText size={13} className="text-[#00ffff]" />
             <span>{lang === "ro" ? "Notițe" : "Notes"}</span>
           </button>
           <button onClick={() => setFilter("image")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "image" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <ImageIcon size={13} className="text-blue-400" />
             <span>{lang === "ro" ? "Imagini" : "Images"}</span>
           </button>
           <button onClick={() => setFilter("video")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "video" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <VideoIcon size={13} className="text-pink-400" />
             <span>{lang === "ro" ? "Video" : "Videos"}</span>
           </button>
           <button onClick={() => setFilter("pdf")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "pdf" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <FileText size={13} className="text-red-500" />
             <span>{lang === "ro" ? "PDF" : "PDFs"}</span>
           </button>
           <button onClick={() => setFilter("docs")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "docs" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <File size={13} className="text-purple-400" />
             <span>{lang === "ro" ? "Documente" : "Docs"}</span>
           </button>
           <button onClick={() => setFilter("others")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${filter === "others" ? "bg-pplx-secondary text-white shadow-sm" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary/20"}`}>
             <FolderOpen size={13} className="text-gray-400" />
             <span>{lang === "ro" ? "Altele" : "Others"}</span>
           </button>

           <div className="ml-auto flex items-center gap-1 text-pplx-muted bg-pplx-secondary border border-pplx-border p-0.5 rounded-lg shrink-0">
             <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-pplx-card text-pplx-text shadow-sm" : "hover:text-pplx-text"}`}><List size={13}/></button>
             <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-pplx-card text-pplx-text shadow-sm" : "hover:text-pplx-text"}`}><LayoutGrid size={13}/></button>
           </div>
        </div>

        {/* Back navigation helper button inside active directory folders */}
        {currentFolderId && filter === "all" && (
          <button 
            onClick={() => {
              const current = notes.find(n => n.id === currentFolderId);
              setCurrentFolderId(current?.parentId || null);
            }}
            className="flex items-center gap-2 mb-4 text-xs font-semibold text-white/50 hover:text-[#00ffff] transition-colors bg-pplx-card border border-pplx-border rounded-xl px-3 py-1.5 mr-auto cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Back to Parent Directory</span>
          </button>
        )}

        {/* Empty state views */}
        {filteredNotes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-pplx-card/20 border border-pplx-border/50 rounded-2xl p-8 mb-4">
            <div className="w-16 h-16 bg-pplx-secondary border border-pplx-border rounded-2xl flex items-center justify-center mb-4 text-white/30">
              <FolderOpen size={30} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {filter === "favorites"
                ? (lang === "ro" ? "Niciun element la Favorite" : "No favorites yet")
                : (lang === "ro" ? "Acest director este gol" : "This directory is empty")}
            </h3>
            <p className="text-xs text-pplx-muted mb-6 max-w-sm">
              {filter === "favorites"
                ? (lang === "ro" ? "Salvează elemente ca favorite pentru a le vedea aici rapid." : "Star items across categories or folders to bookmark them here.")
                : (lang === "ro" 
                    ? "Păstrează fluxul de lucru organizat adăugând elemente noi." 
                    : "Add elements here or upload your files to populate this container.")}
            </p>
            <div className="flex gap-2.5">
              {/* Show Create New Page button only if filter is all or notes */}
              {(filter === "all" || filter === "notes") && (
                <button
                  onClick={() => onCreateNote(currentFolderId || undefined)}
                  className="px-4 py-2 bg-white hover:bg-white/95 text-black rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> {lang === "ro" ? "Pagină Nouă" : "Create New Page"}
                </button>
              )}

              {/* Show dynamic Upload button for categories other than notes and favorites */}
              {filter !== "notes" && filter !== "favorites" && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-pplx-secondary hover:bg-pplx-hover text-white border border-pplx-border rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={14} /> {getUploadButtonText(filter, lang)}
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid visual layout mode */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {filteredNotes.map((note) => {
              const isFolder = note.category === "folder" || note.emoji === "📁";
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectOrPreview(note)}
                  className="group flex flex-col bg-pplx-card border border-pplx-border hover:border-[#00ffff]/40 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-premium transition-all duration-300 transform hover:-translate-y-1 p-2 min-h-[120px] w-full"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs shadow-sm border shrink-0 ${
                      isFolder ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-white/5 border-white/10"
                    }`}>
                      {note.emoji || "📄"}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(note);
                        }}
                        className="p-0.5 text-pplx-muted hover:text-[#00ffff] bg-black/40 border border-white/10 shadow-sm rounded transition-colors"
                        title="Favorite"
                      >
                        <Heart size={8} fill={note.isFavorite ? "#00ffff" : "none"} className={note.isFavorite ? "text-[#00ffff]" : ""} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMovingNote(note);
                        }}
                        className="p-0.5 text-pplx-muted hover:text-blue-400 bg-black/40 border border-white/10 shadow-sm rounded transition-colors"
                        title="Move to folder"
                      >
                        <Move size={8} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="p-0.5 text-pplx-muted hover:text-red-500 bg-black/40 border border-white/10 shadow-sm rounded transition-colors"
                        title="Delete File"
                      >
                        <Trash2 size={8} />
                      </button>
                    </div>
                  </div>

                  {renameNoteId === note.id ? (
                    <input 
                      type="text"
                      value={renameValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameNote(note.id, renameValue);
                        if (e.key === "Escape") setRenameNoteId(null);
                      }}
                      autoFocus
                      className="bg-pplx-secondary border border-pplx-accent px-1 py-0.5 rounded text-white text-[10px] outline-none w-full font-mono mb-1"
                    />
                  ) : (
                    <h3 className="font-bold text-pplx-text text-[11px] mb-0.5 group-hover:text-[#00ffff] transition-colors truncate" title={note.title || "Untitled"}>
                      {note.title || "Untitled"}
                    </h3>
                  )}

                  <p className="text-[9px] text-pplx-muted line-clamp-1 mb-2">
                    {note.content ? note.content.replace(/[#*`_\[\]]/g, '').substring(0, 60) : "No description."}
                  </p>

                  <div className="mt-auto pt-1 border-t border-pplx-border">
                    <div className="flex items-center justify-between text-[8px] text-pplx-muted font-medium">
                      <span className="uppercase text-[7px] tracking-wider font-semibold text-[#00ffff]/80">
                        {isFolder ? "folder" : (note.category && note.category !== "none" ? note.category : "doc")}
                      </span>
                      <span>
                        {isFolder ? "Folder" : getFileSizeString(note)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Visual block tree-mode */
          <div className="flex flex-col w-full bg-[#090909] border border-white/5 rounded-2xl overflow-hidden shadow-premium">
            {/* Table Header */}
            <div className="flex items-center text-xs font-bold text-white/50 px-4 py-3.5 border-b border-white/5 bg-white/5">
              <div className="flex-1 flex items-center gap-2">
                <FileText size={14} className="text-[#00ffff]" /> File Name
              </div>
              <div className="w-[10%] hidden md:flex items-center gap-2">
                ⭐ Actions
              </div>
              <div className="w-[15%] hidden md:flex items-center gap-2">
                <User size={13} /> Creator
              </div>
              <div className="w-[15%] hidden lg:flex items-center gap-1.5">
                <File size={13} /> Category
              </div>
              <div className="w-[12%] hidden sm:flex items-center gap-2">
                📁 File Size
              </div>
              <div className="w-[12%] hidden sm:flex items-center gap-2">
                <Clock size={13} /> Last Edited
              </div>
              <div className="w-16 shrink-0"></div>
            </div>
            
            {/* Table Body */}
            <div className="flex flex-col">
               {renderTreeRows(treeNodes)}
            </div>
          </div>
        )}
      </div>

      {/* --- PREVIEW AND INTERACTIVE FILE VISUALIZER DIALOG --- */}
      {previewNote && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-fadeIn font-sans">
          <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Left Viewer Panel (Responsive Core Display Area) */}
            <div className="flex-1 bg-[#050507] p-6 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
              <button 
                onClick={() => setPreviewNote(null)}
                className="absolute top-4 left-4 p-2 bg-black/50 border border-white/10 rounded-full text-white/60 hover:text-white transition-colors z-30 cursor-pointer flex md:hidden gap-1 text-xs"
              >
                <X size={14} /> Close Preview
              </button>

              {/* Dynamic Content Renderer */}
              <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-2">
                
                {/* 1. IMAGE VIEWER */}
                {previewNote.category === "image" && (
                  <div className="relative group max-h-full">
                    <img 
                      src={previewNote.content} 
                      alt={previewNote.title} 
                      className="max-h-[65vh] max-w-full object-contain rounded-xl select-none shadow-2xl border border-white/5"
                    />
                  </div>
                )}

                {/* 2. VIDEO VIEWER */}
                {previewNote.category === "video" && (
                  <video 
                    src={previewNote.content} 
                    controls 
                    autoPlay
                    className="max-h-[65vh] max-w-full rounded-xl shadow-2xl border border-white/10 object-contain w-full bg-black"
                  />
                )}

                {/* 3. PDF VIEWER */}
                {previewNote.category === "pdf" && (
                  <div className="w-full h-full min-h-[50vh] flex flex-col">
                    {previewNote.content?.startsWith("data:application/pdf") ? (
                      <object 
                        data={previewNote.content} 
                        type="application/pdf" 
                        className="w-full h-full rounded-xl min-h-[60vh] bg-neutral-900 overflow-hidden border border-white/10"
                      >
                        {/* Fallback iframe */}
                        <iframe 
                          src={previewNote.content} 
                          title={previewNote.title} 
                          className="w-full h-full rounded-xl min-h-[60vh] bg-[#111]"
                        />
                      </object>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/40 border border-white/5 rounded-2xl">
                        <FileText size={48} className="text-[#00ffff]/80 mb-3" />
                        <h4 className="text-sm font-bold text-white mb-2">Portable Document Format</h4>
                        <p className="text-xs text-white/50 max-w-xs mb-6">
                          This file note is registered as a secure PDF link or object. Download to read content.
                        </p>
                        <button
                          onClick={() => downloadFile(previewNote)}
                          className="px-5 py-2.5 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30 rounded-xl text-xs font-semibold flex items-center gap-2"
                        >
                          <Download size={14} /> Download PDF File
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DOCUMENTS & EDITABLE TEXT PANELS */}
                {(previewNote.category === "docs" || previewNote.category === "notes" || !previewNote.category) && (
                  <div className="w-full h-full flex flex-col">
                    {isEditingText ? (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#00ffff]/70 bg-[#00ffff]/10 px-2 py-0.5 rounded uppercase font-semibold">Editing Mode</span>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setIsEditingText(false)} 
                              className="px-2.5 py-1 text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={saveTextEditContent} 
                              className="px-2.5 py-1 text-[10px] font-semibold bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-lg flex items-center gap-1"
                            >
                              <Save size={10} /> Save Changes
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={editTextContent}
                          onChange={(e) => setEditTextContent(e.target.value)}
                          className="flex-1 w-full min-h-[50vh] p-4 bg-black/80 border border-white/10 rounded-xl text-white outline-none focus:border-[#00ffff] text-[11px] font-mono leading-relaxed resize-none custom-scrollbar"
                          placeholder="Type or overwrite file text content..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40 uppercase">File Text Workspace</span>
                          <button 
                            onClick={() => {
                              setEditTextContent(previewNote.content || "");
                              setIsEditingText(true);
                            }}
                            className="text-xs text-[#00ffff] hover:underline flex items-center gap-1.5 font-mono"
                          >
                            <Edit2 size={11} /> Edit Document content
                          </button>
                        </div>
                        <div className="flex-1 bg-black/50 p-6 border border-white/5 rounded-2xl overflow-y-auto max-h-[60vh] custom-scrollbar text-left font-mono text-[11px] leading-relaxed text-white/80 whitespace-pre-wrap select-text">
                          {previewNote.content || <span className="italic text-white/30">No readable text content. Click edit content to add.</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. GUEST / OTHER FILE TYPES */}
                {previewNote.category !== "image" && previewNote.category !== "video" && previewNote.category !== "pdf" && previewNote.category !== "docs" && previewNote.category !== "notes" && previewNote.category !== undefined && previewNote.category !== "" && (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-black/30 border border-white/5 rounded-2xl max-w-md">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 mb-4 font-mono text-xl">
                      {previewNote.emoji || "📦"}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 truncate max-w-xs">{previewNote.title || "Generic File Node"}</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-6">
                      This element consists of non-media bytes, archive files, or custom program scripts. You can download and run this file natively.
                    </p>
                    <button
                      onClick={() => downloadFile(previewNote)}
                      className="px-6 py-2.5 bg-white text-black font-semibold hover:bg-white/95 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Download size={14} /> Download File ({getFileSizeString(previewNote)})
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Right Information & Action Panel (Obsidian Detail Panel) */}
            <div className="w-full md:w-80 bg-[#0d0d12] p-6 flex flex-col border-t md:border-t-0 border-white/10 select-none font-sans justify-between">
              
              <div>
                {/* Modal close icon */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-mono font-bold text-[#00ffff]/80 bg-[#00ffff]/5 px-2 py-0.5 border border-[#00ffff]/15 rounded-lg uppercase">
                    📁 FILE METADATA
                  </span>
                  <button 
                    onClick={() => setPreviewNote(null)}
                    className="p-1 w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all cursor-pointer border border-white/10"
                    title="Close Preview (ESC)"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Title and rename */}
                <div className="mb-6">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1 block">File ID Name</label>
                  {renameNoteId === previewNote.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="bg-pplx-primary border border-[#00ffff]/50 px-2.5 py-1.5 rounded-xl text-xs text-white outline-none w-full font-mono outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={() => {
                          handleRenameNote(previewNote.id, renameValue);
                          setPreviewNote({ ...previewNote, title: renameValue });
                        }}
                        className="p-2 bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 rounded-xl text-xs flex items-center justify-center cursor-pointer font-bold"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1.5 p-1 group/title rounded-lg hover:bg-white/5 transition-colors">
                      <div className="font-bold text-sm text-ellipsis overflow-hidden font-sans tracking-wide leading-snug">
                        {previewNote.title || "Untitled Document"}
                      </div>
                      <button 
                        onClick={() => {
                          setRenameValue(previewNote.title || "");
                          setRenameNoteId(previewNote.id);
                        }}
                        className="text-white/40 hover:text-[#00ffff] p-1 border border-white/10 bg-black/20 rounded opacity-0 group-hover/title:opacity-100 transition-all cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Detail parameters list */}
                <div className="flex flex-col gap-3.5 mb-8 border-t border-b border-white/5 py-5 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white/40">Status Class:</span>
                    <span className="text-white font-semibold">Ready</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white/40">File Size:</span>
                    <span className="text-white font-semibold">{getFileSizeString(previewNote)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white/40">Format Ext:</span>
                    <span className="text-[#00ffff] uppercase font-bold text-[10px] bg-[#00ffff]/10 px-2 py-0.5 rounded border border-[#00ffff]/15">
                      {previewNote.category || "General"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white/40">Last Synchronized:</span>
                    <span className="text-white font-semibold">{formatDate(previewNote.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Operations Column */}
              <div className="flex flex-col gap-2 bg-[#121217] border border-white/5 p-4 rounded-2xl">
                <button
                  onClick={() => downloadFile(previewNote)}
                  className="w-full px-4 py-2 bg-white text-black font-semibold hover:bg-white/90 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Local Copy</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleFavorite(previewNote)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-white/85"
                  >
                    <Heart size={13} fill={previewNote.isFavorite ? "#00ffff" : "none"} className={previewNote.isFavorite ? "text-[#00ffff]" : "text-white/50"} />
                    <span>{previewNote.isFavorite ? "Unfavorite" : "Favorite"}</span>
                  </button>
                  <button
                    onClick={() => setMovingNote(previewNote)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white/85"
                  >
                    <Move size={13} className="text-blue-400" />
                    <span>Move...</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    onSelectNote(previewNote.id);
                    setPreviewNote(null);
                  }}
                  className="w-full px-4 py-1.5 bg-transparent text-white/60 hover:text-white text-[11px] font-mono flex items-center justify-center gap-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors cursor-pointer"
                >
                  <span>Open in Page Workspace Editor →</span>
                </button>

                <button
                  onClick={() => {
                    onDeleteNote(previewNote.id);
                    setPreviewNote(null);
                  }}
                  className="w-full mt-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete File from Database</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- CREATE NEW FOLDER OVERLAY MODAL --- */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📁</span> Create New Directory
              </h2>
              <button 
                onClick={() => setIsCreateFolderOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/50 uppercase font-bold font-mono">Directory Name</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Finances, Strategy, PDFs..."
                  className="w-full bg-pplx-primary border border-white/10 p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00ffff]/60 transition-colors placeholder:text-white/20 font-sans"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center gap-2 justify-end mt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 bg-[#1c1c24] border border-white/5 hover:bg-[#2e2e38] rounded-xl text-xs text-white/80 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#00ffff] hover:bg-[#00ffff]/90 text-black font-bold rounded-xl text-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MOVE FILE / DIRECTORY ROUTE POPUP --- */}
      {movingNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Move size={14} className="text-[#00ffff]" /> Move "{movingNote.title || "Untitled"}" to Folder
              </h2>
              <button 
                onClick={() => setMovingNote(null)}
                className="text-white/40 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <p className="text-[11px] text-white/50 mb-4 bg-white/5 p-2 rounded-lg font-mono leading-relaxed">
              Move this file or document into another library directory to maintain proper catalog cleanliness.
            </p>

            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 mb-6">
              
              {/* Move to top folder (Root Library) */}
              <button
                onClick={() => moveNoteToFolder(movingNote, undefined)}
                className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors text-left ${
                  movingNote.parentId === undefined || movingNote.parentId === null
                    ? "bg-[#00ffff]/10 border-[#00ffff]/20 text-[#00ffff] font-bold"
                    : "bg-[#14141d]/50 border-white/5 hover:bg-pplx-hover text-white"
                }`}
              >
                <span className="flex items-center gap-2">📚 Root Library</span>
                {(!movingNote.parentId) && <Check size={12} />}
              </button>

              {/* Dynamic folder nodes */}
              {allFolders.filter(f => f.id !== movingNote.id).map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => moveNoteToFolder(movingNote, folder.id)}
                  className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors text-left ${
                    movingNote.parentId === folder.id
                      ? "bg-[#00ffff]/10 border-[#00ffff]/20 text-[#00ffff] font-bold"
                      : "bg-[#14141d]/50 border-white/5 hover:bg-pplx-hover text-white/80"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">📁 {folder.title}</span>
                  {movingNote.parentId === folder.id && <Check size={12} />}
                </button>
              ))}

              {allFolders.filter(f => f.id !== movingNote.id).length === 0 && (
                <div className="py-6 text-center text-white/30 text-[11px] font-mono italic">
                   No subfolders available. Create a folder first!
                </div>
              )}

            </div>

            <div className="flex items-center gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setMovingNote(null)}
                className="px-4 py-2 bg-[#1c1c24] border border-white/5 hover:bg-[#2e2e38] rounded-xl text-xs text-white/80 font-bold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
