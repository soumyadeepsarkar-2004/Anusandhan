import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Globe, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  Filter, 
  Layers,
  FileText,
  Upload,
  X,
  AlertCircle
} from 'lucide-react';
import { FACULTY_DATABASE } from '../../data/facultyDatabase';
import { Professor, ResearchDomain, StudentProfile } from '../../types';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

interface OpportunitiesSectionProps {
  onSelectProfessor: (prof: Professor) => void;
  onLaunchPlatform: () => void;
  professors?: Professor[];
  student?: StudentProfile;
}

const OpportunitiesSectionComponent: React.FC<OpportunitiesSectionProps> = ({
  onSelectProfessor,
  onLaunchPlatform,
  professors,
  student
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<'all' | 'national' | 'global'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [intakePromptProf, setIntakePromptProf] = useState<Professor | null>(null);

  const hasCompletedProfile = Boolean(student && student.fullName && student.rrsScore > 0);

  const domains = [
    { id: 'all', label: 'All Disciplines' },
    { id: 'Arts & Humanities', label: 'Arts & Humanities' },
    { id: 'Commerce & Economics', label: 'Commerce & Economics' },
    { id: 'Natural & Physical Sciences', label: 'Natural & Physical Sciences' },
    { id: 'Social Sciences & Law', label: 'Social Sciences & Law' },
    { id: 'Artificial Intelligence & ML', label: 'AI & Machine Learning' },
    { id: 'Robotics & Autonomous Systems', label: 'Robotics & Vision' },
    { id: 'Quantum Computing & Information', label: 'Quantum Computing' },
    { id: 'Computational Biology & Genomics', label: 'Computational Biology' }
  ];

  const sourceFaculty = useMemo(() => (professors && professors.length > 0) ? professors : FACULTY_DATABASE, [professors]);
  const filteredFaculty = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sourceFaculty.filter((prof) => {
      const matchesDomain = selectedDomain === 'all' || prof.domain === selectedDomain;
      const matchesScope = selectedScope === 'all' || prof.scope === selectedScope;
      const matchesSearch = 
        !q ||
        prof.name.toLowerCase().includes(q) ||
        prof.university.toLowerCase().includes(q) ||
        prof.researchFocus.toLowerCase().includes(q) ||
        prof.labName.toLowerCase().includes(q);
      return matchesDomain && matchesScope && matchesSearch;
    });
  }, [sourceFaculty, selectedDomain, selectedScope, searchQuery]);

  const handleCardPitchClick = (prof: Professor) => {
    if (!hasCompletedProfile) {
      setIntakePromptProf(prof);
    } else {
      onSelectProfessor(prof);
    }
  };

  return (
    <section id="opportunities" className="py-16 sm:py-24 bg-transparent border-t border-white/5 relative overflow-hidden select-none">
      
      {/* Specular Ambient Glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-amber-500/5 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full apple-glass-pill text-xs text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Disciplinary Research & Faculty Intelligence</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-serif text-zinc-100 font-medium tracking-tight">
              Verified Open Labs &{' '}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500">
                Funded Faculty
              </span>
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Real-time faculty intelligence tracking active funding allocations from DST, MeitY, CSIR, NSF, and ERC. Every lab has verified student co-authorship track records.
            </p>
          </div>

          {/* Quick Scope Filter Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-canvas-card border border-white/10 shrink-0">
            <button
              onClick={() => setSelectedScope('all')}
              className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedScope === 'all'
                  ? 'bg-amber-400 text-canvas font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Labs ({FACULTY_DATABASE.length})
            </button>
            <button
              onClick={() => setSelectedScope('national')}
              className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedScope === 'national'
                  ? 'bg-amber-400 text-canvas font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🇮🇳 Premier National (IISc, IITs)
            </button>
            <button
              onClick={() => setSelectedScope('global')}
              className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedScope === 'global'
                  ? 'bg-amber-400 text-canvas font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌐 Global Labs (Max Planck, MIT)
            </button>
          </div>
        </div>

        {/* Search & Domain Filter Bar */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by professor name, university (IISc, MIT, IIT Bombay), or research keywords..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-canvas-card border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={onLaunchPlatform}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-canvas font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Match with My CV</span>
            </button>
          </div>

          {/* Domain Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {domains.map((dom) => (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`min-h-[34px] px-3.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  selectedDomain === dom.id
                    ? 'bg-zinc-800 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-canvas-subtle/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-canvas-card'
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>
        </div>

        {/* Faculty Grid - Curated 3 Spotlight Labs with Non-Overlapping Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredFaculty.slice(0, 3).map((prof) => (
            <AppleGlassCard
              key={prof.id}
              className="p-6 shadow-xl group border border-white/10 hover:border-amber-500/30 transition-all rounded-2xl bg-zinc-900/60"
              enableTilt={true}
            >
              <div className="flex flex-col justify-between h-full min-h-[480px]">
                <div className="flex-1 flex flex-col">
                  {/* Header: Scope Tag & Acceptance Radar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                      prof.scope === 'national'
                        ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}>
                      {prof.scope === 'national' ? '🇮🇳 Premier National' : '🌐 Global Lab'}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-medium">
                      Accepting Interns
                    </span>
                  </div>

                  {/* Professor Info */}
                  <h3 className="text-lg font-serif font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors leading-snug">
                    {prof.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    {prof.title} · {prof.department}
                  </p>
                  <p className="text-xs text-amber-400 font-mono mt-0.5 font-medium">
                    {prof.university}
                  </p>

                  {/* Unsolved Research Problem / Challenge Block */}
                  {prof.recentPaper?.snippet && (
                    <div className="my-3 p-3 rounded-xl bg-zinc-950/80 border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-400 font-semibold">
                        <span>Unsolved Research Challenge</span>
                        <span className="text-zinc-500 font-mono text-[9px]">Target</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                        {prof.recentPaper.snippet}
                      </p>
                    </div>
                  )}

                  {/* Active Grant Callout */}
                  {prof.metrics?.activeGrant && (
                    <div className="mb-3 p-2.5 rounded-xl bg-zinc-900/90 border border-emerald-500/20 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400">
                        <span>Funded Grant</span>
                        <span className="text-emerald-400 font-semibold">{prof.metrics.activeGrant.expiryYear}</span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {prof.metrics.activeGrant.title}
                      </p>
                      <p className="text-[10px] font-mono text-emerald-400">
                        {prof.metrics.activeGrant.funder} · {prof.metrics.activeGrant.amount}
                      </p>
                    </div>
                  )}

                  {/* Research Focus */}
                  <div className="mb-3 text-xs text-zinc-300 leading-relaxed font-sans">
                    <strong className="text-zinc-400 font-medium font-mono text-[11px] block mb-0.5">Focus Areas:</strong>
                    <p className="line-clamp-2 text-zinc-400">{prof.researchFocus}</p>
                  </div>

                  {/* Recent Publication */}
                  {prof.recentPaper && (
                    <div className="mt-auto pt-3 border-t border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>LATEST PUBLICATION</span>
                        <span className="text-amber-400">{prof.recentPaper.venue} ({prof.recentPaper.year})</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-snug">
                        "{prof.recentPaper.title}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono text-zinc-400">
                    <span className="text-zinc-200 font-semibold">
                      {prof.metrics?.studentCoAuthorshipRatio ? Math.round(prof.metrics.studentCoAuthorshipRatio * 100) : 45}%
                    </span> Student Co-Authors
                  </div>

                  <button
                    onClick={() => handleCardPitchClick(prof)}
                    className="min-h-[36px] px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-canvas font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {hasCompletedProfile ? (
                      <>
                        <span>Pitch to Lab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Upload CV to Pitch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </AppleGlassCard>
          ))}
        </div>

        {/* Viewport Bottom Explorer Strip */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400 font-mono text-center sm:text-left">
            <span>Showing top spotlight labs · </span>
            <span className="text-amber-400 font-medium">500+ verified faculty tracked daily across IISc, IITs, MIT & Max Planck</span>
          </div>

          <button
            onClick={onLaunchPlatform}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-white/15 text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span>Launch Platform & Explore All 500+ Labs</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

      </div>

      {/* CV Intake Prerequisite Prompt Modal */}
      <AnimatePresence>
        {intakePromptProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIntakePromptProf(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Upload CV Before Pitching</h3>
                  <p className="text-xs text-amber-400 font-mono">Target: {intakePromptProf.name} ({intakePromptProf.university})</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/10 mb-5 text-xs text-zinc-300 leading-relaxed space-y-2">
                <p>
                  <strong>Why this step is required:</strong> Anusandhan does not send generic template spam. A verified pitch requires calibrating your real technical proof-of-work (frameworks, GitHub code, papers) against {intakePromptProf.name}'s active grant papers.
                </p>
                <p className="text-zinc-400 font-mono text-[11px]">
                  Upload your CV first so Anusandhan can calibrate your background and generate a verified pitch.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  onClick={() => setIntakePromptProf(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIntakePromptProf(null);
                    onLaunchPlatform();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-canvas font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CV & Calibrate Profile</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export const OpportunitiesSection = React.memo(OpportunitiesSectionComponent);
