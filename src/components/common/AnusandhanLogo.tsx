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
  badge = null,
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

  // Robust URL resolution supporting root domain, base subpath, and edge CDNs
  const rawBase = (import.meta as any).env?.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const emblemSrc = `${base}${effectiveIsDark ? 'brand-emblem-dark.svg' : 'brand-emblem-light.svg'}`;
  const fallbackSrc = `${base}brand-emblem.svg`;

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblem Frame with Dynamic Theme Shadow & Border */}
      <div
        className={`${dim.emblem} ${dim.container} shrink-0 transition-all duration-300 flex items-center justify-center overflow-hidden ${
          effectiveIsDark
            ? 'bg-zinc-950 border border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
            : 'bg-[#FDFCFA] border border-stone-200/90 shadow-[0_2px_10px_rgba(40,30,20,0.06)] ring-1 ring-stone-900/5'
        }`}
      >
        {!imgError ? (
          <img
            key={effectiveIsDark ? 'dark-logo' : 'light-logo'}
            src={emblemSrc}
            alt="Anusandhan Logo"
            className="w-full h-full object-contain transition-opacity duration-300"
            onError={() => {
              setImgError(true);
            }}
          />
        ) : (
          /* Inline Resilient Astrolabe Constellation SVG (Never Fails) */
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <polygon points="50,10 85,25 90,65 65,90 25,90 10,65 15,25 50,10" 
                     stroke={effectiveIsDark ? "#F59E0B" : "#D97706"} strokeWidth="4" strokeDasharray="4 4" fill="none"/>
            <ellipse cx="50" cy="50" rx="34" ry="14" stroke={effectiveIsDark ? "#38BDF8" : "#0284C7"} strokeWidth="3" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="34" ry="14" stroke={effectiveIsDark ? "#F59E0B" : "#B45309"} strokeWidth="3" transform="rotate(-30 50 50)" />
            <polygon points="50,38 60,50 50,62 40,50" fill={effectiveIsDark ? "#F59E0B" : "#D97706"} />
            <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
          </svg>
        )}
      </div>

      {/* Typography & Brand Name */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span
            className={`font-serif tracking-tight font-semibold transition-colors duration-300 ${dim.text} ${
              effectiveIsDark ? 'text-zinc-100' : 'text-[#1C1917]'
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
