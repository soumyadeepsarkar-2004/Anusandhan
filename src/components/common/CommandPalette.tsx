import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Compass, 
  ShieldCheck, 
  Award, 
  Mail, 
  Clock, 
  Kanban, 
  Radio, 
  Sparkles, 
  User, 
  Mic, 
  CreditCard, 
  ExternalLink, 
  ArrowRight, 
  X, 
  Globe, 
  BookOpen, 
  CheckCircle2,
  CornerDownLeft,
  RefreshCw
} from 'lucide-react';
import { Professor, FellowshipProgram, StudentProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ApiClient } from '../../services/apiClient';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (
    view: 'landing' | 'app' | 'intake',
    tab?: any,
    options?: {
      subTab?: 'professors' | 'fellowships' | 'scraped';
      status?: 'all' | 'active' | 'upcoming' | 'passed';
      scope?: 'all' | 'national' | 'international';
      openMockInterview?: boolean;
    }
  ) => void;
  onOpenVoiceModal?: () => void;
  onOpenMockInterview?: () => void;
  onOpenPricingModal?: () => void;
  professors?: Professor[];
  fellowships?: FellowshipProgram[];
  scrapedPostings?: any[];
  student?: StudentProfile;
}

interface PaletteItem {
  id: string;
  category: 'Navigation' | '24/7 Bot' | 'Faculty' | 'Fellowships' | 'Actions';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onOpenVoiceModal,
  onOpenMockInterview,
  onOpenPricingModal,
  professors = [],
  fellowships = [],
  scrapedPostings = [],
  student
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build unified items list
  const baseItems: PaletteItem[] = [
    {
      id: 'nav-discover-labs',
      category: 'Navigation',
      title: 'Discover Verified Research Labs',
      subtitle: 'Browse 100+ national & global laboratories with active grant funding',
      icon: Compass,
      badge: 'Radar',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      action: () => {
        onNavigateView('app', 'discover', { subTab: 'professors' });
        onClose();
      }
    },
    {
      id: 'nav-active-fellowships',
      category: 'Navigation',
      title: 'Active Fellowship Vacancies',
      subtitle: 'Funded applications open now (IISc SRFP, DAAD WISE, CERN Summer Student)',
      icon: Sparkles,
      badge: 'Open Now',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      action: () => {
        onNavigateView('app', 'discover', { subTab: 'fellowships', status: 'active' });
        onClose();
      }
    },
    {
      id: 'nav-diagnostic',
      category: 'Navigation',
      title: 'CV Gap Diagnostic & RRS Simulator',
      subtitle: 'Detect why cold emails fail before professors auto-reject',
      icon: ShieldCheck,
      badge: 'Audit',
      badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      action: () => {
        onNavigateView('app', 'diagnostic');
        onClose();
      }
    },
    {
      id: 'nav-pitch-composer',
      category: 'Navigation',
      title: '146-Word Precision Pitch Composer',
      subtitle: 'Draft paper-grounded proof-of-work pitches with zero AI fluff',
      icon: Mail,
      badge: '146w Standard',
      badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      action: () => {
        onNavigateView('app', 'pitch');
        onClose();
      }
    },
    {
      id: 'nav-followups',
      category: 'Navigation',
      title: '7-Day Follow-Up Engine',
      subtitle: 'Polite 7-day academic follow-ups adhering to PI etiquette',
      icon: Clock,
      badge: 'Follow-ups',
      badgeColor: 'text-amber-300 bg-amber-300/10 border-amber-300/20',
      action: () => {
        onNavigateView('app', 'followups');
        onClose();
      }
    },
    {
      id: 'nav-crm',
      category: 'Navigation',
      title: 'Application CRM Kanban Board',
      subtitle: 'Track outreach pipeline, interview calls, and lab acceptance status',
      icon: Kanban,
      badge: 'CRM',
      badgeColor: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
      action: () => {
        onNavigateView('app', 'crm');
        onClose();
      }
    },
    {
      id: 'act-voice-mentor',
      category: 'Actions',
      title: 'Open Multilingual Voice Mentor',
      subtitle: 'Speak in Hinglish or English with Sarvam AI & Gemini 2.5 foundation models',
      icon: Mic,
      badge: 'Voice AI',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      action: () => {
        if (onOpenVoiceModal) onOpenVoiceModal();
        onClose();
      }
    },
    {
      id: 'act-mock-viva',
      category: 'Actions',
      title: 'Simulate PI Screening Viva (Mock Interview)',
      subtitle: 'Rigorous oral exam scoring technical depth, soundness & scientific honesty',
      icon: Award,
      badge: 'Viva Screening',
      badgeColor: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
      action: () => {
        if (onOpenMockInterview) onOpenMockInterview();
        onClose();
      }
    },
    {
      id: 'act-upload-cv',
      category: 'Actions',
      title: 'Calibrate Profile & Upload Academic CV',
      subtitle: 'Extract proof-of-work frameworks and calculate Research Readiness Score',
      icon: User,
      badge: 'Intake Flow',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      action: () => {
        onNavigateView('intake');
        onClose();
      }
    },
    {
      id: 'act-pricing',
      category: 'Actions',
      title: 'Upgrade Outreach Credits & Plans',
      subtitle: 'View transparent student and researcher plans starting at ₹199 / $3',
      icon: CreditCard,
      badge: 'Refill Credits',
      badgeColor: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20',
      action: () => {
        if (onOpenPricingModal) onOpenPricingModal();
        onClose();
      }
    },
    {
      id: 'act-trigger-scraper',
      category: 'Actions',
      title: '⚡ Trigger 24/7 Autonomous Scraper Sweep',
      subtitle: 'Instantly crawl arXiv, OpenAlex, and university lab portals across Arts, Commerce & Tech',
      icon: RefreshCw,
      badge: '24/7 Bot',
      badgeColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
      action: async () => {
        try {
          await ApiClient.triggerIngestionSweep();
        } catch {}
        onNavigateView('app', 'discover', { subTab: 'scraped' });
        onClose();
      }
    }
  ];

