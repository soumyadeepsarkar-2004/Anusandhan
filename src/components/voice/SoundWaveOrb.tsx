import React from 'react';
import { Mic } from 'lucide-react';

interface SoundWaveOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  onClick: () => void;
}

export const SoundWaveOrb: React.FC<SoundWaveOrbProps> = ({
  isListening,
  isSpeaking,
  onClick
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-5">
      
      {/* Subdued Glow */}
      <div className={`absolute w-28 h-28 rounded-full transition-all duration-500 pointer-events-none ${
        isSpeaking
          ? 'bg-amber-500/15 blur-xl'
          : isListening
          ? 'bg-zinc-400/15 blur-xl'
          : 'bg-transparent'
      }`} />

      {/* Main Orb Button */}
      <button
        onClick={onClick}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
          isSpeaking
            ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400/40'
            : isListening
            ? 'bg-zinc-100 text-zinc-950 ring-2 ring-zinc-300'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
        }`}
      >
        <Mic className={`w-8 h-8 ${isListening || isSpeaking ? 'scale-105' : ''}`} />
      </button>

      {/* Animated Soundwave Frequency Bars - Simple & Restrained */}
      <div className="flex items-center space-x-1.5 h-8 mt-5">
        {[4, 12, 22, 28, 16, 24, 12, 6].map((baseHeight, index) => {
          const height = isSpeaking || isListening 
            ? `${Math.max(6, (baseHeight * (index % 2 === 0 ? 1.1 : 0.85)))}px`
            : '4px';

          return (
            <div
              key={index}
              style={{ height }}
              className={`w-1 rounded-full transition-all duration-200 ${
                isSpeaking
                  ? 'bg-amber-400'
                  : isListening
                  ? 'bg-zinc-200'
                  : 'bg-zinc-700'
              }`}
            />
          );
        })}
      </div>

      {/* State Text */}
      <span className="text-xs font-mono text-zinc-400 font-medium mt-2">
        {isSpeaking
          ? 'Assistant is Speaking...'
          : isListening
          ? 'Listening (Hinglish or English)...'
          : 'Tap to speak'}
      </span>
    </div>
  );
};
