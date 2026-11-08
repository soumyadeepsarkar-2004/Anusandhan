import React, { useState, useEffect } from 'react';
import { ActivityFeedItem } from '../../types';
import { Radio, RefreshCw, Clock, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

interface LiveActivityFeedProps {
  feedItems: ActivityFeedItem[];
  onManualRefresh: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  feedItems,
  onManualRefresh
}) => {
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes (300s)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onManualRefresh();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onManualRefresh]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshClick = () => {
    onManualRefresh();
    setCountdown(300);
    confetti({ particleCount: 25, spread: 45 });
  };

  const getBadgeClass = (color: ActivityFeedItem['badgeColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cyan':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Top Banner with Countdown Clock */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Live Academic Telemetry Stream</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-zinc-100 font-medium">
            Live Lab Activity & Grants Radar
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
            Auto-polls academic networks every 5 minutes for faculty grant allocations, paper acceptances, and fellowship openings.
          </p>
        </div>

        {/* 5-Min Countdown Clock & Refresh Button */}
        <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
          <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 text-center font-mono">
            <span className="text-[11px] text-zinc-500 block uppercase tracking-wider">Next Poll in</span>
            <span className="text-sm font-semibold text-amber-400">{formatCountdown(countdown)}</span>
          </div>

          <button
            onClick={handleRefreshClick}
            className="min-h-[44px] min-w-[44px] p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-amber-500/40 text-amber-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center backdrop-blur-md"
            title="Poll Lab Updates Now"
            aria-label="Poll Lab Updates Now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </AppleGlassCard>

      {/* Live Event Timeline */}
      <div className="space-y-3.5">
        {feedItems.map((item) => (
          <AppleGlassCard
            key={item.id}
            glowOnHover={true}
            className="p-4 sm:p-5 flex items-start space-x-4"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 shadow-inner">
              <Radio className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-100 truncate">{item.title}</h4>
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${getBadgeClass(item.badgeColor)}`}>
                  {item.badgeText}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center space-x-2 pt-1 text-[11px] text-zinc-500 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.relativeTime}</span>
              </div>
            </div>
          </AppleGlassCard>
        ))}
      </div>

    </div>
  );
};
