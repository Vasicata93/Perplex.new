
import React, { useState } from 'react';
import { ChevronLeft, Headphones, Eye, MoreHorizontal, Share2, Copy, Square, FolderPlus } from 'lucide-react';
import { SidebarToggle } from './SidebarToggle';
import { Tooltip } from './Tooltip';

import { Space } from '../types';

interface ChatHeaderProps {
  title?: string;
  onBack: () => void;
  showActions?: boolean;
  onTTS?: () => void;
  isPlayingAudio?: boolean;
  onCopy?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  activeSpace?: Space | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title, 
  onBack, 
  showActions,
  onTTS,
  isPlayingAudio,
  onCopy,
  onShare,
  onSave,
  activeSpace,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const actionButtonClass = "p-2 rounded-full transition-all duration-300 text-pplx-text bg-pplx-secondary/80 backdrop-blur-md md:bg-transparent border-transparent shadow-sm md:shadow-none hover:bg-pplx-hover md:hover:bg-pplx-hover";

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between w-full px-4 pt-3 pb-3 md:pt-4 md:pb-5 bg-pplx-primary/80 backdrop-blur-md transition-all supports-[backdrop-filter]:bg-pplx-primary/50">
      {/* Left: Navigation Actions */}
      <div className="flex items-center relative z-20 shrink-0">
        {/* Sidebar Toggle */}
        {onToggleSidebar && !isSidebarOpen && (
          <SidebarToggle 
            onClick={onToggleSidebar}
            className="hidden md:flex mr-2"
            size={20}
          />
        )}

        {/* Back Button - Always visible, acts as Home on mobile. First on mobile. */}
        <button 
          onClick={onBack}
          onMouseEnter={() => setHoveredTooltip('back')}
          onMouseLeave={() => setHoveredTooltip(null)}
          className={`${actionButtonClass} mr-2 relative`}
        >
          <ChevronLeft size={20} className="md:stroke-[2.2]" />
          {hoveredTooltip === 'back' && <Tooltip text="Back to Home" position="bottom" />}
        </button>
        
        {title && !activeSpace && (
            <h2 className="text-sm font-medium text-pplx-text truncate max-w-[150px] md:max-w-md hidden font-serif tracking-tight opacity-90 ml-1">
                {title}
            </h2>
        )}
      </div>

      {/* Center: Workspace Title */}
      {activeSpace && (
        <>
          {/* Mobile: Flex-based to prevent overlap and ensure alignment */}
          <div className="flex-1 flex justify-center px-2 min-w-0 md:hidden z-10">
              <div className="bg-pplx-card/80 backdrop-blur-md border border-pplx-border/50 shadow-sm px-3 py-1 rounded-full flex items-center gap-2 max-w-full">
                  <span className="text-sm shrink-0">{activeSpace.emoji}</span>
                  <span className="text-xs font-medium text-pplx-muted uppercase tracking-wide truncate">
                      {activeSpace.title}
                  </span>
              </div>
          </div>

          {/* Desktop: Absolute centered as before */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex z-10 pointer-events-none justify-center">
              <div className="bg-pplx-card/80 backdrop-blur-md border border-pplx-border/50 shadow-sm px-3 py-1 rounded-full flex items-center gap-2 pointer-events-auto">
                  <span className="text-sm">{activeSpace.emoji}</span>
                  <span className="text-xs font-medium text-pplx-muted uppercase tracking-wide truncate max-w-[120px]">
                      {activeSpace.title}
                  </span>
              </div>
          </div>
        </>
      )}

      {/* Right: Actions */}
      <div className="flex items-center space-x-1 relative z-20 shrink-0">
        {showActions && (
          <>
            <button 
                onClick={onTTS}
                onMouseEnter={() => setHoveredTooltip('tts')}
                onMouseLeave={() => setHoveredTooltip(null)}
                className={`${actionButtonClass} ${isPlayingAudio ? '!text-red-500 !bg-red-500/10' : ''} relative`}
            >
                {isPlayingAudio ? <Square size={20} fill="currentColor" className="md:stroke-[2.2]" /> : <Headphones size={20} className="md:stroke-[2.2]" />}
                {hoveredTooltip === 'tts' && <Tooltip text="Read Aloud" position="bottom" />}
            </button>
            <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    onMouseEnter={() => setHoveredTooltip('more')}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    className={`${actionButtonClass} relative`}
                >
                    <MoreHorizontal size={20} className="md:stroke-[2.2]" />
                    {hoveredTooltip === 'more' && !showMenu && <Tooltip text="More Actions" position="bottom" />}
                </button>
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-10 w-40 bg-pplx-card border border-pplx-border rounded-xl shadow-xl z-40 py-1 animate-fadeIn">
                            <button onClick={() => { onCopy?.(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2">
                                <Copy size={12} /> Copy
                            </button>
                            <button onClick={() => { onShare?.(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2">
                                <Share2 size={12} /> Share
                            </button>
                            <button onClick={() => { onSave?.(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2">
                                <FolderPlus size={12} /> Save
                            </button>
                        </div>
                    </>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
