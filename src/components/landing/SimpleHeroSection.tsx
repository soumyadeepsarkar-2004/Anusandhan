import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Sparkles, ChevronDown, Award, ShieldCheck } from 'lucide-react';
import { LiveRadarDot } from '../ui/AppleGlass';

interface SimpleHeroSectionProps {
  onLaunchPlatform: () => void;
  onExploreLabs: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

export const SimpleHeroSection: React.FC<SimpleHeroSectionProps> = ({
  onLaunchPlatform,
  onExploreLabs,
  onOpenAuth,
  isAuthenticated,
  userName
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
      className="relative w-full flex flex-col justify-between pt-32 pb-10 sm:pt-36 sm:pb-14 lg:pt-40 lg:pb-14 overflow-hidden bg-transparent select-none min-h-[90vh]"
    >
      {/* Specular Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/15 via-amber-400/8 to-transparent blur-[160px] pointer-events-none -z-10" />

      {/* Main Centered Hero Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center w-full">
        
        {/* Universal Inclusivity Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full apple-glass-pill text-xs font-mono text-zinc-300 mb-5 sm:mb-6 border border-white/10 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-zinc-200 font-medium">OPEN TO ALL CURIOUS MINDS</span>
          <span className="text-zinc-500">·</span>
          <span className="text-amber-400">National & Global Research Access</span>
        </motion.div>

        {/* Clean, Human Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-zinc-100 font-medium tracking-tight leading-[1.1] max-w-5xl"
        >
          Democratizing Research Opportunities{' '}
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500">
            for Curious Minds Everywhere.
          </span>
        </motion.h1>

        {/* Informative, Clear Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed font-sans"
        >
          Whether you study at a regional college, premier national institute, or are a self-taught builder — discover verified lab openings, diagnose profile gaps before professors auto-reject, and bridge your code into active research literature.
        </motion.p>

        {/* Clear Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
        >
          <button
            onClick={onLaunchPlatform}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-sm shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center space-x-2.5 active:scale-98"
          >
            <span>{isAuthenticated ? `Enter Workspace (${userName || 'Scholar'})` : 'Launch Research Platform'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreLabs}
            className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium text-sm border border-white/15 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center space-x-2.5"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Browse 500+ Open Labs & Grants</span>
          </button>
        </motion.div>

        {/* Metric Highlights Bar - Placed comfortably in laptop full-screen flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="w-full mt-10 sm:mt-12"
        >
          <div className="p-4 sm:p-5 rounded-3xl glass-panel grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Universal Coverage</span>
              <div className="text-base sm:text-lg font-serif text-zinc-100 font-medium">National & Global</div>
              <p className="text-xs text-zinc-400 leading-snug">IISc, IITs, TIFR, CERN, MIT, Max Planck</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Automated Audit</span>
              <div className="text-base sm:text-lg font-serif text-amber-400 font-medium">Gap Analysis</div>
              <p className="text-xs text-zinc-400 leading-snug">Detects why cold emails fail before you send</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Precision Outreach</span>
              <div className="text-base sm:text-lg font-serif text-emerald-400 font-medium">146 Words</div>
              <p className="text-xs text-zinc-400 leading-snug">Literature-grounded proof-of-work pitches</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Ethics & Compliance</span>
              <div className="text-base sm:text-lg font-serif text-zinc-100 font-medium">Zero Spam</div>
              <p className="text-xs text-zinc-400 leading-snug">Mandatory human review + 7-day pacing</p>
            </div>
          </div>
        </motion.div>

        {/* Dedicated Bottom Scroll Indicator - Positioned after metrics at the section fold */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          onClick={scrollToOpportunities}
          className="mt-6 sm:mt-8 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-amber-300 transition-all cursor-pointer group shadow-sm"
        >
          <span className="text-xs font-mono tracking-wider uppercase">Explore Verified Labs</span>
          <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform text-amber-400" />
        </motion.div>

      </div>

    </section>
  );
};
