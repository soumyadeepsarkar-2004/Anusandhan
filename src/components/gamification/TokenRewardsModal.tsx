import React, { useState } from 'react';
import { 
  X, Coins, Sparkles, Flame, CheckCircle2, Gift, ArrowRight, 
  ShieldCheck, Award, Zap, Clock, RefreshCw, Trophy, Lock, ShieldAlert
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
  const [activeTab, setActiveTab] = useState<'wallet' | 'badges' | 'leaderboard' | 'security'>('wallet');
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
        setClaimFeedback('Please sign in or create an account to claim daily Research Coins (রিসার্চ কয়েন).');
      }
      return;
    }
    setIsClaiming(true);
    setClaimFeedback(null);
    try {
      const res = await claimDailyStreak();
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      setClaimFeedback(res.message || 'Claimed +5 Research Coins (রিসার্চ কয়েন)!');
    } catch (err: any) {
      setClaimFeedback(err.message || 'Daily streak reward already claimed for today.');
    } finally {
      setIsClaiming(false);
    }
  };

  const badges = [
    { id: 'streak-7', title: '7-Day Scholar Streak', desc: 'Consistently logged in and verified opportunities for 7 days', reward: '+25 RC', unlocked: streak >= 7, icon: '🔥' },
    { id: 'first-pitch', title: '146-Word Pitch Grounded', desc: 'Crafted a literature-cited cold outreach email', reward: '+15 RC', unlocked: true, icon: '📜' },
    { id: 'paper-scout', title: 'Literature Scout', desc: 'Explored 25+ papers across arXiv & OpenAlex', reward: '+20 RC', unlocked: true, icon: '🔬' },
    { id: 'edu-bonus', title: 'Institutional Scholar', desc: 'Verified .edu / .ac.in academic domain credentials', reward: '+30 RC', unlocked: false, icon: '🎓' },
    { id: 'viva-ace', title: 'Mock Viva Ace', desc: 'Completed an AI technical interview diagnostic session', reward: '+25 RC', unlocked: false, icon: '⚡' },
    { id: 'dpdp-audit', title: 'Privacy Integrity Guard', desc: 'Enabled DPDP Act 2023 zero-telemetry safe storage', reward: '+10 RC', unlocked: true, icon: '🛡️' }
  ];

  const leaders = [
    { rank: 1, name: 'Aarav M.', institute: 'IIT Bombay', discipline: 'Quantum Photonics', streak: 21, coins: 480 },
    { rank: 2, name: 'Ananya S.', institute: 'IISc Bengaluru', discipline: 'Computational Biology', streak: 18, coins: 395 },
    { rank: 3, name: 'Rohit K.', institute: 'NIT Trichy', discipline: 'Edge Robotics', streak: 14, coins: 310 },
    { rank: 4, name: 'Tanvi D.', institute: 'Jadavpur University', discipline: 'Epigraphy & History', streak: 12, coins: 275 },
    { rank: 5, name: 'Scholar (You)', institute: 'Active Researcher', discipline: 'Multi-Faculty', streak: streak, coins: tokens }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      {/* Ambient Glowing Orbs */}
      <div className="ambient-orb -top-20 -left-20 w-80 h-80 bg-amber-500/15" />
      <div className="ambient-orb -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15" />

      {/* Glass Dialog */}
      <div className="w-full max-w-xl aceternity-glass rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.48)] overflow-hidden flex flex-col relative max-h-[92vh] bg-zinc-950/85">
        {/* Specular Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                  Research Coins (রিসার্চ কয়েন)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  RC Wallet
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Merit-based research rewards · 100% Free · Anti-Cheat Secured
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

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-0 border-b border-white/10 flex items-center space-x-2 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wallet'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Wallet & Streak</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Scholar Badges</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Cheat</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
          
          {/* TAB 1: WALLET & STREAK */}
          {activeTab === 'wallet' && (
            <>
              {/* Main Wallet Balance Card */}
              <div className="apple-glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Active Research Balance
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-serif font-bold text-amber-400">🪙 {tokens}</span>
                    <span className="text-xs text-zinc-400 font-mono">Research Coins (RC)</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>{streak}-Day Streak</span>
                  </div>
                  <span className="block text-[10px] text-zinc-500 mt-1">Multiplier: {streak >= 7 ? '1.5x Boost' : '1.0x Base'}</span>
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
                    Claim +5 Research Coins every 24 hours to generate verified lab pitch drafts.
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
                      <span>Verifying with Server...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim +5 Coins</span>
                    </>
                  )}
                </button>
              </div>

              {claimFeedback && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono text-center">
                  {claimFeedback}
                </div>
              )}

              {/* Ways to Spend Coins */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Redeem Research Coins (রিসার্চ কয়েন)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200 block">10 Verified Outreach Credits</span>
                      <span className="text-[10px] text-zinc-400">146-word literature pitches</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                      🪙 15 RC
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200 block">AI Mock Technical Viva</span>
                      <span className="text-[10px] text-zinc-400">Multilingual audio viva practice</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                      🪙 25 RC
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200 block">Scholar Pro Upgrade</span>
                      <span className="text-[10px] text-zinc-400">Full 30-day autonomous access</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                      🪙 30 RC
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200 block">Deep Lab Grant Radar</span>
                      <span className="text-[10px] text-zinc-400">Funded vacancies & stipend analysis</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/25">
                      🪙 40 RC
                    </span>
                  </div>
                </div>
              </div>

              {/* Institutional Bonus Card */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-blue-200">Institutional Email Scholar Grant</span>
                  <p className="text-[10px] text-blue-300">
                    Verify your .edu / .ac.in academic email for an immediate +30 Research Coins grant.
                  </p>
                </div>
                <span className="font-mono font-bold text-blue-300 text-sm">
                  +30 🪙
                </span>
              </div>
            </>
          )}

          {/* TAB 2: SCHOLAR BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-[11px]">Earned 3 of 6 Milestone Badges</span>
                <span className="text-amber-400 font-mono text-[11px] font-semibold">50% Complete</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                      b.unlocked 
                        ? 'bg-amber-500/[0.07] border-amber-500/30 text-zinc-200' 
                        : 'bg-white/[0.02] border-white/10 text-zinc-500 opacity-60'
                    }`}
                  >
                    <div className="text-2xl select-none">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-zinc-200 truncate">{b.title}</span>
                        <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                          {b.reward}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{b.desc}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {b.unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unlocked & Credited</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                            <Lock className="w-3 h-3" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
                <span className="text-zinc-300">National Research Scholar Leaderboard</span>
                <span className="font-mono text-amber-400 font-semibold text-[11px]">Ranked by Research Consistency</span>
              </div>

              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-white/[0.04] text-zinc-400 border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Scholar</th>
                      <th className="py-2.5 px-3">Institute</th>
                      <th className="py-2.5 px-3 text-right">Streak</th>
                      <th className="py-2.5 px-3 text-right">Coins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaders.map((lead) => (
                      <tr 
                        key={lead.rank} 
                        className={`hover:bg-white/[0.03] transition-colors ${
                          lead.rank === 5 ? 'bg-amber-500/10 font-bold text-amber-300' : 'text-zinc-300'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          {lead.rank === 1 ? '🥇 #1' : lead.rank === 2 ? '🥈 #2' : lead.rank === 3 ? '🥉 #3' : `#${lead.rank}`}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                          {lead.name}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          {lead.institute}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400">
                          🔥 {lead.streak}d
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                          🪙 {lead.coins}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANTI-CHEAT & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cryptographic Anti-Cheat & Fair Play Architecture</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  To ensure that research opportunities remain strictly merit-grounded and honest for every student:
                </p>
                <ul className="space-y-1.5 text-[11px] text-zinc-400 list-disc list-inside">
                  <li><strong className="text-zinc-200">Server-Side Timestamp Validation:</strong> Check-ins are validated using immutable NTP server times, preventing client-side system clock manipulation.</li>
                  <li><strong className="text-zinc-200">Monotonic Anti-Replay Tokens:</strong> Daily coin claims generate a single-use monotonic token, preventing double-spend and scripted replay attacks.</li>
                  <li><strong className="text-zinc-200">DPDP Act 2023 Compliance:</strong> No private telemetry, keystroke loggers, or invasive trackers are used.</li>
                  <li><strong className="text-zinc-200">No Pay-To-Win:</strong> Coins cannot be bought through illegitimate hacks or bots; they can only be earned through authentic research work.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer action to buy plans with cash/Razorpay */}
          {onOpenPricingModal && (
            <div className="pt-2 text-center border-t border-white/10">
              <p className="text-[11px] text-zinc-400">
                Want to unlock institutional batch access?
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
export default TokenRewardsModal;
