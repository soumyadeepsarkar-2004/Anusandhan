import React from 'react';
import { FELLOWSHIP_PROGRAMS } from '../../data/fellowships';
import { FellowshipProgram } from '../../types';
import { Globe, Clock, ArrowUpRight, DollarSign, Sparkles } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface FellowshipsMarqueeProps {
  onSelectProgram?: (programId: string) => void;
  onLaunchApp: () => void;
  fellowships?: FellowshipProgram[];
}

export const FellowshipsMarquee: React.FC<FellowshipsMarqueeProps> = ({ onLaunchApp, fellowships }) => {
  const displayedPrograms = (fellowships && fellowships.length > 0 ? fellowships : FELLOWSHIP_PROGRAMS).slice(0, 3);

  return (
    <section id="fellowships" className="py-16 sm:py-24 bg-transparent border-t border-white/5 relative overflow-hidden select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full apple-glass-pill text-[11px] font-mono text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>GLOBAL PRESTIGE FELLOWSHIPS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              100+ Funded Research Programs{' '}
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                Tracked Live
              </span>
            </h2>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md leading-relaxed">
            Never miss a funding deadline. We distinguish between programs requiring prior professor cold outreach vs centralized matchmakers.
          </p>
        </div>

        {/* Programs Grid - 3 Spotlight Cards for 1-Screen Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-auto">
          {displayedPrograms.map((prog) => (
            <AppleGlassCard
              key={prog.id}
              className="p-5 flex flex-col justify-between shadow-xl"
              enableTilt={true}
            >
              <div>
                {/* Top Badge: Dynamic Lifecycle Status + Requirement */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 font-medium ${
                    prog.status === 'active'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : prog.status === 'upcoming'
                      ? 'bg-white/5 text-zinc-300 border border-white/10'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    <span>{prog.statusLabel || `${prog.deadlineDaysLeft}d left`}</span>
                  </span>

                  {prog.requiresPriorAcceptance ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Cold Email Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                      Central Portal
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-amber-200 transition-colors">
                  {prog.name}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{prog.hostInstitutions}</p>

                <div className="my-2.5 p-2.5 rounded-xl bg-canvas-card border border-white/10">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Financial Stipend</span>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-mono block mt-0.5">
                    {prog.stipendDisplay}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                  <strong className="text-zinc-400 font-medium">Eligibility:</strong> {prog.eligibility}
                </p>
              </div>

              {/* Bottom Strip with Direct Application Form Link */}
              <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-zinc-400">{prog.hostCountry}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onLaunchApp}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <span>Guide</span>
                  </button>
                  <a
                    href={prog.applicationPortalUrl || prog.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm transform active:scale-95"
                  >
                    <span>Apply Form</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </AppleGlassCard>
          ))}
        </div>

        {/* Viewport Bottom Explorer Strip */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-zinc-400 font-mono text-center sm:text-left">
            <span>Tracking Mitacs, DAAD, CERN, SURGE & 100+ programs · </span>
            <span className="text-amber-400 font-medium">Direct stipend & deadline tracking updated weekly</span>
          </div>

          <button
            onClick={onLaunchApp}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-white/15 text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span>Explore All 100+ Fellowships in Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

      </div>
    </section>
  );
};
