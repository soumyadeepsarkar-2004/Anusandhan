import React from 'react';
import { OutreachDraft } from '../../types';
import { Clock, Send, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { createGmailComposeUrl } from '../../services/emailGenerator';
import confetti from 'canvas-confetti';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

interface FollowUpManagerProps {
  drafts: OutreachDraft[];
  onSendFollowUp: (draftId: string) => void;
  onSimulateTimeJump: () => void;
}

export const FollowUpManager: React.FC<FollowUpManagerProps> = ({
  drafts,
  onSendFollowUp,
  onSimulateTimeJump
}) => {
  // Overdue follow-up criteria: sent, daysSinceSent >= 6
  const followUpDueItems = drafts.filter(
    d => (d.status === 'Sent' || d.status === 'Opened' || d.status === 'Follow-up Due') && (d.daysSinceSent || 0) >= 6
  );

  const pendingRecentItems = drafts.filter(
    d => (d.status === 'Sent' || d.status === 'Opened') && (d.daysSinceSent || 0) < 6
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Ethical 7-Day Follow-Up Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-zinc-100">
            Smart Follow-Up Queue ({followUpDueItems.length} Due)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Professors receive 50+ emails daily. A single polite 3-sentence bump 7 days later increases response rates without being spammy.
          </p>
        </div>

        {/* 7-Day Timeline Simulation Accelerator */}
        <button
          onClick={() => {
            onSimulateTimeJump();
            confetti({ particleCount: 30, spread: 50 });
          }}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/90 border border-white/10 text-zinc-200 font-medium text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm self-start md:self-auto"
          title="Simulate 7 days elapsed to test follow-up trigger"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Fast-Forward Timeline (+7 Days)</span>
        </button>
      </AppleGlassCard>

      {/* Follow-Ups Due Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Requires Human Confirmation to Send</span>
        </h3>

        {followUpDueItems.length === 0 ? (
          <AppleGlassCard glowOnHover={false} className="p-8 sm:p-10 text-center text-xs text-zinc-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-90" />
            <p className="text-sm font-semibold text-zinc-200">All Clear! No Follow-Ups Overdue.</p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              All active inquiries are within the 5–7 day grace period, or recipients have already replied.
            </p>
          </AppleGlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {followUpDueItems.map((item) => {
              const gmailUrl = item.followUpBumpDraft
                ? createGmailComposeUrl(item.professorEmail, `Re: ${item.subjectLine}`, item.followUpBumpDraft)
                : '#';

              return (
                <AppleGlassCard
                  key={item.id}
                  glowOnHover={true}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        {item.daysSinceSent || 7} Days Elapsed Without Reply
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">Original: {item.status}</span>
                    </div>

                    <h4 className="text-base font-semibold text-zinc-100">
                      {item.professorName} <span className="text-xs font-normal text-zinc-400">({item.university})</span>
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      Paper cited: <span className="text-zinc-300 font-mono">"{item.paperTitle}"</span>
                    </p>

                    {/* Pre-Drafted 3-Sentence Bump */}
                    <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-xs text-zinc-300 font-mono leading-relaxed mt-2 shadow-inner">
                      <span className="text-[11px] text-zinc-500 uppercase font-mono block mb-1">Generated Follow-Up Bump:</span>
                      {item.followUpBumpDraft || "Dear Professor, gently following up on my research inquiry from last week..."}
                    </div>
                  </div>

                  {/* Human-in-the-Loop Action with touch ergonomics */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                    <button
                      onClick={() => {
                        onSendFollowUp(item.id);
                        confetti({ particleCount: 40, spread: 50 });
                      }}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch</span>
                    </button>

                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 text-xs font-medium flex items-center justify-center gap-2 border border-white/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Gmail</span>
                    </a>
                  </div>
                </AppleGlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Grace Period / Active Inquiries */}
      {pendingRecentItems.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-medium">
            Active Inquiries in 7-Day Grace Period ({pendingRecentItems.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRecentItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-canvas-card/60 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-zinc-200 block">{item.professorName}</span>
                  <span className="text-zinc-500 text-[11px]">{item.university}</span>
                </div>
                <span className="font-mono text-zinc-400 text-[11px]">
                  Sent {item.daysSinceSent || 1}d ago · Grace active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
