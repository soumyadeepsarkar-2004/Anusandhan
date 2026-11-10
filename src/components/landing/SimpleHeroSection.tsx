import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Sparkles, ChevronDown, Smartphone, Monitor, Apple, Globe } from 'lucide-react';

interface SimpleHeroSectionProps {
  onLaunchPlatform: () => void;
  onExploreLabs: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  userName?: string;
  onOpenCrossNativeModal?: () => void;
}

const SimpleHeroSectionComponent: React.FC<SimpleHeroSectionProps> = ({
  onLaunchPlatform,
  onExploreLabs,
  onOpenAuth,
  isAuthenticated,
  userName,
  onOpenCrossNativeModal
}) => {
  const scrollToOpportunities = () => {
    const el = document.getElementById('opportunities');
    if (el) {
      const yOffset = -75;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="hero" 
      className="relative w-full flex flex-col justify-between pt-28 pb-10 sm:pt-36 sm:pb-14 lg:pt-36 lg:pb-12 overflow-hidden bg-transparent select-none min-h-[85vh]"
    >
      {/* Restrained Ambient Radial Sheen */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-amber-500/10 blur-[140px] pointer-events-none -z-10" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center w-full">
        
        {/* Editorial Launch Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-300 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-zinc-200 font-medium">Anusandhan 2.0</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">Autonomous Research Internship Intelligence</span>
        </motion.div>

        {/* Confident, High-Hierarchy Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-zinc-100 font-normal tracking-tight leading-[1.08] max-w-4xl"
        >
          Research internships grounded in active academic literature.
        </motion.h1>

        {/* Clear, Measured Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-5 text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-sans font-light"
        >
          Discover verified funded lab vacancies across national institutes and global universities. Diagnose profile weaknesses before faculty review, and bridge your code into publication-grade proposals.
        </motion.p>

        {/* Intentional Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={onLaunchPlatform}
            className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-medium text-sm transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] shadow-sm"
          >
            <span>{isAuthenticated ? `Enter Workspace (${userName || 'Scholar'})` : 'Launch Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreLabs}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 font-medium text-sm border border-white/10 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span>Explore 500+ Faculty Openings</span>
          </button>
        </motion.div>

        {/* Cross-Platform Device Suite Strip - Clean Vector Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono"
        >
          <span className="text-zinc-500 text-[11px] mr-1">Platforms:</span>
          
          <button
            onClick={onOpenCrossNativeModal}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-zinc-300 text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span>Android</span>
          </button>

          <button
            onClick={onOpenCrossNativeModal}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-zinc-300 text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3 h-3 text-zinc-400" />
            <span>Windows</span>
          </button>

          <button
            onClick={onOpenCrossNativeModal}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-zinc-300 text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Apple className="w-3 h-3 text-zinc-400" />
            <span>macOS</span>
          </button>

          <button
            onClick={onOpenCrossNativeModal}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-zinc-300 text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3 h-3 text-zinc-400" />
            <span>Web PWA</span>
          </button>
        </motion.div>

        {/* Metric Highlights Strip - Clean Architectural Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="w-full mt-10 sm:mt-12"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left shadow-lg">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Coverage</span>
              <div className="text-base font-serif text-zinc-100 font-medium">National & Global</div>
              <p className="text-xs text-zinc-400 leading-snug">IISc, IITs, CERN, MIT, Max Planck</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Diagnostic</span>
              <div className="text-base font-serif text-zinc-100 font-medium">Readiness Score</div>
              <p className="text-xs text-zinc-400 leading-snug">Identifies rejection triggers before submission</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Outreach</span>
              <div className="text-base font-serif text-zinc-100 font-medium">146-Word Pitches</div>
              <p className="text-xs text-zinc-400 leading-snug">Empirically calibrated academic formatting</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Compliance</span>
              <div className="text-base font-serif text-zinc-100 font-medium">Zero Spam</div>
              <p className="text-xs text-zinc-400 leading-snug">Mandatory human review and 7-day pacing</p>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          onClick={scrollToOpportunities}
          className="mt-6 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-xs font-mono"
        >
          <span>Explore openings</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </motion.div>

      </div>
    </section>
  );
};

export const SimpleHeroSection = React.memo(SimpleHeroSectionComponent);
export default SimpleHeroSection;
