import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Sparkles, 
  Search, 
  ChevronDown, 
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import { AppTab } from '../app/MobileBottomNav';
import { WORKSPACE_TABS } from '../../data/navigationConfig';
import { PullChainBulb } from './PullChainBulb';
import { useTheme } from '../../context/ThemeContext';

interface MacOSDockProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenVoiceModal: () => void;
  onOpenPricingModal: () => void;
  onOpenCommandPalette?: () => void;
  followUpDueCount?: number;
}

interface DockItemProps {
  icon: React.ElementType;
  label: string;
  shortLabel: string;
  isActive: boolean;
  badge?: number | string;
  onClick: () => void;
}

const DockIcon: React.FC<DockItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  badge, 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  return (
    <div 
      className="relative flex flex-col items-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Tooltip with Apple Glassmorphism */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className={`absolute -top-11 px-2.5 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap z-50 pointer-events-none shadow-xl border ${
              isDark 
                ? 'bg-zinc-900/90 text-zinc-100 border-white/20' 
                : 'bg-white/95 text-zinc-900 border-white/80 shadow-[0_8px_20px_rgba(15,23,42,0.1)]'
            } backdrop-blur-xl`}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Icon Button */}
      <motion.button
        whileHover={{ scale: 1.15, y: -3 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
          isActive
            ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-zinc-950 font-bold border border-white/60 shadow-md shadow-amber-500/30'
            : isDark
              ? 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10'
              : 'bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md'
        }`}
        title={label}
        aria-label={label}
      >
        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Counter Badge */}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold flex items-center justify-center shadow-md border border-white/40">
            {badge}
          </span>
        )}
      </motion.button>

      {/* Active Dot Reflection Indicator */}
      <div className="h-1 flex items-center justify-center mt-1">
        {isActive && (
          <motion.div 
            layoutId="dock-active-dot"
            className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
          />
        )}
      </div>
    </div>
  );
};

export const MacOSDock: React.FC<MacOSDockProps> = ({
  currentTab,
  onTabChange,
  onOpenVoiceModal,
  onOpenPricingModal,
  onOpenCommandPalette,
  followUpDueCount = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDark } = useTheme();

  const currentTabConfig = WORKSPACE_TABS.find(t => t.id === currentTab) || WORKSPACE_TABS[0];
  const CurrentIcon = currentTabConfig.icon;

  return (
    <div className="fixed bottom-4 inset-x-0 mx-auto w-fit z-40 px-4 pointer-events-none hidden md:block">
      
      {/* Collapsed State: Unobtrusive Micro Pill (Zero Screen Blocking) */}
      {isCollapsed ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="pointer-events-auto"
        >
          <button
            onClick={() => setIsCollapsed(false)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full apple-glass-pill shadow-xl border cursor-pointer group active:scale-95 transition-all ${
              isDark ? 'border-white/15 text-zinc-300' : 'border-white/80 text-zinc-700 shadow-[0_10px_25px_rgba(15,23,42,0.10)]'
            }`}
            title="Expand Navigation Taskbar"
          >
            <CurrentIcon className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-mono font-medium">{currentTabConfig.shortLabel}</span>
            <ChevronUp className="w-3 h-3 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </button>
        </motion.div>
      ) : (
        /* Full Expanded Taskbar Dock: Complete, Consistent, and Beautiful */
        <motion.nav 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className={`pointer-events-auto apple-glass-pill rounded-2xl px-3 py-1.5 flex items-center space-x-2 shadow-[0_16px_45px_rgba(0,0,0,0.5)] border backdrop-blur-2xl transition-all ${
            isDark ? 'border-white/20' : 'border-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.12)]'
          }`}
          aria-label="Workspace Navigation Taskbar"
        >
          {/* Complete 8 Workspace Tabs in Synchronized Order */}
          {WORKSPACE_TABS.map((tab) => (
            <DockIcon
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              shortLabel={tab.shortLabel}
              isActive={currentTab === tab.id}
              badge={tab.id === 'followups' && followUpDueCount > 0 ? followUpDueCount : undefined}
              onClick={() => onTabChange(tab.id)}
            />
          ))}

          {/* Elegant Vertical Divider */}
          <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/15' : 'bg-slate-300/70'}`} />

          {/* Quick Command Search (⌘K) */}
          {onOpenCommandPalette && (
            <div 
              onClick={onOpenCommandPalette}
              className="relative flex flex-col items-center group cursor-pointer"
              title="Global Search (⌘K)"
            >
              <button
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                  isDark 
                    ? 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10' 
                    : 'bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md'
                }`}
                aria-label="Global Search (⌘K)"
              >
                <Search className="w-4 h-4 text-amber-500" />
              </button>
              <div className="h-1 mt-1" />
            </div>
          )}

          {/* Multilingual Voice Mentor Trigger */}
          <div 
            onClick={onOpenVoiceModal}
            className="relative flex flex-col items-center group cursor-pointer"
            title="Open Voice Mentor"
          >
            <button
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10' 
                  : 'bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md'
              }`}
              aria-label="Voice Mentor"
            >
              <Mic className="w-4 h-4 text-amber-500" />
            </button>
            <div className="h-1 mt-1" />
          </div>

          {/* Plans & Credits Refill */}
          <div 
            onClick={onOpenPricingModal}
            className="relative flex flex-col items-center group cursor-pointer"
            title="View Pro Plans & Token Balance"
          >
            <button
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10' 
                  : 'bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md'
              }`}
              aria-label="Plans and Credits"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>
            <div className="h-1 mt-1" />
          </div>

          {/* Theme Pull-Chain Bulb */}
          <div className="flex items-center px-0.5">
            <PullChainBulb size="sm" />
          </div>

          {/* Minimize / Hide Toggle (Guarantees zero interference with content) */}
          <button
            onClick={() => setIsCollapsed(true)}
            className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            title="Minimize Taskbar to Edge (Unblock view)"
            aria-label="Minimize Taskbar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </motion.nav>
      )}
    </div>
  );
};
