import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Upload, FileText, Bot } from "lucide-react";
import { Space, Attachment, AppSettings } from "../../types";
import { AgentTeamConfig } from "./AgentTeamConfig";

interface SpaceConfigViewProps {
  space: Partial<Space>;
  onSaveSpace: (space: Space) => void;
  onDeleteSpace: (id: string) => void;
  onClose: () => void;
  settings: AppSettings;
}

export const SpaceConfigView: React.FC<SpaceConfigViewProps> = ({
  space,
  onSaveSpace,
  onDeleteSpace,
  onClose,
  settings,
}) => {
  const [editingSpace, setEditingSpace] = useState<Partial<Space>>(space);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingSpace(space);
  }, [space]);

  const handleSave = () => {
    if (editingSpace && editingSpace.title) {
      onSaveSpace(editingSpace as Space);
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const newFile: Attachment = {
            type: "text",
            content: reader.result as string,
            mimeType: file.type,
            name: file.name,
          };
          setEditingSpace((prev) => ({
            ...prev,
            files: [...(prev.files || []), newFile],
          }));
        };
        reader.readAsText(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setEditingSpace((prev) => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-pplx-primary overflow-y-auto w-full custom-scrollbar pt-16 md:pt-10">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pb-32">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-pplx-muted hover:text-pplx-text transition-colors mb-6 group w-fit"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Spaces</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-pplx-text mb-2">
              {editingSpace.id && space.title ? "Edit Space" : "Create New Space"}
            </h1>
            <p className="text-pplx-muted text-sm max-w-xl">
              Configure your workspace identity, system instructions, and agent team to tailor the experience to your specific goals.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {space.id && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this space?")) {
                    onDeleteSpace(space.id as string);
                    onClose();
                  }
                }}
                className="flex items-center justify-center p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                title="Delete Space"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!editingSpace.title}
              className="flex items-center gap-2 px-5 py-2.5 bg-pplx-text text-pplx-primary disabled:bg-pplx-text/50 hover:bg-pplx-text/90 rounded-xl font-medium transition-colors shadow-lg active:scale-95"
            >
              <Save size={18} />
              <span>Save Space</span>
            </button>
          </div>
        </div>

        <div className="bg-pplx-sidebar border border-pplx-border rounded-xl p-6 md:p-8 space-y-8 shadow-sm">
          {/* Identity Section */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-pplx-muted mb-4 border-b border-pplx-border pb-2">Space Identity</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="shrink-0 space-y-2">
                <label className="text-sm text-pplx-muted font-medium">Icon</label>
                <input
                  className="w-16 h-16 flex items-center justify-center bg-pplx-input border border-pplx-border rounded-xl text-center text-3xl focus:border-pplx-accent focus:ring-1 focus:ring-pplx-accent outline-none text-pplx-text transition-all"
                  value={editingSpace.emoji || "📁"}
                  onChange={(e) =>
                    setEditingSpace({ ...editingSpace, emoji: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
              <div className="w-full space-y-2">
                <label className="text-sm text-pplx-muted font-medium">Space Name</label>
                <input
                  className="w-full bg-pplx-input border border-pplx-border rounded-xl px-4 py-4 text-pplx-text placeholder-pplx-muted focus:border-pplx-accent focus:ring-1 focus:ring-pplx-accent outline-none text-lg transition-all"
                  placeholder="e.g. Content Creation, Coding Team..."
                  value={editingSpace.title || ""}
                  onChange={(e) =>
                    setEditingSpace({ ...editingSpace, title: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section>
            <div className="space-y-2">
              <label className="text-sm text-pplx-muted font-medium">Description</label>
              <input
                className="w-full bg-pplx-input border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text placeholder-pplx-muted focus:border-pplx-accent focus:ring-1 focus:ring-pplx-accent outline-none transition-all"
                placeholder="Briefly describe what this space is for..."
                value={editingSpace.description || ""}
                onChange={(e) =>
                  setEditingSpace({
                    ...editingSpace,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </section>

          {/* Prompt Section */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-pplx-muted mb-4 border-b border-pplx-border pb-2 mt-8">Behavior & Knowledge</h2>
            <div className="space-y-2 mb-6">
              <label className="text-sm text-pplx-muted font-medium flex items-center gap-2">
                <Bot size={16} className="text-pplx-accent" />
                System Instructions
              </label>
              <textarea
                className="w-full h-40 bg-pplx-input border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text placeholder-pplx-muted focus:border-pplx-accent focus:ring-1 focus:ring-pplx-accent outline-none resize-none custom-scrollbar transition-all"
                placeholder="How should the agent behave in this space? e.g., 'You are a senior developer. Always review code for security vulnerabilities. Be concise.'"
                value={editingSpace.systemInstructions || ""}
                onChange={(e) =>
                  setEditingSpace({
                    ...editingSpace,
                    systemInstructions: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-pplx-muted font-medium flex items-center gap-2">
                <FileText size={16} className="text-pplx-accent" />
                Knowledge Base (Files)
              </label>
              <p className="text-xs text-pplx-muted mb-3">Upload contextual documents that the agent can reference automatically.</p>
              
              <div className="bg-pplx-secondary/50 border border-pplx-border rounded-xl p-4">
                {editingSpace.files && editingSpace.files.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {editingSpace.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-pplx-primary border border-pplx-border py-2 px-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-blue-400 shrink-0" />
                          <span className="text-xs text-pplx-text truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-pplx-hover text-pplx-muted hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-8 bg-pplx-primary border border-dashed border-pplx-border rounded-lg text-sm text-pplx-muted hover:text-pplx-text hover:border-pplx-accent hover:bg-pplx-hover transition-all"
                >
                  <Upload size={16} />
                  <span>Upload Text or Code Files</span>
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.csv,.py,.html,.css"
                />
              </div>
            </div>
          </section>

          {/* Agent Team Section */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-pplx-muted mb-4 border-b border-pplx-border pb-2 mt-8">Agent Teams</h2>
            <AgentTeamConfig
              editingSpace={editingSpace}
              setEditingSpace={setEditingSpace}
              settings={settings}
            />
          </section>
        </div>
      </div>
    </div>
  );
};
