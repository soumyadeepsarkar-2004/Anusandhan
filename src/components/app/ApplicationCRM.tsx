import React from 'react';
import { OutreachDraft } from '../../types';
import { Kanban, CheckCircle, ChevronRight } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface ApplicationCRMProps {
  drafts: OutreachDraft[];
  onMoveStatus: (draftId: string, nextStatus: OutreachDraft['status']) => void;
}

export const ApplicationCRM: React.FC<ApplicationCRMProps> = ({ drafts, onMoveStatus }) => {
  const columns: { status: OutreachDraft['status']; title: string; color: string; badge: string }[] = [
    { status: 'Drafted', title: 'Drafted', color: 'border-zinc-700 text-zinc-400', badge: 'bg-zinc-800 text-zinc-400' },
    { status: 'Sent', title: 'Queued / Sent', color: 'border-amber-500/30 text-amber-300', badge: 'bg-amber-500/10 text-amber-300' },
    { status: 'Opened', title: 'Delivered', color: 'border-sky-500/30 text-sky-400', badge: 'bg-sky-500/10 text-sky-400' },
    { status: 'Replied', title: 'PI Replied', color: 'border-amber-500/60 text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    { status: 'Interview Scheduled', title: 'Interview Offer', color: 'border-emerald-500/60 text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-zinc-100 flex items-center gap-2.5">
            <Kanban className="w-5 h-5 text-amber-400" />
            <span>Research Pipeline CRM</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time pipeline tracking from literature outreach to interview offers.
          </p>
        </div>
        <span className="text-xs font-mono text-amber-400 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/12 font-medium">
          Total Tracked: {drafts.length}
        </span>
      </div>

      {/* Kanban Board Container with responsive scroll */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = drafts.filter(d => {
            if (col.status === 'Sent') {
              return d.status === 'Sent' || d.status === 'Follow-up Due';
            }
            return d.status === col.status;
          });

          return (
            <div
              key={col.status}
              className="rounded-2xl glass-panel p-4 flex flex-col min-w-[240px] shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              {/* Column Header */}
              <div className={`flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs font-medium font-mono ${col.color}`}>
                <span className="tracking-wider uppercase">{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${col.badge}`}>
                  {items.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="space-y-3 flex-1">
                {items.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-600 font-mono">
                    No active cards
                  </div>
                ) : (
                  items.map((item) => (
                    <AppleGlassCard
                      key={item.id}
                      glowOnHover={true}
                      className="p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-zinc-100 leading-snug truncate">
                          {item.professorName}
                        </h4>
                        {item.daysSinceSent !== undefined && (
                          <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                            {item.daysSinceSent}d ago
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 truncate">
                        {item.university}
                      </p>

                      <p className="text-[11px] text-zinc-500 line-clamp-1 font-mono">
                        "{item.paperTitle}"
                      </p>

                      {/* Move status buttons with comfortable tap area */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        {col.status !== 'Interview Scheduled' && (
                          <button
                            onClick={() => {
                              const nextMap: Record<string, OutreachDraft['status']> = {
                                'Drafted': 'Sent',
                                'Sent': 'Opened',
                                'Opened': 'Replied',
                                'Replied': 'Interview Scheduled'
                              };
                              onMoveStatus(item.id, nextMap[col.status] || 'Sent');
                            }}
                            className="min-h-[36px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>Advance Stage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {col.status === 'Interview Scheduled' && (
                          <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px] font-mono">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Offer In Review
                          </span>
                        )}
                      </div>
                    </AppleGlassCard>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
