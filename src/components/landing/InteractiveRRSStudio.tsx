import React, { useState } from 'react';
import { Award, Check, Sparkles, TrendingUp, ArrowRight, ShieldCheck, Cpu, Code2, BookOpen, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

interface InteractiveRRSStudioProps {
  onLaunchApp: () => void;
}

export const InteractiveRRSStudio: React.FC<InteractiveRRSStudioProps> = ({ onLaunchApp }) => {
  const [hasPaper, setHasPaper] = useState<boolean>(true);
  const [hasRepo, setHasRepo] = useState<boolean>(true);
  const [hasEduEmail, setHasEduEmail] = useState<boolean>(true);
  const [hasOrcid, setHasOrcid] = useState<boolean>(false);
  const [hasTooling, setHasTooling] = useState<boolean>(true);
  const [cgpa, setCgpa] = useState<number>(9.2);

  // Compute dynamic score
  const paperScore = hasPaper ? 23 : 6;
  const repoScore = hasRepo ? 22 : 8;
  const eduScore = hasEduEmail ? 14 : 4;
  const orcidScore = hasOrcid ? 15 : 6;
  const toolingScore = hasTooling ? 14 : 5;
  const gpaScore = Math.round((cgpa / 10.0) * 12);

  const totalScore = Math.min(99, paperScore + repoScore + eduScore + orcidScore + toolingScore + gpaScore);

  let tier;
  let replyLikelihood;
  let tierColor;

  if (totalScore >= 85) {
    tier = 'Elite Global Fellow (DAAD/Mitacs Top 5%)';
    replyLikelihood = '28.4%';
    tierColor = 'text-amber-400';
  } else if (totalScore >= 70) {
    tier = 'Competitive Candidate (High Faculty Match)';
    replyLikelihood = '18.2%';
    tierColor = 'text-emerald-400';
  } else {
    tier = 'Developing Scholar (Standard Applicant Pool)';
    replyLikelihood = '5.1%';
    tierColor = 'text-zinc-400';
  }

  const handleToggleConfetti = () => {
    if (totalScore >= 85) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  return (
    <section className="py-20 sm:py-24 bg-canvas border-t border-white/5 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-xs font-mono mb-4 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Interactive Score Simulator</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-zinc-100 font-medium tracking-tight">
            Simulate Your Research Readiness Score (RRS)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            See in real-time how verifiable proof-of-work shifts your academic profile from the auto-reject pile into the top 5% of international fellowship applicants.
          </p>
        </div>

        {/* Interactive Studio Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Left Panel: Proof-of-Work Levers (7 Columns) */}
          <AppleGlassCard glowOnHover={false} className="lg:col-span-7 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Adjust Your Academic Proof-of-Work Signals
              </span>
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                <LiveRadarDot status="active" />
                <span>Live Simulator</span>
              </span>
            </div>

            {/* Toggle 1: arXiv Preprint */}
            <label className="min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasPaper ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 block truncate">arXiv Preprint or Workshop Paper</span>
                  <span className="text-[11px] text-zinc-400 block truncate">Peer-reviewed or pre-printed manuscript link (+23 pts)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasPaper}
                onChange={(e) => {
                  setHasPaper(e.target.checked);
                  handleToggleConfetti();
                }}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-400 accent-amber-500 cursor-pointer ml-3 shrink-0"
              />
            </label>

            {/* Toggle 2: Code Repo with Reproduction Guide */}
            <label className="min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasRepo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 block truncate">Reproducible PyTorch / CUDA Code Repo</span>
                  <span className="text-[11px] text-zinc-400 block truncate">GitHub with 1-click reproduction instructions & benchmarks (+22 pts)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasRepo}
                onChange={(e) => {
                  setHasRepo(e.target.checked);
                  handleToggleConfetti();
                }}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-400 accent-amber-500 cursor-pointer ml-3 shrink-0"
              />
            </label>

            {/* Toggle 3: Official Institutional Email */}
            <label className="min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasEduEmail ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 block truncate">Official Institutional Address (.edu / .ac.in)</span>
                  <span className="text-[11px] text-zinc-400 block truncate">Dramatically decreases Gmail spam filtering (+14 pts)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasEduEmail}
                onChange={(e) => {
                  setHasEduEmail(e.target.checked);
                  handleToggleConfetti();
                }}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-emerald-400 accent-emerald-500 cursor-pointer ml-3 shrink-0"
              />
            </label>

            {/* Toggle 4: ORCID / Scholar Profile */}
            <label className="min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasOrcid ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 block truncate">Verified ORCID Identifier</span>
                  <span className="text-[11px] text-zinc-400 block truncate">Attaches persistent scholarly authorship (+15 pts)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasOrcid}
                onChange={(e) => {
                  setHasOrcid(e.target.checked);
                  handleToggleConfetti();
                }}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-400 accent-amber-500 cursor-pointer ml-3 shrink-0"
              />
            </label>

            {/* Toggle 5: Hardware & Tooling */}
            <label className="min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-canvas-subtle/80 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasTooling ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 block truncate">Deep Systems & Tooling Stack</span>
                  <span className="text-[11px] text-zinc-400 block truncate">ROS2, Triton, CUDA, Docker, or W&B (+14 pts)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasTooling}
                onChange={(e) => {
                  setHasTooling(e.target.checked);
                  handleToggleConfetti();
                }}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-400 accent-amber-500 cursor-pointer ml-3 shrink-0"
              />
            </label>

            {/* CGPA Slider */}
            <div className="p-4 rounded-xl bg-canvas-subtle/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-zinc-300 font-medium">Academic CGPA / GPA:</span>
                <span className="font-mono text-amber-400 font-semibold">{cgpa.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min="7.0"
                max="10.0"
                step="0.1"
                value={cgpa}
                onChange={(e) => setCgpa(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-500 cursor-pointer"
                aria-label="CGPA slider"
              />
              <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1">
                <span>7.0 (Baseline)</span>
                <span>8.5 (Competitive)</span>
                <span>10.0 (Top 1%)</span>
              </div>
            </div>

          </AppleGlassCard>

          {/* Right Panel: Live Dial & Probability Card (5 Columns) */}
          <AppleGlassCard glowOnHover={true} className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium block">
                Calculated Readiness
              </span>

              {/* Big Score Dial Display with Luminous Ring */}
              <div className="p-6 rounded-2xl bg-canvas-subtle/90 border border-white/10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="text-5xl sm:text-6xl font-semibold text-zinc-100 font-mono tracking-tight relative z-10">
                  {totalScore}
                  <span className="text-xl text-zinc-500 font-normal">/100</span>
                </div>
                <div className={`text-xs sm:text-sm font-medium font-mono uppercase mt-2 ${tierColor} relative z-10`}>
                  {tier}
                </div>
              </div>

              {/* PI Response Probability Gauge */}
              <div className="p-4 rounded-xl bg-canvas-subtle/90 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Estimated PI Reply Rate:</span>
                  </span>
                  <span className="font-mono font-semibold text-emerald-400 text-sm">{replyLikelihood}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (parseFloat(replyLikelihood) / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-mono">
                  *Versus 2.1% baseline for mass cold blast emails without paper citations.
                </p>
              </div>

              {/* Diagnostic Recommendation */}
              <div className="space-y-2 text-xs text-zinc-400 pt-1">
                <span className="text-zinc-300 font-medium text-[11px] uppercase tracking-wider font-mono block">Key Recommendation:</span>
                {!hasPaper && (
                  <p className="text-[11px] leading-relaxed text-amber-300/90">💡 Upload an early preprint on arXiv or institutional repository to gain +17 points.</p>
                )}
                {!hasRepo && (
                  <p className="text-[11px] leading-relaxed text-amber-300/90">💡 Provide a clean GitHub repo link with a 1-line pip install reproduction script.</p>
                )}
                {!hasOrcid && (
                  <p className="text-[11px] leading-relaxed text-amber-300/90">💡 Register a free 16-digit ORCID ID at orcid.org to prove persistent authorship.</p>
                )}
                {hasPaper && hasRepo && hasOrcid && (
                  <p className="text-[11px] leading-relaxed text-emerald-400">✓ Your profile is primed for DAAD WISE, Mitacs, and top Max Planck labs!</p>
                )}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-white/10">
              <button
                onClick={onLaunchApp}
                className="w-full min-h-[44px] flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-canvas font-semibold text-xs tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
              >
                <span>Score Your Real CV Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </AppleGlassCard>

        </div>

      </div>
    </section>
  );
};
