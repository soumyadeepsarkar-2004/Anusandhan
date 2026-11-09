import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentProfile, Professor, FellowshipProgram, OutreachDraft, ActivityFeedItem } from './types';
import { INITIAL_STUDENT_STATE } from './services/resumeParser';
import { FELLOWSHIP_PROGRAMS } from './data/fellowships';
import { matchProfessorsForStudent } from './services/academicMatcher';
import { generateColdEmail } from './services/emailGenerator';
import { INITIAL_ACTIVITY_FEED, generateNextActivityItem } from './services/liveFeedService';
import { ApiClient } from './services/apiClient';

// Landing Page Components (Simple, Clean, Informative)
import { Navbar } from './components/landing/Navbar';
import { SimpleHeroSection } from './components/landing/SimpleHeroSection';
import { OpportunitiesSection } from './components/landing/OpportunitiesSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { FellowshipsMarquee } from './components/landing/FellowshipsMarquee';
import { PricingSection } from './components/landing/PricingSection';
import { Footer } from './components/landing/Footer';

// UI & Ambient Components
import { ConstellationBackground } from './components/ui/ConstellationBackground';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { PullChainBulb } from './components/ui/PullChainBulb';
import { AnusandhanLogo } from './components/common/AnusandhanLogo';

// Platform Core App Layout & Lightweight Nav
import { AppLayout } from './components/app/AppLayout';
import { AppTab, MobileBottomNav } from './components/app/MobileBottomNav';
import { OpportunityExplorer } from './components/app/OpportunityExplorer';
import { OutreachComposer } from './components/app/OutreachComposer';
import { FollowUpManager } from './components/app/FollowUpManager';
import { ApplicationCRM } from './components/app/ApplicationCRM';
import { LiveActivityFeed } from './components/app/LiveActivityFeed';
import { AutonomousAssistantWidget } from './components/voice/AutonomousAssistantWidget';

