import React, { useState } from 'react';
import { PRICING_PLANS } from '../../data/pricingPlans';
import { Check, Sparkles } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-transparent border-t border-white/5 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-[11px] font-mono mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Transparent, Student-Friendly Plans</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif text-zinc-100 font-medium tracking-tight">
            Start Free. Upgrade Only When You Need More Reach.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Free forever for targeted searching and your first 5 verified faculty matches. No paywalls on basic academic matching.
          </p>

          {/* Currency Toggle */}
          <div className="mt-4 inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setCurrency('INR')}
              className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                currency === 'INR' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              INR (₹) India
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              USD ($) Global
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid - 3 Columns with non-overlapping top badge and baseline alignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch w-full">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const price = currency === 'INR' ? plan.priceInr : plan.priceUsd;

            return (
              <AppleGlassCard
                key={plan.id}
                className={`p-6 sm:p-7 shadow-xl transition-all duration-300 rounded-3xl ${
                  isPopular 
                    ? 'border-amber-400/50 ring-1 ring-amber-400/30 bg-gradient-to-b from-amber-500/15 via-white/[0.04] to-black/40 shadow-[0_16px_45px_rgba(245,158,11,0.15)] backdrop-blur-xl' 
                    : 'border-white/12 bg-white/[0.03] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.05]'
                }`}
                spotlightColor={isPopular ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
                enableTilt={true}
              >
                <div className="flex flex-col justify-between h-full min-h-[510px]">
                  <div className="flex-1 flex flex-col">
                    {/* Clean Non-Overlapping Rounded Corner Top Badge Header */}
                    <div className="flex items-center justify-between mb-3.5 min-h-[28px]">
                      {isPopular ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                          <Sparkles className="w-3 h-3 text-zinc-950" />
                          <span>Recommended for Applicants</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-white/10 text-zinc-400 text-[10px] font-mono font-medium uppercase tracking-wider">
                          {plan.badgeText || (plan.id === 'free-scholar' ? 'Free Forever' : 'Advanced Access')}
                        </span>
                      )}
                    </div>

                    {/* Plan Name */}
                    <div className="h-8 flex items-center">
                      <h3 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">{plan.name}</h3>
                    </div>

                    {/* Plan Description */}
                    <div className="h-10 flex items-start mt-1">
                      <p className="text-xs text-zinc-400 leading-snug line-clamp-2">{plan.description}</p>
                    </div>

                    {/* Price Row */}
                    <div className="h-16 flex items-baseline gap-1.5 my-3 py-3 border-y border-white/10">
                      <span className="text-3xl sm:text-4xl font-semibold text-zinc-100 font-mono tracking-tight">{price}</span>
                      <span className="text-xs text-zinc-400 font-mono">/ {plan.periodText}</span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 my-4 text-xs text-zinc-300 min-h-[175px]">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-zinc-300 leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom CTA Button */}
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`mt-4 w-full min-h-[44px] py-2.5 px-4 rounded-xl font-medium text-xs transition-all cursor-pointer flex items-center justify-center ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 active:scale-98'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 hover:text-white backdrop-blur-md active:scale-98'
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              </AppleGlassCard>
            );
          })}
        </div>

      </div>
    </section>
  );
};
