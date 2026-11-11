import React, { useState } from 'react';
import { AppTab, MobileBottomNav } from './MobileBottomNav';
import { 
  Sparkles, 
  Mic, 
  ArrowLeft, 
  User, 
  Clock, 
  Award, 
  LogOut, 
  Search, 
  Flame, 
  Coins,
  ShieldCheck,
  Scale,
  Smartphone
} from 'lucide-react';
import { StudentProfile } from '../../types';
import { WORKSPACE_TABS } from '../../data/navigationConfig';
import { AudioWaveformVisualizer } from '../ui/AppleGlass';
import { PullChainBulb } from '../ui/PullChainBulb';
import { useAuth } from '../../context/AuthContext';
import { AnusandhanLogo } from '../common/AnusandhanLogo';

// Dynamic lazy imports for gamification modals
const ScholarStreakModal = React.lazy(() => import('../gamification/ScholarStreakModal').then(m => ({ default: m.ScholarStreakModal })));
const TokenRewardsModal = React.lazy(() => import('../gamification/TokenRewardsModal').then(m => ({ default: m.TokenRewardsModal })));

interface AppLayoutProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenVoiceModal: () => void;
  onOpenMockInterview?: () => void;
  onOpenPricingModal: () => void;
  onOpenOnboarding: () => void;
  onBackToLanding: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAuth?: () => void;
  onOpenPrivacyModal?: () => void;
  onOpenTermsModal?: () => void;
  onOpenCrossNativeModal?: () => void;
  student: StudentProfile;
  followUpDueCount: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  onOpenVoiceModal,
  onOpenMockInterview,
  onOpenPricingModal,
  onOpenOnboarding,
  onBackToLanding,
  onOpenCommandPalette,
  onOpenAuth,
  onOpenPrivacyModal,
  onOpenTermsModal,
  onOpenCrossNativeModal,
  student,
  followUpDueCount,
  children
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] flex flex-col pb-16 relative transition-colors duration-300">
      
      {/* Top Application Header - Layered Frosted Glass */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 backdrop-blur-2xl bg-white/[0.03] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative transition-colors duration-300">
        {/* Specular Top Sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand + Back Button */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={onBackToLanding}
              className="p-1.5 rounded-xl bg-white/[0.04] border border-[var(--border-subtle)] hover:bg-white/[0.08] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer backdrop-blur-md"
              title="Return to Public Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center cursor-pointer select-none" onClick={onBackToLanding}>
              <AnusandhanLogo size="sm" />
            </div>
          </div>

          {/* Center: Global Search Command Palette Pill */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border-subtle)] hover:border-amber-500/40 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono transition-all cursor-pointer shadow-sm group backdrop-blur-md max-w-xs w-full justify-between"
              title="Global Command Palette (⌘K / Ctrl+K)"
            >
              <div className="flex items-center space-x-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-sans truncate">Search commands, faculty...</span>
              </div>
              <kbd className="text-[9px] bg-white/[0.08] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] font-mono shrink-0">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Right Suite: Metrics, Voice, Theme & Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 text-xs shrink-0">
            
            {/* Daily Streak Flame */}
            <button
              onClick={() => {
                if (!isAuthenticated && onOpenAuth) {
                  onOpenAuth();
                  return;
                }
                setIsStreakModalOpen(true);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 font-mono text-xs transition-all cursor-pointer shadow-sm active:scale-95 group"
              title={isAuthenticated ? "View Scholar Streak & Rewards" : "Sign In to Claim Daily Streak & Tokens"}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30 group-hover:scale-110 transition-transform" />
              <span className="font-bold">{isAuthenticated ? `${user?.loginStreak || 1}d` : 'Claim 🪙'}</span>
            </button>

            {/* Shodh Tokens Balance */}
            <button
              onClick={() => {
                if (!isAuthenticated && onOpenAuth) {
                  onOpenAuth();
                  return;
                }
                setIsTokenModalOpen(true);
              }}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border-subtle)] hover:border-amber-400/40 text-amber-500 font-mono text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              title={isAuthenticated ? "Your Shodh Token Balance & Reward Claims" : "Sign In to View Token Wallet"}
            >
              <span className="text-xs">🪙</span>
              <span className="font-bold text-[var(--text-primary)]">{isAuthenticated ? (user?.tokensBalance || 0) : 0}</span>
            </button>

            {/* Credits Balance Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-amber-500/30 text-[var(--text-secondary)] font-mono backdrop-blur-md">
              <span className="text-[var(--text-muted)] text-[11px]">Cr:</span>
              <span className="font-bold text-amber-500">{student.creditsRemaining}</span>
              <button
                onClick={onOpenPricingModal}
                className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors font-bold cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Voice Mentor Action */}
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs shadow-sm transition-all cursor-pointer group backdrop-blur-md"
              title="Open Multilingual Academic Voice Mentor"
            >
              <AudioWaveformVisualizer active={true} variant="micro" />
              <span className="hidden lg:inline font-mono text-[11px] text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors">
                Voice
              </span>
            </button>

            {/* Cross-Native Android & PWA App Header Pill */}
            {onOpenCrossNativeModal && (
              <button
                onClick={onOpenCrossNativeModal}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-medium text-xs shadow-sm transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                title="Download Android APK & Install PWA"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-mono text-[11px] font-semibold text-amber-300">
                  App
                </span>
              </button>
            )}

            {/* Pull-Chain Bulb Theme Switcher */}
            <div className="flex items-center px-1">
              <PullChainBulb size="sm" />
            </div>

            {/* Scholar Profile / Sign In Action */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-[var(--border-subtle)]">
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={onOpenOnboarding}
                    className="flex items-center space-x-2 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Edit Profile & Re-parse CV"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30 shadow-inner">
                      {(user?.fullName || student.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden xl:flex flex-col text-left">
                      <span className="text-xs font-medium max-w-[110px] truncate text-[var(--text-primary)]">
                        {user?.fullName || student.fullName || 'Scholar'}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        Scholar · RRS {user?.rrsScore !== undefined ? user.rrsScore : (student.rrsScore !== undefined ? student.rrsScore : 0)}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Desktop Tab Bar with Liquid Glass */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)] overflow-x-auto relative no-scrollbar">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <nav className="flex space-x-1.5 py-2">
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              const count = tab.id === 'followups' ? followUpDueCount : undefined;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'apple-glass-pill text-amber-500 font-bold border-amber-500/40 shadow-sm'
                      : 'glass-chip text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[11px] font-mono font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Tab Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {children}
      </main>

      {/* Workspace Footer Strip with High-Contrast Legal & Policy Links */}
      <footer className="mt-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-secondary)] gap-3 font-mono">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Anusandhan Autonomous Workspace · DPDP Act 2023 Compliant</span>
        </div>
        <div className="flex items-center space-x-4 text-[11px]">
          {onOpenPrivacyModal && (
            <button
              onClick={onOpenPrivacyModal}
              className="hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy Policy</span>
            </button>
          )}
          {onOpenTermsModal && (
            <button
              onClick={onOpenTermsModal}
              className="hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Terms & Ethics</span>
            </button>
          )}
          <a
            href="mailto:soumyadeepsarkar2004@outlook.com"
            className="hover:text-amber-500 transition-colors"
          >
            Support
          </a>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Taskbar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenVoiceModal={onOpenVoiceModal}
        followUpDueCount={followUpDueCount}
      />

      {/* Scholar Streak, Daily Login Rewards & Token Exchange Modal */}
      <React.Suspense fallback={null}>
        <ScholarStreakModal
          isOpen={isStreakModalOpen}
          onClose={() => setIsStreakModalOpen(false)}
          onOpenPricingModal={onOpenPricingModal}
          onOpenAuth={onOpenAuth}
        />

        {/* Shodh Token Wallet & Rewards Claim Modal */}
        <TokenRewardsModal
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          onOpenPricingModal={onOpenPricingModal}
          onOpenAuth={onOpenAuth}
        />
      </React.Suspense>

    </div>
  );
};
