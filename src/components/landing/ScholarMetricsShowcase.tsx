import React from 'react';
import { Award, BookOpen, ShieldCheck, Flame, Users, CheckCircle, Sparkles } from 'lucide-react';
import { FACULTY_DATABASE } from '../../data/facultyDatabase';
import { INITIAL_STUDENT_STATE } from '../../services/resumeParser';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

export const ScholarMetricsShowcase: React.FC = () => {
  const sampleProf = FACULTY_DATABASE[0];
  const student = INITIAL_STUDENT_STATE;

  return (
    <section id="scholars" className="py-20 sm:py-24 bg-canvas relative border-t border-white/5 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-xs font-mono mb-4 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Academic Reputation Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-zinc-100 font-medium tracking-tight">
            Know Which Professors <span className="font-serif italic font-normal text-amber-300">Actively Mentor Students</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            We query OpenAlex, Semantic Scholar, ORCID, and NSF/NIH databases to surface verified mentor ratings and evaluate your Research Readiness Score (RRS).
          </p>
        </div>

        {/* Dual Cards: Left = Professor Reputation Card, Right = Student RRS Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
          
          {/* Card 1: Professor Scholar Card */}
          <AppleGlassCard className="p-5 sm:p-6 flex flex-col justify-between shadow-2xl" enableTilt={true}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
                  Verified Faculty Profile
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center space-x-1.5 shadow-sm">
                  <LiveRadarDot status="active" />
                  <span>Accepting Interns</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-zinc-100">{sampleProf.name}</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{sampleProf.title} · {sampleProf.labName}</p>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">{sampleProf.university}</p>

              {/* Verified Scholar Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10">
                  <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>h-INDEX</span>
                  </div>
                  <div className="text-xl font-semibold text-zinc-100 font-mono mt-1.5">{sampleProf.metrics.hIndex}</div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">Semantic Scholar</span>
                </div>

                <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10">
                  <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>VELOCITY</span>
                  </div>
                  <div className="text-xl font-semibold text-amber-400 font-mono mt-1.5">+{sampleProf.metrics.citationVelocity.toLocaleString()}</div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">2-Year Momentum</span>
                </div>

                <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10">
                  <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-mono">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CO-AUTHORS</span>
                  </div>
                  <div className="text-xl font-semibold text-emerald-400 font-mono mt-1.5">
                    {Math.round(sampleProf.metrics.studentCoAuthorshipRatio * 100)}%
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">Student Authors</span>
                </div>
              </div>

              {/* Active Grant Indicator */}
              {sampleProf.metrics?.activeGrant && (
                <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10 mb-4 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 flex flex-wrap items-center gap-1.5">
                      <span>{sampleProf.metrics.activeGrant.funder} Active Grant</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">Funded Capacity</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{sampleProf.metrics.activeGrant.title}</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{sampleProf.metrics.activeGrant.amount}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-white/10 text-xs text-zinc-400 flex items-center justify-between">
              <span>Verified via ORCID & Semantic Scholar Graph</span>
              <span className="text-amber-400 font-mono font-medium">97% Match Affinity</span>
            </div>
          </AppleGlassCard>

          {/* Card 2: Student Research Readiness Score (RRS) */}
          <AppleGlassCard className="p-5 sm:p-6 flex flex-col justify-between shadow-2xl" enableTilt={true}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
                  Student Verification Hub
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-mono font-semibold border border-amber-500/30">
                  Tier: {student.rrsTier}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-100">{student.fullName}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{student.university}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-semibold text-zinc-100 font-mono">{student.rrsScore}<span className="text-sm text-zinc-500 font-normal">/100</span></div>
                  <span className="text-xs text-amber-400 font-mono">Research Readiness</span>
                </div>
              </div>

              {/* RRS 3 Key Bars Breakdown */}
              <div className="space-y-3.5 my-5">
                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-medium mb-1">
                    <span>Code Reproducibility (GitHub / Spaces)</span>
                    <span className="font-mono text-zinc-200">{student.rrsPillars.codeExecution} / 25</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-zinc-200 rounded-full" style={{ width: `${(student.rrsPillars.codeExecution / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-medium mb-1">
                    <span>Research Literacy & Methodology</span>
                    <span className="font-mono text-amber-400">{student.rrsPillars.researchMethodology} / 25</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(student.rrsPillars.researchMethodology / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-medium mb-1">
                    <span>Academic Foundations (CGPA 9.12)</span>
                    <span className="font-mono text-emerald-400">{student.rrsPillars.academicFoundations} / 20</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(student.rrsPillars.academicFoundations / 20) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Proof-of-Work Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {student.badges.map(b => (
                  <span
                    key={b.id}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      b.unlocked 
                        ? 'bg-zinc-800/90 border-white/10 text-zinc-200' 
                        : 'bg-canvas-card border-white/5 text-zinc-600 opacity-50'
                    }`}
                  >
                    <span>{b.icon}</span>
                    <span>{b.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/10 text-xs text-zinc-400 flex items-center justify-between">
              <span>Linked Accounts: GitHub, ORCID, Hugging Face</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1 font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Student</span>
              </span>
            </div>

          </AppleGlassCard>

        </div>

      </div>
    </section>
  );
};
