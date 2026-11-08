import React, { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { AudioWaveformVisualizer, LiveRadarDot } from '../ui/AppleGlass';

interface FloatingVoiceCapsuleProps {
  onOpenVoiceModal: () => void;
}

export const FloatingVoiceCapsule: React.FC<FloatingVoiceCapsuleProps> = ({ onOpenVoiceModal }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-fadeIn select-none">
      
      {/* Specular Ambient Glow behind Capsule */}
      <div 
        className={`absolute inset-0 rounded-full bg-amber-500/25 blur-xl transition-all duration-300 pointer-events-none -z-10 ${
          isHovered ? 'opacity-100 scale-135' : 'opacity-60 scale-100'
        }`} 
      />

      <button
        onClick={onOpenVoiceModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="min-h-[46px] flex items-center space-x-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full apple-glass-pill text-zinc-100 border border-white/20 hover:border-amber-500/60 shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
        aria-label="Open Multilingual AI Voice Mentor"
      >
        {/* Pulsing Audio Emblem */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/80 group-hover:border-amber-500/60 transition-colors shadow-inner shrink-0">
          <Mic className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>

        {/* Text and Live Equalizer Waveform */}
        <div className="text-left hidden sm:flex flex-col pr-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold leading-none text-zinc-100 group-hover:text-amber-200 transition-colors">
              AnusandhanAI
            </span>
            {/* The micro waveform equalizer */}
            <AudioWaveformVisualizer active={true} variant="micro" className="opacity-90 group-hover:opacity-100" />
          </div>
          <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block leading-none">
            Voice Mentor · Hinglish / Hindi
          </span>
        </div>

        {/* Mobile-only micro waveform */}
        <div className="sm:hidden flex items-center pl-0.5">
          <AudioWaveformVisualizer active={true} variant="micro" />
        </div>
      </button>

    </div>
  );
};
