import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ArrowRight, Menu, X, Sparkles, User, LogOut, ShieldCheck, Search } from 'lucide-react';
import { AudioWaveformVisualizer, LiveRadarDot } from '../ui/AppleGlass';
import { PullChainBulb } from '../ui/PullChainBulb';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onLaunchApp: () => void;
  onOpenVoiceModal: () => void;
  onOpenAuth: () => void;
  creditsRemaining: number;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onLaunchApp, 
  onOpenVoiceModal, 
  onOpenAuth,
  creditsRemaining,
  onOpenCommandPalette
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
    { name: 'Plans', href: '#pricing', id: 'pricing' }
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
    <div className="fixed top-3 sm:top-5 inset-x-0 mx-auto max-w-5xl z-50 px-3 sm:px-6 pointer-events-none">
      <header className="pointer-events-auto apple-glass-pill rounded-full px-3 sm:px-5 py-2.5 flex items-center justify-between transition-all duration-300">
        
        {/* Brand Mark */}
        <div 
          className="flex items-center space-x-2.5 cursor-pointer group select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/80 p-0.5 overflow-hidden flex items-center justify-center shadow-lg group-hover:border-amber-500/50 transition-colors">
              <img src="/brand-emblem.png" alt="Anusandhan Emblem" className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = '/brand-emblem.svg'; }} />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                Anusandhan
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </div>
            <span className="hidden xl:block text-[10px] text-zinc-400 font-mono tracking-wider leading-none mt-1 truncate max-w-[220px]">
              Autonomous Research · Powered by AnusandhanAI
            </span>
          </div>
        </div>

        {/* Center Navigation Links with Sliding Pill */}
        <nav className="hidden lg:flex items-center space-x-1 relative">
          {navLinks.map((link) => {
            const isSelected = hoveredNav === link.name || (!hoveredNav && activeSection === link.id);

            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavScroll(e, link.href)}
                onMouseEnter={() => setHoveredNav(link.name)}
                onMouseLeave={() => setHoveredNav(null)}
                className={`relative px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected ? 'text-amber-300 font-semibold' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="navbar-hover-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.1] border border-white/15 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Quick Search / Command Palette Pill */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-amber-500/40 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm group backdrop-blur-md"
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
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-amber-500/40 text-zinc-200 text-xs font-medium transition-all cursor-pointer shadow-sm group backdrop-blur-md"
            title="Open Multilingual Academic Voice Mentor"
          >
            <AudioWaveformVisualizer active={true} variant="micro" />
            <span className="font-mono text-[11px] text-zinc-300 group-hover:text-amber-300 transition-colors">
              Voice Mentor
            </span>
          </button>

          {/* Interactive Pull-Chain Light Bulb Theme Switcher */}
          <div className="flex items-center px-1">
            <PullChainBulb size="sm" />
          </div>

          {/* User Status / Auth Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onLaunchApp}
                className="min-h-[38px] flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={logout}
                className="min-h-[38px] p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAuth}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={onLaunchApp}
                className="min-h-[38px] relative group overflow-hidden flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer transform active:scale-95"
              >
                <span className="relative z-10">Launch Platform</span>
                <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
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
            className="pointer-events-auto lg:hidden apple-glass rounded-2xl p-4 mt-2 border border-zinc-700/60 shadow-2xl space-y-3"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavScroll(e, link.href);
                  }}
                  className="px-3 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenVoiceModal(); }}
                className="flex items-center space-x-1.5 text-amber-400 font-mono"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Mentor</span>
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                  className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
