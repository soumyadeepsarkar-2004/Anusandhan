import React from 'react';
import { VoiceEngineType } from '../../types';
import { Sparkles, Globe, Cpu } from 'lucide-react';

interface VoiceEngineSelectorProps {
  currentEngine: VoiceEngineType;
  onEngineChange: (engine: VoiceEngineType) => void;
}

export const VoiceEngineSelector: React.FC<VoiceEngineSelectorProps> = ({
  currentEngine,
  onEngineChange
}) => {
  const engines = [
    {
      id: 'sarvam' as VoiceEngineType,
      name: 'Sarvam AI Bulbul',
      tag: 'HINGLISH',
      icon: Sparkles
    },
    {
      id: 'web-speech' as VoiceEngineType,
      name: 'Web Speech API',
      tag: 'LOCAL',
      icon: Globe
    },
    {
      id: 'google-live' as VoiceEngineType,
      name: 'Google Gemini Live',
      tag: 'REASONING',
      icon: Cpu
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-canvas-card border border-white/10 text-xs">
      <span className="text-[11px] text-zinc-500 font-mono px-1 uppercase tracking-wider">Engine:</span>
      {engines.map((eng) => {
        const Icon = eng.icon;
        const isSelected = currentEngine === eng.id;
        return (
          <button
            key={eng.id}
            onClick={() => onEngineChange(eng.id)}
            className={`min-h-[38px] flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              isSelected
                ? 'bg-zinc-800 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">{eng.name}</span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase">
              ({eng.tag})
            </span>
          </button>
        );
      })}
    </div>
  );
};
