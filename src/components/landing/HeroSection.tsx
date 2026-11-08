import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Mic, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  DollarSign,
  Flame,
  Binary,
  Layers
} from 'lucide-react';
import { AppleGlassCard, AudioWaveformVisualizer, LiveRadarDot } from '../ui/AppleGlass';

interface HeroSectionProps {
  onLaunchApp: () => void;
  onOpenVoiceModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchApp, onOpenVoiceModal }) => {
  // State for interactive pitch comparator
  const [pitchMode, setPitchMode] = useState<'calibrated' | 'generic'>('calibrated');
  
  // State for active radar lab node
  const [selectedLab, setSelectedLab] = useState<number>(0);

  const radarLabs = [
    {
      name: 'TUM Robotics & Vision Lab',
      pi: 'Prof. Fei-Fei Tian',
      country: '🇩🇪 Germany',
      grant: '€1.65M ERC Grant',
      replyRate: '31.2%',
      studentRatio: '74% 1st-Author',
      recentPaper: 'ICRA 2025 (Oral)',
      matchScore: 98
    },
    {
      name: 'ETH Zurich Molecular Design Core',
      pi: 'Prof. Elena Alvarez',
      country: '🇨🇭 Switzerland',
      grant: 'CHF 1.4M SNSF Grant',
      replyRate: '28.6%',
      studentRatio: '71% 1st-Author',
      recentPaper: 'Nature Biotech 2025',
      matchScore: 96
    },
    {
      name: 'CERN Openlab Advanced Computing',
      pi: 'Dr. Lukas Becker',
      country: '🇨🇭 Geneva',
      grant: '€4,200/mo Fellowship',
      replyRate: '26.4%',
      studentRatio: '82% Fellow Placement',
      recentPaper: 'J. High Energy Phys 2025',
      matchScore: 94
    },
    {
      name: 'MIT CSAIL Efficient AI Core',
      pi: 'Prof. Song Han',
      country: '🇺🇸 United States',
      grant: '$1.2M NSF REU Award',
      replyRate: '24.8%',
      studentRatio: '68% 1st-Author',
      recentPaper: 'NeurIPS 2024 Spotlight',
      matchScore: 92
    }
  ];

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      
      {/* Ambient Lighting & Atmospheric Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-700/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 left-1/4 w-[400px] h-[250px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Eyebrow / Live Status Pill */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full apple-glass-pill text-xs font-mono text-zinc-300 shadow-lg"
          >
            <LiveRadarDot label="SUMMER 2027 CYCLES OPEN" />
            <span className="hidden sm:inline text-zinc-500">|</span>
            <span className="text-zinc-400 hidden sm:inline">DAAD WISE · Mitacs GRI · CERN · ETH</span>
          </motion.div>
        </div>

        {/* Hero Headline: Calibrated & Purposeful Typography */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.08]"
          >
            Autonomous Matchmaking for{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300">
              Frontier Research Labs.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Stop burning faculty inboxes with generic AI spam. We index verified NSF/ERC lab grants, calculate your holographic student readiness score (RRS), and synthesize calibrated 146-word precision pitches.
          </motion.p>

          {/* Primary Action Button Cluster */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto relative group overflow-hidden flex items-center justify-center space-x-2 px-7 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all cursor-pointer transform active:scale-98"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />
              <span>Explore Matched Labs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onOpenVoiceModal}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-3 rounded-xl apple-glass hover:bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 hover:border-amber-500/50 text-sm font-medium transition-all cursor-pointer shadow-lg group"
            >
              <Mic className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Voice Agent (Hindi / English)</span>
            </button>
          </motion.div>
        </div>

        {/* =========================================================================
            21st.dev Style Bento Grid: Tangible Interactive Artifacts (No Text Walls!)
            ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-4 text-left"
        >

          {/* BENTO CARD 1 (Col 1-5): Real-Time Lab Grant Radar Scope */}
          <AppleGlassCard className="lg:col-span-5 p-5 flex flex-col justify-between" enableTilt={true}>
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                      Grant Telemetry Radar
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono">Live Indexing 12,400+ PIs</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono">
                  ACTIVE SCAN
                </span>
              </div>

              {/* Radar Grid Interactive Selector */}
              <div className="py-4 space-y-2">
                {radarLabs.map((lab, idx) => {
                  const isSelected = selectedLab === idx;
                  return (
                    <div
                      key={lab.name}
                      onClick={() => setSelectedLab(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-zinc-800/80 border-amber-500/50 shadow-[0_0_15px_rgba(217,119,6,0.15)]'
                          : 'bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs">{lab.country}</span>
                          <span className="text-xs font-medium text-zinc-200">{lab.pi}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{lab.name}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-semibold text-emerald-400">{lab.grant}</span>
                        <div className="text-[11px] font-mono text-zinc-500">{lab.replyRate} Response</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar Insights Footer */}
            <div className="mt-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Match Compatibility:</span>
              <span className="text-amber-400 font-semibold">{radarLabs[selectedLab].matchScore}% Affinity</span>
            </div>
          </AppleGlassCard>

          {/* BENTO CARD 2 (Col 6-8): Holographic Student Research Card */}
          <AppleGlassCard className="lg:col-span-4 p-5 flex flex-col justify-between" enableTilt={true}>
            <div>
              {/* Card Header with Insignia */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                      Research Readiness
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono">Universal Holographic Pass</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-semibold">
                  TIER-1 DIAMOND
                </span>
              </div>

              {/* Holographic Gauge Visualizer */}
              <div className="py-5 flex flex-col items-center justify-center text-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Circular Orbit Gauge */}
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" className="text-zinc-800" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" className="text-amber-400" strokeDasharray="301.6" strokeDashoffset="24.1" strokeLinecap="round" fill="transparent" />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold font-mono text-white">92</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">RRS Score</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="text-xs font-semibold text-zinc-200">Aarav Sharma · IIT Bombay</div>
                  <p className="text-[11px] text-zinc-400 font-mono">B.Tech Comp Sci · CGPA 9.42 / 10</p>
                </div>
              </div>

              {/* Verified Verification Pillars */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>PyTorch Repo (120★)</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>DAAD WISE Ready</span>
                </div>
              </div>
            </div>

            {/* Holographic Barcode Stripe */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>SCAN-ID: #RRS-2027-TUM98</span>
              <QrCode className="w-4 h-4 text-zinc-400" />
            </div>
          </AppleGlassCard>

          {/* BENTO CARD 3 (Col 9-12): Precision 146-Word Pitch Comparator */}
          <AppleGlassCard className="lg:col-span-3 p-5 flex flex-col justify-between" enableTilt={true}>
            <div>
              {/* Header with Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                    Pitch Synthesizer
                  </h2>
                </div>

                {/* Toggle Pill */}
                <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono">
                  <button
                    onClick={() => setPitchMode('calibrated')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      pitchMode === 'calibrated' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    146w
                  </button>
                  <button
                    onClick={() => setPitchMode('generic')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      pitchMode === 'generic' ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    Spam
                  </button>
                </div>
              </div>

              {/* Dynamic Body Content */}
              <div className="py-4 text-xs font-sans space-y-2">
                {pitchMode === 'calibrated' ? (
                  <div className="space-y-2 text-zinc-300 leading-relaxed font-sans text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-emerald-900/40">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-emerald-950">
                      <span>✓ 146 WORDS (OPTIMAL)</span>
                      <span>28.4% REPLY RATE</span>
                    </div>
                    <p className="line-clamp-6">
                      <span className="text-amber-300 font-medium">"Dear Prof. Tian, </span>
                      I read your ICRA 2025 paper on Cross-Embodiment Token Distillation. I reproduced your latency benchmark on GitHub (github.com/aarav/distill-rl) and found that pruning spatial keys reduces rollout latency by 18%... My travel is fully funded via the DAAD WISE fellowship."
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-zinc-400 leading-relaxed font-sans text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-red-900/40">
                    <div className="flex items-center justify-between text-[11px] font-mono text-red-400 pb-1 border-b border-red-950">
                      <span>❌ 410 WORDS (SPAM)</span>
                      <span>2.1% REPLY RATE</span>
                    </div>
                    <p className="line-clamp-6 text-zinc-500">
                      "Respected Sir, I am writing to express my deepest interest in your esteemed lab. I am a hardworking student who knows Python and ML. Please give me an internship and sponsor my visa..."
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Anti-Spam Safety Pill */}
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Anti-Spam Jitter:</span>
              <span className="text-emerald-400 font-medium">4–12 Min Random Queue</span>
            </div>
          </AppleGlassCard>

        </motion.div>

        {/* Global Voice Agents Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-6 p-4 rounded-2xl apple-glass flex flex-col md:flex-row items-center justify-between gap-4 border border-zinc-800"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AudioWaveformVisualizer active={true} />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                Frontier Multilingual Academic Voice Agent
              </div>
              <p className="text-[11px] text-zinc-400">
                Talk natively in Hindi or English to calibrate drafts, check faculty response deadlines, and practice mock PI interviews.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              🇮🇳 Sarvam AI
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              ⚡ Maya Research
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              🤖 Kivibot Voice
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              ✨ Gemini 3.8 Live
            </span>
            <button
              onClick={onOpenVoiceModal}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Start Speaking
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
