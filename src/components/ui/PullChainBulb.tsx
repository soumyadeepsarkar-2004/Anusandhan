import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface PullChainBulbProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Pure Pull-Chain Theme Toggle (Bulb-Free Minimalist Tactile Switch)
 * Displays only the vintage beaded brass pull chain and pull ring.
 * Pulling/clicking triggers mechanical recoil physics and synthesized switch audio.
 */
export const PullChainBulb: React.FC<PullChainBulbProps> = ({ 
  className = '',
  size = 'sm'
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  const handlePull = async () => {
    if (isPulling) return;
    setIsPulling(true);

    // Dynamic mechanical spring pull: chain stretches downward then snaps back
    await controls.start({
      y: [0, 14, -3, 0],
      transition: {
        duration: 0.32,
        times: [0, 0.45, 0.75, 1],
        ease: 'easeInOut'
      }
    });

    toggleTheme();

    setTimeout(() => {
      setIsPulling(false);
    }, 350);
  };

  const isSmall = size === 'sm';

  return (
    <div 
      className={`relative inline-flex flex-col items-center select-none cursor-pointer group px-1 py-0.5 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePull}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePull();
        }
      }}
      aria-label={`Toggle theme via pull-chain. Current: ${theme}`}
      title={`Pull chain to switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      {/* Top Ceiling / Header Anchor Mount Eyelet */}
      <div className="w-2.5 h-1 rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 border border-amber-600/40 shadow-sm shrink-0" />

      {/* Hanging Chain Assembly with Framer Motion Elasticity */}
      <motion.div 
        animate={controls}
        className="flex flex-col items-center cursor-pointer active:scale-95 group/chain pt-0.5"
      >
        {/* Beaded Brass Chain Links */}
        <div className="flex flex-col items-center gap-[1.5px] py-0.5">
          {[...Array(isSmall ? 5 : 7)].map((_, idx) => (
            <div 
              key={idx} 
              className={`rounded-full transition-colors duration-200 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 shadow-[0_0_2px_rgba(245,158,11,0.5)] ${
                isSmall ? 'w-1 h-1' : 'w-1.5 h-1.5'
              }`} 
            />
          ))}
        </div>

        {/* Brass Teardrop Pull Handle / Ring */}
        <div 
          className={`relative rounded-full transition-all duration-200 group-hover:scale-110 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border border-amber-300/80 shadow-[0_2px_8px_rgba(245,158,11,0.4)] ${
            isSmall ? 'w-2.5 h-3.5' : 'w-3 h-4'
          } flex items-center justify-center -mt-0.5`}
        >
          {/* Inner ring perforation */}
          <div className="w-1 h-1 rounded-full bg-zinc-950/80" />
        </div>
      </motion.div>

      {/* Micro-Tooltip on Hover */}
      {isHovered && (
        <motion.div 
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`absolute -bottom-7 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-mono font-medium shadow-xl border z-50 backdrop-blur-xl ${
            isDark 
              ? 'bg-zinc-900/95 text-amber-300 border-amber-500/30' 
              : 'bg-white/95 text-amber-600 border-amber-500/40 shadow-sm'
          }`}
        >
          {isDark ? 'Pull for Light ☀️' : 'Pull for Dark 🌙'}
        </motion.div>
      )}
    </div>
  );
};

// Convenient alias for semantic usage
export const PullChainSwitch = PullChainBulb;
