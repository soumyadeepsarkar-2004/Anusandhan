import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Send, VolumeX, Volume2, Mic, Sparkles, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { StudentProfile, VoiceEngineType, VoiceMessage } from '../../types';
import { processVoiceQuery, speakText } from '../../services/voiceAgentService';
import { ApiClient } from '../../services/apiClient';
import { AudioWaveformVisualizer, LiveRadarDot, AppleGlassCard } from '../ui/AppleGlass';
import { useTheme } from '../../context/ThemeContext';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onActionTrigger?: (action: string) => void;
  onMinimize?: () => void;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  student,
  onActionTrigger,
  onMinimize
}) => {
  if (!isOpen) return null;

  const { isDark } = useTheme();
  const [engine, setEngine] = useState<VoiceEngineType>('sarvam');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'm-welcome',
      sender: 'agent',
      text: "Namaste! Main AnusandhanAI Assistant hoon. Anusandhan platform par aap pooch sakte hain: 'Bhai mera status kya hai?', 'Kaunse professors ke paas active grants hain?', ya 'Mera RRS score kitna hai?'.",
      language: 'Hinglish',
      timestamp: 'Just now'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking, isListening]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleUserQuery(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [student, engine]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(true);
        }
      } else {
        // Fallback simulation
        setIsListening(true);
        setTimeout(() => {
          handleUserQuery("Bhai mera kya update hai?");
          setIsListening(false);
        }, 1500);
      }
    }
  };

  const handleUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: VoiceMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      language: 'Hinglish',
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setIsProcessing(true);

    let responseText = "";
    let detectedAction = "";
    let audioBase64: string | undefined = undefined;

    try {
      const apiTurn = await ApiClient.voiceTurn({
        user_input: queryText,
        preferred_language: 'hi-IN',
        voice_engine: engine,
        student_context: {
          fullName: student.fullName,
          rrsScore: student.rrsScore,
          university: student.university
        }
      });

      if (apiTurn) {
        responseText = apiTurn.agent_text_response;
        detectedAction = apiTurn.recommended_action || "";
        audioBase64 = apiTurn.audio_base64;
      }
    } catch {
      // Fallback
    } finally {
      setIsProcessing(false);
    }

    if (!responseText) {
      const localResponse = processVoiceQuery(queryText, student, engine);
      responseText = localResponse.spokenText;
      detectedAction = localResponse.suggestedAction || "";
    }

    const agentMsg: VoiceMessage = {
      id: `a-${Date.now()}`,
      sender: 'agent',
      text: responseText,
      language: 'Hinglish',
      timestamp: 'Just now',
      action: detectedAction,
      audioBase64: audioBase64
    };

    setMessages((prev) => [...prev, agentMsg]);

    playBase64OrTts(responseText, audioBase64, () => {
      if (detectedAction && onActionTrigger) {
        onActionTrigger(detectedAction);
      }
    });
  };

  const playBase64OrTts = (text: string, base64Audio?: string, onComplete?: () => void) => {
    if (base64Audio) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioCtx.decodeAudioData(bytes.buffer).then((audioBuffer) => {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          setIsSpeaking(true);
          source.onended = () => {
            setIsSpeaking(false);
            if (onComplete) onComplete();
          };
          source.start(0);
        }).catch(() => {
          setIsSpeaking(true);
          speakText(text, engine, () => {
            setIsSpeaking(false);
            if (onComplete) onComplete();
          });
        });
        return;
      } catch (e) {
        console.warn('Audio decoding fallback to speech synthesis:', e);
      }
    }

    setIsSpeaking(true);
    speakText(text, engine, () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    });
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Determine current ambient lighting state
  const lightingState = isSpeaking 
    ? 'lighting-pulse-speaking' 
    : isListening 
    ? 'lighting-pulse-listening' 
    : isProcessing 
    ? 'lighting-pulse-reasoning' 
    : 'lighting-ambient-idle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      
      {/* Dynamic Ambient Backlight Atmosphere */}
      <div className={`absolute w-[500px] h-[500px] rounded-full pointer-events-none -z-10 transition-all duration-700 ${lightingState}`} />

      {/* Main Glass Canvas */}
      <div className="relative w-full max-w-3xl glass-modal rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-white/20 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        
        {/* Specular Top Sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/15 shadow-md">
              <img src={isDark ? '/brand-emblem-dark.svg' : '/brand-emblem-light.svg'} alt="Emblem" className="w-5 h-5 object-contain" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Voice Research Mentor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  AnusandhanAI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Multilingual (Hinglish / Hindi / English)
              </p>
            </div>
          </div>

          {/* Engine Selector & Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Minimal Engine Selector */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono backdrop-blur-md">
              <button
                onClick={() => setEngine('sarvam')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  engine === 'sarvam' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sarvam AI
              </button>
              <button
                onClick={() => setEngine('google-live')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  engine === 'google-live' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gemini Live
              </button>
              <button
                onClick={() => setEngine('web-speech')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  engine === 'web-speech' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Native
              </button>
            </div>

            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 text-xs font-mono flex items-center gap-1 cursor-pointer border border-white/15 backdrop-blur-md"
                title="Mute current voice response"
              >
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>Mute</span>
              </button>
            )}

            {/* Dedicated Minimize Button to dock into floating assistant widget */}
            <button
              onClick={onMinimize || onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Minimize to floating assistant widget"
              aria-label="Minimize assistant to floating widget"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close voice assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Central Dynamic Voice Stage */}
        <div className="relative py-6 px-4 flex flex-col items-center justify-center bg-transparent border-b border-white/10">
          
          {/* Sonic Concentric Rings */}
          <div className="relative flex items-center justify-center">
            
            {/* Outer Soft Ambient Wave */}
            {(isListening || isSpeaking) && (
              <span className="absolute w-32 h-32 rounded-full opacity-20 pointer-events-none bg-amber-400 blur-md transition-all duration-300 scale-110" />
            )}

            {/* Middle Glow Ring */}
            <div className={`absolute w-28 h-28 rounded-full blur-lg transition-all duration-300 pointer-events-none ${
              isSpeaking || isListening
                ? 'bg-amber-500/25 scale-105'
                : 'bg-transparent'
            }`} />

            {/* Central Tap-to-Talk Orb */}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-2xl ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-zinc-950 ring-4 ring-amber-400/30'
                  : isListening
                  ? 'bg-gradient-to-tr from-amber-300 to-amber-400 text-zinc-950 ring-4 ring-amber-400/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/20 hover:border-amber-400/50'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
            >
              <Mic className={`w-8 h-8 transition-transform ${isListening || isSpeaking ? 'scale-110' : ''}`} />
            </button>

          </div>

          {/* Micro-Adjustment Status Badge with Real-Time Audio Waves */}
          <div className="mt-4 flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/12 text-xs font-mono shadow-inner backdrop-blur-md">
            <AudioWaveformVisualizer active={isListening || isSpeaking} variant="micro" />
            <span className={`font-medium ${
              isSpeaking 
                ? 'text-amber-300' 
                : isListening 
                ? 'text-amber-300' 
                : isProcessing 
                ? 'text-amber-200' 
                : 'text-zinc-400'
            }`}>
              {isSpeaking
                ? 'Voice Mentor Speaking (Sarvam Bulbul v4)'
                : isListening
                ? 'Listening to you (Hinglish / Hindi)...'
                : isProcessing
                ? 'Reasoning on Academic Corpus...'
                : 'Tap Orb to Speak or Select Suggestion'}
            </span>
          </div>

          {/* Sleek Quick-Prompt Suggestion Pills */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 mt-4 pb-1 scrollbar-none">
            {[
              "IISc aur IIT ke AI labs filter karo",
              "Prof. Chiranjib ke liye 146w pitch draft karo",
              "Mock technical screening viva shuru karo",
              "Application CRM aur status check karo",
              "Profile auto-rejection gap audit karo"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleUserQuery(prompt)}
                className="glass-chip px-3 py-1 rounded-xl text-[11px] text-zinc-300 hover:text-amber-300 whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>

        </div>

        {/* Live Conversation Transcript Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-64 sm:max-h-72 space-y-3.5 bg-black/20 backdrop-blur-sm">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'glass-bubble-user text-zinc-950 font-medium rounded-br-sm'
                    : 'glass-bubble-assistant text-zinc-100 rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>

                  {/* Action Dispatch Badge */}
                  {msg.action && msg.action !== 'NOOP' && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Action: {msg.action}</span>
                      </span>

                      {onActionTrigger && (
                        <button
                          onClick={() => onActionTrigger(msg.action!)}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono font-bold text-[10px] transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          Trigger Screen
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 px-1 text-[10px] font-mono text-zinc-500">
                  <span>{isUser ? 'You' : 'Mentor'}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => playBase64OrTts(msg.text, msg.audioBase64)}
                      className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                      title="Replay audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={transcriptEndRef} />
        </div>

        {/* Integrated Bottom Command Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center gap-2.5">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserQuery(textInput)}
            placeholder="Type a research question or speak in Hinglish/English..."
            className="flex-1 min-h-[44px] px-4 py-2 rounded-2xl glass-input text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/60 outline-none transition-all"
          />

          <button
            onClick={() => handleUserQuery(textInput)}
            disabled={!textInput.trim() || isProcessing}
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
