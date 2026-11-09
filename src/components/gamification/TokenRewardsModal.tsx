import React, { useState } from 'react';
import { 
  X, Coins, Sparkles, Flame, CheckCircle2, Gift, ArrowRight, 
  ShieldCheck, Award, Zap, Clock, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

interface TokenRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricingModal?: () => void;
  onOpenAuth?: () => void;
}

export const TokenRewardsModal: React.FC<TokenRewardsModalProps> = ({
  isOpen,
  onClose,
  onOpenPricingModal,
  onOpenAuth
}) => {
  if (!isOpen) return null;

  const { user, claimDailyStreak, redeemTokensForPlan } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const tokens = user?.tokensBalance || 0;
  const streak = user?.loginStreak || 1;

  const handleClaimDaily = async () => {
    if (!user) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      } else {
        setClaimFeedback('Please sign in or create an account to claim daily Shodh tokens.');
      }
      return;
    }
    setIsClaiming(true);
    setClaimFeedback(null);
    try {
      const res = await claimDailyStreak();
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      setClaimFeedback(res.message || 'Claimed +5 Shodh Tokens!');
    } catch (err: any) {
      setClaimFeedback(err.message || 'Streak reward already claimed for today.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-2xl animate-fadeIn">
      {/* Specular Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Glass Dialog */}
      <div className="w-full max-w-lg apple-glass rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative max-h-[90vh]">
        {/* Specular Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                Shodh Token Wallet & Rewards
              </h3>
              <p className="text-xs text-zinc-400">
                Earn by researching · Spend on verified lab outreach
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Token Rewards Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
          
          {/* Main Wallet Balance Card */}
          <div className="apple-glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Active Balance
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-serif font-bold text-amber-400">🪙 {tokens}</span>
                <span className="text-xs text-zinc-400 font-mono">Shodh Tokens</span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{streak}-Day Streak</span>
              </div>
              <span className="block text-[10px] text-zinc-500 mt-1">Multiplier: 1.0x</span>
            </div>
          </div>

          {/* Daily Streak Claim Box */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-medium text-zinc-100">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Daily Scholar Check-In</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Claim +5 Shodh Tokens every 24 hours to fuel your cold email pitches.
              </p>
            </div>

            <button
              onClick={handleClaimDaily}
              disabled={isClaiming}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              {isClaiming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Claim +5 Tokens</span>
                </>
              )}
            </button>
          </div>

          {claimFeedback && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono text-center">
              {claimFeedback}
            </div>
          )}

          {/* Ways to Spend Tokens */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Redeem Shodh Tokens
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">10 Verified Credits</span>
                  <span className="text-[10px] text-zinc-400">AI outreach pitches</span>
                </div>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                  🪙 15
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">AI Mock Technical Viva</span>
                  <span className="text-[10px] text-zinc-400">1-on-1 interview practice</span>
                </div>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                  🪙 25
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">Scholar Pro Upgrade</span>
                  <span className="text-[10px] text-zinc-400">1-Month full pass</span>
                </div>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                  🪙 30
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">Lab Grant Tracker</span>
                  <span className="text-[10px] text-zinc-400">Deep capacity reports</span>
                </div>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                  🪙 40
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Bonus Card */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-200">Institutional Email Bonus</span>
              <p className="text-[10px] text-blue-300">
                Link your .edu / .ac.in email for an instant +25 Shodh Tokens grant.
              </p>
            </div>
            <span className="font-mono font-bold text-blue-300 text-sm">
              +25 🪙
            </span>
          </div>

          {/* Footer action to buy plans with cash/Razorpay */}
          {onOpenPricingModal && (
            <div className="pt-2 text-center border-t border-white/10">
              <p className="text-[11px] text-zinc-400">
                Need more credits instantly?
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricingModal();
                  }}
                  className="ml-1.5 text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                >
                  View Subscription Plans & Razorpay Checkout →
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
