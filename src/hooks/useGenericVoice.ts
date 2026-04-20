import { useState, useEffect, useRef, useCallback } from 'react';
import { Thread, Role } from '../types';

interface UseGenericVoiceProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  activeThread?: Thread;
  enabled: boolean;
  onTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
}

export const useGenericVoice = ({ onSendMessage, isThinking, activeThread, enabled, onTTS, isPlayingAudio }: UseGenericVoiceProps) => {
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

  const isPlayingAudioRef = useRef(isPlayingAudio);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !synthRef.current?.speaking && !isPlayingAudioRef.current && !isThinkingRef.current && !hasPendingRequestRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (e) {
        // Already started
      }
    }
  }, []);

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
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        // Use the browser's language to allow dynamic detection of the user's native tongue
        recognitionRef.current.lang = navigator.language || 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          let isFinal = false;
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }
          
          setTranscript(currentTranscript);

          if (isFinal && currentTranscript.trim()) {
            hasPendingRequestRef.current = true; // Synchronously mark that we are waiting for LLM
            onSendMessage(currentTranscript.trim());
            setTranscript('');
            setIsListening(false);
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
          // Auto-restart if still enabled, NOT waiting for a request, NOT thinking, NOT speaking, NOT playing audio, and no fatal error.
          if (
             enabledRef.current && 
             !hasPendingRequestRef.current && 
             !isThinkingRef.current && 
             !synthRef.current?.speaking && 
             !isPlayingAudioRef.current &&
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
