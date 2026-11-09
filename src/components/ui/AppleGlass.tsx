import React, { useRef, useState, MouseEvent } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface AppleGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
  glowOnHover?: boolean;
}

export const AppleGlassCard: React.FC<AppleGlassCardProps> = ({
  children,
  className = '',
  spotlightColor,
  enableTilt = false,
  glowOnHover = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  // Theme-calibrated refractive spotlight color
  const effectiveSpotlight = spotlightColor || (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217, 119, 6, 0.16)');

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (spotlightRef.current && glowOnHover) {
      spotlightRef.current.style.opacity = '1';
      spotlightRef.current.style.background = `radial-gradient(400px circle at ${x}px ${y}px, ${effectiveSpotlight}, transparent 75%)`;
    }

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rx = ((y - centerY) / centerY) * -5;
      const ry = ((x - centerX) / centerX) * 5;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  };

  const handleMouseEnter = () => {
    if (spotlightRef.current && glowOnHover) {
      spotlightRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    if (spotlightRef.current && glowOnHover) {
      spotlightRef.current.style.opacity = '0';
    }
    if (cardRef.current && enableTilt) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        willChange: enableTilt ? 'transform' : undefined
      }}
      className={`relative overflow-hidden rounded-2xl apple-glass-card ${className}`}
      {...props}
    >
      {/* 21st.dev Style Cursor Spotlight Glow (Zero React Re-render Direct Paint) */}
      {glowOnHover && (
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0"
        />
      )}

      {/* Subtle Specular Top Sheen Highlight */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/20' : 'via-white/95'} to-transparent`} />

      {/* Card Body */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export const AudioWaveformVisualizer: React.FC<{ active?: boolean; className?: string; variant?: 'normal' | 'micro' }> = ({
  active = true,
  className = '',
  variant = 'normal'
}) => {
  if (variant === 'micro') {
    return (
      <div className={`flex items-center gap-[2.5px] h-3.5 ${className}`} aria-hidden="true">
        <span className={`w-[2.5px] h-2 rounded-full bg-amber-400 ${active ? 'animate-micro-1' : 'opacity-40'}`} />
        <span className={`w-[2.5px] h-3 rounded-full bg-amber-300 ${active ? 'animate-micro-2' : 'opacity-40'}`} />
        <span className={`w-[2.5px] h-3.5 rounded-full bg-amber-400 ${active ? 'animate-micro-3' : 'opacity-40'}`} />
        <span className={`w-[2.5px] h-2.5 rounded-full bg-amber-500 ${active ? 'animate-micro-4' : 'opacity-40'}`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-[2px] h-3.5 ${className}`} aria-hidden="true">
      <span className={`w-[2px] rounded-full bg-amber-400 ${active ? 'animate-wave-1' : 'h-1'}`} />
      <span className={`w-[2px] rounded-full bg-amber-300 ${active ? 'animate-wave-2' : 'h-1.5'}`} />
      <span className={`w-[2px] rounded-full bg-amber-400 ${active ? 'animate-wave-3' : 'h-2'}`} />
      <span className={`w-[2px] rounded-full bg-amber-500 ${active ? 'animate-wave-4' : 'h-1'}`} />
    </div>
  );
};

export const LiveRadarDot: React.FC<{ 
  label?: string; 
  status?: 'active' | 'warning' | 'idle' | string;
  className?: string;
}> = ({ label, status = 'active', className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-400/80"></span>
      {label && <span className="text-[11px] font-mono text-zinc-300">{label}</span>}
    </span>
  );
};
