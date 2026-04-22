import { useState, useEffect, useRef, useCallback } from 'react';
import { Thread, Role, AppSettings } from '../types';

interface UseGenericVoiceProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  activeThread?: Thread;
  enabled: boolean;
  onTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
  settings?: AppSettings;
}

export const useGenericVoice = ({ onSendMessage, isThinking, activeThread, enabled, onTTS, isPlayingAudio, settings }: UseGenericVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isThinkingRef = useRef(isThinking);
  const enabledRef = useRef(enabled);
  const hasFatalErrorRef = useRef(false);
  const hasPendingRequestRef = useRef(false);
  const hasRequestedMicPermissionRef = useRef(false);

  const isPlayingAudioRef = useRef(isPlayingAudio);
  const activeThreadRef = useRef(activeThread);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  // Safely track when audio stops to flush STT buffer
  useEffect(() => {
    const wasPlaying = isPlayingAudioRef.current;
    isPlayingAudioRef.current = isPlayingAudio;

    if (wasPlaying && !isPlayingAudio && isListening && recognitionRef.current) {
        // Audio just stopped playing (either naturally finished or interrupted).
        // The microphone likely recorded the AI's "echo" or the interrupt word in its buffer.
        // We MUST abort the recognition to flush this dirty buffer.
        // The `onend` handler will instantly fire and cleanly restart the mic.
        try {
            recognitionRef.current.abort();
            setTranscript('');
            hasPendingRequestRef.current = false;
        } catch (e) {}
    }
  }, [isPlayingAudio, isListening]);

  const onTTSRef = useRef(onTTS);
  
  useEffect(() => {
    onTTSRef.current = onTTS;
  }, [onTTS]);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isThinkingRef.current && !hasPendingRequestRef.current && !isListening) {
      try {
        if (!hasRequestedMicPermissionRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
           try {
             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
             stream.getTracks().forEach(track => track.stop());
             hasRequestedMicPermissionRef.current = true;
           } catch (e) {
             // Let it fall through, recognitionRef.current.start() might still work or throw NotAllowed
           }
        }

        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
        hasFatalErrorRef.current = false;
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e === 'not-allowed') {
           setError("Microphone access denied. Please allow permissions in browser settings.");
           hasFatalErrorRef.current = true;
        }
      }
    }
  }, [isListening]);

  useEffect(() => {
    const wasPlaying = isPlayingAudioRef.current;
    isPlayingAudioRef.current = isPlayingAudio;
    // Auto start listening when high-quality TTS finishes
    if (wasPlaying && !isPlayingAudio && enabledRef.current && !isThinkingRef.current) {
       startListening();
    }
  }, [isPlayingAudio, startListening]);

  const speak = useCallback((text: string) => {
    if (onTTS) {
       onTTS(text);
       return;
    }

    if (!synthRef.current) return;
    
    // Clean up markdown before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (enabledRef.current) {
        startListening();
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (enabledRef.current) {
        startListening();
      }
    };

    synthRef.current.speak(utterance);
  }, [startListening, onTTS]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      hasFatalErrorRef.current = false;
      hasPendingRequestRef.current = false;
      setError(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        // --- SMART AUTO-DETECT LOGIC ---
        const appInterfaceRo = settings?.interfaceLanguage === "ro";
        const aiResponseRo = settings?.aiProfile?.language === "Romanian";
        const sysLangs = navigator.languages || [navigator.language];
        const systemRo = sysLangs.some((l) => l && l.toLowerCase().includes("ro"));

        // Priority Logic: If ANY indicator points to Romanian, use 'ro-RO'.
        const langCode =
          appInterfaceRo || aiResponseRo || systemRo ? "ro-RO" : "en-US";

        recognitionRef.current.lang = langCode;

        recognitionRef.current.onresult = (event: any) => {
          let chunks = [];
          let isFinal = false;
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            let chunkText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinal = true;
            }
            if (!chunkText) continue;

            if (chunks.length > 0) {
               let prev = chunks[chunks.length - 1];
               if (chunkText.toLowerCase().trim().startsWith(prev.toLowerCase().trim()) && chunkText.length > prev.trim().length) {
                  chunks[chunks.length - 1] = chunkText;
                  continue;
               }
               const isAndroid = /Android/i.test(navigator.userAgent);
               if (isAndroid && chunkText.toLowerCase().trim() === prev.toLowerCase().trim()) {
                  chunks[chunks.length - 1] = chunkText;
                  continue;
               }
            }
            chunks.push(chunkText);
          }
          
          let currentTranscript = chunks.join('');
          
          setTranscript(currentTranscript);

          // INTERRUPT LOGIC: If we hear speech while audio is playing, stop the audio!
          // We must ensure the transcript isn't just the AI hearing its own voice (echo).
          let isEcho = false;
          if (activeThreadRef.current && activeThreadRef.current.messages.length > 0) {
              const lastMsg = activeThreadRef.current.messages[activeThreadRef.current.messages.length - 1];
              if (lastMsg.role === 'model') {
                  const normTrans = currentTranscript.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const normMsg = lastMsg.content.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  
                  // Strict substring match
                  if (normTrans.length > 5 && normMsg.replace(/ /g, '').includes(normTrans.replace(/ /g, ''))) {
                      isEcho = true;
                  } else if (isPlayingAudioRef.current) {
                      // Fuzzy word overlap match if audio is actively playing
                      const transWords = normTrans.split(' ').filter(w => w.length > 2);
                      const msgWords = normMsg.split(' ');
                      
                      if (transWords.length > 0) {
                          let matchCount = 0;
                          transWords.forEach(tw => {
                              if (msgWords.some(mw => mw.includes(tw) || tw.includes(mw))) {
                                  matchCount++;
                              }
                          });
                          
                          // If more than 40% of the transcribed substantial words match the AI's words, it's an echo.
                          if ((matchCount / transWords.length) >= 0.4) {
                              isEcho = true;
                          }
                      }
                  }
              }
          }

          // Add a check: don't interrupt if it's just a tiny noise (length <= 12) or an echo
          const isSignificantSpeech = currentTranscript.trim().length > 12 && !isEcho;
          if (isSignificantSpeech) {
              if (isPlayingAudioRef.current) {
                 if (onTTSRef.current) {
                    onTTSRef.current(""); // empty string stops it
                 }
              }
              if (synthRef.current?.speaking) {
                 synthRef.current.cancel();
              }
          }

          if (isFinal && currentTranscript.trim()) {
            if (isEcho) {
                // Ignore the echo, do not send it as a message
                setTranscript('');
                return;
            }

            if (!hasPendingRequestRef.current && !isThinkingRef.current) {
                hasPendingRequestRef.current = true; // Synchronously mark that we are waiting for LLM
                onSendMessage(currentTranscript.trim());
                setTranscript('');
                // Note: we DO NOT call setIsListening(false) or startListening() here because it is continuous.
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
              setError("Microphone access denied. Please allow permissions in browser settings.");
              hasFatalErrorRef.current = true;
            } else if (event.error === 'audio-capture') {
              setError("No microphone found. Please ensure a microphone is connected.");
              hasFatalErrorRef.current = true;
            } else {
              setError(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Auto-restart if still enabled, NOT waiting for a request, NOT thinking, and no fatal error.
          if (
             enabledRef.current && 
             !hasPendingRequestRef.current && 
             !isThinkingRef.current && 
             !hasFatalErrorRef.current
          ) {
             try {
               recognitionRef.current?.start();
               setIsListening(true);
             } catch (e) {}
          }
        };
      } else {
        setError("Speech Recognition API is not supported in this browser.");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [onSendMessage]);

  // Handle TTS when thinking stops
  useEffect(() => {
    const wasThinking = isThinkingRef.current;
    isThinkingRef.current = isThinking;

    // If it becomes true, we know React acknowledged the thinking state. We can clear the synchronous pending flag.
    if (isThinking && !wasThinking) {
      hasPendingRequestRef.current = false;
    }

    if (wasThinking && !isThinking && enabled && activeThread) {
      hasPendingRequestRef.current = false; // also clear here for safety
      // Model just finished generating
      const messages = activeThread.messages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.role === Role.MODEL && lastMessage.content) {
        speak(lastMessage.content);
        if (enabled) {
          startListening();
        }
      } else if (enabled) {
        startListening();
      }
    }
  }, [isThinking, activeThread, enabled, speak, startListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Fake volume for visualizer
  useEffect(() => {
    let interval: any;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setVolume(Math.random() * 0.4 + 0.1);
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  return {
    startListening,
    stopListening,
    isConnected: isListening || isSpeaking || isThinking,
    isSpeaking,
    transcript,
    volume,
    error
  };
};
