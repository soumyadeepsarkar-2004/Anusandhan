import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ArrowRight, Menu, X, Sparkles, User, LogOut, ShieldCheck, Search, CreditCard, Scale, ChevronDown } from 'lucide-react';
import { AudioWaveformVisualizer, LiveRadarDot } from '../ui/AppleGlass';
import { PullChainBulb } from '../ui/PullChainBulb';
import { AnusandhanLogo } from '../common/AnusandhanLogo';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onLaunchApp: () => void;
  onOpenVoiceModal: () => void;
  onOpenAuth: () => void;
  creditsRemaining: number;
  onOpenCommandPalette?: () => void;
  onOpenPricingModal?: () => void;
  onOpenRewardsModal?: () => void;
  onOpenPrivacyModal?: () => void;
  onOpenTermsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onLaunchApp, 
  onOpenVoiceModal, 
  onOpenAuth,
  creditsRemaining,
  onOpenCommandPalette,
  onOpenPricingModal,
  onOpenRewardsModal,
  onOpenPrivacyModal,
  onOpenTermsModal
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isVoiceHovered, setIsVoiceHovered] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { name: 'Opportunities', href: '#opportunities', id: 'opportunities' },
    { name: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { name: 'Fellowships', href: '#fellowships', id: 'fellowships' },
    { name: 'Plans', href: '#pricing', id: 'pricing' },
    { name: 'Docs', href: 'https://soumyadeepsarkar-2004.github.io/Anusandhan/', id: 'docs', isExternal: true }
  ];

  // Active section scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ['pricing', 'fellowships', 'how-it-works', 'opportunities', 'hero'];
      const scrollY = window.scrollY + 180;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollY >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const targetElement = document.getElementById(id);
    if (targetElement) {
      const yOffset = -75; // Account for fixed floating pill navbar
      const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed top-3 sm:top-5 inset-x-0 mx-auto max-w-7xl w-[96%] z-50 px-2 sm:px-4 pointer-events-none">
      <header className="pointer-events-auto apple-glass-pill rounded-full min-h-[56px] h-[56px] px-3.5 sm:px-5 lg:px-6 flex items-center justify-between transition-all duration-300 gap-2 sm:gap-4 shadow-2xl relative">
        
        {/* Dynamic Theme-Aware Brand Logo */}
        <div 
          className="flex items-center cursor-pointer group select-none shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <AnusandhanLogo size="sm" />
        </div>

        {/* Center Navigation Links with Sliding Pill */}
        <nav className="hidden lg:flex items-center space-x-0.5 relative shrink-0">
          {navLinks.map((link) => {
            const isSelected = hoveredNav === link.name || (!hoveredNav && activeSection === link.id);

            return (
              <a
                key={link.name}
                href={link.href}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noreferrer' : undefined}
                onClick={(e) => {
                  if (link.isExternal) {
                    return;
                  }
                  if (link.id === 'pricing' && onOpenPricingModal) {
                    e.preventDefault();
                    onOpenPricingModal();
                    return;
                  }
                  handleNavScroll(e, link.href);
                }}
                onMouseEnter={() => setHoveredNav(link.name)}
                onMouseLeave={() => setHoveredNav(null)}
                className={`relative px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer rounded-full ${
                  isSelected ? 'text-amber-500 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="navbar-hover-pill"
                    className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/25 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Controls - Guaranteed Containment Inside Floating Glass Pill */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          
          {/* Quick Search / Command Palette Pill */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden xl:flex items-center space-x-1.5 px-2.5 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-amber-500/40 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm group backdrop-blur-md shrink-0"
              title="Global Command Palette (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              <span className="text-[11px] font-sans">Search</span>
              <kbd className="text-[9px] bg-white/[0.08] border border-white/15 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Multilingual Voice Engine Quick Pill */}
          <button
            onClick={onOpenVoiceModal}
            onMouseEnter={() => setIsVoiceHovered(true)}
            onMouseLeave={() => setIsVoiceHovered(false)}
            className="hidden md:flex items-center space-x-1.5 px-2.5 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-amber-500/40 text-zinc-200 text-xs font-medium transition-all cursor-pointer shadow-sm group backdrop-blur-md shrink-0"
            title="Open Multilingual Academic Voice Mentor"
          >
            <AudioWaveformVisualizer active={true} variant="micro" />
            <span className="font-mono text-[11px] text-zinc-300 group-hover:text-amber-300 transition-colors">
              Voice
            </span>
          </button>

          {/* Shodh Token Rewards Trigger */}
          {isAuthenticated && onOpenRewardsModal && (
            <button
              onClick={onOpenRewardsModal}
              className="hidden sm:flex items-center space-x-1 px-2.5 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-amber-500/30 text-amber-300 text-xs font-mono transition-all cursor-pointer shadow-sm shrink-0"
              title="Shodh Token Wallet & Daily Rewards"
            >
              <span>🪙</span>
              <span className="text-[11px] font-bold">{user?.tokensBalance || 0}</span>
            </button>
          )}

          {/* Interactive Pull-Chain Light Bulb Theme Switcher */}
          <div className="flex items-center px-0.5 shrink-0">
            <PullChainBulb size="sm" />
          </div>

          {/* Seamless Authentication & Launch Platform Capsule Placeholder */}
          {isAuthenticated && user ? (
            <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shrink-0 gap-1 shadow-inner">
              <button
                onClick={onLaunchApp}
                className="h-8 group flex items-center space-x-1.5 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition-all cursor-pointer transform active:scale-95 shrink-0 whitespace-nowrap border border-amber-300/40"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={logout}
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shrink-0 gap-1 shadow-inner">
              <button
                onClick={onOpenAuth}
                className="h-8 px-3.5 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                Sign In
              </button>

              <button
                onClick={onLaunchApp}
                className="h-8 group flex items-center space-x-1.5 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition-all cursor-pointer transform active:scale-95 shrink-0 whitespace-nowrap border border-amber-300/40"
              >
                <span>Launch Platform</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer h-8 w-8 flex items-center justify-center shrink-0 shadow-sm"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </header>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto lg:hidden apple-glass-pill rounded-3xl p-4 mt-2 border border-[var(--border-subtle)] shadow-2xl space-y-3 bg-[var(--surface-bg)]"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noreferrer' : undefined}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (link.isExternal) return;
                    handleNavScroll(e, link.href);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-[var(--border-subtle)] hover:border-amber-500/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer font-medium text-center"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Mobile Compliance Actions */}
            {(onOpenPrivacyModal || onOpenTermsModal) && (
              <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-[11px]">
                {onOpenPrivacyModal && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenPrivacyModal(); }}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-amber-500/10 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Privacy Policy</span>
                  </button>
                )}
                {onOpenTermsModal && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenTermsModal(); }}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-amber-500/10 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-medium"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    <span>Terms & Ethics</span>
                  </button>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenVoiceModal(); }}
                className="flex items-center space-x-1.5 text-amber-500 font-mono font-medium"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Mentor</span>
              </button>

              {!isAuthenticated ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onLaunchApp(); }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <span>App</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