// Code-Split Dynamic Heavy Modules (Instant First Paint & Zero Bundle Lag)
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const IntakeDiagnosticFlow = lazy(() => import('./components/intake/IntakeDiagnosticFlow').then(m => ({ default: m.IntakeDiagnosticFlow })));
const TokenRewardsModal = lazy(() => import('./components/gamification/TokenRewardsModal').then(m => ({ default: m.TokenRewardsModal })));
const OnboardingModal = lazy(() => import('./components/app/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const StudentProfileHub = lazy(() => import('./components/app/StudentProfileHub').then(m => ({ default: m.StudentProfileHub })));
const PricingModal = lazy(() => import('./components/app/PricingModal').then(m => ({ default: m.PricingModal })));
const InteractiveRRSStudio = lazy(() => import('./components/landing/InteractiveRRSStudio').then(m => ({ default: m.InteractiveRRSStudio })));
const PaperPitchVisualizer = lazy(() => import('./components/landing/PaperPitchVisualizer').then(m => ({ default: m.PaperPitchVisualizer })));
const MockInterviewModal = lazy(() => import('./components/agents/MockInterviewModal').then(m => ({ default: m.MockInterviewModal })));
const CommandPalette = lazy(() => import('./components/common/CommandPalette').then(m => ({ default: m.CommandPalette })));

const SuspenseSkeleton: React.FC = () => (
  <div className="w-full min-h-[300px] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500/25 border-t-amber-500 animate-spin" />
      <span className="text-xs font-mono text-stone-400 dark:text-zinc-500">Loading module...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Navigation View: 'landing' | 'intake' | 'app'
  const [view, setView] = useState<'landing' | 'intake' | 'app'>('landing');

  // App Dashboard Active Tab
  const [currentTab, setCurrentTab] = useState<AppTab>('discover');
  const [discoverSubTab, setDiscoverSubTab] = useState<'professors' | 'fellowships' | 'scraped'>('professors');
  const [opportunityStatus, setOpportunityStatus] = useState<'all' | 'active' | 'upcoming' | 'passed'>('all');
  const [opportunityScope, setOpportunityScope] = useState<'all' | 'national' | 'international'>('all');

  // Navigate View with URL Hash & History Synchronization
  const navigateToView = (
    nextView: 'landing' | 'intake' | 'app', 
    nextTab?: AppTab,
    options?: {
      subTab?: 'professors' | 'fellowships' | 'scraped';
      status?: 'all' | 'active' | 'upcoming' | 'passed';
      scope?: 'all' | 'national' | 'international';
      openMockInterview?: boolean;
    }
  ) => {
    setView(nextView);
    if (nextTab) {
      setCurrentTab(nextTab);
    }
    if (options?.subTab) {
      setDiscoverSubTab(options.subTab);
    }
    if (options?.status) {
      setOpportunityStatus(options.status);
    }
    if (options?.scope) {
      setOpportunityScope(options.scope);
    }
    if (options?.openMockInterview) {
      setIsMockInterviewOpen(true);
    }
    if (nextView === 'landing') {
      if (window.location.hash !== '' && !['#opportunities', '#how-it-works', '#fellowships', '#pricing'].includes(window.location.hash)) {
        window.history.pushState(null, '', ' ');
      }
    } else if (nextView === 'intake') {
      window.location.hash = 'intake';
    } else if (nextView === 'app') {
      window.location.hash = `workspace/${nextTab || currentTab}`;
    }
  };

  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab);
    window.location.hash = `workspace/${tab}`;
  };

  // Browser History & Hash Listener (Popstate & Hashchange)
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (!hash || ['hero', 'opportunities', 'how-it-works', 'fellowships', 'pricing'].includes(hash)) {
        setView('landing');
      } else if (hash === 'intake') {
        setView('intake');
      } else if (hash.startsWith('workspace') || hash === 'app') {
        setView('app');
        const parts = hash.split('/');
        if (parts[1]) {
          const tab = parts[1] as AppTab;
          if (['discover', 'diagnostic', 'pitch', 'profile', 'outreach', 'followups', 'crm', 'livefeed'].includes(tab)) {
            setCurrentTab(tab);
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    handleHashSync();

    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register'>('signin');
  const [isMockInterviewOpen, setIsMockInterviewOpen] = useState<boolean>(false);
  const [selectedInterviewProf, setSelectedInterviewProf] = useState<{ name: string; institution?: string; domain?: string; firstQuestion?: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Student Profile State
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_STATE);

  // Synchronize authenticated user with student state
  useEffect(() => {
    if (user) {
      setStudent(prev => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        university: user.university || prev.university,
        degreeLevel: (user.degreeLevel as StudentProfile['degreeLevel']) || prev.degreeLevel,
        cgpa: user.cgpa || prev.cgpa,
        targetDomains: (user.targetDomains && user.targetDomains.length > 0) ? (user.targetDomains as any) : prev.targetDomains,
        rrsScore: user.rrsScore || prev.rrsScore,
        rrsTier: (user.rrsTier as StudentProfile['rrsTier']) || prev.rrsTier,
        creditsRemaining: user.creditsRemaining !== undefined ? user.creditsRemaining : prev.creditsRemaining
      }));
    }
  }, [user]);

  // Data Collections with Real-Time 24/7 Scraping & Ingestion Synchronization
  const [liveFaculty, setLiveFaculty] = useState<Professor[]>(() => matchProfessorsForStudent(student));
  const [fellowships, setFellowships] = useState<FellowshipProgram[]>(FELLOWSHIP_PROGRAMS);
  const [scrapedPostings, setScrapedPostings] = useState<any[]>([]);
  const [ingestionTelemetry, setIngestionTelemetry] = useState<any>(null);

  // Sync with live faculty, fellowships, and 24/7 background crawler postings
  useEffect(() => {
    let isMounted = true;

    const fetchAllLiveOpportunities = async () => {
      try {
        const [facRes, fellRes, scrapRes, statusRes] = await Promise.all([
          ApiClient.getFaculty(),
          ApiClient.getFellowships(),
          ApiClient.getScrapedPostings(),
          ApiClient.getIngestionStatus()
        ]);

        if (isMounted) {
          if (facRes && Array.isArray(facRes) && facRes.length > 0) {
            setLiveFaculty(facRes as any);
          }
          if (fellRes && Array.isArray(fellRes) && fellRes.length > 0) {
            setFellowships(fellRes);
          }
          if (scrapRes && Array.isArray(scrapRes) && scrapRes.length > 0) {
            setScrapedPostings(scrapRes);
          }
          if (statusRes) {
            setIngestionTelemetry(statusRes);
          }
        }
      } catch (err) {
        console.warn('Real-time ingestion sync error:', err);
      }
    };

    fetchAllLiveOpportunities();
    // 24/7 background sync cycle (polls every 30 seconds for live updates)
    const syncInterval = setInterval(fetchAllLiveOpportunities, 30000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Update activity feed item ticker every 60 seconds
  useEffect(() => {
    const updateTimer = setInterval(() => {
      const nextItem = generateNextActivityItem();
      setFeedItems(prev => [nextItem, ...prev.slice(0, 9)]);
    }, 60000);

    return () => clearInterval(updateTimer);
  }, []);

  // Persistent student outreach pipeline (saved in localStorage, clean start with zero demo items)
  const [drafts, setDrafts] = useState<OutreachDraft[]>(() => {
    try {
      const saved = localStorage.getItem('rip_student_drafts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rip_student_drafts', JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  const [activeDraft, setActiveDraft] = useState<OutreachDraft | null>(() => {
    return drafts.length > 0 ? drafts[0] : null;
  });

  // Live Activity Telemetry
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITY_FEED);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedDeconstructTitle, setSelectedDeconstructTitle] = useState<string | undefined>(undefined);

  // Follow-up due count
  const followUpDueCount = drafts.filter(
    d => (d.status === 'Sent' || d.status === 'Opened' || d.status === 'Follow-up Due') && (d.daysSinceSent || 0) >= 6
  ).length;

  // Actions
  const handleDraftOutreach = (prof: Professor) => {
    if (!student.fullName || student.rrsScore === 0) {
      navigateToView('intake');
      return;
    }
    let existing = drafts.find(d => d.professorId === prof.id);
    if (!existing) {
      existing = generateColdEmail(prof, student);
      setDrafts(prev => [existing!, ...prev]);
    }
    setActiveDraft(existing);
    navigateToView('app', 'outreach');
  };

  const handleSendDraft = (draftId: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        return {
          ...d,
          status: 'Sent',
          daysSinceSent: 0,
          sentAt: new Date().toISOString()
        };
      }
      return d;
    }));

    setStudent(prev => ({
      ...prev,
      creditsRemaining: Math.max(0, prev.creditsRemaining - 1),
      dailyOutreachCount: prev.dailyOutreachCount + 1
    }));
  };

  const handleUpdateDraftBody = (draftId: string, newBody: string) => {
    setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, body: newBody } : d));
    if (activeDraft && activeDraft.id === draftId) {
      setActiveDraft(prev => prev ? { ...prev, body: newBody } : null);
    }
  };

  const handleSendFollowUp = (draftId: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        return {
          ...d,
          status: 'Sent',
          daysSinceSent: 0 // Reset timer
        };
      }
      return d;
    }));
  };

  const handleSimulateTimeJump = () => {
    setDrafts(prev => prev.map(d => ({
      ...d,
      daysSinceSent: (d.daysSinceSent || 0) + 7,
      status: d.status === 'Sent' ? 'Follow-up Due' : d.status
    })));
  };

  const handleMoveCrmStatus = (draftId: string, nextStatus: OutreachDraft['status']) => {
    setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: nextStatus } : d));
  };

  const handleManualFeedRefresh = () => {
    const newItem = generateNextActivityItem();
    setFeedItems(prev => [newItem, ...prev.slice(0, 7)]);
  };

  const handleAddCredits = (amount: number) => {
    setStudent(prev => ({
      ...prev,
      creditsRemaining: prev.creditsRemaining + amount
    }));
  };

  // Authenticated Gateway Handler (Blocks anonymous free plan & token consumption)
  const handleLaunchPlatform = (targetTab: AppTab = 'discover') => {
    if (!isAuthenticated) {
      setAuthInitialMode('signin');
      setIsAuthModalOpen(true);
      return;
    }
    navigateToView('app', targetTab);
  };

  const handleVoiceActionTrigger = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CRM') || act === 'OPEN_CRM') {
      navigateToView('app', 'crm');
    } else if (act.includes('PITCH') || act.includes('OUTREACH') || act.includes('DRAFT')) {
      navigateToView('app', 'outreach');
    } else if (act.includes('PROFILE') || act === 'VIEW_PROFILE') {
      navigateToView('app', 'profile');
    } else if (act.includes('LAB') || act.includes('PROGRAM') || act.includes('FILTER')) {
      navigateToView('app', 'discover');
    } else if (act.includes('DIAGNOSTIC') || act.includes('RRS') || act === 'VIEW_DIAGNOSTIC') {
      navigateToView('app', 'diagnostic');
    } else if (act.includes('INTERVIEW') || act === 'START_MOCK_INTERVIEW') {
      navigateToView('app', 'discover');
      setIsMockInterviewOpen(true);
    } else {
      navigateToView('app', 'discover');
    }
    setIsVoiceModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Offline Status & Outbox Synchronization Banner */}
      <OfflineBanner />

      {/* Interactive Constellation Knowledge Graph Backdrop */}
      <ConstellationBackground />
      
      {view === 'landing' && (
        /* SIMPLE, INFORMATIVE, CLEAN MARKETING LANDING PAGE */
        <div className="relative z-10">
          <Navbar
            onLaunchApp={() => handleLaunchPlatform('discover')}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenPricingModal={() => {
              if (!isAuthenticated) {
                setAuthInitialMode('signin');
                setIsAuthModalOpen(true);
                return;
              }
              setIsPricingModalOpen(true);
            }}
            onOpenRewardsModal={() => {
              if (!isAuthenticated) {
                setAuthInitialMode('signin');
                setIsAuthModalOpen(true);
                return;
              }
              setIsRewardsModalOpen(true);
            }}
            onOpenAuth={() => {
              setAuthInitialMode('signin');
              setIsAuthModalOpen(true);
            }}
            creditsRemaining={student.creditsRemaining}
          />

          <main>
            <SimpleHeroSection
              onLaunchPlatform={() => handleLaunchPlatform('discover')}
              onExploreLabs={() => {
                const el = document.getElementById('opportunities');
                if (el) {
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              onOpenAuth={() => {
                setAuthInitialMode('signin');
                setIsAuthModalOpen(true);
              }}
              isAuthenticated={isAuthenticated}
              userName={user?.fullName || student.fullName}
            />

            <OpportunitiesSection
              professors={liveFaculty}
              student={student}
              onSelectProfessor={(prof) => {
                if (!isAuthenticated) {
                  setAuthInitialMode('signin');
                  setIsAuthModalOpen(true);
                  return;
                }
                handleDraftOutreach(prof);
              }}
              onLaunchPlatform={() => handleLaunchPlatform('discover')}
            />

            <HowItWorksSection
              onLaunchPlatform={() => handleLaunchPlatform('discover')}
            />

            <FellowshipsMarquee
              fellowships={fellowships}
              onLaunchApp={() => handleLaunchPlatform('discover')}
            />

            <PricingSection
              onSelectPlan={(planId) => {
                if (!isAuthenticated) {
                  setAuthInitialMode('register');
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsPricingModalOpen(true);
              }}
            />
          </main>

          <Footer />
        </div>
      )}

      {view === 'intake' && (
        /* STEPPED STUDENT INTAKE & PROFILE FAILURE DIAGNOSTICS */
        <div className="relative z-10 min-h-screen pb-16">
          <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-bg)]/80 backdrop-blur-3xl shadow-sm px-4 sm:px-6 h-14 flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer select-none"
              onClick={() => navigateToView('landing')}
            >
              <AnusandhanLogo size="sm" />
            </div>

            <div className="flex items-center space-x-3">
              <PullChainBulb size="sm" />
              <button
                onClick={() => navigateToView('landing')}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-xl glass-chip transition-colors cursor-pointer"
              >
                ← Return to Home
              </button>
            </div>
          </header>

          <div className="py-8 px-4 max-w-5xl mx-auto">
            <Suspense fallback={<SuspenseSkeleton />}>
              <IntakeDiagnosticFlow
                currentStudent={student}
                onCompleteIntake={(updatedStudent) => {
                  setStudent(updatedStudent);
                  const matched = matchProfessorsForStudent(updatedStudent);
                  if (matched.length > 0) {
                    const newDrafts = matched.slice(0, 3).map(p => generateColdEmail(p, updatedStudent));
                    setDrafts(newDrafts);
                    setActiveDraft(newDrafts[0]);
                  }
                  navigateToView('app', 'discover');
                }}
                onCancel={() => navigateToView('landing')}
              />
            </Suspense>
          </div>
        </div>
      )}

      {view === 'app' && (
        /* INTEGRATED WEB APPLICATION WORKSPACE WITH DEDICATED TABS */
        <div className="relative z-10">
          <AppLayout
            currentTab={currentTab}
            onTabChange={handleTabChange}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenMockInterview={() => setIsMockInterviewOpen(true)}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onBackToLanding={() => navigateToView('landing')}
            student={student}
            followUpDueCount={followUpDueCount}
          >
            {/* Tab 1: Discover Labs & Fellowships (Universal Scope: National & Global) */}
            {currentTab === 'discover' && (
              <OpportunityExplorer
                professors={liveFaculty}
                fellowships={fellowships}
                student={student}
                onDraftOutreach={handleDraftOutreach}
                onApplyFellowship={(prog) => {
                  window.open(prog.applicationPortalUrl || prog.officialUrl, '_blank');
                }}
                onDeconstructPaper={(paperTitle?: string) => {
                  setSelectedDeconstructTitle(paperTitle);
                  navigateToView('app', 'pitch');
                }}
                onStartMockInterview={(prof?: Professor) => {
                  if (prof) {
                    setSelectedInterviewProf({
                      name: prof.name,
                      institution: prof.university,
                      domain: prof.domain,
                      firstQuestion: `Could you explain your methodology on "${prof.recentPaper?.title || prof.researchFocus}", and what challenges you anticipate in scaling this architecture?`
                    });
                  } else {
                    setSelectedInterviewProf(null);
                  }
                  setIsMockInterviewOpen(true);
                }}
                activeSubTab={discoverSubTab}
                onSubTabChange={setDiscoverSubTab}
                selectedStatus={opportunityStatus}
                onStatusChange={setOpportunityStatus}
                selectedScope={opportunityScope}
                onScopeChange={setOpportunityScope}
              />
            )}

            {/* Tab 2: Interactive Real-Time RRS Score Simulator */}
            {currentTab === 'diagnostic' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Research Readiness Score (RRS) Diagnostic Studio</h2>
                    <p className="text-xs text-zinc-400">Simulate how publications, code reproductions, and verified citations calibrate your admission probability.</p>
                  </div>
                  <button
                    onClick={() => setView('intake')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Run Automated Gap Diagnostic
                  </button>
                </div>
                <Suspense fallback={<SuspenseSkeleton />}>
                  <InteractiveRRSStudio onLaunchApp={() => setCurrentTab('discover')} />
                </Suspense>
              </div>
            )}

            {/* Tab 3: Paper-to-Pitch 3-Way Deconstructive Canvas */}
            {currentTab === 'pitch' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-100">Paper-to-Pitch Deconstruction Canvas</h2>
                  <p className="text-xs text-zinc-400">See how raw 2025-2026 ArXiv literature is deconstructed into academic problem framing, student angle, and a 146-word inquiry.</p>
                </div>
                <Suspense fallback={<SuspenseSkeleton />}>
                  <PaperPitchVisualizer
                    initialPaperTitle={selectedDeconstructTitle}
                    onDraftOutreach={(title, body, subject) => {
                      const newDraft: OutreachDraft = {
                        id: `draft-paper-${Date.now()}`,
                        professorId: 'prof_scraped_deconstruct',
                        professorName: 'Lead PI',
                        professorEmail: 'lab-admissions@academic-frontier.edu',
                        university: 'Target Research Institution',
                        paperTitle: title,
                        subjectLine: subject,
                        body: body,
                        status: 'Drafted'
                      };
                      setDrafts(prev => [newDraft, ...prev]);
                      setActiveDraft(newDraft);
                      navigateToView('app', 'outreach');
                    }}
                  />
                </Suspense>
              </div>
            )}

            {/* Tab 4: Student Profile & Credentials Hub */}
            {currentTab === 'profile' && (
              <Suspense fallback={<SuspenseSkeleton />}>
                <StudentProfileHub
                  student={student}
                  onUpdateProfile={setStudent}
                  onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                />
              </Suspense>
            )}

            {/* Tab 5: 146-Word Precision Pitch Composer */}
            {currentTab === 'outreach' && (
              <OutreachComposer
                draft={activeDraft}
                student={student}
                onSendDraft={handleSendDraft}
                onUpdateDraftBody={handleUpdateDraftBody}
                onNavigateToDiscover={() => setCurrentTab('discover')}
              />
            )}

            {/* Tab 6: 7-Day Follow-Up Manager */}
            {currentTab === 'followups' && (
              <FollowUpManager
                drafts={drafts}
                onSendFollowUp={handleSendFollowUp}
                onSimulateTimeJump={handleSimulateTimeJump}
              />
            )}

            {/* Tab 7: Application CRM Kanban */}
            {currentTab === 'crm' && (
              <ApplicationCRM
                drafts={drafts}
                onMoveStatus={handleMoveCrmStatus}
              />
            )}

            {/* Tab 8: Live Activity & Placement Feed */}
            {currentTab === 'livefeed' && (
              <LiveActivityFeed
                feedItems={feedItems}
                onManualRefresh={handleManualFeedRefresh}
              />
            )}

            {/* Mobile Bottom Dock (<768px) */}
            <MobileBottomNav
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              followUpDueCount={followUpDueCount}
            />
          </AppLayout>
        </div>
      )}

      {/* Autonomous Academic Agent Widget (Discrete Bottom-Right Floating Capsule & Pop-up Panel) */}
      <AutonomousAssistantWidget
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onNavigateView={navigateToView}
        student={student}
        onUpdateStudent={setStudent}
        fellowships={fellowships}
        professors={liveFaculty}
        drafts={drafts}
        feedItems={feedItems}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenMockInterview={() => setIsMockInterviewOpen(true)}
        onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
        isOpenExternal={isVoiceModalOpen}
        onCloseExternal={() => setIsVoiceModalOpen(false)}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Global Modals Wrapped in Lazy Suspense Boundaries */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateView={navigateToView}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenMockInterview={() => setIsMockInterviewOpen(true)}
          onOpenPricingModal={() => setIsPricingModalOpen(true)}
          professors={liveFaculty}
          fellowships={fellowships}
          scrapedPostings={scrapedPostings}
          student={student}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authInitialMode}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            navigateToView('app', 'discover');
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MockInterviewModal
          isOpen={isMockInterviewOpen}
          onClose={() => {
            setIsMockInterviewOpen(false);
            setSelectedInterviewProf(null);
          }}
          student={student}
          targetProfessor={selectedInterviewProf}
          onUpdateRrs={(newScore) => {
            setStudent(prev => ({
              ...prev,
              rrsScore: Math.max(prev.rrsScore, newScore)
            }));
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          creditsRemaining={student.creditsRemaining}
          onAddCredits={handleAddCredits}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TokenRewardsModal
          isOpen={isRewardsModalOpen}
          onClose={() => setIsRewardsModalOpen(false)}
          onOpenPricingModal={() => {
            setIsRewardsModalOpen(false);
            setIsPricingModalOpen(true);
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          student={student}
          onSaveProfile={setStudent}
        />
      </Suspense>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;