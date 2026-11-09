import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertTriangle, ShieldCheck, Mail, Sparkles, ArrowRight, CheckCircle2, Code2, BookOpen, Layers } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface HowItWorksSectionProps {
  onLaunchPlatform: () => void;
}

const HowItWorksSectionComponent: React.FC<HowItWorksSectionProps> = ({ onLaunchPlatform }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      number: 1,
      title: 'Upload CV & Ingest Proof-of-Work',
      tag: 'INGESTION',
      icon: Upload,
      headline: 'The AI extracts your real engineering capabilities — not just high-level keywords.',
      description: 'Upload your academic CV in PDF format. Our neural extraction pipeline identifies specific systems frameworks (PyTorch, JAX, CUDA, ROS2, Triton), links to public repositories, coursework depth, and research interests to construct your persistent scholar card.',
      previewCard: {
        badge: 'AUTOMATED EXTRACTION RESULT',
        title: 'Academic Proof-of-Work Parsed',
        points: [
          'Detected 8 core frameworks: PyTorch, CUDA, JAX, HuggingFace, C++',
          'Identified target domains: Multilingual LLMs & Efficient Inference',
          'Verified GitHub benchmark repo with 1-click reproduction guide'
        ]
      }
    },
    {
      number: 2,
      title: 'Automated Failure Diagnostic & RRS',
      tag: 'GAP DETECTION',
      icon: AlertTriangle,
      headline: 'Identify why faculty auto-reject cold emails before you hit send.',
      description: 'Faculty receive 50+ cold emails per day. Our diagnostic engine evaluates your profile against known auto-rejection triggers: missing reproducible code benchmarks (-22 pts), absent 2024-2025 paper citations (-18 pts), and unverified scholar identity (-12 pts). You receive a calibrated RRS score and a 14-day technical remediation sprint.',
      previewCard: {
        badge: 'CALIBRATED READINESS',
        title: 'Research Readiness Score: 81 / 100',
        points: [
          'Code Execution: 23/25 (Public reproduction benchmark verified)',
          'Literature Grounding: 21/25 (Tied to 2025 ArXiv literature)',
          'Remediation Plan: 14-Day Code Sprint synthesized'
        ]
      }
    },
    {
      number: 3,
      title: 'Active Grant & Faculty Radar',
      tag: 'REAL-TIME MATCHING',
      icon: ShieldCheck,
      headline: 'Filter for professors who have active grant funding and publish with undergrads.',
      description: 'Stop emailing professors with expired funding. Our scanner continuously monitors grant allocations from DST, MeitY, CSIR, NSF, and ERC, calculating student co-authorship velocity so you connect exclusively with mentors actively hiring funded researchers.',
      previewCard: {
        badge: 'FUNDING VERIFIED',
        title: 'Premier Lab Match Found',
        points: [
          'Lab: Center for Indian Language Technology (IIT Bombay)',
          'Grant: MeitY Bhashini AI Initiative (₹2.4 Crores active)',
          'Student Placement: 92% student co-authorship track record'
        ]
      }
    },
    {
      number: 4,
      title: '146-Word Precision Pitches',
      tag: 'OUTREACH SYNTHESIS',
      icon: Mail,
      headline: 'Proof-of-work outreach that professors actually read and reply to.',
      description: 'Generic AI templates get deleted in 3 seconds. Anusandhan deconstructs the professor\'s latest 2024–2025 publication, isolates its unsolved algorithmic or hardware bottlenecks, and drafts a 146-word precision proof-of-work pitch in your voice.',
      previewCard: {
        badge: 'CALIBRATED PITCH',
        title: '146-Word Proof-of-Work Synthesized',
        points: [
          'Subject: Cites exact unsolved KV-cache scaling paper (ICML 2025)',
          'Value Proposition: Student proposes open-source CUDA kernel ablation',
          'Ethics: 1-click human verification + strict 7-day polite pacing'
        ]
      }
    }
  ];

  const current = steps.find(s => s.number === activeStep) || steps[0];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-transparent border-t border-white/5 relative overflow-hidden select-none">
      
      {/* Specular Ambient Glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[400px] bg-amber-500/5 blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full apple-glass-pill text-[11px] font-mono text-zinc-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>CALIBRATED ACADEMIC PIPELINE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif text-zinc-100 font-medium tracking-tight">
            How Anusandhan Works
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl mx-auto">
            From raw student CV to funded laboratory placement in 4 rigorous, AI-calibrated steps. Built for serious students who value research integrity.
          </p>
        </div>

        {/* 4 Interactive Step Selector Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {steps.map((st) => {
            const Icon = st.icon;
            const isSelected = activeStep === st.number;

            return (
              <button
                key={st.number}
                onClick={() => setActiveStep(st.number)}
                className={`p-3 sm:p-4 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between min-h-[85px] sm:min-h-[95px] backdrop-blur-md ${
                  isSelected
                    ? 'bg-white/[0.08] border-amber-400/50 shadow-lg ring-1 ring-amber-400/30'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm' : 'bg-white/10 text-zinc-400'
                  }`}>
                    STEP 0{st.number}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                </div>
                <h4 className={`text-xs font-semibold transition-colors line-clamp-1 ${
                  isSelected ? 'text-zinc-100' : 'text-zinc-400'
                }`}>
                  {st.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed View (Glass Card) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="my-auto"
          >
            <AppleGlassCard className="p-5 sm:p-7 shadow-2xl border border-white/10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left Narrative Column */}
                <div className="lg:col-span-7 space-y-3 text-left">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
                    <span>STEP {current.number} OF 4</span>
                    <span>·</span>
                    <span>{current.tag}</span>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-serif text-zinc-100 font-medium leading-tight">
                    {current.headline}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                    {current.description}
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={onLaunchPlatform}
                      className="min-h-[40px] px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center space-x-2 active:scale-98"
                    >
                      <span>Experience Step {current.number} Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Interactive Preview Column */}
                <div className="lg:col-span-5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/12 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-[10px] font-mono text-amber-400 font-semibold tracking-wider">
                        {current.previewCard.badge}
                      </span>
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-100">
                      {current.previewCard.title}
                    </h4>

                    <div className="space-y-2">
                      {current.previewCard.points.map((pt, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-zinc-300 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Status: Verified Safe</span>
                      <span className="text-emerald-400">Zero AI Hallucination</span>
                    </div>
                  </div>
                </div>

              </div>
            </AppleGlassCard>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export const HowItWorksSection = React.memo(HowItWorksSectionComponent);
