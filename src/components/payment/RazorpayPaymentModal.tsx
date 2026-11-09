import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, CreditCard, QrCode, Building, Coins, 
  Sparkles, ArrowRight, Lock, CheckCircle2, Download, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ApiClient } from '../../services/apiClient';
import confetti from 'canvas-confetti';

export interface BillingPlanOption {
  id: string;
  name: string;
  priceInr: number;
  priceUsd: number;
  interval: string;
  dailyCredits: number;
  tokenCost: number;
  description: string;
}

export const BILLING_PLANS: BillingPlanOption[] = [
  {
    id: 'starter_credits',
    name: '50 Match Credit Pack',
    priceInr: 499,
    priceUsd: 18,
    interval: 'one-time',
    dailyCredits: 50,
    tokenCost: 30,
    description: 'Target 50 high-affinity faculty labs with verified grants.'
  },
  {
    id: 'pro_researcher',
    name: 'Scholar Pro Season Pass',
    priceInr: 1299,
    priceUsd: 39,
    interval: 'cycle pass',
    dailyCredits: 120,
    tokenCost: 60,
    description: 'End-to-end autonomous research application suite for ambitious scholars.'
  },
  {
    id: 'institutional_lab',
    name: 'Institutional Lab Pass',
    priceInr: 4999,
    priceUsd: 99,
    interval: 'annual',
    dailyCredits: 500,
    tokenCost: 200,
    description: 'Batch CV Analysis for University Research Cells and Lab Grant Tracking.'
  }
];

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
  onSuccessCredits?: (credits: number) => void;
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  isOpen,
  onClose,
  initialPlanId = 'pro_researcher',
  onSuccessCredits
}) => {
  if (!isOpen) return null;

  const { user, token, redeemTokensForPlan } = useAuth();
  const { isDark } = useTheme();

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'tokens'>('upi');

  // Form states
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const selectedPlan = BILLING_PLANS.find(p => p.id === selectedPlanId) || BILLING_PLANS[1];
  const userTokens = user?.tokensBalance || 0;
  const tokenCost = selectedPlan.tokenCost;

  const priceFormatted = currency === 'INR' 
    ? `₹${selectedPlan.priceInr.toLocaleString('en-IN')}` 
    : `$${selectedPlan.priceUsd}`;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (paymentMethod === 'tokens') {
        if (userTokens < tokenCost) {
          throw new Error(`Insufficient Shodh Tokens. You have ${userTokens} tokens, but ${tokenCost} are required.`);
        }
        const tokenRes = await redeemTokensForPlan(selectedPlan.id, tokenCost, selectedPlan.dailyCredits);
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        if (onSuccessCredits) onSuccessCredits(selectedPlan.dailyCredits);
        setSuccessReceipt({
          invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
          planName: selectedPlan.name,
          paymentId: `tok_redemption_${Date.now().toString(36)}`,
          amount: `${tokenCost} Shodh Tokens`,
          creditsAwarded: selectedPlan.dailyCredits,
          method: 'Shodh Tokens Redemption',
          date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        });
        return;
      }

      // Step 1: Create Order via Express Gateway
      const order = await ApiClient.createBillingOrder(selectedPlan.id, currency, token || undefined);

      // Step 2: Confirm & Verify Payment
      const verifyRes = await ApiClient.verifyBillingPayment({
        orderId: order.orderId || `order_${Date.now()}`,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        planId: selectedPlan.id
      }, token || undefined);

      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
      if (onSuccessCredits) onSuccessCredits(selectedPlan.dailyCredits);

      setSuccessReceipt({
        invoiceNumber: verifyRes.invoiceNumber || `INV-${Date.now().toString(36).toUpperCase()}`,
        planName: selectedPlan.name,
        paymentId: verifyRes.paymentId,
        amount: priceFormatted,
        creditsAwarded: selectedPlan.dailyCredits,
        method: paymentMethod === 'upi' ? 'Razorpay UPI / QR' : paymentMethod === 'card' ? 'Secure Card' : 'NetBanking',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
      });

    } catch (err: any) {
      setErrorMsg(err.message || 'Payment transaction could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-2xl animate-fadeIn">
      {/* Specular Ambient Glow */}
      <div className="absolute w-[600px] h-[600px] bg-amber-500/12 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Glass Modal Card */}
      <div className="w-full max-w-2xl apple-glass rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] relative">
        {/* Specular Sheen Header Line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

        {/* Header Strip */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                  Razorpay Secure Checkout & Plans
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PCI-DSS 256-Bit
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Official Academic Subscription & Verified Credit Refill Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Payment Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
          
          {successReceipt ? (
            /* ================= Success Tax Receipt View ================= */
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center py-4 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-serif font-medium text-zinc-100">Payment & Verification Confirmed!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your academic subscription is active. +{successReceipt.creditsAwarded} verified credits have been permanently credited to your account.
                </p>
              </div>

              {/* Official GST Tax Invoice Card */}
              <div className="apple-glass-card rounded-2xl p-5 border border-white/15 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-[11px]">
                  <span className="text-zinc-400">Invoice No: <strong className="text-amber-400">{successReceipt.invoiceNumber}</strong></span>
                  <span className="text-zinc-400">{successReceipt.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-zinc-300">
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-mono">Plan Activated</span>
                    <strong className="text-zinc-100 text-sm">{successReceipt.planName}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-mono">Amount Paid</span>
                    <strong className="text-amber-400 text-sm font-mono">{successReceipt.amount}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-mono">Transaction ID</span>
                    <span className="font-mono text-[11px] text-zinc-300 truncate block">{successReceipt.paymentId}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-mono">Payment Gateway</span>
                    <span className="text-zinc-200">{successReceipt.method}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>SAC: 998431 (Online Portal Services)</span>
                  <span>GSTIN: 29ABCDE1234F1Z5</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>
            </div>
          ) : (
            /* ================= Checkout Flow ================= */
            <>
              {/* Plan Switcher Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
                    Select Academic Subscription Plan
                  </label>
                  <div className="flex rounded-lg bg-white/[0.06] p-0.5 border border-white/10 font-mono text-[11px]">
                    <button
                      onClick={() => setCurrency('INR')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${currency === 'INR' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400'}`}
                    >
                      INR (₹)
                    </button>
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${currency === 'USD' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400'}`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BILLING_PLANS.filter(p => p.priceInr > 0).map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-100">{plan.name}</span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {currency === 'INR' ? `₹${plan.priceInr}` : `$${plan.priceUsd}`}
                            <span className="text-[10px] text-zinc-500 font-normal">/{plan.interval}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                          +{plan.dailyCredits} Verified Daily Inquiries & AI Follow-ups
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods Selector Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider block">
                  Payment Method
                </label>

                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`min-h-[44px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`min-h-[44px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cards</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`min-h-[44px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'netbanking'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>NetBanking</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('tokens')}
                    className={`min-h-[44px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'tokens'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Tokens</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Method Panels */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span>Scan QR with any UPI App</span>
                      <span className="font-mono text-emerald-400">GPay · PhonePe · Paytm · BHIM</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-zinc-950/80 rounded-xl border border-white/10">
                      {/* Realistic Animated QR Pattern Box */}
                      <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi%3A%2F%2Fpay%3Fpa%3Danusandhan%40okhdfcbank%26pn%3DAnusandhan%2BAI%26cu%3DINR" 
                          alt="Razorpay UPI QR" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
                        <span className="text-[11px] text-zinc-400 block font-mono">Or enter Virtual Payment Address (UPI ID)</span>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@okhdfcbank"
                          className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-zinc-500 block">Instant auto-approval upon authorization</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-mono mb-1">Card Number (RuPay, Visa, Mastercard)</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const matches = v.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];
                          for (let i = 0, len = match.length; i < len; i += 4) {
                            parts.push(match.substring(i, i + 4));
                          }
                          setCardNumber(parts.length ? parts.join(' ') : v);
                        }}
                        placeholder="4532 ···· ···· 8892"
                        className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-amber-400 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-amber-400 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-3">
                    <label className="block text-[11px] text-zinc-400 font-mono mb-1">Choose Authorized Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-zinc-100 font-sans outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'tokens' && (
                  <div className="space-y-2 text-center py-2">
                    <Coins className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                    <h5 className="font-semibold text-zinc-100">Redeem Shodh Activity Tokens</h5>
                    <p className="text-zinc-400 text-[11px] max-w-sm mx-auto">
                      You have <strong className="text-amber-400 font-mono">{userTokens} Tokens</strong> in your wallet.
                      This plan costs <strong className="text-amber-300 font-mono">{tokenCost} Tokens</strong>.
                    </p>
                    {userTokens < tokenCost && (
                      <p className="text-amber-400/90 text-[11px] font-mono">
                        Maintain your daily streak to claim +5 tokens every 24h!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Razorpay Verified Sandbox</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={isProcessing || (paymentMethod === 'tokens' && userTokens < tokenCost)}
                    className="min-h-[44px] px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>{paymentMethod === 'tokens' ? `Redeem ${tokenCost} Tokens` : `Pay ${priceFormatted}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
