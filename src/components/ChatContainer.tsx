import React from 'react';
import { Role, Message, FocusMode, ProMode } from '../types';
import { MessageRenderer } from './MessageRenderer';
import { TornadoIndicator } from './TornadoIndicator';
import { PerplexityLogo } from './PerplexityLogo';
import { User, Pencil, Copy, Check, FileText, ImageIcon, BookOpen, Globe, RefreshCw, Share2, FolderPlus, ArrowRight, ArrowDown } from 'lucide-react';

interface ChatContainerProps {
  activeThread: any;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editValue: string;
  setEditValue: (value: string) => void;
  copiedId: string | null;
  handleCopyText: (id: string, text: string) => void;
  handleEditUserMessage: (id: string, content: string) => void;
  handleRegenerate: (id: string) => void;
  handleShare: (content: string) => void;
  activeAddToSpaceId: string | null;
  setActiveAddToSpaceId: (id: string | null) => void;
  spaces: any[];
  handleAddToSpace: (spaceId: string, content: string) => void;
  handleSendMessage: (message: string, focusModes: FocusMode[], proMode: ProMode, attachments: any[]) => void;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  settings: any;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  activeThread,
  editingMessageId,
  setEditingMessageId,
  editValue,
  setEditValue,
  copiedId,
  handleCopyText,
  handleEditUserMessage,
  handleRegenerate,
  handleShare,
  activeAddToSpaceId,
  setActiveAddToSpaceId,
  spaces,
  handleAddToSpace,
  handleSendMessage,
  showScrollButton,
  scrollToBottom,
  settings
}) => {
  return (
    <div className="max-w-3xl mx-auto w-full py-4 space-y-6 px-4 md:px-0 mt-4 md:mt-0 relative z-0 bg-pplx-secondary/5 rounded-2xl">
      {activeThread.messages.map((msg: Message) => (
        <div key={msg.id} data-message-id={msg.id} className="flex flex-col space-y-3 animate-fadeIn">
          {/* ... message content logic ... */}
        </div>
      ))}
      
      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button 
          onClick={scrollToBottom}
          className="fixed left-1/2 -translate-x-1/2 z-30 p-1.5 md:p-2 bg-pplx-card/60 md:bg-pplx-secondary/80 backdrop-blur-md border border-pplx-border/50 md:border-transparent rounded-full shadow-sm md:shadow-none text-pplx-muted md:text-pplx-text hover:text-pplx-text hover:bg-pplx-hover/50 md:hover:bg-pplx-hover transition-all duration-150 animate-in fade-in zoom-in group"
          style={{ 
            bottom: window.innerWidth < 768 
              ? (settings.enableMobileDock ? 'calc(220px + env(safe-area-inset-bottom))' : '160px') 
              : '128px' 
          }}
          title="Scroll to Bottom"
        >
          <ArrowDown className="w-4 h-4 md:w-5 md:h-5 md:stroke-[2.2] transition-colors" />
        </button>
      )}
    </div>
  );
};
