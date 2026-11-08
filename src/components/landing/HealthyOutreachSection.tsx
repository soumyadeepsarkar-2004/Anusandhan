import React from 'react';
import { Heart, ShieldCheck, AlertTriangle, CheckCircle, BatteryCharging } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

export const HealthyOutreachSection: React.FC = () => {
  return (
    <section className="py-24 bg-transparent border-t border-zinc-800/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full apple-glass-pill text-xs font-mono text-zinc-300">
            <Heart className="w-3.5 h-3.5 text-amber-400" />
            <span>ETHICAL ACADEMIC PACING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            High Faculty Response Rates,{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
              Zero Blacklisting
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Why automated blast-bots ruin university email reputations, and how Anusandhan enforces healthy, targeted academic pacing.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-10">
          
          {/* Column 1: Generic Spam Bots */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-2xl border border-white/10 group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div>
              <div className="flex items-center space-x-2 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>The Wrong Way: Mass Blasters</span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">
                Cold-Emailing 200+ Professors In Bulk
              </h3>

              <ul className="space-y-3.5 text-xs text-zinc-400 leading-relaxed">
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-mono font-bold shrink-0">✕</span>
                  <span><strong className="text-zinc-200">Generic Hallucinations:</strong> "Dear Respected Sir, I love your esteemed work" without citing specific publications or grants.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-mono font-bold shrink-0">✕</span>
                  <span><strong className="text-zinc-200">Domain Blacklisting:</strong> Blasting dozens of emails per hour triggers university `.edu` spam filtering across Gmail and Microsoft.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-mono font-bold shrink-0">✕</span>
                  <span><strong className="text-zinc-200">Student Burnout:</strong> 99% ghost rate leads to exhaustion and missed fellowship windows.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>Avg Reply Rate: &lt; 2.5%</span>
              <span className="text-red-400 font-semibold">High Blacklist Risk</span>
            </div>
          </div>

          {/* Column 2: Anusandhan Healthy Method */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-amber-400/30 group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>The Calibrated Way: Anusandhan</span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">
                5–8 Tailored Inquiries with Safe Pacing
              </h3>

              <ul className="space-y-3.5 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold shrink-0">✓</span>
                  <span><strong className="text-white">Literature-Grounded Context:</strong> Every draft directly references the PI's 2025/2026 conference paper and links your reproducible code repository.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold shrink-0">✓</span>
                  <span><strong className="text-white">Jittered Dispatch Queue:</strong> Enforces randomized 4–12 minute intervals between sends and caps volume to preserve inbox health.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold shrink-0">✓</span>
                  <span><strong className="text-white">Human-in-the-Loop:</strong> You must review and confirm each draft before transmission. Zero automated blasting without student sign-off.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="text-amber-300 font-semibold">Avg Reply Rate: 24.8% – 31%</span>
              <span className="text-amber-400 font-mono">100% Whitelist Safe</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
