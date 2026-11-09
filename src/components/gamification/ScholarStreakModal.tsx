import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Coins, 
  Gift, 
  Award, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Clock, 
  Star,
  Check,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

interface ScholarStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricingModal?: () => void;
  onOpenAuth?: () => void;
}

export const ScholarStreakModal: React.FC<ScholarStreakModalProps> = ({
  isOpen,
  onClose,
  onOpenPricingModal,
  onOpenAuth
}) => {
  if (!isOpen) return null;

  const { user, claimDailyReward, redeemTokensForPlan } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'shop' | 'badges'>('rewards');

  // Gamification properties from user profile
  const streak = user?.loginStreak || 1;
  const tokens = user?.tokensBalance || 0;
  const isClaimedToday = user?.dailyRewardClaimedToday || false;
  const xp = user?.xpPoints || 150;
  const credits = user?.creditsRemaining || 10;

  // Level calculation
  const currentLevel = xp < 200 ? 1 : xp < 400 ? 2 : xp < 700 ? 3 : 4;
  const levelTitle = currentLevel === 1 
    ? 'Undergraduate Explorer' 
    : currentLevel === 2 
    ? 'Literature Scout' 
    : currentLevel === 3 
    ? 'Lab-Ready Fellow' 
    : 'Elite Grant Scholar';
  const nextLevelXp = currentLevel === 1 ? 200 : currentLevel === 2 ? 400 : currentLevel === 3 ? 700 : 1000;
  const xpProgressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  // Handle claiming daily credits and random tokens
  const handleClaim = async () => {
    if (!user) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      } else {
        setClaimFeedback('Please sign in with Google or your academic CV to claim daily tokens.');
      }
      return;
    }
    if (isClaimedToday || isClaiming) return;
    setIsClaiming(true);
    setClaimFeedback(null);
    try {
      const res = await claimDailyReward();
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
      setClaimFeedback(res.message);
    } catch (err: any) {
      setClaimFeedback(err.message || 'Failed to claim daily reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle spending tokens to purchase Pro plans
  const handleRedeem = async (planId: string, cost: number, creditsToAdd: number) => {
    setIsRedeeming(planId);
    setRedeemFeedback(null);
    try {
      const res = await redeemTokensForPlan(planId, cost, creditsToAdd);
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
      setRedeemFeedback(res.message);
    } catch (err: any) {
      setRedeemFeedback(err.message || 'Failed to redeem tokens.');
    } finally {
      setIsRedeeming(null);
    }
  };

  const REDEEMABLE_PLANS = [
    {
      id: 'starter-credits',
      name: 'Starter Boost Pack',
      tokenCost: 10,
      credits: 25,
      description: '25 Verified Faculty Matches & 146-word AI Pitch drafts',
      badge: 'POPULAR'
    },
    {
      id: 'pro-season',
      name: 'Pro Scholar Monthly Pass',
      tokenCost: 20,
      credits: 100,
      description: '100 Credits + Full AI Model Routing (Gemini 2.5, Llama 3.3, DeepSeek R1)',
      badge: 'BEST VALUE',
      featured: true
    },
    {
      id: 'global-fellowship',
      name: 'Global Fellowship VIP Bundle',
      tokenCost: 45,
      credits: 250,
      description: '250 Credits + Unlimited Simulated Mock Interview Vivas + DAAD/Mitacs Priority Radar',
      badge: 'ELITE SCHOLAR'
    }
  ];

  const BADGES = [
    { name: 'Consistent Researcher', icon: '🔥', desc: 'Maintained 3+ days login streak', unlocked: streak >= 3 },
    { name: 'Token Collector', icon: '🪙', desc: 'Collected 10+ Shodh tokens', unlocked: tokens >= 10 },
    { name: 'Literature Grounded', icon: '📜', desc: 'Drafted 146-word paper-aligned pitch', unlocked: true },
    { name: 'Lab-Ready Scholar', icon: '🎓', desc: 'Reached Level 3 Research Readiness', unlocked: currentLevel >= 3 },
    { name: 'Weeklong Dedicated', icon: '⚡', desc: 'Maintained 7+ days unbroken streak', unlocked: streak >= 7 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-2xl animate-fadeIn">
      {/* Ambient Floor Glow */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="w-full max-w-2xl glass-modal rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Specular Top Sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                  Scholar Streaks & Token Economy
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  ANUSANDHAN REWARDS
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Log in daily to earn free credits, collect Shodh Tokens, and redeem Pro plans.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Streak Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Daily Bonus</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Token Exchange</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-amber-300 font-bold">
              {tokens} 🪙
            </span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges & XP</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Top Live Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl glass-panel text-center relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold font-mono text-base sm:text-lg">
                <Flame className="w-4 h-4 fill-current" />
                <span>{streak} Days</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mt-0.5">
                Current Streak
              </span>
            </div>

            <div className="p-3 rounded-2xl glass-panel text-center relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold font-mono text-base sm:text-lg">
                <span>🪙 {tokens}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mt-0.5">
                Shodh Tokens
              </span>
            </div>

            <div className="p-3 rounded-2xl glass-panel text-center relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
              <div className="flex items-center justify-center gap-1 text-zinc-100 font-bold font-mono text-base sm:text-lg">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{credits}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mt-0.5">
                Active Credits
              </span>
            </div>
          </div>

          {/* TAB 1: DAILY BONUS & STREAK REWARDS */}
          {activeTab === 'rewards' && (
            <div className="space-y-5">
              
              {/* Daily Claim Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-white/[0.03] to-black/40 border border-amber-500/35 relative overflow-hidden shadow-xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>DAY {streak} OF 7 · DAILY DROP</span>
                    </div>
                    <h4 className="text-lg font-serif font-semibold text-zinc-100">
                      {isClaimedToday ? 'Daily Reward Claimed!' : 'Your Daily Scholar Loot is Ready'}
                    </h4>
                    <p className="text-xs text-zinc-300 max-w-sm">
                      {isClaimedToday 
                        ? 'You have already checked in today. Your next batch of free credits and random tokens unlocks tomorrow!'
                        : 'Claim +3 free outreach credits and 1 to 3 random 🪙 Shodh Tokens to fuel your research outreach.'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={handleClaim}
                      disabled={isClaimedToday || isClaiming}
                      className={`min-h-[46px] px-6 py-2.5 rounded-2xl font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center space-x-2 shadow-lg ${
                        isClaimedToday
                          ? 'bg-white/10 text-zinc-400 cursor-not-allowed border border-white/10'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-amber-500/25 active:scale-95'
                      }`}
                    >
                      <Gift className="w-4 h-4" />
                      <span>{isClaiming ? 'Unlocking...' : isClaimedToday ? 'Claimed for Today' : 'Claim Daily Reward'}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Toast */}
                {claimFeedback && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300 font-mono animate-fadeIn flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{claimFeedback}</span>
                  </div>
                )}
              </div>

              {/* 7-Day Visual Progress Track */}
              <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-semibold">7-Day Streak Roadmap</span>
                  <span className="text-amber-400">{streak}/7 Days Completed</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isCompleted = streak >= day;
                    const isToday = streak === day;
                    const isMilestone = day === 3 || day === 7;
                    return (
                      <div
                        key={day}
                        className={`p-2 rounded-xl text-center flex flex-col items-center justify-between min-h-[64px] border transition-all ${
                          isCompleted
                            ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                            : isToday
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-white/[0.02] border-white/5 text-zinc-500'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-medium block">D{day}</span>
                        <span className="text-sm my-0.5">
                          {isMilestone ? '🎁' : isCompleted ? '✓' : '🪙'}
                        </span>
                        <span className="text-[9px] font-mono block text-zinc-400">
                          {day === 7 ? '+3 🪙' : day === 3 ? '+1 🪙' : '1-3 🪙'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TOKEN EXCHANGE SHOP (Redeem for Pro Plans) */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-100 block">Your Shodh Token Balance</span>
                  <p className="text-[11px] text-zinc-400">Earned by keeping daily login streaks and reviewing faculty.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-amber-400">🪙 {tokens} Tokens</span>
                </div>
              </div>

              {redeemFeedback && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300 font-mono animate-fadeIn flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{redeemFeedback}</span>
                </div>
              )}

              <div className="space-y-3">
                {REDEEMABLE_PLANS.map((plan) => {
                  const canAfford = tokens >= plan.tokenCost;
                  const isRedeemingThis = isRedeeming === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        plan.featured
                          ? 'bg-gradient-to-r from-amber-500/15 via-white/[0.04] to-black/40 border-amber-400/40 shadow-lg'
                          : 'glass-panel border-white/12'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-100">{plan.name}</h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            {plan.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{plan.description}</p>
                        <span className="text-[11px] font-mono text-amber-300 font-semibold block">
                          +{plan.credits} Verified Outreach Credits
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-zinc-100 block">
                            🪙 {plan.tokenCost}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Tokens Required</span>
                        </div>

                        <button
                          onClick={() => handleRedeem(plan.id, plan.tokenCost, plan.credits)}
                          disabled={!canAfford || !!isRedeeming}
                          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-md active:scale-95'
                              : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/10'
                          }`}
                        >
                          {isRedeemingThis ? (
                            <span>Redeeming...</span>
                          ) : canAfford ? (
                            <>
                              <span>Redeem Plan</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Need {plan.tokenCost - tokens} More</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onOpenPricingModal && (
                <div className="pt-2 text-center">
                  <p className="text-xs text-zinc-400">
                    Want to top up credits directly without waiting?{' '}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPricingModal();
                      }}
                      className="text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      View INR / USD Credit Packs
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BADGES & SCHOLAR XP */}
          {activeTab === 'badges' && (
            <div className="space-y-5">
              {/* Level Progress */}
              <div className="p-4 rounded-2xl glass-panel space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-semibold">Level {currentLevel}: {levelTitle}</span>
                  <span className="text-zinc-400">{xp} / {nextLevelXp} XP</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpProgressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Earn XP by inspecting faculty papers, maintaining login streaks, and synthesizing 146-word inquiry pitches.
                </p>
              </div>

              {/* Badges List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Unlocked Achievements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BADGES.map((b, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all ${
                        b.unlocked
                          ? 'glass-panel border-amber-500/30'
                          : 'bg-white/[0.02] border-white/5 opacity-50'
                      }`}
                    >
                      <div className="text-2xl shrink-0 p-2 rounded-xl bg-white/5">
                        {b.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-200 truncate">{b.name}</span>
                          {b.unlocked && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
