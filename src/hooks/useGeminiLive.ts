import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface UseGeminiLiveProps {
  apiKey: string;
  onTranscript?: (text: string, isUser: boolean) => void;
  onTurnComplete?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export const useGeminiLive = ({ apiKey, onTranscript, onTurnComplete, onVolumeChange }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      console.log('LiveVoice: Starting connection...');
      setError(null);
      
      if (!apiKey) {
        throw new Error("API key is missing. Please configure GEMINI_API_KEY.");
      }

      console.log('LiveVoice: Initializing AudioContext...');
      // Initialize Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const audioProcessorCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      this.port.postMessage(channelData);
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
      `;
      const blob = new Blob([audioProcessorCode], { type: 'application/javascript' });
      const audioProcessorUrl = URL.createObjectURL(blob);

      console.log('LiveVoice: Adding audio processor module...');
      await audioContextRef.current.audioWorklet.addModule(audioProcessorUrl);

      console.log('LiveVoice: Requesting microphone access...');
      // Get Microphone Access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      if (!audioContextRef.current) {
        throw new Error("AudioContext not initialized");
      }

      console.log('LiveVoice: Creating audio nodes...');
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // Add Analyzer for volume detection
      const analyzer = audioContextRef.current.createAnalyser();
      analyzer.fftSize = 256;
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateVolume = () => {
        if (!isConnected || !onVolumeChange) return;
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        onVolumeChange(average / 255);
        requestAnimationFrame(updateVolume);
      };

      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');

      console.log('LiveVoice: Initializing Gemini Live Session...');
      // Initialize Gemini Live Session
      const ai = new GoogleGenAI({ apiKey });
      
      console.log('LiveVoice: Calling ai.live.connect...');
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a helpful and professional AI assistant. Keep responses concise and natural for voice conversation.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            
            // Handle audio input from microphone
            if (workletNodeRef.current) {
              workletNodeRef.current.port.onmessage = async (event) => {
                const float32Data = event.data as Float32Array;
                
                // Convert Float32Array to Int16Array (PCM 16-bit)
                const int16Data = new Int16Array(float32Data.length);
                for (let i = 0; i < float32Data.length; i++) {
                  const s = Math.max(-1, Math.min(1, float32Data[i]));
                  int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Convert Int16Array to Base64
                const uint8Data = new Uint8Array(int16Data.buffer);
                let binary = '';
                for (let i = 0; i < uint8Data.byteLength; i++) {
                  binary += String.fromCharCode(uint8Data[i]);
                }
                const base64Data = btoa(binary);

                const session = await sessionPromise;
                if (session) {
                  session.sendRealtimeInput({
                    audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                  });
                }
              };
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Convert PCM 16-bit to Float32
              const int16Array = new Int16Array(bytes.buffer);
              const float32Array = new Float32Array(int16Array.length);
              for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
              }
              
              playAudioChunk(float32Array);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              setIsSpeaking(false);
            }

            // Handle Transcripts
            // Model Output Transcript
            if (message.serverContent?.modelTurn?.parts?.[0]?.text && onTranscript) {
              onTranscript(message.serverContent.modelTurn.parts[0].text, false);
            }
            
            // User Input Transcript (if enabled)
            const userTurn = (message.serverContent as any)?.userTurn;
            if (userTurn?.parts?.[0]?.text && onTranscript) {
              onTranscript(userTurn.parts[0].text, true);
            }
            
            // Handle Turn Complete
            if (message.serverContent?.turnComplete) {
               if (onTurnComplete) onTurnComplete();
            }
          },
          onerror: (err) => {
            console.error('Gemini Live Error:', err);
            setError('Connection error occurred.');
            disconnect();
          },
          onclose: () => {
            console.log('LiveVoice: Connection closed');
            disconnect();
          }
        }
      });

      console.log('LiveVoice: Awaiting sessionPromise...');
      sessionRef.current = await sessionPromise;
      console.log('LiveVoice: sessionPromise resolved!');
      
      // Connect audio nodes
      if (workletNodeRef.current && audioContextRef.current) {
        source.connect(analyzer);
        source.connect(workletNodeRef.current);
        workletNodeRef.current.connect(audioContextRef.current.destination);
        updateVolume();
      }

    } catch (err: any) {
      console.error('LiveVoice: Failed to connect:', err);
      setError(err.message || 'Failed to connect to Live API');
      disconnect();
    }
  }, [apiKey, onTranscript]);

  const playAudioChunk = (chunk: Float32Array) => {
    if (!audioContextRef.current) return;
    
    audioQueueRef.current.push(chunk);
    
    if (!isPlayingRef.current) {
      processAudioQueue();
    }
  };

  const processAudioQueue = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current.createBuffer(1, chunk.length, 24000); // Gemini returns 24kHz PCM
    audioBuffer.getChannelData(0).set(chunk);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    const playTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(playTime);
    nextPlayTimeRef.current = playTime + audioBuffer.duration;
    
    source.onended = () => {
      processAudioQueue();
    };
  };

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    isSpeaking,
    error
  };
};
