import React from "react";
import { AlertCircle, Trash2, X, Check } from "lucide-react";

interface ConfirmDeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onConfirm,
  onCancel,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
}) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-pplx-card border border-pplx-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-pplx-border bg-red-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg text-red-500 bg-red-500/20">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-pplx-text tracking-tight">
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-500 leading-relaxed font-medium">
              {description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-pplx-border bg-pplx-card flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors flex items-center gap-2"
          >
            <X size={16} /> <span>Cancel</span>
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Check size={18} strokeWidth={3} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
