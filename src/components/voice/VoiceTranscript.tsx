import React from 'react';
import { VoiceMessage } from '../../types';
import { Volume2, User, Sparkles, ArrowRight, Zap } from 'lucide-react';

interface VoiceTranscriptProps {
  messages: VoiceMessage[];
  onPlayMessage: (text: string, audioBase64?: string) => void;
  onTriggerAction?: (action: string) => void;
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  messages,
  onPlayMessage,
  onTriggerAction
}) => {
  return (
    <div className="space-y-3 max-h-60 overflow-y-auto p-4 rounded-xl bg-canvas-card border border-white/10 shadow-inner">
      {messages.length === 0 ? (
        <p className="text-center text-xs text-zinc-500 font-mono py-6">
          No dialogue history yet. Tap the microphone or click a prompt above.
        </p>
      ) : (
        messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-zinc-800/90 border border-white/10 text-zinc-200'
                    : 'bg-amber-500/20 border border-amber-500/30 text-zinc-100 font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                  <span className="font-semibold text-zinc-300">{isAgent ? 'AnusandhanAI' : 'You'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="font-sans">{msg.text}</p>

                {isAgent && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onPlayMessage(msg.text, msg.audioBase64)}
                      className="min-h-[30px] text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay Voice</span>
                    </button>

                    {msg.action && msg.action !== 'NOOP' && onTriggerAction && (
                      <button
                        onClick={() => onTriggerAction(msg.action!)}
                        className="min-h-[30px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Action: {msg.action.replace('_', ' ')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!isAgent && (
                <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
