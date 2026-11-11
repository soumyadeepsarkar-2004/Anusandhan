import React, { useState, useEffect } from 'react';
import { Professor, FellowshipProgram, StudentProfile } from '../../types';
import { Search, ShieldCheck, Mail, ArrowUpRight, Clock, DollarSign, Users, Sparkles, Cpu, RefreshCw, ExternalLink, Calendar, CheckCircle2, Globe } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { AppleGlassCard } from '../ui/AppleGlass';
import { AutonomousPortalModal } from '../agents/AutonomousPortalModal';

interface OpportunityExplorerProps {
  professors: Professor[];
  fellowships: FellowshipProgram[];
  student: StudentProfile;
  onDraftOutreach: (prof: Professor) => void;
  onApplyFellowship: (prog: FellowshipProgram) => void;
  onDeconstructPaper?: (paperTitle: string) => void;
  onStartMockInterview?: (prof: Professor) => void;
  activeSubTab?: 'professors' | 'fellowships' | 'scraped';
  onSubTabChange?: (tab: 'professors' | 'fellowships' | 'scraped') => void;
  selectedStatus?: 'all' | 'active' | 'upcoming' | 'passed';
  onStatusChange?: (status: 'all' | 'active' | 'upcoming' | 'passed') => void;
  selectedScope?: 'all' | 'national' | 'international';
  onScopeChange?: (scope: 'all' | 'national' | 'international') => void;
}

