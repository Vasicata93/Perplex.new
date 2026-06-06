import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Plus,
  Mic,
  X,
  Camera,
  Image as ImageIcon,
  File,
  Cpu,
  Monitor,
  Square,
  Globe,
  Zap,
  Search,
  CheckCircle2,
  ChevronRight,
  Bot,
  Brain,
  FolderPlus,
  Plug,
  AudioLines,
  PhoneOff,
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  FocusMode,
  Attachment,
  AppSettings,
  ModelProvider,
  ProMode,
  Note,
  Space,
  Role,
  Thread,
} from "../types";
import { PRO_MODES } from "../constants";
import { Tooltip } from "./Tooltip";
import { LiveVoiceWidget } from "./LiveVoiceWidget";
import { useIntegrationStore } from "../store/integrationStore";

interface InputAreaProps {
  onSendMessage: (
    text: string,
    focusModes: FocusMode[],
    proMode: ProMode,
    attachments: Attachment[],
    modelId?: string,
    isAgentMode?: boolean,
  ) => void;
  onAddMessage?: (role: Role, content: string) => string | null;
  onUpdateMessage?: (id: string, content: string) => void;
  onSelectView?: (view: any) => void;
  onStop?: () => void;
  isThinking: boolean;
  centered?: boolean;
  settings?: AppSettings;
  notes?: Note[];
  spaces?: Space[];
  activeSpaceId?: string | null;
  onSelectSpace?: (id: string | null) => void;
  onNewSpace?: () => void;
  placeholder?: string;
  compact?: boolean;
  activeNote?: Note;
  mobileSidePanel?: boolean;
  // Lifted State Props (Optional)
  proMode?: ProMode;
  setProMode?: (mode: ProMode) => void;
  isAgentMode?: boolean;
  setIsAgentMode?: (isAgent: boolean) => void;
  isLongThinking?: boolean;
  setIsLongThinking?: (isThinking: boolean) => void;
  activeThread?: Thread;
  onTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
  isCompanionOpen?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onAddMessage,
  onUpdateMessage,
  onSelectView,
  onStop,
  isThinking,
  centered = false,
  settings,
  notes = [],
  spaces = [],
  activeSpaceId,
  onSelectSpace,
  onNewSpace,
  placeholder,
  compact = false,
  mobileSidePanel = false,
  // Lifted State Props
  proMode: propProMode,
  setProMode: propSetProMode,
  isAgentMode: propIsAgentMode,
  setIsAgentMode: propSetIsAgentMode,
  activeThread,
  onTTS,
  isPlayingAudio,
  isCompanionOpen = false,
}) => {
  const [input, setInput] = useState("");
  const [focusModes, setFocusModes] = useState<FocusMode[]>([
    FocusMode.WEB_SEARCH,
  ]);

  // Local State Fallbacks
  const [localProMode, setLocalProMode] = useState<ProMode>(ProMode.STANDARD);
  const [localIsAgentMode, setLocalIsAgentMode] = useState(false);

  // Use props if available, otherwise local state
  const proMode = propProMode !== undefined ? propProMode : localProMode;
  const setProMode = propSetProMode || setLocalProMode;

  const isAgentMode =
    propIsAgentMode !== undefined ? propIsAgentMode : localIsAgentMode;
  const setIsAgentMode = propSetIsAgentMode || setLocalIsAgentMode;

  // const isLongThinking =
  //   propIsLongThinking !== undefined ? propIsLongThinking : localIsLongThinking;
  // const setIsLongThinking = propSetIsLongThinking || setLocalIsLongThinking;

  // const thinkingDepth = useState(4000);

  // Library Selection State
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");

  // Menus
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);

  // Accordion States for Attach Menu
  const [isConnectorsExpanded, setIsConnectorsExpanded] = useState(false);

  const { skills, connectors } = useIntegrationStore();
  const installedSkills = Object.values(skills).filter(s => s.isActive);
  const connectedConnectors = Object.values(connectors).filter(c => c.status === 'connected');
  const availableConnectors = Object.values(connectors).filter(c => c.status !== 'connected');
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  // Tooltip State
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [detectedLangDisplay, setDetectedLangDisplay] = useState<string>(""); // For UI display (RO/EN)

  const recognitionRef = useRef<any>(null);

  // Drag Controls for Bottom Sheets
  const attachDragControls = useDragControls();
  const skillsDragControls = useDragControls();
  const attachScrollRef = useRef<HTMLDivElement>(null);
  const skillsScrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const skillsMenuRef = useRef<HTMLDivElement>(null);

  // Specific refs for different input types
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clear input when switching threads (takes over the role of the 'key' prop on InputArea)
  useEffect(() => {
    setInput("");
    setAttachments([]);
  }, [activeThread?.id]);

  useEffect(() => {
    const handleAppend = (e: any) => {
      let isAppended = false;
      if (e.detail && e.detail.text) {
        setInput(prev => {
           let updated = prev;
           if (updated && !updated.endsWith(' ') && !updated.endsWith('\n')) updated += '\n';
           updated += e.detail.text;
           return updated;
        });
        isAppended = true;
      }
      if (e.detail && e.detail.attachment) {
        setAttachments(prev => [...prev, e.detail.attachment]);
        isAppended = true;
      }
      
      if (isAppended && textareaRef.current) {
        textareaRef.current.focus();
      }
    };
    window.addEventListener("append-to-input", handleAppend);
    return () => window.removeEventListener("append-to-input", handleAppend);
  }, []);

  // Initialize selected model from settings and active space
  useEffect(() => {
    if (settings) {
      let initialModelId = "";
      
      const activeSpace = spaces.find(s => s.id === activeSpaceId);
      if (activeSpace && activeSpace.modelId && activeSpace.modelId !== "auto") {
         initialModelId = activeSpace.modelId;
      } else {
        // Fallback to global setting
        if (settings.modelProvider === ModelProvider.GEMINI) {
          initialModelId = "gemini-pro";
        } else if (settings.modelProvider === ModelProvider.OPENROUTER) {
          initialModelId = "openrouter";
        } else if (settings.modelProvider === ModelProvider.OPENAI) {
          initialModelId = "openai";
        } else {
          initialModelId = settings.activeLocalModelId || "";
        }
      }
      
      setSelectedModelId(initialModelId);

      if (settings.defaultProMode) {
        setProMode(settings.defaultProMode);
      }
    }
  }, [settings, activeSpaceId, spaces]);

  // --- Voice Input Logic (Professional) ---
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsListening(false);
    setRecordingSeconds(0);
    setDetectedLangDisplay("");
  };

  const handleVoiceInput = async () => {
    // 1. If active, stop it
    if (isListening) {
      stopListening();
      return;
    }

    // 2. Check Support
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    // Prompt for permission explicitly if needed (bypasses iframe silent reject issues)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (e: any) {
      // If user denied or no mic, alert
      alert("Microphone access denied or not found. Please allow permissions in browser settings (click lock icon next to URL or check iframe permissions).");
      return;
    }

    // 3. Initialize
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configuration for "Professional" feel
    recognition.continuous = true;
    recognition.interimResults = true; // Show results in real-time

    // --- SMART AUTO-DETECT LOGIC ---
    const appInterfaceRo = settings?.interfaceLanguage === "ro";
    const aiResponseRo = settings?.aiProfile?.language === "Romanian";
    const sysLangs = navigator.languages || [navigator.language];
    const systemRo = sysLangs.some((l) => l && l.toLowerCase().includes("ro"));

    // Priority Logic: If ANY indicator points to Romanian, use 'ro-RO'.
    const langCode =
      appInterfaceRo || aiResponseRo || systemRo ? "ro-RO" : "en-US";

    recognition.lang = langCode;
    setDetectedLangDisplay(langCode === "ro-RO" ? "RO" : "EN");

    // 4. Handle Results - MOBILE FIX: Reconstruct transcript from scratch
    // Capture the text that was already in the input box BEFORE we started speaking
    const initialText = input;

    recognition.onresult = (event: any) => {
      let chunks = [];

      for (let i = 0; i < event.results.length; ++i) {
        let chunkText = event.results[i][0].transcript;
        if (!chunkText) continue;

        // Smart Deduplication for Android Cumulative Bug
        // Android Chrome often returns cumulative strings in new indices 
        // e.g. results[0]="mama", results[1]="mama are".
        if (chunks.length > 0) {
           let prev = chunks[chunks.length - 1];
           // If the chunk completely encompasses the previous chunk, it's cumulative.
           if (chunkText.toLowerCase().trim().startsWith(prev.toLowerCase().trim()) && chunkText.length > prev.trim().length) {
              chunks[chunks.length - 1] = chunkText; // Overwrite
              continue;
           }
           // If it's an exact duplicate on Android, it's a redundant event.
           const isAndroid = /Android/i.test(navigator.userAgent);
           if (isAndroid && chunkText.toLowerCase().trim() === prev.toLowerCase().trim()) {
              chunks[chunks.length - 1] = chunkText; // Overwrite identically to avoid spam
              continue;
           }
        }
        chunks.push(chunkText);
      }

      const sessionTranscript = chunks.join('');

      // Combine the text that was there before + the new session transcript
      const separator =
        initialText && sessionTranscript && !initialText.endsWith(" ")
          ? " "
          : "";
      setInput(initialText + separator + sessionTranscript);
    };

    recognition.onerror = (event: any) => {
      // Ignore "no-speech" and "aborted" errors as they happen during normal operation
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech Recognition Error", event.error);
      }
      if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone permissions in your browser settings (check the lock icon in the address bar and ensure you are not in Private/Incognito mode).");
        stopListening();
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        // For other errors, we might want to show a subtle hint or just log
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        stopListening();
      }
    };

    // 5. Start
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);

      // Start Timer
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Failed to start recognition", e);
      setIsListening(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Screen Share Logic ---
  const handleScreenShare = async () => {
    // Safety check for mobile browsers
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      // Wait for video to load metadata and play to capture a frame
      video.onloadedmetadata = () => {
        video.play();
        // Small delay to ensure the frame is rendered
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Data = canvas.toDataURL("image/jpeg", 0.8);

            const newAttachment: Attachment = {
              type: "image",
              content: base64Data,
              mimeType: "image/jpeg",
              name: `Screen ${new Date().toLocaleTimeString()}.jpg`,
            };
            setAttachments((prev) => [...prev, newAttachment]);
          }

          // Stop the stream immediately after capturing the snapshot
          stream.getTracks().forEach((track) => track.stop());
          video.remove();
        }, 300);
      };
    } catch (err: any) {
      // Ignore user cancellation errors to prevent console noise
      if (
        err.name !== "NotAllowedError" &&
        err.name !== "PermissionDeniedError"
      ) {
        console.error("Screen share cancelled or failed:", err);
      }
    }
  };

  // --- File Attachment Logic ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const isImage = file.type.startsWith("image/");
        const newAttachment: Attachment = {
          type: isImage ? "image" : "text",
          content: content,
          mimeType: file.type,
          name: file.name,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        setShowAttachMenu(false);
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const [isAttachAtTop, setIsAttachAtTop] = useState(true);
  const [isSkillsAtTop, setIsSkillsAtTop] = useState(true);

  // --- Submission Logic ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((input.trim() || attachments.length > 0) && !isThinking) {
      const finalAttachments = [...attachments];

      // Handle Library Mode: If no specific pages selected, assume ALL
      // If specific pages selected, only attach those.
      if (
        focusModes.includes(FocusMode.LIBRARY) ||
        focusModes.includes(FocusMode.ALL)
      ) {
        const notesToAttach =
          selectedLibraryIds.length === 0
            ? notes
            : notes.filter((n) => selectedLibraryIds.includes(n.id));

        notesToAttach.forEach((note) => {
          finalAttachments.push({
            type: "text",
            content: note.content,
            mimeType: "text/markdown",
            name: note.title || "Untitled Page",
          });
        });
      }

      onSendMessage(
        input,
        focusModes,
        proMode,
        finalAttachments,
        selectedModelId || undefined,
        isAgentMode,
      );
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      // Unified minHeight (approx 42px) to keep the box consistent between Home/Chat
      // and prevent the "Large" jump on refresh.
      let minHeight = mobileSidePanel ? 32 : 42;
      if (isCompanionOpen && isMobile) {
        minHeight = 31; // ~25% reduction from 42px is 31px
      }
      textareaRef.current.style.height =
        Math.max(minHeight, Math.min(textareaRef.current.scrollHeight, 160)) +
        "px";
    }
  }, [input, centered, mobileSidePanel, isCompanionOpen, isMobile]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // NOTE: On mobile, clicking "outside" the menu (which is fixed at bottom) usually means clicking the top part of screen.
      // This logic still holds because the menu refs are distinct from the top of screen.
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(event.target as Node)
      )
        setShowAttachMenu(false);
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(event.target as Node)
      )
        setShowModelMenu(false);
      if (
        skillsMenuRef.current &&
        !skillsMenuRef.current.contains(event.target as Node)
      )
        setShowSkillsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Responsive Container Class
  const containerClass = centered
    ? `w-full max-w-4xl mx-auto z-20 fixed ${settings?.enableMobileDock ? "bottom-[72px]" : "bottom-0"} left-0 px-4 md:static md:px-0 md:bottom-auto md:relative transition-all duration-150`
    : "w-full max-w-3xl mx-auto z-20 relative transition-all duration-150";

  // Box Styles
  const boxClass = isCompanionOpen
    ? `bg-pplx-card border border-pplx-border shadow-md rounded-[20px] flex flex-col transition-all duration-150 ${isMobile ? "p-1" : ""}`
    : centered
      ? "bg-pplx-card border border-pplx-border shadow-xl rounded-[24px] flex flex-col transition-all duration-150 md:rounded-3xl"
      : "bg-pplx-card border border-pplx-border shadow-xl rounded-[24px] flex flex-col transition-all duration-150 md:rounded-3xl";

  // -- Sizing Constants --
  const buttonPadding = isCompanionOpen && isMobile
    ? "p-1.5"
    : centered
      ? "p-2 sm:px-2.5 sm:py-1.5"
      : "p-2 sm:px-2.5 sm:py-1.5";
  const roundButtonPadding = isCompanionOpen && isMobile
    ? "p-1"
    : centered ? "p-2 sm:p-1.5" : "p-2 sm:p-1.5";
  const iconSize = isCompanionOpen && isMobile
    ? 18
    : isMobile ? 24 : 20; // 24 is 20% larger than 20

  // Mobile: No background, just the icon (Light icon)
  // Desktop: transparent background, muted text, hover to text-primary
  const mobileButtonFixedBg = isMobile
    ? "bg-transparent text-pplx-text transition-all sm:text-pplx-muted dark:sm:text-pplx-muted sm:hover:text-pplx-text sm:scale-100 sm:border-none sm:shadow-none sm:hover:bg-transparent"
    : "bg-pplx-hover text-pplx-text border border-pplx-border shadow-lg backdrop-blur-md hover:bg-pplx-hover/80 transition-all sm:bg-transparent dark:sm:bg-transparent sm:text-pplx-muted dark:sm:text-pplx-muted sm:hover:text-pplx-text sm:scale-100 sm:border-none sm:shadow-none sm:hover:bg-transparent";

  return (
    <div className={containerClass}>

      <div
        className={`${boxClass} ${compact ? "border-none shadow-none bg-transparent" : ""}`}
      >
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div
            className={`flex gap-2 overflow-x-auto no-scrollbar mb-1 ${centered ? "px-2 pt-2" : "px-3 pt-2"}`}
          >
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative group shrink-0 w-12 h-12 rounded-lg border border-pplx-border overflow-hidden bg-pplx-card"
              >
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <X size={10} />
                </button>
                {att.type === "image" ? (
                  <img
                    src={att.content}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File size={18} className="text-pplx-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div
          className={`flex items-start w-full ${compact ? "px-2 pt-1" : centered ? "px-3 pt-2" : "px-3 pt-2"} ${mobileSidePanel ? "!pt-0 !px-1.5" : ""} ${isCompanionOpen && isMobile ? "!px-2 !pt-1 !pb-0" : ""}`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening..."
                : placeholder ||
                  (centered
                    ? isMobile
                      ? ""
                      : "Ask anything..."
                    : "Ask follow-up...")
            }
            className={`w-full bg-transparent leading-relaxed resize-none outline-none overflow-y-auto max-h-[160px] text-pplx-text placeholder-gray-500/90 ${
              // Standardized font size logic to keep it compact but readable on mobile home
              centered ? "text-[18px] md:text-lg py-2" : "text-[16px] py-2"
            } ${mobileSidePanel ? "!text-[13px] !py-0.5 !leading-tight min-h-[32px]" : ""} ${isCompanionOpen && isMobile ? "!text-[13px] !py-0.5 !leading-snug min-h-[30px]" : ""}`}
            rows={1}
            // Lock the input while listening to ensure "Single Path" for voice input on mobile
            disabled={isThinking}
            readOnly={isListening}
            autoFocus={centered && window.innerWidth > 768}
          />
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
        />
        <input
          type="file"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
          capture="environment"
        />

        {/* Action Bar */}
        <div
          className={`flex justify-between items-center ${compact ? "px-1 pb-1 mt-0.5" : centered ? "px-2 pb-2 mt-2 gap-3 md:gap-0" : "px-2 pb-2 mt-1"} ${mobileSidePanel ? "!mt-0 !pb-1 !px-1" : ""} ${isCompanionOpen && isMobile ? "!mt-0.5 !pb-1 !px-1.5" : ""}`}
        >
          {/* LEFT GROUP: Attach */}
          <div
            className={`flex items-center min-w-0 ${centered ? "gap-2 md:gap-2" : "gap-1 md:gap-2"} ${compact ? "flex-1 mr-2" : ""}`}
          >
            {/* Attach Button */}
            <div
              ref={attachMenuRef}
              className={compact ? "" : "relative"}
            >
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                onMouseEnter={() => setHoveredTooltip("attach")}
                onMouseLeave={() => setHoveredTooltip(null)}
                disabled={isListening}
                className={`relative flex items-center space-x-1 rounded-full hover:text-pplx-text font-medium ${buttonPadding} ${mobileButtonFixedBg} ${mobileSidePanel ? "!p-1.5" : ""}`}
              >
                <div>
                  <Plus
                    size={mobileSidePanel ? (isMobile ? 20 : 16) : iconSize}
                  />
                </div>
                {hoveredTooltip === "attach" && !showAttachMenu && (
                  <Tooltip text="Attach File" position="top" />
                )}
              </button>

              <AnimatePresence>
                {showAttachMenu && isMobile && (
                  <motion.div
                    key="attach-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAttachMenu(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                  />
                )}
                {showAttachMenu && (
                  <motion.div
                    key="attach-menu"
                    drag={isMobile ? "y" : false}
                    dragControls={attachDragControls}
                    dragListener={isMobile && isAttachAtTop}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.8 }}
                    dragMomentum={false}
                    onDragEnd={(_: any, info: any) => {
                      if (
                        isMobile &&
                        (info.offset.y > 80 || info.velocity.y > 400)
                      ) {
                        setShowAttachMenu(false);
                      }
                    }}
                    initial={
                      isMobile
                        ? { y: "100%", opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 10 }
                    }
                    animate={
                      isMobile
                        ? { y: 0, opacity: 1 }
                        : { opacity: 1, scale: 1, y: 0 }
                    }
                    exit={
                      isMobile
                        ? { y: "100%", opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 10 }
                    }
                    transition={
                      isMobile
                        ? { type: "spring", damping: 30, stiffness: 300 }
                        : { duration: 0.15, ease: "easeOut" }
                    }
                    className={`fixed ${settings?.enableMobileDock ? "bottom-[72px]" : "bottom-0"} left-0 right-0 w-full bg-pplx-card border-t border-pplx-border rounded-t-2xl shadow-xl p-4 z-50 pb-8 md:absolute md:bottom-12 md:left-0 ${compact ? "md:w-full" : "md:w-64"} md:border md:rounded-xl md:p-2 md:pb-2 md:border-b overscroll-contain touch-pan-y`}
                  >
                    {/* Mobile Drag Handle */}
                    <div
                      onPointerDown={(e: React.PointerEvent) =>
                        attachDragControls.start(e)
                      }
                      className="w-full py-3 -mt-4 mb-2 md:hidden cursor-grab active:cursor-grabbing flex justify-center touch-none"
                    >
                      <div className="w-12 h-1.5 bg-gray-600/30 rounded-full" />
                    </div>

                    <div
                      ref={attachScrollRef}
                      onScroll={(e) =>
                        setIsAttachAtTop(e.currentTarget.scrollTop <= 0)
                      }
                      className="max-h-[85vh] md:max-h-[300px] overflow-y-auto overscroll-contain custom-scrollbar pb-4"
                    >
                      <div className="grid grid-cols-3 gap-1.5 px-1 relative z-10 w-full overflow-hidden mb-2 pt-1">
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="flex flex-col items-center justify-center space-y-1.5 p-3 md:p-2 rounded-xl text-sm text-pplx-muted bg-pplx-card border border-pplx-border hover:bg-pplx-hover hover:text-pplx-text transition-all min-w-0"
                        >
                          <ImageIcon size={20} className="md:w-5 md:h-5 shrink-0" />
                          <span className="text-[9px] md:text-[10px] text-center leading-tight tracking-wide font-medium truncate w-full px-1">Photo</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center space-y-1.5 p-3 md:p-2 rounded-xl text-sm text-pplx-muted bg-pplx-card border border-pplx-border hover:bg-pplx-hover hover:text-pplx-text transition-all min-w-0"
                        >
                          <File size={20} className="md:w-5 md:h-5 shrink-0" />
                          <span className="text-[9px] md:text-[10px] text-center leading-tight tracking-wide font-medium truncate w-full px-1">File</span>
                        </button>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center space-y-1.5 p-3 md:p-2 rounded-xl text-sm text-pplx-muted bg-pplx-card border border-pplx-border hover:bg-pplx-hover hover:text-pplx-text transition-all min-w-0"
                        >
                          <Camera size={20} className="md:w-5 md:h-5 shrink-0" />
                          <span className="text-[9px] md:text-[10px] text-center leading-tight tracking-wide font-medium truncate w-full px-1">Camera</span>
                        </button>
                      </div>

                      {/* Web Search with Toggle */}
                      <div className="mb-2 px-1">
                        <div
                          className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-pplx-hover transition-colors cursor-pointer"
                          onClick={() => {
                            setFocusModes((prev) => {
                              if (prev.includes(FocusMode.WEB_SEARCH)) {
                                return prev.filter((id) => id !== FocusMode.WEB_SEARCH);
                              } else {
                                return [...prev.filter((id) => id !== FocusMode.ALL), FocusMode.WEB_SEARCH];
                              }
                            });
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Globe size={18} className={focusModes.includes(FocusMode.WEB_SEARCH) ? "text-pplx-accent" : "text-pplx-muted"} />
                            <span className="text-sm font-semibold tracking-wide text-pplx-text">Web Search</span>
                          </div>
                          <div className={`w-10 h-6 flex shrink-0 items-center justify-center rounded-full transition-colors relative ${focusModes.includes(FocusMode.WEB_SEARCH) ? "bg-pplx-accent" : "bg-pplx-muted/40"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${focusModes.includes(FocusMode.WEB_SEARCH) ? "left-5" : "left-1"}`} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-pplx-border my-2 mx-1 opacity-50" />

                      {/* My Computer Section */}
                      <div className="mb-2 px-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pplx-hover transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3 text-pplx-muted">
                            <Monitor size={18} />
                            <span className="text-sm font-semibold tracking-wide text-pplx-text">My Computer</span>
                          </div>
                        </button>
                      </div>

                      {/* Share Screen Section */}
                      <div className="mb-2 px-1">
                        <button
                          onClick={handleScreenShare}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pplx-hover transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3 text-pplx-muted">
                            <Monitor size={18} />
                            <span className="text-sm font-semibold tracking-wide text-pplx-text">Share screen</span>
                          </div>
                        </button>
                      </div>

                      {/* Projects Section (Accordion) */}
                      <div className="mb-2 px-1">
                        <button
                          onClick={() =>
                            setIsProjectsExpanded(!isProjectsExpanded)
                          }
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pplx-hover transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3 text-pplx-muted">
                            <FolderPlus
                              size={18}
                              className={activeSpaceId ? "text-pplx-accent" : ""}
                            />
                            <span
                              className={`text-sm font-semibold tracking-wide text-pplx-text ${activeSpaceId ? "text-pplx-accent" : ""}`}
                            >
                              Projects
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeSpaceId && (
                              <span className="text-[10px] bg-pplx-accent/20 text-pplx-accent px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                            <ChevronRight
                              size={16}
                              className={`text-pplx-muted transition-transform ${isProjectsExpanded ? "rotate-90" : ""}`}
                            />
                          </div>
                        </button>

                        {isProjectsExpanded && (
                          <div className="mt-1 ml-2 pl-2 border-l border-pplx-border space-y-1">
                            {spaces.length > 0 ? (
                              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                {spaces.map((space) => (
                                  <button
                                    key={space.id}
                                    onClick={() => {
                                      onSelectSpace?.(space.id);
                                      setShowAttachMenu(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${activeSpaceId === space.id ? "bg-pplx-hover text-pplx-accent" : "text-gray-300 hover:bg-pplx-hover hover:text-pplx-text"}`}
                                  >
                                    <div className="flex items-center space-x-3 truncate">
                                      <span className="text-base shrink-0">
                                        {space.emoji || "📁"}
                                      </span>
                                      <span className="truncate">
                                        {space.title}
                                      </span>
                                    </div>
                                    {activeSpaceId === space.id && (
                                      <CheckCircle2
                                        size={14}
                                        className="text-pplx-accent shrink-0"
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 text-xs text-gray-500 italic">
                                No projects yet
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                onNewSpace?.();
                                setShowAttachMenu(false);
                              }}
                              className="w-full flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-400 hover:bg-pplx-hover hover:text-pplx-text transition-colors mt-2 border border-dashed border-pplx-border">
                              <Plus size={16} />
                              <span>Add new project</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-pplx-border my-2 mx-1" />

                      {/* Connectors Section */}
                      <div className="mb-2 px-1">
                        <button
                          onClick={() => setIsConnectorsExpanded(!isConnectorsExpanded)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pplx-hover transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3 text-pplx-muted">
                            <Plug size={18} />
                            <span className="text-sm font-semibold tracking-wide text-pplx-text">Connectors</span>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`text-pplx-muted transition-transform ${isConnectorsExpanded ? "rotate-90" : ""}`}
                          />
                        </button>

                        {isConnectorsExpanded && (
                          <div className="mt-1 ml-2 pl-2 border-l border-pplx-border space-y-1">
                            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                              {connectedConnectors.length > 0 ? connectedConnectors.map((connector) => (
                                <button
                                  key={connector.id}
                                  onClick={() => {
                                    setInput(`@${connector.name} `);
                                    setShowAttachMenu(false);
                                  }}
                                  className="w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors text-pplx-text hover:bg-pplx-hover"
                                >
                                  <div className="flex items-center space-x-3 truncate">
                                    <span>{connector.icon}</span>
                                    <span className="truncate">{connector.name}</span>
                                  </div>
                                  <CheckCircle2 size={14} className="text-pplx-accent shrink-0" />
                                </button>
                              )) : (
                                <div className="p-2 text-xs text-gray-500 italic">No connected data sources</div>
                              )}

                              {availableConnectors.length > 0 && (
                                <>
                                  <div className="h-px bg-pplx-border my-2 mx-1" />
                                  <div className="text-[10px] uppercase font-semibold text-pplx-muted px-2 py-1 tracking-wider">Available</div>
                                  {availableConnectors.map((connector) => (
                                    <button
                                      key={connector.id}
                                      onClick={() => {
                                        setShowAttachMenu(false);
                                        window.dispatchEvent(new CustomEvent('openSettings', { detail: { tab: 'connectors' } }));
                                      }}
                                      className="w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
                                    >
                                      <div className="flex items-center space-x-3 truncate">
                                        <span className="opacity-50">{connector.icon}</span>
                                        <span className="truncate">{connector.name}</span>
                                      </div>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => {
                                setShowAttachMenu(false);
                                window.dispatchEvent(new CustomEvent('openSettings', { detail: { tab: 'connectors' } }));
                              }}
                              className="w-full flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-400 hover:bg-pplx-hover hover:text-pplx-text transition-colors mt-2 border border-dashed border-pplx-border">
                              <Plus size={16} />
                              <span>Add new connector</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-pplx-border my-2 mx-1 opacity-50" />

                      {/* Library at Bottom */}
                      <div className="mt-2 mb-2 px-1 text-left">
                        <button
                          onClick={() => {
                            setFocusModes((prev) => {
                              if (prev.includes(FocusMode.LIBRARY)) {
                                const next = prev.filter((id) => id !== FocusMode.LIBRARY);
                                return next.length === 0 ? [FocusMode.LIBRARY] : next;
                              } else {
                                return [...prev.filter((id) => id !== FocusMode.ALL), FocusMode.LIBRARY];
                              }
                            });
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pplx-hover transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3 text-pplx-muted">
                            <FolderPlus size={18} className={focusModes.includes(FocusMode.LIBRARY) ? "text-pplx-accent" : "text-pplx-muted"} />
                            <span className={`text-sm font-semibold tracking-wide text-pplx-text ${focusModes.includes(FocusMode.LIBRARY) ? "text-pplx-accent" : ""}`}>
                              Librării
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {focusModes.includes(FocusMode.LIBRARY) && (
                              <span className="text-[10px] bg-pplx-accent/20 text-pplx-accent px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                            <ChevronRight
                              size={16}
                              className={`text-pplx-muted transition-transform ${focusModes.includes(FocusMode.LIBRARY) ? "rotate-90" : ""}`}
                            />
                          </div>
                        </button>

                          {/* Library Sub-Selection Logic */}
                          {focusModes.includes(FocusMode.LIBRARY) && (
                            <div className="pl-10 pr-2 pb-2 animate-fadeIn bg-pplx-secondary/10 rounded-b-lg mb-1 mt-1">
                              <div className="text-xs text-pplx-muted mb-2 pt-2 border-t border-pplx-border/50">
                                Select Knowledge Sources:
                              </div>

                              <div className="relative mb-2">
                                <Search
                                  size={12}
                                  className="absolute left-2 top-2 text-pplx-muted"
                                />
                                <input
                                  className="w-full bg-pplx-input rounded text-xs py-1.5 pl-7 pr-2 text-pplx-text outline-none"
                                  placeholder="Search pages..."
                                  value={librarySearch}
                                  onChange={(e) =>
                                    setLibrarySearch(e.target.value)
                                  }
                                />
                              </div>

                              <div className="max-h-[50vh] md:max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                {/* Select All Toggle */}
                                <button
                                  onClick={() =>
                                    setSelectedLibraryIds(
                                      selectedLibraryIds.length ===
                                        notes.length
                                        ? []
                                        : notes.map((n) => n.id),
                                    )
                                  }
                                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-pplx-hover rounded text-xs text-pplx-text font-medium"
                                >
                                  <span>All Pages ({notes.length})</span>
                                  {selectedLibraryIds.length ===
                                    notes.length && (
                                    <CheckCircle2
                                      size={12}
                                      className="text-pplx-accent"
                                    />
                                  )}
                                </button>

                                {notes
                                  .filter((n) =>
                                    n.title
                                      .toLowerCase()
                                      .includes(librarySearch.toLowerCase()),
                                  )
                                  .map((note) => (
                                    <button
                                      key={note.id}
                                      onClick={() => {
                                        if (
                                          selectedLibraryIds.includes(note.id)
                                        ) {
                                          setSelectedLibraryIds((prev) =>
                                            prev.filter(
                                              (id) => id !== note.id,
                                            ),
                                          );
                                        } else {
                                          setSelectedLibraryIds((prev) => [
                                            ...prev,
                                            note.id,
                                          ]);
                                        }
                                      }}
                                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-pplx-hover rounded text-xs text-pplx-muted hover:text-pplx-text text-left"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span>{note.emoji || "📄"}</span>
                                        <span className="truncate max-w-[120px]">
                                          {note.title || "Untitled"}
                                        </span>
                                      </div>
                                      <div
                                        className={`w-3 h-3 rounded-sm border ${selectedLibraryIds.includes(note.id) ? "bg-pplx-accent border-pplx-accent" : "border-pplx-muted"}`}
                                      />
                                    </button>
                                  ))}
                                {notes.length === 0 && (
                                  <div className="text-[10px] text-pplx-muted italic px-2">
                                    No pages in library.
                                  </div>
                                )}
                              </div>
                              <div className="text-[9px] text-pplx-muted mt-2 text-center opacity-70">
                                {selectedLibraryIds.length === 0
                                  ? "Default: All pages used"
                                  : `${selectedLibraryIds.length} pages selected`}
                              </div>
                            </div>
                          )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Skills Button */}
            <div
              ref={skillsMenuRef}
              className={compact ? "" : "relative"}
            >
              <button
                onClick={() => setShowSkillsMenu(!showSkillsMenu)}
                onMouseEnter={() => setHoveredTooltip("skills")}
                onMouseLeave={() => setHoveredTooltip(null)}
                disabled={isListening}
                className={`relative flex items-center space-x-1 rounded-full hover:text-pplx-text font-medium ${buttonPadding} ${mobileButtonFixedBg} ${mobileSidePanel ? "!p-1.5" : ""}`}
              >
                <div>
                  <Brain
                    size={mobileSidePanel ? (isMobile ? 20 : 16) : iconSize}
                  />
                </div>
                {hoveredTooltip === "skills" && !showSkillsMenu && (
                  <Tooltip text="Skills" position="top" />
                )}
              </button>

              <AnimatePresence>
                {showSkillsMenu && isMobile && (
                  <motion.div
                    key="skills-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSkillsMenu(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                  />
                )}
                {showSkillsMenu && (
                  <motion.div
                    key="skills-menu"
                    drag={isMobile ? "y" : false}
                    dragControls={skillsDragControls}
                    dragListener={isMobile && isSkillsAtTop}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.8 }}
                    dragMomentum={false}
                    onDragEnd={(_: any, info: any) => {
                      if (isMobile && (info.offset.y > 80 || info.velocity.y > 400)) {
                        setShowSkillsMenu(false);
                      }
                    }}
                    initial={isMobile ? { y: "100%", opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
                    animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    exit={isMobile ? { y: "100%", opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
                    transition={isMobile ? { type: "spring", damping: 30, stiffness: 300 } : { duration: 0.15, ease: "easeOut" }}
                    className={`fixed ${settings?.enableMobileDock ? "bottom-[72px]" : "bottom-0"} left-0 right-0 w-full bg-pplx-card border-t border-pplx-border rounded-t-2xl shadow-xl p-4 z-50 pb-8 md:absolute md:bottom-12 md:left-0 ${compact ? "md:w-full" : "md:w-64"} md:border md:rounded-xl md:p-2 md:pb-2 md:border-b overscroll-contain touch-pan-y`}
                  >
                    <div
                      onPointerDown={(e: React.PointerEvent) =>
                        skillsDragControls.start(e)
                      }
                      className="w-full py-3 -mt-4 mb-2 md:hidden cursor-grab active:cursor-grabbing flex justify-center touch-none"
                    >
                      <div className="w-12 h-1.5 bg-gray-600/30 rounded-full" />
                    </div>

                    <div
                      ref={skillsScrollRef}
                      onScroll={(e) =>
                        setIsSkillsAtTop(e.currentTarget.scrollTop <= 0)
                      }
                      className="max-h-[85vh] md:max-h-[300px] overflow-y-auto overscroll-contain custom-scrollbar space-y-2"
                    >
                      {/* Agent Toggle */}
                      <div className={`flex flex-col bg-pplx-card rounded-lg border transition-colors ${isAgentMode ? 'border-pplx-accent/50 bg-pplx-accent/5 shadow-sm' : 'border-transparent hover:border-pplx-border'}`}>
                        <div
                          className="flex items-center justify-between p-2 cursor-pointer rounded-lg hover:bg-pplx-hover"
                          onClick={() => setIsAgentMode(!isAgentMode)}
                        >
                          <div className="flex items-center space-x-3">
                            <Bot size={16} className={isAgentMode ? "text-pplx-accent" : "text-pplx-muted"} />
                            <span className={`text-sm ${isAgentMode ? "text-pplx-accent font-medium" : "text-pplx-text font-medium"}`}>
                              Agentul
                            </span>
                          </div>
                          <div className={`w-10 h-6 rounded-full transition-colors relative ${isAgentMode ? "bg-pplx-accent" : "bg-pplx-muted/40"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isAgentMode ? "left-5" : "left-1"}`} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-pplx-border my-2 mx-1 opacity-50" />
                      <div className="text-[10px] font-semibold text-pplx-muted uppercase tracking-wider mb-2 px-2">
                        Active Skills
                      </div>

                      <div className="flex flex-wrap gap-2 px-1">
                        {installedSkills.length > 0 ? installedSkills.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => {
                              setInput(`@${skill.name} `);
                              setShowSkillsMenu(false);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-pplx-border/50 bg-pplx-secondary/30 hover:bg-pplx-hover hover:border-pplx-border transition-colors text-xs font-medium text-pplx-text capitalize whitespace-nowrap"
                          >
                            {skill.name.replace(/[-_]/g, ' ')}
                          </button>
                        )) : (
                          <div className="p-4 text-center border border-dashed border-pplx-border rounded-xl text-xs text-gray-500 italic flex justify-center w-full">No active skills</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Mode Badges (Minimalist) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none mask-linear-fade">
                  {isAgentMode && (
                    <button
                        onClick={() => setIsAgentMode(false)}
                        onMouseEnter={() => setHoveredTooltip("agent")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-pplx-accent/10 border border-pplx-accent/20 text-[10px] font-medium text-pplx-accent whitespace-nowrap animate-in fade-in zoom-in duration-150 hover:bg-pplx-accent/20 transition-colors group"
                      >
                        <Bot size={10} />
                        <span>Agent</span>
                        <X
                          size={8}
                          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        {hoveredTooltip === "agent" && (
                          <Tooltip text="Agent" position="top" />
                        )}
                      </button>
                    )}
                  {focusModes.includes(FocusMode.LIBRARY) && (
                    <button
                        onClick={() => setFocusModes((prev) => {
                          const next = prev.filter((id) => id !== FocusMode.LIBRARY);
                          return next.length === 0 ? [FocusMode.LIBRARY] : next;
                        })}
                        className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 whitespace-nowrap animate-in fade-in zoom-in duration-150 hover:bg-emerald-500/20 transition-colors group"
                      >
                        <FolderPlus size={10} />
                        <span>Library {selectedLibraryIds.length > 0 ? `(${selectedLibraryIds.length})` : ''}</span>
                        <X
                          size={8}
                          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </button>
                  )}
                {proMode !== ProMode.STANDARD &&
                  proMode !== ProMode.THINKING &&
                  (() => {
                    const mode = PRO_MODES.find((m) => m.id === proMode);
                    if (!mode) return null;
                    const Icon = mode.icon;
                    return (
                      <button
                        onClick={() => setProMode(ProMode.STANDARD)}
                        onMouseEnter={() => setHoveredTooltip("pro")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-medium text-orange-400 whitespace-nowrap animate-in fade-in zoom-in duration-150 hover:bg-orange-500/20 transition-colors group"
                      >
                        <Icon size={10} />
                        <span>{mode.label}</span>
                        <X
                          size={8}
                          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        {hoveredTooltip === "pro" && (
                          <Tooltip text="Skill" position="top" />
                        )}
                      </button>
                    );
                  })()}
                {activeSpaceId &&
                  spaces.find((s) => s.id === activeSpaceId) &&
                  (() => {
                    const space = spaces.find((s) => s.id === activeSpaceId);
                    return (
                      <button
                        onClick={() => onSelectSpace?.(null)}
                        onMouseEnter={() => setHoveredTooltip("space")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-400 whitespace-nowrap animate-in fade-in zoom-in duration-150 hover:bg-blue-500/20 transition-colors group"
                      >
                        <span>{space?.emoji || "📁"}</span>
                        <span className="max-w-[80px] truncate">
                          {space?.title}
                        </span>
                        <X
                          size={8}
                          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        {hoveredTooltip === "space" && (
                          <Tooltip text="Active Space" position="top" />
                        )}
                      </button>
                    );
                  })()}
                {/* Attachments Badges */}
                {attachments.map((att, idx) => (
                  <button
                    key={idx}
                    onClick={() => removeAttachment(idx)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/10 border border-gray-500/20 text-[10px] font-medium text-gray-400 whitespace-nowrap animate-in fade-in zoom-in duration-150 hover:bg-gray-500/20 transition-colors group"
                  >
                    {att.type === "image" ? (
                      <ImageIcon size={10} />
                    ) : (
                      <File size={10} />
                    )}
                    <span className="max-w-[60px] truncate">
                      {att.name || "File"}
                    </span>
                    <X
                      size={8}
                      className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Items Badges - Removed for clean UI */}


          {/* RIGHT GROUP: Model, Screen, Voice, Send */}
          <div
            className={`flex items-center shrink-0 ml-auto ${centered ? "gap-2 md:gap-2" : "gap-1 md:gap-2"}`}
          >
            {/* Model Selector (Hidden on small mobile) */}
            {settings && (
              <div ref={modelMenuRef} className="relative hidden sm:block">
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  onMouseEnter={() => setHoveredTooltip("model")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  disabled={isListening}
                  className={`relative flex items-center justify-center gap-0.5 rounded-full hover:text-pplx-text transition-colors ${roundButtonPadding} ${mobileButtonFixedBg}`}
                >
                  <Cpu size={iconSize} />
                  {hoveredTooltip === "model" && !showModelMenu && (
                    <Tooltip text="AI Model" position="top" />
                  )}
                </button>
                {showModelMenu && (
                  <div className="absolute bottom-12 right-0 w-56 bg-pplx-card border border-pplx-border rounded-xl shadow-xl p-1 z-50 animate-fadeIn">
                    <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-pplx-muted">
                      Cloud
                    </div>
                    <button
                      onClick={() => {
                        setSelectedModelId("gemini-pro");
                        setShowModelMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-pplx-text hover:bg-pplx-hover hover:text-pplx-text rounded-lg flex justify-between items-center group"
                    >
                      <span>Gemini Pro 1.5/2.0</span>
                      {selectedModelId === "gemini-pro" && (
                        <div className="w-2 h-2 rounded-full bg-pplx-accent"></div>
                      )}
                    </button>

                    {/* Added OpenRouter and OpenAI to Model Menu */}
                    {settings.openRouterApiKey && (
                      <button
                        onClick={() => {
                          setSelectedModelId("openrouter");
                          setShowModelMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-pplx-text hover:bg-pplx-hover hover:text-pplx-text rounded-lg flex justify-between items-center group"
                      >
                        <span className="flex items-center gap-2">
                          <Globe size={12} /> OpenRouter
                        </span>
                        {selectedModelId === "openrouter" && (
                          <div className="w-2 h-2 rounded-full bg-pplx-accent"></div>
                        )}
                      </button>
                    )}

                    {settings.openAiApiKey && (
                      <button
                        onClick={() => {
                          setSelectedModelId("openai");
                          setShowModelMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-pplx-text hover:bg-pplx-hover hover:text-pplx-text rounded-lg flex justify-between items-center group"
                      >
                        <span className="flex items-center gap-2">
                          <Zap size={12} /> OpenAI
                        </span>
                        {selectedModelId === "openai" && (
                          <div className="w-2 h-2 rounded-full bg-pplx-accent"></div>
                        )}
                      </button>
                    )}

                    {settings.localModels.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-pplx-muted mt-1">
                          Local / Custom
                        </div>
                        {settings.localModels.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModelId(m.id);
                              setShowModelMenu(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-pplx-text hover:bg-pplx-hover hover:text-pplx-text rounded-lg flex justify-between items-center truncate"
                          >
                            <span>{m.name}</span>
                            {selectedModelId === m.id && (
                              <div className="w-2 h-2 rounded-full bg-pplx-accent"></div>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Voice (Gemini Live API) */}
            {!isLiveVoiceOpen ? (
              <>
                <button
                  onClick={() => {
                    setIsLiveVoiceOpen(true);
                    if (onSelectView) onSelectView("chat");
                  }}
                  onMouseEnter={() => setHoveredTooltip("live")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  disabled={isListening}
                  className={`relative flex items-center justify-center rounded-full transition-colors hover:text-pplx-accent text-pplx-accent/80 ${roundButtonPadding} ${mobileButtonFixedBg}`}
                >
                  <div>
                    <AudioLines size={iconSize} />
                  </div>
                  {hoveredTooltip === "live" && (
                    <Tooltip text="Live Voice Conversation" position="top" />
                  )}
                </button>

                {/* Voice Input (Enhanced) */}
                <button
                  onClick={handleVoiceInput}
                  onMouseEnter={() => setHoveredTooltip("voice")}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  disabled={isLiveVoiceOpen}
                  className={`relative flex items-center justify-center transition-all duration-150 gap-2 shrink-0 ${
                    isListening
                      ? "bg-red-500/10 text-red-500 px-4 py-2 sm:py-1.5 rounded-full border border-red-500/30"
                      : `rounded-full hover:text-pplx-text ${roundButtonPadding} ${mobileButtonFixedBg} ${mobileSidePanel ? "!p-1.5" : ""} ${isLiveVoiceOpen ? "opacity-50 cursor-not-allowed" : ""}`
                  }`}
                >
                  {isListening ? (
                    <>
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                        <Square size={12} fill="currentColor" />
                      </div>
                      <span className="text-xs font-mono font-medium animate-pulse flex items-center gap-1.5">
                        {formatTimer(recordingSeconds)}
                        <span className="opacity-50">•</span>
                        <span className="font-bold tracking-wider">
                          {detectedLangDisplay}
                        </span>
                      </span>
                    </>
                  ) : (
                    <div>
                      <Mic
                        size={mobileSidePanel ? (isMobile ? 20 : 16) : iconSize}
                      />
                    </div>
                  )}
                  {hoveredTooltip === "voice" && !isListening && (
                    <Tooltip text="Voice Input (Auto-Detect)" position="top" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLiveVoiceOpen(false)}
                className={`relative flex items-center justify-center transition-all duration-150 gap-2 shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 sm:py-1.5 rounded-full border border-red-500/30`}
              >
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                  <PhoneOff size={14} />
                </div>
                <span className="text-xs font-mono font-medium animate-pulse flex items-center gap-1.5">
                  <span className="font-bold tracking-wider uppercase">
                    End Call
                  </span>
                </span>
              </button>
            )}

            {/* Send / Stop Button - Hidden when listening to allow voice bar to expand right */}
            {!isListening &&
              (isThinking ||
                input.trim().length > 0 ||
                attachments.length > 0) && (
                <button
                  onClick={isThinking ? onStop : handleSubmit}
                  disabled={
                    !isThinking && !input.trim() && attachments.length === 0
                  }
                  className={`ml-1 rounded-full transition-all duration-150 flex items-center justify-center ${
                    isThinking || input.trim() || attachments.length > 0
                      ? "bg-pplx-accent text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(32,184,205,0.4)]"
                      : "bg-pplx-hover text-pplx-muted cursor-not-allowed"
                  } ${centered ? "p-4 sm:p-2 scale-110" : "p-3 sm:p-2 scale-110 sm:scale-100"} ${centered ? "shadow-md origin-center" : ""}`}
                >
                  {isThinking ? (
                    <div className="animate-fadeIn">
                      <Square size={centered ? 14 : 12} fill="currentColor" />
                    </div>
                  ) : (
                    <div>
                      {/* Slightly larger icon for send button (20% larger than 20px is ~24px) */}
                      <ArrowUp size={centered ? 24 : 22} strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              )}
          </div>
        </div>
        
        {/* Live Voice Widget */}
        <LiveVoiceWidget 
          isOpen={isLiveVoiceOpen} 
          onClose={() => setIsLiveVoiceOpen(false)} 
          apiKey={process.env.GEMINI_API_KEY || ''} 
          onAddMessage={onAddMessage}
          onUpdateMessage={onUpdateMessage}
          settings={settings}
          activeThread={activeThread}
          isThinking={isThinking}
          onGenericSendMessage={(text) => {
            const finalAttachments = [...attachments];
            // Format to signal to AgentEngine that this is a voice conversation
            const wrappedText = `<voice_input>${text}</voice_input>`;
            onSendMessage(wrappedText, focusModes, proMode, finalAttachments, selectedModelId || undefined, isAgentMode);
            setAttachments([]); // Clear attachments after sending
          }}
          onTTS={onTTS}
          isPlayingAudio={isPlayingAudio}
          onShareScreen={handleScreenShare}
        />
      </div>
    </div>
  );
};
