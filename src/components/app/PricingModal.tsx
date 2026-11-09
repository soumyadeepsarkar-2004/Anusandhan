import React, { useState } from 'react';
import { X, Check, Zap, Sparkles, CreditCard, ShieldCheck, Coins, Lock } from 'lucide-react';
import { PRICING_PLANS } from '../../data/pricingPlans';
import { useAuth } from '../../context/AuthContext';
import { RazorpayPaymentModal } from '../payment/RazorpayPaymentModal';
import confetti from 'canvas-confetti';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining: number;
  onAddCredits: (amount: number) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  creditsRemaining,
  onAddCredits
}) => {
  if (!isOpen) return null;

  const { user, redeemTokensForPlan } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [payWithTokens, setPayWithTokens] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<string | null>(null);

  // Razorpay Checkout State
  const [checkoutPlanId, setCheckoutPlanId] = useState<string>('pro-season');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  const tokens = user?.tokensBalance || 0;

  const handlePurchase = async (planId: string, credits: number, tokenCost: number) => {
    setIsProcessing(true);
    setTokenFeedback(null);

    if (payWithTokens) {
      try {
        const res = await redeemTokensForPlan(planId, tokenCost, credits);
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
        onAddCredits(credits);
        setTokenFeedback(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setTokenFeedback(err.message || 'Failed to redeem tokens.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (planId === 'free-scholar') {
      onAddCredits(10);
      setIsProcessing(false);
      confetti({ particleCount: 50, spread: 60 });
      onClose();
      return;
    }

    // Map to backend billing plan ID and open Razorpay Payment Modal
    const mappedPlanId = planId === 'institutional-lab' ? 'institutional_lab' : 'pro_researcher';
    setCheckoutPlanId(mappedPlanId);
    setIsRazorpayModalOpen(true);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-fadeIn">
      {/* Ambient Radial Lighting Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl glass-modal rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Specular Highlight Sheen */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-lg font-serif font-medium text-zinc-100">Upgrade Plan & Refill Verified Credits</h3>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 font-mono">
              <span>Credits: <strong className="text-amber-400">{creditsRemaining}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span>Shodh Tokens:</span>
                <strong className="text-amber-300">🪙 {tokens}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Pay with Tokens toggle */}
            <div className="flex p-0.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono font-medium backdrop-blur-md">
              <button
                onClick={() => setPayWithTokens(false)}
                className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  !payWithTokens ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setPayWithTokens(true)}
                className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  payWithTokens ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Free with 🪙 Tokens</span>
              </button>
            </div>

            {!payWithTokens && (
              <div className="flex p-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono font-medium backdrop-blur-md">
                <button
                  onClick={() => setCurrency('INR')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    currency === 'INR' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ₹
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    currency === 'USD' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  $
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Token Feedback Toast */}
        {tokenFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300 font-mono animate-fadeIn">
            {tokenFeedback}
          </div>
        )}

        {/* Body Cards - Pixel-perfect baseline alignment */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const price = currency === 'INR' ? plan.priceInr : plan.priceUsd;
            const creditBoost = plan.id === 'starter-credits' ? 50 : plan.id === 'pro-season' ? 150 : 5;
            const tokenCost = plan.id === 'starter-credits' ? 10 : plan.id === 'pro-season' ? 20 : 0;
            const canAffordTokens = tokens >= tokenCost;

            return (
              <div
                key={plan.id}
                className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between relative transition-all ${
                  isPopular
                    ? 'bg-gradient-to-b from-amber-500/15 via-white/[0.05] to-black/40 backdrop-blur-xl border-amber-400/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-white/[0.03] backdrop-blur-xl border-white/12 hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex-1 flex flex-col">
                  {/* Clean Non-Overlapping Rounded Corner Top Badge Header */}
                  <div className="flex items-center justify-between mb-3.5 min-h-[28px]">
                    {isPopular ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                        <Sparkles className="w-3 h-3 text-zinc-950" />
                        <span>Recommended</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-white/10 text-zinc-400 text-[10px] font-mono font-medium uppercase tracking-wider">
                        {plan.badgeText || (plan.id === 'free-scholar' ? 'Standard Access' : 'Full Cycle')}
                      </span>
                    )}
                  </div>
                  {/* Title Row - Fixed Height h-8 */}
                  <div className="h-8 flex items-center">
                    <h4 className="text-base sm:text-lg font-semibold text-zinc-100">{plan.name}</h4>
                  </div>

                  {/* Description Row - Fixed Height across all cards h-10 */}
                  <div className="h-10 flex items-start mt-1">
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-2">{plan.description}</p>
                  </div>

                  {/* Price Row - Exact Same Baseline Alignment */}
                  <div className="h-16 flex items-baseline gap-1.5 my-3 py-3 border-y border-white/10">
                    {payWithTokens ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-semibold text-amber-300 font-mono tracking-tight">
                          {tokenCost === 0 ? 'Free' : `🪙 ${tokenCost}`}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {tokenCost === 0 ? 'Standard' : 'Shodh Tokens'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-semibold text-zinc-100 font-mono tracking-tight">{price}</span>
                        <span className="text-xs text-zinc-400 font-mono">/ {plan.periodText}</span>
                      </>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 text-xs text-zinc-300 my-3 min-h-[160px]">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-zinc-300 leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePurchase(plan.id, creditBoost, tokenCost)}
                  disabled={isProcessing || (payWithTokens && tokenCost > 0 && !canAffordTokens)}
                  className={`mt-4 w-full min-h-[44px] py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    payWithTokens && tokenCost > 0 && !canAffordTokens
                      ? 'bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 active:scale-98'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-100 hover:text-white backdrop-blur-md active:scale-98'
                  }`}
                >
                  {payWithTokens ? (
                    tokenCost === 0 ? (
                      <span>Current Active Plan</span>
                    ) : canAffordTokens ? (
                      <>
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>Redeem with {tokenCost} Tokens (+{creditBoost} Credits)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Need {tokenCost - tokens} More Tokens</span>
                      </>
                    )
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{isProcessing ? 'Simulating Checkout...' : `Select (${creditBoost} Credits)`}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-white/[0.02] backdrop-blur-md border-t border-white/10 flex items-center justify-center space-x-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Earn 1–3 free Shodh Tokens every day via login streaks · Redeemable directly for any Pro plan</span>
        </div>

      </div>

      {/* Embedded Razorpay Secure Checkout Gateway */}
      <RazorpayPaymentModal
        isOpen={isRazorpayModalOpen}
        initialPlanId={checkoutPlanId}
        onClose={() => {
          setIsRazorpayModalOpen(false);
          onClose();
        }}
        onSuccessCredits={(added) => {
          onAddCredits(added);
          setIsRazorpayModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
