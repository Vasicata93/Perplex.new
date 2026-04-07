import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { mockDocuments } from "./safedigital-constants";
import { DocumentItem } from "./safedigital-types";

declare global {
  interface Window {
    safeDigitalActions?: {
      getDocuments: () => DocumentItem[];
      addDocument: (doc: Partial<DocumentItem>) => void;
      updateDocument: (id: number, updates: Partial<DocumentItem>) => void;
      deleteDocument: (id: number) => void;
    };
  }
}

// Component Imports
import SafeDigitalVault, { folderHierarchy } from "./SafeDigitalVault";
import { PlusIcon, VaultIcon, XIcon } from "./Icons";
import {
  UploadCloud,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface SafeDigitalPageProps {
  hasDock?: boolean;
}

const SafeDigitalPage: React.FC<SafeDigitalPageProps> = ({
  hasDock = false,
}) => {
  // Centralized state management
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments);

  // AI Action Bridge
  useEffect(() => {
    window.safeDigitalActions = {
      getDocuments: () => documents,
      addDocument: (doc) => {
        const finalItem = {
          title: doc.title || "Document Nou",
          mainCategory: doc.mainCategory || "Personal",
          subCategory: doc.subCategory || "Altele",
          fileSize: doc.fileSize || "N/A",
          content: doc.content,
          expiryDate: doc.expiryDate,
          id: Date.now(),
          lastModified: new Date().toISOString().split("T")[0],
          isLocked: true,
        };
        setDocuments((prev) => [...prev, finalItem as DocumentItem]);
      },
      updateDocument: (id, updates) => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        );
      },
      deleteDocument: (id) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      },
    };
    return () => {
      delete window.safeDigitalActions;
    };
  }, [documents]);

  const [selectedMainCategory, setSelectedMainCategory] =
    useState<string>("Personal");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DocumentItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [textContent, setTextContent] = useState("");

  // Generic CRUD handlers
  const deleteHandler = (id: number) => {
    setDocuments((prev) => prev.filter((item) => item.id !== id));
  };

  const saveHandler = (item: any) => {
    let finalSize = item.fileSize;
    if (inputMode === "file" && uploadedFile) {
      finalSize = uploadedFile.size;
    } else if (inputMode === "text" && textContent) {
      const bytes = new Blob([textContent]).size;
      if (bytes < 1024) finalSize = `${bytes} B`;
      else if (bytes < 1024 * 1024)
        finalSize = `${(bytes / 1024).toFixed(2)} KB`;
      else finalSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    const finalItem = {
      ...item,
      fileSize: finalSize,
      content: inputMode === "text" ? textContent : undefined,
    };
    if (editingItem) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === editingItem.id ? { ...d, ...finalItem } : d)),
      );
    } else {
      setDocuments((prev) => [
        ...prev,
        {
          ...finalItem,
          id: Date.now(),
          lastModified: new Date().toISOString().split("T")[0],
          isLocked: true,
        },
      ]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setUploadedFile(null);
    setTextContent("");
  };

  // Open a specific modal for adding a new item
  const openAddModal = (initialData?: any) => {
    setEditingItem(null);
    setUploadedFile(null);
    setTextContent("");
    setInputMode("file");
    if (initialData?.mainCategory) {
      setSelectedMainCategory(initialData.mainCategory);
    } else {
      setSelectedMainCategory("Personal");
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item: DocumentItem) => {
    setEditingItem(item);
    setUploadedFile(null);
    setTextContent(item.content || "");
    setInputMode(item.content ? "text" : "file");
    setSelectedMainCategory(item.mainCategory || "Personal");
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const size = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setUploadedFile({ name: file.name, size, type: file.type });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const size = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setUploadedFile({ name: file.name, size, type: file.type });
    }
  };

  return (
    <div
      className={`bg-pplx-primary text-pplx-text font-sans min-h-screen transition-colors duration-300 ${hasDock ? "pb-[152px] lg:pb-0" : "pb-[80px] lg:pb-0"}`}
    >
      {/* Semantic Data Layer for AI Agent */}
      <script
        id="safe-digital-semantic-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(documents) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-8 sm:py-12 min-h-[calc(100vh-4rem)] pb-32 lg:pb-12">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pplx-card rounded-xl shadow-sm border border-pplx-border">
                <VaultIcon className="w-6 h-6 text-pplx-accent" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-pplx-text tracking-tight font-display">
                  Safe Digital
                </h2>
                <p className="text-[10px] sm:text-xs text-pplx-muted mt-0.5 font-medium uppercase tracking-wider">
                  Sistem de management securizat
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <SafeDigitalVault
            documents={documents}
            onDelete={deleteHandler}
            onEdit={openEditModal}
            onAdd={openAddModal}
          />
        </main>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-pplx-card rounded-[32px] shadow-2xl border border-pplx-border p-6 sm:p-8 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-pplx-text">
                    {editingItem ? "Editează" : "Adaugă"} Document
                  </h3>
                  <p className="text-xs text-pplx-muted mt-1 font-medium">
                    Completează detaliile pentru a securiza documentul
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-pplx-hover rounded-full text-pplx-muted transition-all active:scale-90 border border-transparent hover:border-pplx-border"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data: any = {};
                  formData.forEach((value, key) => (data[key] = value));
                  saveHandler(data);
                }}
                className="space-y-6"
              >
                {/* Input Mode Toggle */}
                <div className="flex p-1 bg-pplx-secondary/50 rounded-2xl border border-pplx-border">
                  <button
                    type="button"
                    onClick={() => setInputMode("file")}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      inputMode === "file"
                        ? "bg-pplx-accent text-pplx-primary shadow-lg shadow-pplx-accent/20"
                        : "text-pplx-muted hover:text-pplx-text"
                    }`}
                  >
                    Fișier
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("text")}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      inputMode === "text"
                        ? "bg-pplx-accent text-pplx-primary shadow-lg shadow-pplx-accent/20"
                        : "text-pplx-muted hover:text-pplx-text"
                    }`}
                  >
                    Text Brut
                  </button>
                </div>

                {inputMode === "file" ? (
                  /* File Upload Area */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative group transition-all duration-300 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center ${
                      isDragging
                        ? "border-pplx-accent bg-pplx-accent/5"
                        : uploadedFile
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-pplx-border hover:border-pplx-accent/40 hover:bg-pplx-secondary/30"
                    }`}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {uploadedFile ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                          {uploadedFile.type.includes("image") ? (
                            <ImageIcon className="w-8 h-8 text-emerald-500" />
                          ) : uploadedFile.type.includes("pdf") ? (
                            <FileText className="w-8 h-8 text-emerald-500" />
                          ) : uploadedFile.type.includes("sheet") ||
                            uploadedFile.type.includes("excel") ? (
                            <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                          ) : (
                            <File className="w-8 h-8 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-pplx-text mb-1 max-w-[240px] truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                          {uploadedFile.size} • Gata de încărcare
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-pplx-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="w-8 h-8 text-pplx-accent" />
                        </div>
                        <h4 className="text-sm font-bold text-pplx-text mb-1">
                          Încarcă fișierul tău
                        </h4>
                        <p className="text-[10px] text-pplx-muted max-w-[200px]">
                          Trage fișierul aici sau apasă pentru a selecta (PDF,
                          DOC, XLS, Imagini...)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  /* Raw Text Area */
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                      Conținut Text
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Lipește sau scrie textul tău aici..."
                      className="w-full h-40 bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-2xl py-4 px-4 outline-none transition-all font-medium text-pplx-text text-sm resize-none scrollbar-hide"
                    />
                    <div className="flex justify-end mt-2">
                      <p className="text-[10px] font-bold text-pplx-muted uppercase tracking-widest">
                        {textContent.length} Caractere
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                      Titlu Document
                    </label>
                    <input
                      name="title"
                      defaultValue={
                        editingItem?.title ||
                        (uploadedFile
                          ? uploadedFile.name.split(".")[0]
                          : inputMode === "text" && textContent
                            ? "Document Text"
                            : "")
                      }
                      required
                      className="w-full bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-xl py-3.5 px-4 outline-none transition-all font-medium text-pplx-text text-sm placeholder:text-pplx-muted/40"
                      placeholder="Ex: Pașaport, Contract Chirie..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                        Categorie
                      </label>
                      <div className="relative">
                        <select
                          name="mainCategory"
                          value={selectedMainCategory}
                          onChange={(e) =>
                            setSelectedMainCategory(e.target.value)
                          }
                          className="w-full bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-xl py-3.5 px-4 outline-none transition-all font-medium text-pplx-text text-sm appearance-none cursor-pointer"
                        >
                          {folderHierarchy.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pplx-muted">
                          <PlusIcon className="w-3 h-3 rotate-45" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                        Subcategorie
                      </label>
                      <div className="relative">
                        <select
                          name="subCategory"
                          defaultValue={
                            editingItem?.subCategory ||
                            folderHierarchy.find(
                              (f) => f.id === selectedMainCategory,
                            )?.subfolders[0]
                          }
                          key={
                            selectedMainCategory +
                            (editingItem?.subCategory || "")
                          }
                          className="w-full bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-xl py-3.5 px-4 outline-none transition-all font-medium text-pplx-text text-sm appearance-none cursor-pointer"
                        >
                          {folderHierarchy
                            .find((f) => f.id === selectedMainCategory)
                            ?.subfolders.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pplx-muted">
                          <PlusIcon className="w-3 h-3 rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                        Data Expirării (Opțional)
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        defaultValue={editingItem?.expiryDate || ""}
                        className="w-full bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-xl py-3.5 px-4 outline-none transition-all font-medium text-pplx-text text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-2 px-1">
                        Mărime Fișier
                      </label>
                      <input
                        name="fileSize"
                        value={
                          uploadedFile
                            ? uploadedFile.size
                            : inputMode === "text"
                              ? "Calculat la salvare"
                              : editingItem?.fileSize || ""
                        }
                        readOnly={true}
                        className={`w-full bg-pplx-secondary/50 border border-pplx-border focus:border-pplx-accent rounded-xl py-3.5 px-4 outline-none transition-all font-medium text-pplx-text text-sm ${uploadedFile || inputMode === "text" ? "opacity-60" : ""}`}
                        placeholder="Ex: 1.2 MB"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-pplx-secondary hover:bg-pplx-hover rounded-2xl font-bold transition-all text-pplx-text text-xs active:scale-95 border border-pplx-border"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-pplx-accent hover:bg-pplx-accent/90 text-pplx-primary rounded-2xl font-bold transition-all shadow-xl shadow-pplx-accent/20 text-xs active:scale-95"
                  >
                    Salvează Documentul
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafeDigitalPage;
