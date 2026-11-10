export type ResearchDomain = 
  | 'Artificial Intelligence & ML'
  | 'Quantum Computing & Information'
  | 'Computational Biology & Genomics'
  | 'Robotics & Autonomous Systems'
  | 'Clean Energy & Materials Science'
  | 'Neuroscience & Brain-Computer Interfaces'
  | 'High Energy & Theoretical Physics'
  | 'Cybersecurity & Distributed Systems'
  | 'Arts & Humanities'
  | 'Commerce & Economics'
  | 'Natural & Physical Sciences'
  | 'Social Sciences & Law'
  | 'Management & Public Policy';

export type OpportunityStatus = 'active' | 'upcoming' | 'passed';

export interface FellowshipProgram {
  id: string;
  name: string;
  hostCountry: string;
  hostInstitutions: string;
  scope?: 'national' | 'international';
  stipendDisplay: string;
  monthlyAllowanceEuro?: number;
  durationWeeks: number;
  deadlineDisplay: string;
  deadlineDaysLeft: number;
  eligibility: string;
  requiresPriorAcceptance: boolean; // True for DAAD WISE, Charpak; False for Mitacs, CERN
  officialUrl: string;
  applicationPortalUrl?: string; // Direct link to official application form or portal vacancy
  status?: OpportunityStatus; // 'active' | 'upcoming' | 'passed'
  statusLabel?: string; // Formatted status e.g. "Active · 28d left", "Upcoming · Opens Jan 15", "Passed · Closed"
  opensInDays?: number;
  openDate?: string;
  targetDeadline?: string;
  lastVerifiedAt?: string;
  tags: string[];
  featured: boolean;
}

export interface ScholarMetrics {
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  citationVelocity: number; // 2-year velocity
  recentTopVenuePapers: number; // 3-year count
  studentCoAuthorshipRatio: number; // 0.0 - 1.0 (how often students are 1st author)
  activeGrant?: {
    funder: string;
    title: string;
    amount: string;
    expiryYear: number;
  };
}

export interface Professor {
  id: string;
  name: string;
  title: string;
  department: string;
  university: string;
  country: string;
  scope?: 'national' | 'international' | 'global' | 'remote';
  labName: string;
  labUrl: string;
  contactEmail: string;
  domain: ResearchDomain;
  researchFocus: string;
  recentPaper: {
    title: string;
    year: number;
    venue: string; // e.g., NeurIPS, Nature, ICML, CVPR, Phys. Rev. Lett.
    snippet: string;
    doiUrl?: string;
  };
  metrics: ScholarMetrics;
  matchScore: number; // 0 - 100 affinity with active student
  isAcceptingStudents: boolean;
}

export interface RRSBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'code' | 'paper' | 'model' | 'trust';
}

export interface UserApiKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  groqApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
}

export interface StudentProfile {
  fullName: string;
  email: string;
  university: string;
  degreeLevel: 'B.Tech / B.S.' | 'Dual Degree / M.Tech / M.S.' | 'Pre-Doctoral' | 'Other';
  currentYear: string;
  cgpa: number; // on 10 or 4 scale
  targetDomains: ResearchDomain[];
  targetCountries: string[];
  skills: string[];
  
  // Linked Scholar Footprint
  linkedAccounts: {
    githubUrl?: string;
    googleScholarUrl?: string;
    orcidId?: string;
    huggingFaceUrl?: string;
    arxivAuthorId?: string;
    linkedinUrl?: string;
  };

  // Bring-Your-Own-Key (BYOK) Foundation Model Keys
  userApiKeys?: UserApiKeys;

  // Proof-of-work project summary
  featuredProject: {
    title: string;
    description: string;
    techStack: string[];
    repoUrl?: string;
  };

  // Gamified Research Readiness Score (0 - 100)
  rrsScore: number;
  rrsTier: 'Explorer' | 'Scholar Apprentice' | 'Junior Researcher' | 'Lab-Ready Fellow' | 'Distinguished Candidate';
  rrsPillars: {
    codeExecution: number;      // max 25
    researchMethodology: number;// max 25
    academicFoundations: number;// max 20
    labTooling: number;         // max 15
    professionalism: number;    // max 15
  };
  badges: RRSBadge[];
  creditsRemaining: number;
  dailyOutreachCount: number; // For anti-burnout pacing
}

export interface OutreachDraft {
  id: string;
  professorId: string;
  professorName: string;
  professorEmail: string;
  university: string;
  paperTitle: string;
  subjectLine: string;
  body: string;
  status: 'Drafted' | 'Queued' | 'Sent' | 'Opened' | 'Replied' | 'Interview Scheduled' | 'Follow-up Due';
  sentAt?: string;
  daysSinceSent?: number;
  followUpBumpDraft?: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  type: 'email_opened' | 'paper_alert' | 'deadline_alert' | 'professor_reply' | 'grant_alert';
  title: string;
  description: string;
  badgeText: string;
  badgeColor: 'emerald' | 'amber' | 'cyan' | 'purple';
}

export type VoiceEngineType = 'web-speech' | 'sarvam' | 'google-live';

export type AgentModelId = 
  | 'deepseek-r1'
  | 'qwen-2.5-coder'
  | 'llama-3-70b'
  | 'mistral-nemo'
  | 'gemma-2-9b'
  | 'local-academic'
  | 'gemini-flash'
  | 'gemini-flash-lite';

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  language: 'Hinglish' | 'Hindi' | 'English' | 'Bengali';
  timestamp: string;
  audioPlaying?: boolean;
  action?: string;
  audioBase64?: string;
  modelUsed?: string;
  opportunityLinks?: Array<{ name: string; url: string; status: string }>;
}
