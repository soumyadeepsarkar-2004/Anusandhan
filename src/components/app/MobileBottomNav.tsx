import React from 'react';
import { Mic } from 'lucide-react';
import { WORKSPACE_TABS } from '../../data/navigationConfig';
import { useTheme } from '../../context/ThemeContext';

export type AppTab = 'profile' | 'discover' | 'diagnostic' | 'pitch' | 'outreach' | 'followups' | 'crm' | 'livefeed';

interface MobileBottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenVoiceModal: () => void;
  followUpDueCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenVoiceModal,
  followUpDueCount
}) => {
  const { isDark } = useTheme();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 apple-glass-pill border-t px-2 py-1.5 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.4)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur-2xl transition-colors ${
        isDark ? 'border-white/10' : 'border-white/80 bg-white/85 shadow-[0_-10px_30px_rgba(15,23,42,0.10)]'
      }`}
    >
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar w-full py-1">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const badge = tab.id === 'followups' && followUpDueCount > 0 ? followUpDueCount : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                isActive 
                  ? 'text-amber-500 font-bold bg-amber-500/15 border border-amber-500/30 shadow-sm' 
                  : isDark 
                    ? 'text-zinc-400 hover:text-zinc-200' 
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-sans truncate max-w-[52px]">{tab.shortLabel}</span>
              
              {/* Badge Counter */}
              {badge !== undefined && (
                <span className="absolute top-0.5 right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Center Floating Voice Action Pill */}
        <button
          onClick={onOpenVoiceModal}
          className="flex flex-col items-center justify-center min-w-[44px] h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 shadow-md border border-white/40 active:scale-95 transition-transform cursor-pointer shrink-0 ml-1 mr-1"
          title="Voice Assistant"
        >
          <Mic className="w-4 h-4 font-bold" />
        </button>
      </div>
    </nav>
  );
};
