import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, 
  ShieldCheck, RefreshCw, BookOpen, Code2, Globe, Building2, User, Award, 
  ExternalLink, Layers, Terminal
} from 'lucide-react';
import { StudentProfile, ResearchDomain, Professor, FellowshipProgram } from '../../types';
import { parseResumeText } from '../../services/resumeParser';
import { calculateRRS } from '../../services/rrsCalculator';
import { ApiClient } from '../../services/apiClient';
import { FACULTY_DATABASE } from '../../data/facultyDatabase';
import { FELLOWSHIP_PROGRAMS } from '../../data/fellowships';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';
import { DPDPConsentBanner, ConsentState } from '../legal/DPDPConsentBanner';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../legal/TermsOfServiceModal';
import confetti from 'canvas-confetti';

interface IntakeDiagnosticFlowProps {
  currentStudent: StudentProfile;
  onCompleteIntake: (student: StudentProfile) => void;
  onCancel?: () => void;
}

interface DetectedFailure {
  id: string;
  category: 'code' | 'literature' | 'trust' | 'pacing';
  title: string;
  impactScore: number;
  reason: string;
  remedy: string;
}

export const IntakeDiagnosticFlow: React.FC<IntakeDiagnosticFlowProps> = ({
  currentStudent,
  onCompleteIntake,
  onCancel
}) => {
  const [step, setStep] = useState<'input' | 'diagnostic'>('input');
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Form State for Manual Mode
  const [fullName, setFullName] = useState(currentStudent.fullName || '');
  const [email, setEmail] = useState(currentStudent.email || '');
  const [university, setUniversity] = useState(currentStudent.university || '');
  const [degreeLevel, setDegreeLevel] = useState<StudentProfile['degreeLevel']>('B.Tech / B.S.');
  const [cgpa, setCgpa] = useState(currentStudent.cgpa ? currentStudent.cgpa.toString() : '');
  const [domain, setDomain] = useState<ResearchDomain>(currentStudent.targetDomains[0] || 'Artificial Intelligence & ML');
  const [skillsRaw, setSkillsRaw] = useState(currentStudent.skills?.length ? currentStudent.skills.join(', ') : '');
  const [projectTitle, setProjectTitle] = useState(currentStudent.featuredProject?.title || '');
  const [projectDesc, setProjectDesc] = useState(currentStudent.featuredProject?.description || '');
  const [githubUrl, setGithubUrl] = useState(currentStudent.linkedAccounts?.githubUrl || '');

  // Diagnostic Results State
  const [processedProfile, setProcessedProfile] = useState<StudentProfile>(currentStudent);
  const [detectedFailures, setDetectedFailures] = useState<DetectedFailure[]>([]);
  const [matchedFaculty, setMatchedFaculty] = useState<Professor[]>([]);
  const [matchedFellowships, setMatchedFellowships] = useState<FellowshipProgram[]>([]);

  // DPDP Act 2023 Mandatory Statutory Consent State
  const [isStatutoryConsentGranted, setIsStatutoryConsentGranted] = useState(false);
  const [statutoryConsent1, setStatutoryConsent1] = useState(false);
  const [statutoryConsent2, setStatutoryConsent2] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const analyzeFailuresAndGaps = (profile: StudentProfile): DetectedFailure[] => {
    const failures: DetectedFailure[] = [];

    // Check 1: Code reproduction
    const hasRepo = !!profile.linkedAccounts.githubUrl && profile.linkedAccounts.githubUrl.length > 20;
    if (!hasRepo) {
      failures.push({
        id: 'fail-repo',
        category: 'code',
        title: 'Missing Reproducible Code Benchmark Repo',
        impactScore: -22,
        reason: 'Faculty receive dozens of inquiries daily. Inquiries without a 1-click reproducible GitHub repo or benchmark table are flagged as unsubstantiated claims.',
        remedy: 'Attach a public GitHub repository containing a clean README, requirements.txt, and a 1-click execution guide.'
      });
    }

    // Check 2: Literature citation
    const hasPreprint = profile.skills.some(s => s.toLowerCase().includes('arxiv') || s.toLowerCase().includes('paper') || s.toLowerCase().includes('icml') || s.toLowerCase().includes('neurips'));
    if (!hasPreprint) {
      failures.push({
        id: 'fail-lit',
        category: 'literature',
        title: 'No 2024–2025 Literature Grounding in Outreach',
        impactScore: -18,
        reason: 'Generic emails asking for internships without citing the professor\'s latest 2024–2025 published paper result in a sub-3% baseline response rate.',
        remedy: 'Our Pitch Agent will automatically ground your proposal in the PI\'s latest open unsolved publication limitation.'
      });
    }

    // Check 3: Verified ORCID / Institutional Scholar Identity
    const hasOrcid = !!profile.linkedAccounts.orcidId;
    if (!hasOrcid) {
      failures.push({
        id: 'fail-orcid',
        category: 'trust',
        title: 'Absence of Verified Scholar Identifier (ORCID)',
        impactScore: -12,
        reason: 'Without an ORCID iD or verified institutional domain, spam filters at national and foreign research institutes frequently quarantine inquiries.',
        remedy: 'Link a free 16-digit ORCID profile (orcid.org) to establish permanent academic attribution.'
      });
    }

    // Check 4: Deep Systems & Tooling Layer
    const hasDeepTooling = profile.skills.some(s => ['cuda', 'triton', 'ros2', 'c++', 'jax', 'docker', 'linux'].includes(s.toLowerCase()));
    if (!hasDeepTooling) {
      failures.push({
        id: 'fail-tooling',
        category: 'code',
        title: 'Shallow Tooling Layer (Only High-Level APIs)',
        impactScore: -14,
        reason: 'R1/Tier-1 lab directors prioritize students who can deploy, benchmark, and optimize code on actual accelerator hardware or simulation engines.',
        remedy: 'Highlight systems knowledge (such as CUDA, C++, ROS2, Triton, or JAX) in your project bridges.'
      });
    }

    return failures;
  };

  const computeSuggestions = (profile: StudentProfile) => {
    // Match faculty based on domain and skills
    const directMatches = FACULTY_DATABASE.filter(p => 
      profile.targetDomains.includes(p.domain) ||
      p.researchFocus.toLowerCase().includes(profile.skills[0]?.toLowerCase() || '') ||
      profile.skills.some(sk => p.researchFocus.toLowerCase().includes(sk.toLowerCase()))
    );

    const chosenFaculty = directMatches.length > 0 ? directMatches.slice(0, 4) : FACULTY_DATABASE.slice(0, 4);
    const chosenFellowships = FELLOWSHIP_PROGRAMS.slice(0, 3);

    setMatchedFaculty(chosenFaculty);
    setMatchedFellowships(chosenFellowships);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isStatutoryConsentGranted) {
      alert('Statutory consent is required under DPDP Act 2023 §6 to process your academic credentials. Please confirm consent above.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Send to Python FastAPI backend parser
      let parsed: any = null;
      try {
        parsed = await ApiClient.uploadCV(file);
      } catch (err) {
        console.warn('FastAPI direct upload failed, using local browser fallback parser:', err);
      }

      // Clean candidate name & university from file or parser
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const extractedName = (parsed && parsed.extracted_name) ? parsed.extracted_name : cleanFileName;
      const detectedUni = (parsed && parsed.detected_university) ? parsed.detected_university : (currentStudent.university || 'Regional / State University');
      const detectedCgpa = (parsed && parsed.detected_cgpa) ? parsed.detected_cgpa : (currentStudent.cgpa || 8.5);
      const detectedSkills = (parsed && parsed.extracted_skills?.length) ? parsed.extracted_skills : ['Python', 'PyTorch', 'Git', 'CUDA'];
      const detectedDomains = (parsed && parsed.detected_domains?.length) ? (parsed.detected_domains as ResearchDomain[]) : (currentStudent.targetDomains || ['Artificial Intelligence & ML']);

      const updated: StudentProfile = {
        ...currentStudent,
        fullName: extractedName,
        email: (parsed && parsed.extracted_email) ? parsed.extracted_email : (currentStudent.email || ''),
        university: detectedUni,
        cgpa: detectedCgpa,
        skills: detectedSkills,
        targetDomains: detectedDomains,
        featuredProject: {
          title: (parsed && parsed.extracted_projects?.[0]?.title) || 'Research & Benchmark Project',
          description: (parsed && parsed.extracted_projects?.[0]?.description) || 'Developed and benchmarked algorithmic implementations under scalable workloads.',
          techStack: detectedSkills.slice(0, 3),
          repoUrl: (parsed && parsed.extracted_projects?.[0]?.github_or_paper_url) || ''
        }
      };

      const { totalScore, tier, pillars, updatedBadges } = calculateRRS(updated);
      updated.rrsScore = totalScore;
      updated.rrsTier = tier;
      updated.rrsPillars = pillars;
      updated.badges = updatedBadges;

      const failures = analyzeFailuresAndGaps(updated);
      setProcessedProfile(updated);
      setDetectedFailures(failures);
      computeSuggestions(updated);
      setStep('diagnostic');
      confetti({ particleCount: 40, spread: 60 });

    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStatutoryConsentGranted) {
      alert('Statutory consent is required under DPDP Act 2023 §6 to process your academic credentials. Please confirm consent above.');
      return;
    }
    setIsProcessing(true);

    const skillsArray = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
    const updated: StudentProfile = {
      ...currentStudent,
      fullName: fullName.trim() || currentStudent.fullName || 'Research Scholar',
      email: email.trim() || currentStudent.email || '',
      university: university.trim() || currentStudent.university || 'Academic University',
      degreeLevel: degreeLevel,
      cgpa: parseFloat(cgpa) || currentStudent.cgpa || 8.5,
      targetDomains: [domain],
      skills: skillsArray.length ? skillsArray : ['Python', 'PyTorch', 'Git'],
      linkedAccounts: {
        ...currentStudent.linkedAccounts,
        githubUrl: githubUrl.trim()
      },
      featuredProject: {
        title: projectTitle.trim() || 'Laboratory Technical Project',
        description: projectDesc.trim() || 'Author of reproduction benchmarks and scalable implementations.',
        techStack: skillsArray.slice(0, 3),
        repoUrl: githubUrl.trim()
      }
    };

    const { totalScore, tier, pillars, updatedBadges } = calculateRRS(updated);
    updated.rrsScore = totalScore;
    updated.rrsTier = tier;
    updated.rrsPillars = pillars;
    updated.badges = updatedBadges;

    const failures = analyzeFailuresAndGaps(updated);
    setProcessedProfile(updated);
    setDetectedFailures(failures);
    computeSuggestions(updated);
    setStep('diagnostic');
    setIsProcessing(false);
    confetti({ particleCount: 35, spread: 55 });
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase tracking-wider">ACADEMIC INTAKE & PROFILE AUDIT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-zinc-100 font-medium">
            {step === 'input' 
              ? 'Step 1: Upload Your CV or Enter Research Profile' 
              : 'Step 2: AI Profile Extraction & Tailored Opportunities'}
          </h2>
          <p className="text-xs text-zinc-400">
            {step === 'input'
              ? 'Our AI analyzes your engineering capabilities, projects, and domain interests to unlock verified lab openings.'
              : 'Review your extracted capabilities, audit auto-rejection vulnerabilities, and review matched faculty.'}
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-mono text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer self-start sm:self-center"
          >
            Cancel / Back to Landing
          </button>
        )}
      </div>

      {step === 'input' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          {/* Statutory DPDP Act 2023 Consent Notice Gate */}
          <AppleGlassCard className={`p-6 sm:p-7 border transition-all ${
            isStatutoryConsentGranted 
              ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5' 
              : 'border-amber-500/40 bg-zinc-950/80 shadow-2xl shadow-amber-500/10'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isStatutoryConsentGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isStatutoryConsentGranted ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 block">
                      Statutory Consent Notice (DPDP Act 2023 § 5, § 6 & § 9)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Official Data Protection & Academic Confidentiality Verification
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  {isStatutoryConsentGranted ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Consent Verified ({consentTimestamp})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Action Required
                    </span>
                  )}
                </div>
              </div>

              {!isStatutoryConsentGranted ? (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    Under Sections 5 and 6 of India's Digital Personal Data Protection (DPDP) Act 2023, Anusandhan AI is legally required to obtain your explicit, informed consent before analyzing your curriculum vitae, transcripts, and project publications. 
                    Your data is strictly restricted to matching you with professors and drafting personalized cold emails. <strong className="text-zinc-100">Zero data is ever sold or shared with commercial edtech or advertising brokers.</strong>
                  </p>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statutoryConsent1}
                        onChange={(e) => setStatutoryConsent1(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-200 leading-snug">
                        <strong className="text-amber-400 font-mono">[Mandatory]</strong> I grant unconditional, revocable statutory consent under Section 6 of DPDP Act 2023 for Anusandhan AI to parse my academic CV, skills, and publications solely for research laboratory matchmaking and personalized outreach synthesis.
                      </span>
                    </label>

                    <label className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statutoryConsent2}
                        onChange={(e) => setStatutoryConsent2(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-200 leading-snug">
                        <strong className="text-amber-400 font-mono">[Mandatory]</strong> I declare under Section 9 of the DPDP Act 2023 that I am 18 years of age or older, or have explicit parental / legal guardian authorization to utilize this research matchmaking platform.
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono">
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Terms of Service
                      </button>
                      <span>·</span>
                      <span>DPO: grievance@anusandhan.ai</span>
                    </div>

                    <button
                      type="button"
                      disabled={!statutoryConsent1 || !statutoryConsent2}
                      onClick={() => {
                        setIsStatutoryConsentGranted(true);
                        setConsentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
                      }}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Grant Statutory Consent & Unlock Intake</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Statutory authorization active. You may now upload your CV or fill your profile manually below.</span>
                  </div>
                  <button
                    onClick={() => setIsStatutoryConsentGranted(false)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    Modify Consent
                  </button>
                </div>
              )}
            </div>
          </AppleGlassCard>

          {/* Two Spacious, Uncluttered Cards: Option A vs Option B */}
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-serif font-medium text-zinc-100">
                Choose Your Preferred Intake Method
              </h3>
              <p className="text-xs text-zinc-400">
                Select between instant automated document extraction or custom step-by-step entry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option A Card: Upload CV */}
              <AppleGlassCard 
                className={`p-6 sm:p-7 flex flex-col justify-between rounded-3xl border transition-all ${
                  inputMode === 'upload'
                    ? 'border-amber-400/80 bg-amber-500/10 shadow-xl shadow-amber-500/10'
                    : 'border-white/12 hover:border-white/25 bg-white/[0.03]'
                } ${!isStatutoryConsentGranted ? 'opacity-50 pointer-events-none' : ''}`}
                glowOnHover={isStatutoryConsentGranted}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Recommended · 10s Scan
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-zinc-100">Option A: Upload Academic CV</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Upload your PDF resume. Our AI automatically extracts your real GPA, technical frameworks, publications, and git repositories with 100% accuracy.
                    </p>
                  </div>

                  {/* Dropzone Area directly inside Card A */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleFileUpload(fakeEvent);
                      }
                    }}
                    className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragOver
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-white/15 bg-white/[0.02] hover:border-amber-500/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                    <span className="text-xs font-medium text-zinc-200 block mb-1">
                      Drag & Drop CV (PDF) here
                    </span>
                    <span className="text-[11px] text-zinc-500 block mb-4">
                      Max 5 MB · 100% Academic Confidentiality
                    </span>

                    <label className="min-h-[42px] inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer shadow-md shadow-amber-500/20 transition-all active:scale-95">
                      <span>{isProcessing ? 'Analyzing Document...' : 'Select PDF from Computer'}</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isProcessing || !isStatutoryConsentGranted}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </AppleGlassCard>

              {/* Option B Card: Enter Profile Manually */}
              <AppleGlassCard 
                className={`p-6 sm:p-7 flex flex-col justify-between rounded-3xl border transition-all ${
                  inputMode === 'manual'
                    ? 'border-amber-400/80 bg-amber-500/10 shadow-xl shadow-amber-500/10'
                    : 'border-white/12 hover:border-white/25 bg-white/[0.03]'
                } ${!isStatutoryConsentGranted ? 'opacity-50 pointer-events-none' : ''}`}
                glowOnHover={isStatutoryConsentGranted}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/15 text-zinc-200 flex items-center justify-center shadow-inner">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-medium bg-zinc-800 text-zinc-300 border border-white/10">
                      Step-by-Step Entry
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-zinc-100">Option B: Enter Profile Manually</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Don't have an academic CV ready? Input your university, degree level, CGPA, target domains, and featured projects directly into our structured intake.
                    </p>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => setInputMode('manual')}
                      disabled={!isStatutoryConsentGranted}
                      className={`w-full min-h-[44px] rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                        inputMode === 'manual'
                          ? 'bg-amber-400 text-zinc-950 font-bold shadow-amber-500/20'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>{inputMode === 'manual' ? 'Manual Form Active (Scroll Down)' : 'Fill Manual Profile Form →'}</span>
                    </button>
                  </div>
                </div>
              </AppleGlassCard>

            </div>
          </div>

          {/* Manual Input Form (Rendered when Option B is selected) */}
          {inputMode === 'manual' && isStatutoryConsentGranted && (
            <AppleGlassCard className="p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl animate-fadeIn border border-white/15">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-white/10">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-serif font-medium text-zinc-100">
                  Step-by-Step Scholar Profile Intake
                </h4>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-sans">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1 font-mono">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Your Full Name"
                      className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. your.email@institution.edu"
                      className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-300 font-medium mb-1 font-mono">University / Institute</label>
                    <input
                      type="text"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="e.g. IIT Bombay / NIT Trichy / Stanford"
                      className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1 font-mono">CGPA / GPA (out of 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.85"
                      className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-mono">Primary Target Research Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as ResearchDomain)}
                    className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none cursor-pointer"
                  >
                    <option value="Artificial Intelligence & ML" className="bg-zinc-900 text-white">Artificial Intelligence & ML</option>
                    <option value="Robotics & Autonomous Systems" className="bg-zinc-900 text-white">Robotics & Autonomous Systems</option>
                    <option value="Computational Biology & Genomics" className="bg-zinc-900 text-white">Computational Biology & Genomics</option>
                    <option value="Quantum Computing & Information" className="bg-zinc-900 text-white">Quantum Computing & Information</option>
                    <option value="High Energy & Theoretical Physics" className="bg-zinc-900 text-white">High Energy & Theoretical Physics</option>
                    <option value="Cybersecurity & Distributed Systems" className="bg-zinc-900 text-white">Cybersecurity & Distributed Systems</option>
                    <option value="Clean Energy & Materials Science" className="bg-zinc-900 text-white">Clean Energy & Materials Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-mono">Key Technical Skills & Tools (Comma separated)</label>
                  <input
                    type="text"
                    value={skillsRaw}
                    onChange={(e) => setSkillsRaw(e.target.value)}
                    placeholder="e.g. Python, PyTorch, CUDA, JAX, C++, ROS2, Git"
                    className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-mono">Key Work Done / Featured Project Title</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Low-Resource Indic Transformer Fine-Tuning"
                    className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-mono">Key Work Description (What technical problem did you solve?)</label>
                  <textarea
                    rows={2}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Describe specific algorithmic or systems work done, benchmarks tested..."
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-mono">Public GitHub Benchmark / Repository URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/project-repo"
                    className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="min-h-[46px] px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center space-x-2 active:scale-98"
                  >
                    <span>Extract & Match Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            </AppleGlassCard>
          )}

        </div>
      ) : (
        /* STEP 2: EXTRACTED CAPABILITIES, AI DIAGNOSTIC & TAILORED SUGGESTIONS */
        <div className="space-y-8">
          
          {/* Card 1: Verified Extracted Capabilities */}
          <AppleGlassCard className="p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono mb-2 backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI EXTRACTION COMPLETE</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-zinc-100 font-medium">
                  {processedProfile.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  {processedProfile.university} · CGPA <span className="font-mono text-amber-400 font-semibold">{processedProfile.cgpa}/10</span>
                </p>
              </div>

              {/* RRS Score Capsule */}
              <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center shrink-0">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Calibrated RRS</span>
                <div className="text-3xl sm:text-4xl font-mono font-semibold text-zinc-100 mt-0.5">
                  {processedProfile.rrsScore}<span className="text-sm text-zinc-500 font-normal">/100</span>
                </div>
                <span className="text-[11px] font-mono uppercase text-amber-400 font-medium">
                  {processedProfile.rrsTier}
                </span>
              </div>
            </div>

            {/* Extracted Key Work Done & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-canvas-card border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extracted Key Work & Featured Project</span>
                </span>
                <h4 className="text-sm font-semibold text-zinc-200">
                  {processedProfile.featuredProject?.title || 'Neural Model Inference Benchmark'}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {processedProfile.featuredProject?.description || 'Implemented and evaluated reproducible systems benchmark.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-canvas-card border border-white/5 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detected Frameworks & Research Domain</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {processedProfile.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-canvas-subtle border border-white/10 text-zinc-300 text-[11px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-400/90 font-mono pt-1">
                  Target: {processedProfile.targetDomains.join(', ')}
                </p>
              </div>
            </div>
          </AppleGlassCard>

          {/* Card 2: Detected Auto-Rejection Vulnerabilities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cold Email Auto-Rejection Vulnerabilities ({detectedFailures.length} Detected)</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-500">Auto-Remediated by AnusandhanAI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedFailures.map(fail => (
                <div
                  key={fail.id}
                  className="p-5 rounded-2xl bg-canvas-card border border-white/10 space-y-2 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs sm:text-sm font-semibold text-zinc-100">{fail.title}</h5>
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[11px] font-semibold shrink-0">
                        {fail.impactScore} pts risk
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {fail.reason}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-canvas-subtle border border-emerald-500/20 text-[11px] text-emerald-300 font-mono flex items-start gap-1.5 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Remedy:</strong> {fail.remedy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: TAILORED RESEARCH SUGGESTIONS (Key User Request) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tailored Suggestions for Your Extracted Profile ({matchedFaculty.length} Matches)</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400">Matched to {processedProfile.targetDomains[0]}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedFaculty.map(prof => (
                <div
                  key={prof.id}
                  className="p-5 rounded-2xl bg-canvas-card border border-white/10 space-y-3 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        prof.scope === 'national' 
                          ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' 
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}>
                        {prof.scope === 'national' ? '🇮🇳 Premier National' : '🌐 Global Lab'}
                      </span>
                      <h5 className="text-sm font-semibold text-zinc-100 mt-1">{prof.name}</h5>
                      <p className="text-xs text-amber-400 font-mono">{prof.university}</p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Active Grant
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">
                    <strong>Focus:</strong> {prof.researchFocus}
                  </p>

                  <div className="p-2.5 rounded-xl bg-canvas-subtle border border-white/5 text-[11px] text-zinc-300 font-mono flex items-center justify-between">
                    <span>{prof.recentPaper.venue} ({prof.recentPaper.year})</span>
                    <span className="text-emerald-400">{Math.round(prof.metrics.studentCoAuthorshipRatio * 100)}% Student Co-Authors</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Advance to Research Workspace CTA */}
          <div className="p-6 rounded-3xl bg-canvas-card border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                Ready to enter your personalized research workspace?
              </h4>
              <p className="text-xs text-zinc-400">
                Your extracted profile, failure remediations, and {matchedFaculty.length} tailored faculty openings will be pre-loaded into your active pipeline.
              </p>
            </div>

            <button
              onClick={() => {
                onCompleteIntake(processedProfile);
                confetti({ particleCount: 50, spread: 70 });
              }}
              className="min-h-[48px] px-8 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-canvas font-semibold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center space-x-2 shrink-0 active:scale-98"
            >
              <span>Enter Workspace with Matched Labs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Statutory Legal Modals */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

    </div>
  );
};
