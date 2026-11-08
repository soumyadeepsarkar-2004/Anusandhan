import React from 'react';
import { Quote, Star, Award } from 'lucide-react';
import { TESTIMONIALS } from '../../data/testimonials';
import { AppleGlassCard } from '../ui/AppleGlass';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-transparent relative border-t border-zinc-800/80">
      
      {/* Floor Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-amber-500/5 blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full apple-glass-pill text-xs font-mono text-zinc-300">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>AUTHENTIC SCHOLAR OUTCOMES · ANUSANDHAN</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            How Students Cracked{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
              DAAD, CERN & Mitacs
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Real undergraduate and master's researchers who broke through academic email barriers using Anusandhan's literature-grounded intelligence.
          </p>
        </div>

        {/* Testimonials Grid with Responsive Stacking */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-white/15 hover:border-amber-400/40 transition-all duration-300 group"
            >
              {/* Specular Top Sheen */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
              
              <div>
                {/* Metric Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold backdrop-blur-md">
                    {t.metricBadge}
                  </span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Quote with Calibrated Font Size and Leading */}
                <p className="text-sm text-zinc-300 leading-relaxed font-sans italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Info with Authentic Scholar Portrait */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/40 bg-zinc-900 shrink-0 shadow-md">
                    <img 
                      src={t.avatarUrl} 
                      alt={t.studentName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white font-sans truncate">{t.studentName}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{t.originUniversity}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-amber-400 font-mono block">{t.placedProgram}</span>
                  <p className="text-[11px] text-zinc-500 font-mono">{t.hostInstitute}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
