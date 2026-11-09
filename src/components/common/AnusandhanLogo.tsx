import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AnusandhanLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  badge?: 'PRO' | 'AI' | 'SCHOLAR' | null;
  className?: string;
  themeOverride?: 'dark' | 'light';
}

export const AnusandhanLogo: React.FC<AnusandhanLogoProps> = ({
  size = 'md',
  showText = true,
  badge = 'PRO',
  className = '',
  themeOverride
}) => {
  const { isDark } = useTheme();
  const effectiveIsDark = themeOverride ? themeOverride === 'dark' : isDark;

  const sizeDimensions = {
    xs: { emblem: 'w-5 h-5', container: 'p-0.5 rounded-md', text: 'text-xs', badge: 'text-[9px] px-1 py-0.2' },
    sm: { emblem: 'w-7 h-7', container: 'p-0.5 rounded-lg', text: 'text-sm', badge: 'text-[10px] px-1.5 py-0.2' },
    md: { emblem: 'w-8 h-8', container: 'p-1 rounded-xl', text: 'text-base', badge: 'text-[11px] px-2 py-0.5' },
    lg: { emblem: 'w-10 h-10', container: 'p-1 rounded-xl', text: 'text-lg sm:text-xl', badge: 'text-xs px-2 py-0.5' },
    xl: { emblem: 'w-14 h-14', container: 'p-1.5 rounded-2xl', text: 'text-2xl', badge: 'text-xs px-2.5 py-0.5' }
  };

  const dim = sizeDimensions[size];

  // Image source dynamically determined by active theme
  const emblemSrc = effectiveIsDark ? '/brand-emblem-dark.svg' : '/brand-emblem-light.svg';
  const fallbackSrc = '/brand-emblem.svg';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblem Frame with Dynamic Theme Shadow & Border */}
      <div
        className={`${dim.emblem} ${dim.container} shrink-0 transition-all duration-300 flex items-center justify-center overflow-hidden ${
          effectiveIsDark
            ? 'bg-zinc-950 border border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
            : 'bg-white border border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5'
        }`}
      >
        <img
          key={effectiveIsDark ? 'dark-logo' : 'light-logo'}
          src={emblemSrc}
          alt="Anusandhan Logo"
          className="w-full h-full object-contain transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackSrc;
          }}
        />
      </div>

      {/* Typography & Badge */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span
            className={`font-serif tracking-tight font-semibold transition-colors duration-300 ${dim.text} ${
              effectiveIsDark ? 'text-zinc-100' : 'text-slate-900'
            }`}
          >
            Anusandhan
          </span>
          
          {badge && (
            <span
              className={`font-mono font-bold uppercase tracking-wider rounded-full transition-colors duration-300 ${dim.badge} ${
                effectiveIsDark
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-amber-500/20 text-amber-800 border border-amber-600/30'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
