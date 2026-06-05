import React, { useState } from "react";
import { Space, Thread } from "../types";
import { Folder, Plus, Search, MessageSquare } from "lucide-react";

interface SpacesDashboardProps {
  spaces: Space[];
  threads: Thread[];
  onSelectSpace: (id: string) => void;
  onCreateSpace: () => void;
  onManageSpaces: (id?: string) => void;
}

export const SpacesDashboard: React.FC<SpacesDashboardProps> = ({
  spaces,
  threads,
  onSelectSpace,
  onCreateSpace,
  onManageSpaces,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpaces = spaces.filter((s) => {
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-pplx-primary overflow-y-auto px-6 md:px-12 pt-8 pb-32">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-pplx-text tracking-tight mb-2">
              Spaces
            </h1>
            <p className="text-pplx-muted font-light">
              Organize your conversations and agents into dedicated workspaces.
            </p>
          </div>
          <button
            onClick={onCreateSpace}
            className="flex items-center gap-2 px-5 py-2.5 bg-pplx-text text-pplx-primary hover:bg-pplx-text/90 rounded-xl font-medium transition-colors shadow-lg active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>New Space</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative w-full sm:w-72 group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pplx-muted group-focus-within:text-pplx-text transition-colors" />
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-pplx-secondary border border-pplx-border rounded-xl pl-10 pr-4 py-2 text-sm text-pplx-text placeholder-pplx-muted focus:outline-none focus:border-pplx-accent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {filteredSpaces.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-pplx-secondary rounded-xl flex items-center justify-center mb-4 text-pplx-muted">
                <Folder size={24} />
              </div>
              <h3 className="text-base font-bold text-pplx-text mb-1">No spaces found</h3>
              <p className="text-xs text-pplx-muted mb-6 max-w-sm">
                Get started by creating a new space to organize your chats.
              </p>
              <button
                onClick={onCreateSpace}
                className="px-4 py-1.5 bg-pplx-secondary hover:bg-pplx-hover text-pplx-text border border-pplx-border rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
              >
                <Plus size={14} /> Create Space
              </button>
            </div>
          ) : (
            filteredSpaces.map((space) => {
              const spaceThreadsCount = threads.filter((t) => t.id !== "default" && t.spaceId === space.id).length;
              return (
                <div
                  key={space.id}
                  onClick={() => onSelectSpace(space.id)}
                  className="group flex flex-col bg-pplx-card border border-pplx-border hover:border-pplx-accent/30 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-premium transition-all duration-300 transform hover:-translate-y-1 p-2 min-h-[120px]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-7 h-7 rounded-md bg-pplx-secondary flex items-center justify-center text-base shadow-sm border border-pplx-border">
                      {space.emoji || "📁"}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageSpaces(space.id);
                      }}
                      className="p-0.5 text-pplx-muted hover:text-pplx-text bg-pplx-card border border-pplx-border shadow-sm rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus size={10} className="rotate-45" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-pplx-text text-[11px] mb-0.5 group-hover:text-pplx-accent transition-colors truncate" title={space.title}>
                    {space.title}
                  </h3>
                  
                  <p className="text-[9px] text-pplx-muted line-clamp-1 mb-2">
                    {space.description || "No description."}
                  </p>
                  
                  <div className="mt-auto pt-1 border-t border-pplx-border">
                    <div className="flex items-center justify-between text-[8px] text-pplx-muted font-medium">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={10} />
                        {spaceThreadsCount} chats
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
