import React, { useState } from 'react';
import { OutreachDraft, StudentProfile } from '../../types';
import { createGmailComposeUrl, createMailtoUrl } from '../../services/emailGenerator';
import { Mail, Copy, ExternalLink, Send, CheckCircle, Clock, ShieldCheck, WifiOff, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiClient } from '../../services/apiClient';
import { OfflineSyncEngine } from '../../services/offlineSyncEngine';
import { AppleGlassCard } from '../ui/AppleGlass';

interface OutreachComposerProps {
  draft: OutreachDraft | null;
  student: StudentProfile;
  onSendDraft: (draftId: string) => void;
  onUpdateDraftBody: (draftId: string, newBody: string) => void;
  onNavigateToDiscover: () => void;
}

export const OutreachComposer: React.FC<OutreachComposerProps> = ({
  draft,
  student,
  onSendDraft,
  onUpdateDraftBody,
  onNavigateToDiscover
}) => {
  const [copied, setCopied] = useState(false);
  const [humanConfirmed, setHumanConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  const handleAIDeconstruct = async () => {
    if (!draft) return;
    setIsDeconstructing(true);
    try {
      const res = await ApiClient.deconstructPaper({
        paper: {
          title: draft.paperTitle,
          snippet: draft.body.slice(0, 200)
        },
        student: {
          name: student.fullName,
          university: student.university,
          cgpa: student.cgpa,
          skills: student.skills,
          domains: student.targetDomains
        },
        professor: {
          name: draft.professorName,
          university: draft.university,
          email: draft.professorEmail
        }
      });

      if (res && res.pitch_146w) {
        onUpdateDraftBody(draft.id, res.pitch_146w);
        confetti({ particleCount: 35, spread: 50 });
      }
    } catch (e) {
      console.warn('AI Deconstruction failed:', e);
    } finally {
      setIsDeconstructing(false);
    }
  };

  if (!draft) {
    return (
      <AppleGlassCard className="p-10 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-center mx-auto shadow-inner">
          <Mail className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Outreach Draft Selected</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Select a matched professor from the <strong>Discover Labs & Grants</strong> tab to synthesize a calibrated 146-word precision pitch grounded in active 2025/2026 publications.
        </p>
        <button
          onClick={onNavigateToDiscover}
          className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-md"
        >
          Explore Faculty Matches
        </button>
      </AppleGlassCard>
    );
  }

  const wordCount = draft.body.trim().split(/\s+/).length;
  const isOptimalLength = wordCount >= 135 && wordCount <= 185;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${draft.subjectLine}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendAction = async () => {
    setIsSubmitting(true);
    const isOnline = OfflineSyncEngine.isOnline();

    if (!isOnline) {
      await OfflineSyncEngine.enqueueOfflineAction('QUEUE_OUTREACH', {
        draft_id: draft.id,
        professor_email: draft.professorEmail,
        human_confirmed: humanConfirmed
      });
      setQueueMessage('Saved to drafts. Will automatically dispatch when reconnected.');
      onSendDraft(draft.id);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await ApiClient.enqueueEmail({
        draft_id: draft.id,
        professor_email: draft.professorEmail,
        human_confirmed: humanConfirmed
      });

      if (result) {
        setQueueMessage(`Outreach scheduled for delivery. Daily quota remaining: ${result.daily_quota_remaining}.`);
      } else {
        await OfflineSyncEngine.enqueueOfflineAction('QUEUE_OUTREACH', {
          draft_id: draft.id,
          professor_email: draft.professorEmail,
          human_confirmed: humanConfirmed
        });
        setQueueMessage('Saved to local drafts. Will dispatch automatically once online.');
      }
    } catch (e) {
      console.warn('Queued locally:', e);
      await OfflineSyncEngine.enqueueOfflineAction('QUEUE_OUTREACH', {
        draft_id: draft.id,
        professor_email: draft.professorEmail,
        human_confirmed: humanConfirmed
      });
      setQueueMessage('Saved to local drafts. Will dispatch automatically once online.');
    }

    onSendDraft(draft.id);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setIsSubmitting(false);
  };

  const gmailUrl = createGmailComposeUrl(draft.professorEmail, draft.subjectLine, draft.body);
  const mailtoUrl = createMailtoUrl(draft.professorEmail, draft.subjectLine, draft.body);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
      
      {/* Top Protocol Status Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-white/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
              146-Word Academic Precision Protocol
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-[11px] font-mono text-zinc-400">Zero AI Fluff</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-white mt-0.5">
            Outreach to {draft.professorName} ({draft.university})
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Direct PI Inbox: <span className="text-zinc-200">{draft.professorEmail}</span>
          </p>
        </div>

        {/* Action Controls & Word Count Indicator */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleAIDeconstruct}
            disabled={isDeconstructing}
            className="min-h-[34px] px-3.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 backdrop-blur-md"
            title="Invoke Autonomous Paper Agent to analyze bottlenecks and recalibrate pitch to 146 words"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDeconstructing ? 'Deconstructing Paper...' : 'AI 146w Recalibrate'}</span>
          </button>

          <div className={`px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center space-x-1.5 backdrop-blur-md ${
            isOptimalLength
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-white/5 text-zinc-300 border border-white/10'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{wordCount} Words</span>
            <span className="text-zinc-400 text-[11px]">({isOptimalLength ? 'Optimal' : 'Target: 140–180'})</span>
          </div>
        </div>
      </div>

      {/* Apple Glass Editor Box */}
      <div className="glass-panel rounded-3xl p-0 overflow-hidden shadow-2xl border border-white/15 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />
        
        {/* Subject Header */}
        <div className="p-3.5 bg-white/[0.03] backdrop-blur-md border-b border-white/10 text-xs flex items-center space-x-2.5">
          <span className="text-zinc-400 font-mono uppercase text-[11px] font-semibold tracking-wider shrink-0">Subject:</span>
          <span className="text-zinc-100 font-mono font-medium select-all">{draft.subjectLine}</span>
        </div>

        {/* Body Textarea with High-Craft Font & Line Height */}
        <div className="p-5 bg-transparent">
          <textarea
            rows={12}
            value={draft.body}
            onChange={(e) => onUpdateDraftBody(draft.id, e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed outline-none resize-none focus:ring-0 selection:bg-amber-500/30"
          />
        </div>

        {/* Mandatory Human Review Checkbox */}
        <div className="px-5 py-3 bg-white/[0.02] backdrop-blur-md border-t border-white/10 flex items-center space-x-2.5 text-xs text-zinc-300 select-none">
          <input
            type="checkbox"
            id="human-confirm"
            checked={humanConfirmed}
            onChange={(e) => setHumanConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-amber-400 focus:ring-amber-400/20 cursor-pointer"
          />
          <label htmlFor="human-confirm" className="cursor-pointer font-sans leading-tight">
            I have reviewed this draft and confirmed it mentions the PI's specific paper and my actual code experience.
          </label>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-white/[0.03] backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border-white/10 active:scale-95'
              }`}
              title="Copy calibrated pitch and subject line to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Pitch</span>
                </>
              )}
            </button>

            <a
              href={mailtoUrl}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all border border-white/10 backdrop-blur-md"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mail App</span>
            </a>
          </div>

          <div className="flex items-center space-x-2.5">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleSendAction}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium text-xs flex items-center gap-1.5 transition-all border border-white/15 cursor-pointer backdrop-blur-md"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Compose in Gmail</span>
            </a>

            <button
              disabled={!humanConfirmed || isSubmitting}
              onClick={handleSendAction}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 transform active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Queue Jitter Dispatch (4–12 min)</span>
            </button>
          </div>

        </div>

      </div>

      {queueMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2.5 shadow-lg">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono">{queueMessage}</span>
        </div>
      )}

      {/* Anti-Spam Safety Notice */}
      <div className="p-3.5 rounded-xl apple-glass border border-zinc-800/80 flex items-start space-x-3 text-xs text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-200 font-medium">Anti-Blacklist Safeguard:</strong> Messages are held in a randomized 4 to 12 minute jitter delay queue to simulate human transmission timing and protect your sending domain from spam reputation penalties.
        </p>
      </div>

    </div>
  );
};
