import React from 'react';
import { Compass, ShieldCheck, Sparkles, Globe, Cpu, CheckCircle2, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface SimplePillarsSectionProps {
  onLaunchPlatform: () => void;
}

export const SimplePillarsSection: React.FC<SimplePillarsSectionProps> = ({ onLaunchPlatform }) => {
  return (
    <section className="py-20 sm:py-28 bg-transparent border-t border-white/10 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full apple-glass-pill text-zinc-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">HOW IT WORKS · ANUSANDHAN</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-zinc-100 font-medium tracking-tight">
            Built for Students Who Want to Do Real Science.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            No empty hypes. No cold mass-spamming. Here is how Anusandhan transforms your ambition into verified lab placements.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          
          {/* Pillar 1 */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-white/15 hover:border-amber-400/40 transition-all duration-300 group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                1. Universal Lab & Grant Radar
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Access a continuously updated catalog of professors actively hiring interns across premier Indian institutes (IISc, IITs, TIFR, CSIR) and global research centers (CERN, Max Planck, ETH, MIT, Tokyo).
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Active Grants & Capacity</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-white/15 hover:border-amber-400/40 transition-all duration-300 group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                2. AI Failure Diagnostic & RRS
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Upload your CV or list your skills. Our system instantly pinpoints where your profile falls short — missing reproduction instructions, weak problem framing, or absent preprints — and guides you on fixing them.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Diagnostic Gap Analysis Engine</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-white/15 hover:border-amber-400/40 transition-all duration-300 group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                3. 146-Word Precision Pitches
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Synthesize high-conversion research inquiry emails that connect your personal project directly with the professor’s newest 2025 publication. Zero AI fluff. Pure scholarly signal.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Up to 28.4% Faculty Reply Rate</span>
            </div>
          </div>

        </div>

        {/* Step-by-Step Pathway Strip */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-white/15">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-medium">Simple 3-Step Journey</span>
              <h4 className="text-xl sm:text-2xl font-serif text-zinc-100 font-medium">Ready to take your curiosity to the lab?</h4>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Create your free profile, upload or enter your academic background, and explore matching research labs in under 3 minutes.
              </p>
            </div>

            <button
              onClick={onLaunchPlatform}
              className="min-h-[46px] px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center space-x-2 shrink-0 active:scale-98"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