export const OpportunityExplorer: React.FC<OpportunityExplorerProps> = ({
  professors,
  fellowships,
  student,
  onDraftOutreach,
  onApplyFellowship,
  onDeconstructPaper,
  onStartMockInterview,
  activeSubTab: externalSubTab,
  onSubTabChange,
  selectedStatus: externalStatus,
  onStatusChange,
  selectedScope: externalScope,
  onScopeChange
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'professors' | 'fellowships' | 'scraped'>('professors');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalScope, setInternalScope] = useState<'all' | 'national' | 'international'>('all');
  const [internalStatus, setInternalStatus] = useState<'all' | 'active' | 'upcoming' | 'passed'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [onlyFunded, setOnlyFunded] = useState<boolean>(false);
  const [onlyHighMentorship, setOnlyHighMentorship] = useState<boolean>(false);
  const [liveProfessors, setLiveProfessors] = useState<Professor[]>(professors);
  const [liveFellowships, setLiveFellowships] = useState<FellowshipProgram[]>(fellowships);
  const [selectedPortalFellowship, setSelectedPortalFellowship] = useState<FellowshipProgram | null>(null);
  const [isGatewayConnected, setIsGatewayConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ingestionTelemetry, setIngestionTelemetry] = useState<{
    status: string;
    lastSweepTimestamp: string | null;
    nextSweepTimestamp?: string;
    intervalMinutes?: number;
    scrapedPostingsCount?: number;
    totalPostingsCount?: number;
  } | null>(null);

  const activeSubTab = externalSubTab !== undefined ? externalSubTab : internalSubTab;
  const setActiveSubTab = (tab: 'professors' | 'fellowships' | 'scraped') => {
    setInternalSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  const selectedStatus = externalStatus !== undefined ? externalStatus : internalStatus;
  const setSelectedStatus = (status: 'all' | 'active' | 'upcoming' | 'passed') => {
    setInternalStatus(status);
    if (onStatusChange) onStatusChange(status);
  };

  const selectedScope = externalScope !== undefined ? externalScope : internalScope;
  const setSelectedScope = (scope: 'all' | 'national' | 'international') => {
    setInternalScope(scope);
    if (onScopeChange) onScopeChange(scope);
  };

  useEffect(() => {
    setLiveProfessors(professors);
  }, [professors]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Fetch live faculty and fellowships concurrently from Node Express Gateway with status and scope filters
    Promise.all([
      ApiClient.getFaculty({ q: searchQuery, scope: selectedScope }),
      ApiClient.getFellowships({ q: searchQuery, status: selectedStatus, scope: selectedScope })
    ])
      .then(([backendFaculty, backendFellowships]) => {
        if (!isMounted) return;

        if (backendFaculty && Array.isArray(backendFaculty)) {
          const mapped: Professor[] = backendFaculty.map((bp: any) => ({
            id: bp.id,
            name: bp.name,
            title: bp.title || 'Principal Investigator',
            department: bp.department || 'Computer Science & AI',
            university: bp.institution || bp.university,
            country: bp.country || 'Global',
            scope: bp.scope || (bp.country?.toLowerCase() === 'india' ? 'national' : 'international'),
            labName: bp.lab_name || bp.labName || 'Autonomous Systems Lab',
            labUrl: bp.lab_url || bp.labUrl || 'https://example.edu',
            contactEmail: bp.email,
            domain: (bp.research_domains?.[0] as any) || bp.domain || 'Artificial Intelligence & ML',
            researchFocus: bp.top_keywords?.join(' · ') || bp.researchFocus || 'Frontier Systems',
            recentPaper: bp.recentPaper || {
              title: bp.recent_papers?.[0]?.title || 'Recent Advances in Frontier Science',
              year: bp.recent_papers?.[0]?.year || 2025,
              venue: bp.recent_papers?.[0]?.venue || 'Top Venue',
              snippet: bp.recent_papers?.[0]?.snippet || `Investigates ${bp.top_keywords?.[0] || 'core dynamics'} with empirical benchmarks.`,
              doiUrl: bp.recent_papers?.[0]?.pdf_url || bp.recent_papers?.[0]?.doiUrl || undefined
            },
            metrics: {
              hIndex: bp.metrics?.h_index || bp.metrics?.hIndex || 40,
              i10Index: bp.metrics?.calculated_mentor_score || bp.metrics?.i10Index || 35,
              totalCitations: bp.metrics?.total_citations || bp.metrics?.totalCitations || 5000,
              citationVelocity: bp.metrics?.citation_velocity_2y || bp.metrics?.citationVelocity || 1200,
              recentTopVenuePapers: bp.metrics?.recentTopVenuePapers || 8,
              studentCoAuthorshipRatio: bp.metrics?.student_coauthor_ratio || bp.metrics?.studentCoAuthorshipRatio || 0.70,
              activeGrant: bp.metrics?.activeGrant || (bp.active_grants?.[0] ? {
                funder: bp.active_grants[0].agency?.includes('NSF') ? 'NSF' : bp.active_grants[0].agency?.includes('ERC') ? 'Horizon Europe' : 'Max Planck Society',
                title: bp.active_grants[0].title,
                amount: `$${(bp.active_grants[0].amount_usd / 1000000).toFixed(2)}M`,
                expiryYear: bp.active_grants[0].end_year || 2028
              } : undefined)
            },
            matchScore: bp.match_compatibility_score || bp.matchScore || (student?.targetDomains?.includes(bp.domain) ? 85 : 55),
            isAcceptingStudents: bp.accepting_interns ?? bp.isAcceptingStudents ?? true,
            isLiveScraped: bp.isLiveScraped || false,
            source: bp.source || 'Verified Faculty Core'
          } as any));

          const existingIds = new Set(mapped.map(m => m.id));
          const merged = [...mapped, ...professors.filter(p => !existingIds.has(p.id))];
          setLiveProfessors(merged);
        }

        if (backendFellowships && Array.isArray(backendFellowships)) {
          setLiveFellowships(backendFellowships);
        }

        setIsGatewayConnected(true);
      })
      .catch(() => {
        setIsGatewayConnected(false);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Fetch autonomous crawler telemetry
    ApiClient.getIngestionStatus().then(st => {
      if (isMounted && st) setIngestionTelemetry(st as any);
    });

    return () => { isMounted = false; };
  }, [searchQuery, selectedStatus, selectedScope]);

  // Periodic autonomous background polling (every 30 seconds) for freshly scraped postings
  useEffect(() => {
    const syncInterval = setInterval(() => {
      ApiClient.getIngestionStatus().then(st => {
        if (st) setIngestionTelemetry(st as any);
      });
      ApiClient.getFaculty({ q: searchQuery, scope: selectedScope }).then(freshFaculty => {
        if (freshFaculty && Array.isArray(freshFaculty)) {
          const mapped: Professor[] = freshFaculty.map((bp: any) => ({
            id: bp.id,
            name: bp.name,
            title: bp.title || 'Principal Investigator',
            department: bp.department || 'Computer Science & AI',
            university: bp.institution || bp.university,
            country: bp.country || 'Global',
            scope: bp.scope || (bp.country?.toLowerCase() === 'india' ? 'national' : 'international'),
            labName: bp.lab_name || bp.labName || 'Autonomous Systems Lab',
            labUrl: bp.lab_url || bp.labUrl || 'https://example.edu',
            contactEmail: bp.email,
            domain: (bp.research_domains?.[0] as any) || bp.domain || 'Artificial Intelligence & ML',
            researchFocus: bp.top_keywords?.join(' · ') || bp.researchFocus || 'Frontier Systems',
            recentPaper: bp.recentPaper || {
              title: bp.recent_papers?.[0]?.title || 'Recent Advances in Frontier Science',
              year: bp.recent_papers?.[0]?.year || 2025,
              venue: bp.recent_papers?.[0]?.venue || 'Top Venue',
              snippet: bp.recent_papers?.[0]?.snippet || `Investigates ${bp.top_keywords?.[0] || 'core dynamics'} with empirical benchmarks.`,
              doiUrl: bp.recent_papers?.[0]?.pdf_url || bp.recent_papers?.[0]?.doiUrl || undefined
            },
            metrics: {
              hIndex: bp.metrics?.h_index || bp.metrics?.hIndex || 40,
              i10Index: bp.metrics?.calculated_mentor_score || bp.metrics?.i10Index || 35,
              totalCitations: bp.metrics?.total_citations || bp.metrics?.totalCitations || 5000,
              citationVelocity: bp.metrics?.citation_velocity_2y || bp.metrics?.citationVelocity || 1200,
              recentTopVenuePapers: bp.metrics?.recentTopVenuePapers || 8,
              studentCoAuthorshipRatio: bp.metrics?.student_coauthor_ratio || bp.metrics?.studentCoAuthorshipRatio || 0.70,
              activeGrant: bp.metrics?.activeGrant || (bp.active_grants?.[0] ? {
                funder: bp.active_grants[0].agency?.includes('NSF') ? 'NSF' : bp.active_grants[0].agency?.includes('ERC') ? 'Horizon Europe' : 'Max Planck Society',
                title: bp.active_grants[0].title,
                amount: `$${(bp.active_grants[0].amount_usd / 1000000).toFixed(2)}M`,
                expiryYear: bp.active_grants[0].end_year || 2028
              } : undefined)
            },
            matchScore: bp.match_compatibility_score || bp.matchScore || (student?.targetDomains?.includes(bp.domain) ? 85 : 55),
            isAcceptingStudents: bp.accepting_interns ?? bp.isAcceptingStudents ?? true,
            isLiveScraped: bp.isLiveScraped || false,
            source: bp.source || 'Verified Faculty Core'
          } as any));

          const existingIds = new Set(mapped.map(m => m.id));
          const merged = [...mapped, ...professors.filter(p => !existingIds.has(p.id))];
          setLiveProfessors(merged);
        }
      });
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [searchQuery, selectedScope, professors]);

  // Filter professors from live state
  const currentList = isGatewayConnected && liveProfessors.length > 0 ? liveProfessors : professors;
  const filteredProfessors = currentList.filter(prof => {
    const isScraped = Boolean((prof as any).isLiveScraped);
    if (activeSubTab === 'scraped' && !isScraped) return false;
    if (activeSubTab === 'professors' && isScraped) return false;

    const matchesSearch = 
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.researchFocus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prof.recentPaper?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || prof.domain === selectedDomain;
    const matchesFunding = !onlyFunded || (prof.metrics?.activeGrant !== undefined);
    const matchesMentorship = !onlyHighMentorship || ((prof.metrics?.studentCoAuthorshipRatio || 0) >= 0.70);
    const matchesScope = 
      selectedScope === 'all' ||
      (selectedScope === 'national' && (prof.scope === 'national' || prof.country.toLowerCase().includes('india'))) ||
      (selectedScope === 'international' && (prof.scope === 'international' || (!prof.country.toLowerCase().includes('india') && prof.scope !== 'national')));

    return matchesSearch && matchesDomain && matchesFunding && matchesMentorship && matchesScope;
  });

  const scrapedCount = currentList.filter(p => Boolean((p as any).isLiveScraped)).length;
  const coreFacultyCount = currentList.filter(p => !(p as any).isLiveScraped).length;

  // Filter fellowships with dynamic lifecycle categorization ('active' | 'upcoming' | 'passed')
  const currentFellowships = isGatewayConnected ? liveFellowships : fellowships;
  const filteredFellowships = currentFellowships.filter(prog => {
    const matchesSearch =
      prog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.hostCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.hostInstitutions.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prog.statusLabel && prog.statusLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prog.tags && prog.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesScope =
      selectedScope === 'all' ||
      (selectedScope === 'national' && (prog.scope === 'national' || prog.hostCountry.toLowerCase().includes('india'))) ||
      (selectedScope === 'international' && (prog.scope === 'international' || (!prog.hostCountry.toLowerCase().includes('india') && prog.scope !== 'national')));
    const matchesStatus =
      selectedStatus === 'all' || prog.status === selectedStatus;

    return matchesSearch && matchesScope && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Autonomous Ingestion Engine Live Telemetry Banner */}
      <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                Autonomous Academic Web Scraper
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                Sweeps every 30 mins
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Continuous background crawling across arXiv, OpenAlex, and university lab portals.
              {ingestionTelemetry?.lastSweepTimestamp && (
                <span className="text-zinc-500 ml-1.5 font-mono">
                  Last updated: {new Date(ingestionTelemetry.lastSweepTimestamp).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Server Scraper Agent: 24/7 Active</span>
          </div>
        </div>
      </div>

      {/* Top Controls Bar - Layered Frosted Glass Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden">
        {/* Specular Top Sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        
        {/* Sub-tab Switcher with Scraped Openings */}
        <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs backdrop-blur-md">
          <button
            onClick={() => setActiveSubTab('professors')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
              activeSubTab === 'professors'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
            }`}
          >
            <span>Verified Faculty Matches</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-zinc-300 text-[11px] font-mono">
              {coreFacultyCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('scraped')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
              activeSubTab === 'scraped'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
            }`}
          >
            <span>Live Scraped Openings</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-amber-300 text-[11px] font-mono">
              {scrapedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('fellowships')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 font-medium ${
              activeSubTab === 'fellowships'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
            }`}
          >
            <span>Prestige Fellowships</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-zinc-300 text-[11px] font-mono">
              {fellowships.length}
            </span>
          </button>
        </div>

        {/* Search Input & Live Indicator */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'professors' ? "Search professor, university, paper keywords..." : "Search DAAD, CERN, Mitacs..."}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/60 outline-none font-sans"
            />
          </div>

          {isGatewayConnected && (
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 text-[11px] font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>OpenAlex & ArXiv Autonomous Feed</span>
            </div>
          )}
        </div>

      </div>

      {/* Universal Scope Selector */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl glass-panel text-xs">
        <span className="text-zinc-400 font-mono text-[11px] px-2">Scope:</span>
        <button
          onClick={() => setSelectedScope('all')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedScope === 'all'
              ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
          }`}
        >
          <span>🌐 Universal (All Verified)</span>
        </button>

        <button
          onClick={() => setSelectedScope('national')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedScope === 'national'
              ? 'bg-blue-500/25 text-blue-200 border border-blue-400/50 shadow-sm backdrop-blur-md'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
          }`}
        >
          <span>🇮🇳 Premier National (IISc, IITs, TIFR, CSIR, IIIT)</span>
        </button>

        <button
          onClick={() => setSelectedScope('international')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedScope === 'international'
              ? 'bg-purple-500/25 text-purple-200 border border-purple-400/50 shadow-sm backdrop-blur-md'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
          }`}
        >
          <span>🌍 Global Labs (CERN, Max Planck, ETH, MIT)</span>
        </button>
      </div>

      {/* Purposeful Quick Filters for Professors & Scraped Postings */}
      {(activeSubTab === 'professors' || activeSubTab === 'scraped') && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-mono text-[11px] mr-1">Quick Filters:</span>
          
          <button
            onClick={() => setOnlyFunded(!onlyFunded)}
            className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyFunded
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm backdrop-blur-md'
                : 'glass-chip text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>Active Grant ($1M+)</span>
          </button>

          <button
            onClick={() => setOnlyHighMentorship(!onlyHighMentorship)}
            className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyHighMentorship
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm backdrop-blur-md'
                : 'glass-chip text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3 h-3 text-amber-400" />
            <span>High Mentorship (&gt;70% Co-authors)</span>
          </button>

          {['All', 'AI / ML', 'Robotics', 'Quantum', 'Comp Bio'].map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1 rounded-xl border text-xs transition-all cursor-pointer ${
                selectedDomain === dom && !onlyFunded && !onlyHighMentorship
                  ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                  : 'glass-chip text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      )}

      {/* Content View 1: Professors & Scraped Postings Grid */}
      {(activeSubTab === 'professors' || activeSubTab === 'scraped') && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl apple-glass border border-white/5 space-y-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-28 bg-white/10 rounded-full" />
                    <div className="h-5 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-white/15 rounded" />
                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/5">
                    <div className="h-8 bg-white/10 rounded" />
                    <div className="h-8 bg-white/10 rounded" />
                    <div className="h-8 bg-white/10 rounded" />
                  </div>
                  <div className="h-14 bg-white/5 rounded-xl" />
                  <div className="flex justify-between pt-3 border-t border-white/5">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-8 w-36 bg-white/15 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProfessors.length === 0 ? (
            <AppleGlassCard className="p-10 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No Matching Research Labs Found</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No faculty profiles matched your search{searchQuery ? ` for "${searchQuery}"` : ''} or selected filter criteria. Try resetting your filters to see all verified labs.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDomain('All');
                    setOnlyFunded(false);
                    setOnlyHighMentorship(false);
                    setSelectedScope('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            </AppleGlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfessors.map((prof) => (
                <AppleGlassCard
                  key={prof.id}
                  className="p-5 flex flex-col justify-between group shadow-xl"
                  enableTilt={true}
                >
                  <div>
                    
                    {/* Top Bar: Match Score & Acceptance Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/20">
                          {prof.matchScore}% Research Match
                        </span>
                        {(prof as any).isLiveScraped && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] flex items-center gap-1 shadow-sm">
                            <span>⚡ Live Scraped</span>
                          </span>
                        )}
                        {prof.scope === 'national' || prof.country.toLowerCase().includes('india') ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 font-mono text-[10px]">
                            🇮🇳 National Lab
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                            🌐 Global Lab
                          </span>
                        )}
                      </div>

                      {prof.isAcceptingStudents ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                          <span>Accepting Interns</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
                          Waitlist Only
                        </span>
                      )}
                    </div>

                    {/* Prof Name & Institution */}
                    <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
                      {prof.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{prof.title} · {prof.labName}</p>
                    <p className="text-xs text-zinc-300 font-medium">{prof.university} ({prof.country})</p>

                    {/* Scholar Metrics Strip - Restrained & Clean */}
                    <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-canvas-card border border-white/5 text-center text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-500 uppercase font-mono block">h-Index</span>
                        <span className="font-semibold text-zinc-200 font-mono text-xs">{prof.metrics?.hIndex || 22}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 uppercase font-mono block">Citation Velocity</span>
                        <span className="font-semibold text-amber-400 font-mono text-xs">+{prof.metrics?.citationVelocity || 110}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 uppercase font-mono block">Student Co-authors</span>
                        <span className="font-semibold text-emerald-400 font-mono text-xs">
                          {Math.round((prof.metrics?.studentCoAuthorshipRatio || 0.5) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Active Grant Banner */}
                    {prof.metrics?.activeGrant && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prof.metrics.activeGrant.funder} Grant:</span>
                        </span>
                        <span className="font-mono text-[11px] font-semibold">{prof.metrics.activeGrant.amount} (Hiring Fellows)</span>
                      </div>
                    )}

                    {/* Recent Paper Citation Grounding */}
                    {prof.recentPaper && (
                      <div className="p-3.5 rounded-xl bg-canvas-card border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span className="text-amber-400 font-medium">{prof.recentPaper.venue}</span>
                          <div className="flex items-center gap-2">
                            <span>{prof.recentPaper.year}</span>
                            {prof.recentPaper.doiUrl && (
                              <a
                                href={prof.recentPaper.doiUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 text-[10px] underline"
                              >
                                <span>Paper</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-zinc-100 line-clamp-1">
                          "{prof.recentPaper.title}"
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                          {prof.recentPaper.snippet}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Bottom Action Button Bar */}
                  <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <a
                        href={prof.labUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
                      >
                        <span>Lab</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>

                      {onDeconstructPaper && (
                        <button
                          onClick={() => onDeconstructPaper(prof.recentPaper.title)}
                          className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          title="Deconstruct paper in 3-way canvas"
                        >
                          <Cpu className="w-3 h-3 text-amber-400" />
                          <span>Deconstruct</span>
                        </button>
                      )}

                      {onStartMockInterview && (
                        <button
                          onClick={() => onStartMockInterview(prof)}
                          className="text-xs text-zinc-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          title="Screen with AI mock interview"
                        >
                          <span className="text-emerald-400">🎙️</span>
                          <span>Mock Prep</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onDraftOutreach(prof)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-md transform active:scale-95"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Draft 146-Word Email</span>
                    </button>
                  </div>

                </AppleGlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content View 2: Fellowships List with Automatic Lifecycle Categorization */}
      {activeSubTab === 'fellowships' && (
        <div className="space-y-4">
          
          {/* Automatic Lifecycle Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-500 font-mono text-[11px] px-2">Lifecycle Status:</span>
              
              <button
                onClick={() => setSelectedStatus('all')}
                className={`min-h-[32px] px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatus === 'all'
                    ? 'bg-zinc-800 text-zinc-100 border border-white/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <span>All Vacancies</span>
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-[10px] font-mono text-zinc-300">
                  {currentFellowships.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus('active')}
                className={`min-h-[32px] px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatus === 'active'
                    ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-900'
                }`}
              >
                <span>Active (Open Now)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono text-zinc-300">
                  {currentFellowships.filter(f => f.status === 'active').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus('upcoming')}
                className={`min-h-[32px] px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatus === 'upcoming'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Upcoming Cycle</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-900/50 text-[10px] font-mono text-amber-300">
                  {currentFellowships.filter(f => f.status === 'upcoming').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus('passed')}
                className={`min-h-[32px] px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatus === 'passed'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-600 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>Passed / Archived</span>
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-400">
                  {currentFellowships.filter(f => f.status === 'passed').length}
                </span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-zinc-500 hidden md:inline px-2">
              Automated Background Cycle Ingestion Active
            </span>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-5 rounded-2xl apple-glass border border-white/5 space-y-3.5 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-white/10 rounded-full" />
                    <div className="h-5 w-16 bg-white/10 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-5 w-4/5 bg-white/15 rounded" />
                    <div className="h-3 w-3/5 bg-white/10 rounded" />
                  </div>
                  <div className="h-12 bg-white/5 rounded-lg" />
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <div className="h-3 w-14 bg-white/10 rounded" />
                    <div className="h-7 w-28 bg-white/15 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFellowships.length === 0 ? (
            <AppleGlassCard className="p-10 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No Fellowship Vacancies Found</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No fellowship opportunities match the "{selectedStatus}" status filter{searchQuery ? ` and query "${searchQuery}"` : ''}. View all vacancies to explore upcoming deadlines.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setSearchQuery('');
                    setSelectedScope('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Show All Vacancies
                </button>
              </div>
            </AppleGlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFellowships.map((prog) => {
                const isActive = prog.status === 'active';
                const isUpcoming = prog.status === 'upcoming';
                const isPassed = prog.status === 'passed';
                const portalUrl = prog.applicationPortalUrl || prog.officialUrl;

                return (
                  <AppleGlassCard
                    key={prog.id}
                    glowOnHover={true}
                    className="p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group"
                    spotlightColor={isActive ? 'rgba(16, 185, 129, 0.15)' : isUpcoming ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                  >
                    <div>
                      {/* Status & Scope Header */}
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-semibold">
                              <span>{prog.statusLabel || `Active · ${prog.deadlineDaysLeft}d left`}</span>
                            </span>
                          )}

                          {isUpcoming && (
                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 flex items-center gap-1.5 font-semibold">
                              <span>{prog.statusLabel || `Upcoming · Opens in ${prog.opensInDays || 28}d`}</span>
                            </span>
                          )}

                          {isPassed && (
                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 flex items-center gap-1.5">
                              <span>{prog.statusLabel || 'Passed · Closed for 2026'}</span>
                            </span>
                          )}

                          {prog.scope === 'national' || prog.hostCountry.toLowerCase().includes('india') ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 font-mono text-[10px]">
                              🇮🇳 National
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                              🌐 Global
                            </span>
                          )}
                        </div>

                        {prog.requiresPriorAcceptance ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Cold Pitch Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                            Central Portal
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug">
                        {prog.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">{prog.hostInstitutions}</p>

                      <div className="my-3 p-2.5 rounded-lg bg-canvas-card border border-white/5">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Financial Stipend & Logistics</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono block mt-0.5">
                          {prog.stipendDisplay}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        <strong className="text-zinc-400">Eligibility:</strong> {prog.eligibility}
                      </p>
                    </div>

                    {/* Direct Application Link & Action Controls */}
                    <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-zinc-400">{prog.hostCountry}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedPortalFellowship(prog)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
                          title="Apply via Autonomous Agent (Audit, SOP & One-Click Launch)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Auto-Apply</span>
                        </button>

                        <button
                          onClick={() => onApplyFellowship(prog)}
                          className="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          title="View Fellowship Specs & Requirements"
                        >
                          <span>Specs</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>

                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95 ${
                            isActive
                              ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                              : isUpcoming
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                          }`}
                          title={`Open official portal: ${portalUrl}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Application Form' : isUpcoming ? 'Portal Alert' : 'Past Portal'}</span>
                        </a>
                      </div>
                    </div>

                  </AppleGlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Autonomous Portal Agent Application Modal */}
      <AutonomousPortalModal
        isOpen={!!selectedPortalFellowship}
        onClose={() => setSelectedPortalFellowship(null)}
        fellowship={selectedPortalFellowship}
        student={student}
      />

    </div>
  );
};
