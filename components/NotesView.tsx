
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MoreHorizontal, Save, Trash2, 
  Clock, Tag, FileText, Sparkles, 
  Undo, Redo, Maximize2, Minimize2,
  Image as ImageIcon, Smile, Type
} from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { Note } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesViewProps {
  activeNoteId: string | null;
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  onAiEdit?: (content: string, instruction: string) => Promise<string>;
  onSelectNote: (id: string) => void;
  isSideChatOpen?: boolean;
}

export const NotesView: React.FC<NotesViewProps> = ({
  activeNoteId,
  notes,
  onSaveNote,
  onDeleteNote,
  onCreateNote,
  onAiEdit,
  onSelectNote,
  isSideChatOpen = false
}) => {
  const activeNote = notes.find(n => n.id === activeNoteId);
  const [content, setContent] = useState(activeNote?.content || '');
  const [title, setTitle] = useState(activeNote?.title || '');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
      setTitle(activeNote.title);
    }
  }, [activeNoteId, activeNote]);

  const handleSave = () => {
    if (activeNote) {
      onSaveNote({
        ...activeNote,
        title,
        content,
        updatedAt: Date.now()
      });
    }
  };

  const handleAiEditSubmit = async () => {
    if (!onAiEdit || !aiInstruction || !activeNote) return;
    
    setIsAiEditing(true);
    try {
      const newContent = await onAiEdit(content, aiInstruction);
      setContent(newContent);
      setAiInstruction('');
      setShowAiInput(false);
    } catch (error) {
      console.error("AI Edit failed:", error);
    } finally {
      setIsAiEditing(false);
    }
  };

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-pplx-muted p-8">
        <div className="w-16 h-16 bg-pplx-hover rounded-full flex items-center justify-center mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-semibold text-pplx-text mb-2">No note selected</h2>
        <p className="text-center max-w-xs mb-6">Select a note from the sidebar or create a new one to get started.</p>
        <button 
          onClick={onCreateNote}
          className="px-6 py-2.5 bg-pplx-accent text-white rounded-full font-medium hover:bg-pplx-accent/90 transition-all"
        >
          Create New Note
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-pplx-primary overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-pplx-border flex items-center justify-between px-6 bg-pplx-primary/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 flex-1">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Note Title"
            className="bg-transparent border-none text-xl font-bold text-pplx-text outline-none w-full placeholder-pplx-muted/30"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAiInput(!showAiInput)}
            className={`p-2 rounded-xl transition-all ${showAiInput ? 'bg-pplx-accent text-white' : 'hover:bg-pplx-hover text-pplx-muted'}`}
            title="AI Edit"
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={handleSave}
            className="p-2 hover:bg-pplx-hover text-pplx-muted rounded-xl transition-all"
            title="Save"
          >
            <Save size={20} />
          </button>
          <button 
            onClick={() => onDeleteNote(activeNote.id)}
            className="p-2 hover:bg-red-500/10 text-pplx-muted hover:text-red-500 rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* AI Edit Input */}
      <AnimatePresence>
        {showAiInput && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-pplx-border bg-pplx-secondary/30 overflow-hidden"
          >
            <div className="p-4 flex gap-3">
              <input 
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Ask AI to edit this note... (e.g., 'Make it more professional', 'Summarize this')"
                className="flex-1 bg-pplx-input border border-pplx-border rounded-xl px-4 py-2 text-sm text-pplx-text outline-none focus:border-pplx-accent transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAiEditSubmit()}
              />
              <button 
                onClick={handleAiEditSubmit}
                disabled={isAiEditing || !aiInstruction}
                className="px-4 py-2 bg-pplx-accent text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pplx-accent/90 transition-all flex items-center gap-2"
              >
                {isAiEditing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16">
        <div className="max-w-3xl mx-auto">
          <TextareaAutosize 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            placeholder="Start writing..."
            className="w-full bg-transparent border-none outline-none text-pplx-text text-lg leading-relaxed resize-none placeholder-pplx-muted/20"
            minRows={10}
          />
        </div>
      </div>
      
      {/* Footer / Status */}
      <div className="h-10 border-t border-pplx-border flex items-center justify-between px-6 text-[10px] text-pplx-muted uppercase tracking-widest font-medium bg-pplx-primary/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Last updated: {new Date(activeNote.updatedAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <Tag size={12} />
            {activeNote.tags?.length || 0} Tags
          </span>
        </div>
        <div>
          {content.length} characters
        </div>
      </div>
    </div>
  );
};
