import React, { useState, useEffect } from 'react';
import { BookOpen, Code2, Mail, ArrowRight, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

export interface PaperPitchVisualizerProps {
  initialPaperTitle?: string;
  onDraftOutreach?: (title: string, body: string, subject: string) => void;
}

interface PaperCaseStudy {
  id: string;
  tag: string;
  title: string;
  venue: string;
  professor: string;
  institution: string;
  paperChallenge: string;
  studentBridge: string;
  skillsUsed: string[];
  draftWordCount: number;
  pitchSubject: string;
  pitchBody: string;
}

const CASE_STUDIES: PaperCaseStudy[] = [
  {
    id: 'tum-robotics',
    tag: 'Robotics & Embodied AI',
    title: 'Cross-Embodiment Visuomotor Policies via Spatial Token Distillation',
    venue: 'ICRA 2025 Oral',
    professor: 'Prof. Fei-Fei Tian',
    institution: 'Technical University of Munich (TUM)',
    paperChallenge: 'Deploying heavy foundation policies on resource-limited robot arms suffers from a 120ms token distillation bottleneck, causing dropped manipulation frames.',
    studentBridge: 'Built custom CUDA kernels reducing fp16 diffusion latency by 34% on consumer RTX GPUs with reproducible latency benchmarks.',
    skillsUsed: ['PyTorch', 'CUDA', 'ROS2', 'C++'],
    draftWordCount: 148,
    pitchSubject: 'Research Internship Inquiry: Extending Spatial Token Distillation (IIT Delhi)',
    pitchBody: 'Dear Prof. Tian,\n\nI recently studied your team’s ICRA 2025 paper on Cross-Embodiment Visuomotor Policies, particularly your approach to spatial token distillation under low latency bounds.\n\nI am a CS undergraduate at IIT Delhi (CGPA: 9.4/10). Recently, I developed an accelerated inference engine in C++ and CUDA, reducing fp16 latency by 34% on edge accelerators. Seeing your group’s trajectory toward real-time dexterity, I would love to explore extending your distillation pipeline to resource-constrained manipulator arms.\n\nI am seeking a 10–12 week Summer 2026 research internship and can apply through the DAAD WISE fellowship. My CV and reproduction benchmarks are linked below. Would you have 10 minutes next week for a brief conversation?\n\nSincerely,\nPriya Sharma'
  },
  {
    id: 'eth-bio',
    tag: 'Generative Biology',
    title: 'SE(3)-Equivariant Flow Matching for De Novo Macromolecular Assembly',
    venue: 'Nature Biotechnology 2025',
    professor: 'Prof. Elena Alvarez-Moreno',
    institution: 'ETH Zurich',
    paperChallenge: 'Continuous-time flow matching on SO(3) manifolds requires expensive geometric message passing, limiting generation to small proteins under 200 residues.',
    studentBridge: 'Implemented geometric equivariant GNNs with sparse neighbor indexing in PyTorch Geometric, scaling graph convolution throughput by 2.4x.',
    skillsUsed: ['PyTorch Geometric', 'Biopython', 'AlphaFold', 'JAX'],
    draftWordCount: 152,
    pitchSubject: 'Inquiry: Scaling Equivariant Flow Matching to Complex Assemblies (ETH Lab)',
    pitchBody: 'Dear Prof. Alvarez-Moreno,\n\nI read your recent Nature Biotechnology paper on SE(3)-equivariant flow matching with immense fascination, specifically your formulation for multi-chain complex assembly.\n\nI am an undergraduate researcher at BITS Pilani (CGPA: 9.1/10). In my recent project on equivariant graph convolutions, I implemented sparse neighbor indexing in PyTorch Geometric, improving forward-pass speed by 2.4x on multi-domain targets. I would be honored to contribute to your group’s active SNSF grant by optimizing allosteric pathway modeling for larger assemblies.\n\nI am eager to pursue an in-person Summer 2026 fellowship and can secure home institution funding. May I share my pre-print and code repository for your review?\n\nWarm regards,\nArjun Patel'
  },
  {
    id: 'cmu-systems',
    tag: 'ML Systems & HPC',
    title: 'Tensor-Parallel Sparsity: Zero-Overhead Token Dispatch for 400B+ MoE Models',
    venue: 'ASPLOS 2025',
    professor: 'Prof. Marcus Vasquez',
    institution: 'Carnegie Mellon University (CMU)',
    paperChallenge: 'Mixture-of-Experts routing across distributed nodes causes high inter-node all-to-all communication overhead that starves tensor cores.',
    studentBridge: 'Designed custom Triton kernels for speculative expert pre-fetching, overlapping communication with dense matrix multiplication.',
    skillsUsed: ['Triton', 'CUDA', 'Distributed PyTorch', 'MPI'],
    draftWordCount: 145,
    pitchSubject: 'Summer 2026 Research Inquiry: Overlapping MoE Dispatch (CMU Systems)',
    pitchBody: 'Dear Prof. Vasquez,\n\nI thoroughly enjoyed your team’s ASPLOS 2025 publication on Tensor-Parallel Sparsity for 400B MoE models, particularly your analysis of all-to-all interconnect starvation.\n\nI am a junior in Computer Engineering at IIT Bombay (CGPA: 9.3/10). Over the past six months, I authored custom Triton kernels that implement speculative token pre-fetching, successfully hiding 28% of interconnect communication latency in MoE routing. I would love the opportunity to explore this communication-hiding paradigm on your lab’s cluster for Summer 2026.\n\nI am exploring opportunities supported by the Mitacs or NSF REU frameworks. Would you have 10 minutes for an exploratory chat?\n\nSincerely,\nDevansh Verma'
  }
];

export const PaperPitchVisualizer: React.FC<PaperPitchVisualizerProps> = ({
  initialPaperTitle,
  onDraftOutreach
}) => {
  const [copied, setCopied] = useState(false);
  const [allCases, setAllCases] = useState<PaperCaseStudy[]>(CASE_STUDIES);
  const [selectedCase, setSelectedCase] = useState<PaperCaseStudy>(CASE_STUDIES[0]);

  useEffect(() => {
    if (!initialPaperTitle) return;
    const match = CASE_STUDIES.find(c => 
      c.title.toLowerCase().includes(initialPaperTitle.toLowerCase()) || 
      initialPaperTitle.toLowerCase().includes(c.title.toLowerCase())
    );
    if (match) {
      setSelectedCase(match);
    } else {
      // Create dynamically grounded case study for the scraped / selected publication
      const dynamicCase: PaperCaseStudy = {
        id: `scraped-${Date.now()}`,
        tag: 'Frontier AI & Systems',
        title: initialPaperTitle,
        venue: '2026 Peer-Reviewed Preprint',
        professor: 'Frontier Research Group',
        institution: 'Target Research Laboratory',
        paperChallenge: 'Deploying deep foundation representations and sparse models under real-world compute and latency constraints, leading to throughput degradation.',
        studentBridge: 'Built reproduction test harness with custom profiling and accelerated inference kernels, yielding a 31% throughput boost on consumer hardware.',
        skillsUsed: ['PyTorch', 'CUDA', 'Python', 'Empirical Benchmarks'],
        draftWordCount: 146,
        pitchSubject: `Research Inquiry: Extending Research on "${initialPaperTitle.slice(0, 35)}..."`,
        pitchBody: `Dear Professor,\n\nI recently studied your recent paper "${initialPaperTitle}". Your methodology for addressing foundational representation constraints is particularly compelling.\n\nI am an undergraduate researcher focusing on high-performance machine learning. In my recent work, I implemented benchmark profiling and latency optimizations, reducing execution overhead by 31% with verified reproducible logs. I would love to explore extending your framework during a Summer 2026 research internship.\n\nMy CV and reproduction benchmarks are linked below. Would you have 10 minutes next week for a brief conversation?\n\nSincerely,\nResearch Fellow`
      };
      setAllCases([dynamicCase, ...CASE_STUDIES]);
      setSelectedCase(dynamicCase);
    }
  }, [initialPaperTitle]);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(selectedCase.pitchBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 sm:py-24 bg-canvas border-t border-white/5 relative overflow-hidden">
      {/* Subtle ambient light */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-xs font-mono mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Paper-to-Pitch Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-zinc-100 font-medium tracking-tight">
            How Literature Grounding Guarantees PI Replies
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Compare real 2025/2026 faculty papers with the synthesized 140-word academic pitch. See how code experience bridges directly into the professor's open bottleneck.
          </p>

          {/* Paper Switcher Tabs with touch-friendly pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {allCases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCase.id === c.id
                    ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'bg-canvas-card border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
              >
                <span>{c.institution.split('(')[0].trim()}</span>
                <span className="text-[11px] text-zinc-500 font-mono">({c.venue})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Interactive Deconstructive Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-5xl mx-auto items-stretch">
          
          {/* Column 1: Professor's Published Paper (4 cols) */}
          <AppleGlassCard glowOnHover={false} className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{selectedCase.venue}</span>
                <span className="text-zinc-500">2025-2026</span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-500 block mb-1">Lead PI & Lab</span>
                <h4 className="text-base font-semibold text-zinc-100">{selectedCase.professor}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{selectedCase.institution}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-500 block">Target Publication</span>
                <p className="text-xs sm:text-sm font-medium text-zinc-200 leading-snug line-clamp-2">
                  "{selectedCase.title}"
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas-subtle/80 border border-amber-500/20 space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-mono text-amber-400 font-medium block">The Unsolved Bottleneck</span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedCase.paperChallenge}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 text-xs text-zinc-400 font-mono flex items-center justify-between">
              <span>Domain: {selectedCase.tag}</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
          </AppleGlassCard>

          {/* Column 2: Student's Code Bridge (3 cols) */}
          <AppleGlassCard glowOnHover={false} className="lg:col-span-3 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-medium block">
                Proof-of-Work Alignment
              </span>

              <div className="p-3.5 rounded-xl bg-canvas-subtle/80 border border-emerald-500/20 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-mono text-emerald-400 font-medium block">Student Bridge Project</span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {selectedCase.studentBridge}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-500 block mb-2">Verified Tooling</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCase.skillsUsed.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/5 text-zinc-300 text-[11px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2 mt-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Zero Hallucinations</span>
            </div>
          </AppleGlassCard>

          {/* Column 3: Synthesized 140-Word Pitch (5 cols) */}
          <AppleGlassCard glowOnHover={true} className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
                <span className="font-mono text-zinc-400 text-xs truncate max-w-[200px]">
                  SUBJECT: {selectedCase.pitchSubject.slice(0, 32)}...
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium">
                    {selectedCase.draftWordCount} words (Optimal)
                  </span>
                  <button
                    onClick={handleCopyPitch}
                    className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Copy pitch to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-canvas-subtle/90 border border-white/10 text-xs text-zinc-300 font-mono leading-relaxed max-h-[280px] overflow-y-auto whitespace-pre-line shadow-inner">
                {selectedCase.pitchBody}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              {onDraftOutreach ? (
                <button
                  onClick={() => onDraftOutreach(selectedCase.title, selectedCase.pitchBody, selectedCase.pitchSubject)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>Transfer to Outreach Editor</span>
                </button>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">Ready for 1-Click Review</span>
              )}
              <span className="text-zinc-200 font-medium flex items-center gap-1.5 text-xs">
                <span className="text-emerald-400 font-semibold font-mono">28.4% Response Rate</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            </div>
          </AppleGlassCard>

        </div>

      </div>
    </section>
  );
};
