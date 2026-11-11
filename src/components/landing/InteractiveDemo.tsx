import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Mail, Mic, CheckCircle, ArrowRight, Volume2, Sparkles, ShieldCheck, Terminal } from 'lucide-react';
import { speakText } from '../../services/voiceAgentService';
import { AppleGlassCard, AudioWaveformVisualizer } from '../ui/AppleGlass';

interface InteractiveDemoProps {
  onLaunchApp: () => void;
  onOpenVoiceModal: () => void;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ onLaunchApp, onOpenVoiceModal }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const steps = [
    {
      id: 0,
      title: '1. Safe CV Ingestion',
      icon: FileText,
      tag: 'PYPDF SANDBOX',
      description: 'Zero-form drag & drop. Sanitizes PDFs, detects hardware stack (PyTorch/CUDA), and extracts GPA.'
    },
    {
      id: 1,
      title: '2. Lab Grant Telemetry',
      icon: Search,
      tag: 'ERC / NSF / SNSF',
      description: 'Queries active grant databases to ensure the PI has funded headcount for international fellows.'
    },
    {
      id: 2,
      title: '3. 146-Word Pitch',
      icon: Mail,
      tag: 'HUMAN-IN-THE-LOOP',
      description: 'Synthesizes exact paper citations, code repo links, and fellowship funding in under 180 words.'
    },
    {
      id: 3,
      title: '4. Multilingual Voice',
      icon: Mic,
      tag: 'SARVAM AI / GEMINI',
      description: 'Natural spoken Hindi & English dialogue for status checks, deadline alarms, and interview prep.'
    }
  ];

  const handlePlayVoiceSample = () => {
    setIsPlayingAudio(true);
    speakText(
      "Namaste! Aapke profile ke liye TUM aur ETH Zurich ke recent 2025 papers match ho gaye hain. Dono professors ke paas active multi-million euro grants hain.",
      'sarvam',
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      
      {/* Ambient Backdrop Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full apple-glass-pill text-xs font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>INTERACTIVE WORKFLOW PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Designed for Zero Wasted Time
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            From raw PDF drop to verified research fellowship in four autonomous steps.
          </p>
        </div>

        {/* Step Navigation Tabs with Apple Glass */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto mb-6">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'apple-glass-card border-amber-500/60 shadow-[0_0_25px_rgba(217,119,6,0.15)] ring-1 ring-amber-500/40'
                    : 'bg-zinc-950/40 border border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md' : 'bg-zinc-800/80 text-zinc-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    {s.tag}
                  </span>
                </div>
                <h3 className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                  {s.title}
                </h3>
                <p className="text-[11px] leading-relaxed text-zinc-400 mt-1 line-clamp-2">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Simulated Apple Glass Window Container */}
        <AppleGlassCard className="max-w-5xl mx-auto p-0 overflow-hidden shadow-2xl" enableTilt={false}>
          
          {/* macOS / visionOS Window Header Bar */}
          <div className="h-11 bg-zinc-950/80 border-b border-zinc-800/80 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/30" />
              <span className="text-xs text-zinc-400 font-mono ml-3 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-zinc-500" />
                <span>anusandhan.ai/engine/pipeline</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
              <span>ACTIVE PIPELINE</span>
            </div>
          </div>

          {/* Interactive Screen Content with Smooth Animated Transitions */}
          <div className="p-6 sm:p-8 min-h-[360px] bg-zinc-900/40 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              
              {/* Step 0: CV Parsing */}
              {activeStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl apple-glass border border-zinc-800">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-mono text-xs font-bold shadow-inner">
                        PDF
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Devansh_IIT_Research_Resume.pdf</h4>
                        <p className="text-xs text-zinc-400 font-mono">Verified Safe (No scripts) · 18.2 KB · PyPDF Sandbox</p>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium flex items-center space-x-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>RRS Score: 94/100 (Tier-1 Diamond)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-500 uppercase font-mono tracking-wider">Identified Domain</span>
                      <p className="text-xs font-semibold text-zinc-100 mt-1">Spatial VLA & Robotics</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Cross-embodiment policies</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-500 uppercase font-mono tracking-wider">Academic Foundation</span>
                      <p className="text-xs font-semibold text-amber-400 font-mono mt-1">CGPA 9.42 / 10 · Class of 2027</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Top 1% Department Rank</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-500 uppercase font-mono tracking-wider">Validated Repositories</span>
                      <p className="text-xs font-semibold text-zinc-200 mt-1">PyTorch, CUDA, ROS2, Triton</p>
                      <p className="text-[11px] text-zinc-400 mt-1">120 GitHub Stars</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Matching View */}
              {activeStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-xs font-mono text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span>LIVE BIBLIOMETRIC GRAPH · NSF / ERC VERIFIED</span>
                    <span className="text-emerald-400 font-semibold">2 Top Matches Filtered</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-4 rounded-xl apple-glass border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">Prof. Fei-Fei Tian</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">h-index 48</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">74% Student 1st-Author</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">Technical University of Munich (TUM) · Robotics & Vision Laboratory</p>
                        <p className="text-[11px] text-zinc-400 mt-1 font-mono">ICRA 2025: "Cross-Embodiment Visuomotor Policies"</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm font-semibold text-amber-400 font-mono">98% Match Affinity</div>
                        <span className="text-[11px] text-emerald-400 font-mono">€1.65M Active ERC Grant</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 opacity-90">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">Prof. Elena Alvarez-Moreno</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">h-index 54</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">71% Student 1st-Author</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">ETH Zurich · Institute for Medical Bioengineering</p>
                        <p className="text-[11px] text-zinc-400 mt-1 font-mono">Nature Biotech 2025: "SE(3)-Equivariant Flow Matching"</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm font-semibold text-zinc-300 font-mono">96% Match Affinity</div>
                        <span className="text-[11px] text-emerald-400 font-mono">CHF 1.4M Active SNSF Grant</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: 146-Word Pitch View */}
              {activeStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-1 border-b border-zinc-800">
                    <span>SUBJECT: [Research Inquiry] Synthesizing Contribution on [Target Paper Topic]</span>
                    <span className="text-amber-400 font-semibold">146-Word Structure · 100% Academic Ethics Standards</span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed space-y-2.5">
                    <p><span className="text-amber-300 font-semibold">Dear Professor [Faculty Name],</span></p>
                    <p>
                      I recently evaluated your group's publication on <em>"[Target Paper Title]"</em> with great academic interest and replicated your open benchmark.
                    </p>
                    <p>
                      Drawing from my project trajectory at [Your University], I identified a concrete contribution opportunity on [Your Code Repository / Paper Reproduction] that improves [Specific Metric / Latency] on constrained hardware setups.
                    </p>
                    <p>
                      I am applying for summer research opportunities via institutional programs (e.g. DAAD WISE / Mitacs Globalink). Would you have 10 minutes next week for a brief technical discussion?
                    </p>
                    <p className="text-zinc-400 pt-1">Sincerely,<br />[Your Name] · [Your University]</p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Multilingual Voice Agent */}
              {activeStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 text-center py-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl apple-glass border border-amber-500/40 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(217,119,6,0.2)]">
                      <AudioWaveformVisualizer active={isPlayingAudio} className="scale-125" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">"Bhai mera status kya chal raha hai?"</h4>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">
                      Native Indian English and Hindi conversational context via Sarvam AI & Gemini 3.8 Live.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl apple-glass border border-zinc-700/80 max-w-lg mx-auto text-left text-xs text-zinc-200">
                    <div className="flex items-center space-x-2 text-amber-400 font-mono text-[11px] mb-1.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Anusandhan Voice Assistant:</span>
                    </div>
                    <p className="italic text-zinc-200 leading-relaxed font-sans">
                      "Haan bhai! Devansh ke profile ke liye TUM aur ETH Zurich ke recent 2025 papers match ho gaye hain. Dono professors ke paas active multi-million euro grants hain aur unke 146-word drafts review ke liye ready hain."
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePlayVoiceSample}
                      disabled={isPlayingAudio}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-md"
                    >
                      <Volume2 className="w-4 h-4 text-zinc-950" />
                      <span>{isPlayingAudio ? 'Speaking Spoken Hindi...' : 'Hear Spoken Sample'}</span>
                    </button>

                    <button
                      onClick={onOpenVoiceModal}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl apple-glass hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-all cursor-pointer border border-zinc-700"
                    >
                      <Mic className="w-4 h-4 text-amber-400" />
                      <span>Launch Full Voice Console</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Bottom Controls Bar */}
            <div className="pt-5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 3))}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer font-medium"
                >
                  Previous Step
                </button>
                <button
                  onClick={() => setActiveStep((prev) => (prev < 3 ? prev + 1 : 0))}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium cursor-pointer"
                >
                  Next Step
                </button>
              </div>

              <button
                onClick={onLaunchApp}
                className="flex items-center space-x-1.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span>Upload Your Resume</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

          </div>
        </AppleGlassCard>

      </div>
    </section>
  );
};