  // 24/7 Live Scraped Postings across Arts, Commerce, Natural Sciences & Tech
  const scrapedItems: PaletteItem[] = (scrapedPostings || []).slice(0, 25).map((post: any, idx: number) => ({
    id: `scraped-${post.id || idx}`,
    category: '24/7 Bot',
    title: `${post.name} — ${post.university || post.institution}`,
    subtitle: `${post.domain || 'Multi-Disciplinary'} · ${post.researchFocus || post.title || 'Verified Research Position'}`,
    icon: Sparkles,
    badge: '⚡ 24/7 Live Scraped',
    badgeColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    action: () => {
      onNavigateView('app', 'discover', { subTab: 'scraped' });
      onClose();
    }
  }));

  // Faculty items
  const facultyItems: PaletteItem[] = professors.slice(0, 25).map(prof => ({
    id: `prof-${prof.id}`,
    category: 'Faculty',
    title: `${prof.name} — ${prof.university}`,
    subtitle: `${prof.domain} · "${prof.recentPaper.title.slice(0, 75)}..."`,
    icon: BookOpen,
    badge: prof.metrics?.activeGrant ? `${prof.metrics.activeGrant.funder} Grant` : `${prof.matchScore || 92}% Match`,
    badgeColor: prof.metrics?.activeGrant ? 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30' : 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    action: () => {
      onNavigateView('app', 'discover', { subTab: 'professors' });
      onClose();
    }
  }));

  // Fellowship items
  const fellowshipItems: PaletteItem[] = fellowships.slice(0, 15).map(prog => ({
    id: `fellow-${prog.id}`,
    category: 'Fellowships',
    title: prog.name,
    subtitle: `${prog.hostInstitutions} (${prog.hostCountry}) · ${prog.stipendDisplay}`,
    icon: Globe,
    badge: prog.status === 'active' ? '🟢 Active' : prog.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Past',
    badgeColor: prog.status === 'active' ? 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30' : 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    action: () => {
      onNavigateView('app', 'discover', { 
        subTab: 'fellowships',
        status: (prog.status as any) || 'all'
      });
      onClose();
    }
  }));

  const allItems = [...baseItems, ...scrapedItems, ...facultyItems, ...fellowshipItems];

  const filteredItems = query.trim() === ''
    ? baseItems
    : allItems.filter(item => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });

  // Handle keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure highlighted element stays visible in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 select-none">
          
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 backdrop-blur-2xl transition-colors ${
              isDark ? 'bg-black/75' : 'bg-slate-900/40'
            }`}
          />

          {/* Ambient Lighting Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />

          {/* Palette Dialog Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`w-full max-w-2xl glass-modal rounded-3xl border shadow-[0_30px_90px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col max-h-[75vh] ${
              isDark ? 'border-white/20' : 'border-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.18)]'
            }`}
          >
            {/* Top Specular Sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

            {/* Input Header */}
            <div className={`flex items-center px-4 py-3.5 border-b gap-3 backdrop-blur-md ${
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200/80 bg-white/60'
            }`}>
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search 24/7 opportunities, faculty, fellowships or commands..."
                className={`w-full bg-transparent text-sm font-mono outline-none focus:ring-0 ${
                  isDark ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
                }`}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-lg shadow-inner border ${
                isDark ? 'text-zinc-300 bg-white/[0.06] border-white/12' : 'text-zinc-600 bg-black/[0.04] border-black/10'
              }`}>
                ESC
              </kbd>
            </div>

            {/* Items List */}
            <div 
              ref={listRef}
              className={`flex-1 overflow-y-auto p-2 space-y-1 divide-y scrollbar-thin ${
                isDark 
                  ? 'divide-white/5 scrollbar-thumb-zinc-700 bg-black/10' 
                  : 'divide-slate-200/60 scrollbar-thumb-slate-300 bg-white/40'
              } backdrop-blur-sm`}
            >
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                    isDark ? 'bg-white/[0.04] border border-white/10 text-zinc-400' : 'bg-black/[0.04] border border-black/10 text-zinc-600'
                  }`}>
                    <Search className="w-5 h-5" />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>No matching results found for "{query}"</p>
                  <p className="text-xs text-zinc-500 font-mono">Try searching for "Arts", "Commerce", "Economics", "fellowship", "pitch", "IISc", or a professor's name.</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const IconComponent = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`pt-1 first:pt-0 cursor-pointer`}
                    >
                      <div
                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-amber-400/15 border border-amber-500/35 backdrop-blur-md text-white'
                              : 'bg-amber-500/15 border border-amber-500/40 backdrop-blur-md text-zinc-950 shadow-sm'
                            : isDark
                              ? 'hover:bg-white/[0.04] text-zinc-300 border border-transparent'
                              : 'hover:bg-black/[0.04] text-zinc-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isSelected 
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                              : isDark ? 'bg-white/[0.06] text-zinc-400' : 'bg-white/80 text-zinc-600 border border-black/5'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold truncate block ${
                                isDark ? 'text-zinc-100' : 'text-zinc-900'
                              }`}>
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor || (isDark ? 'text-zinc-400 bg-zinc-800 border-zinc-700' : 'text-zinc-600 bg-zinc-100 border-zinc-200')}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] truncate font-mono ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <div className="flex items-center text-[10px] font-mono text-amber-500 gap-1 font-semibold">
                              <span>Jump</span>
                              <CornerDownLeft className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Guide */}
            <div className={`px-4 py-2.5 border-t backdrop-blur-md flex items-center justify-between text-[11px] font-mono ${
              isDark ? 'border-white/10 bg-white/[0.03] text-zinc-500' : 'border-slate-200/80 bg-white/60 text-zinc-600'
            }`}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/12 text-zinc-300">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/12 text-zinc-300">↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/12 text-zinc-300">↵</kbd> Select
                </span>
              </div>
              <div className="text-zinc-400 font-sans text-[11px]">
                Anusandhan · <span className="text-amber-400 font-mono">⌘K</span>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
