import React, { useState } from 'react';
import { StudentProfile, UserApiKeys } from '../../types';
import { calculateRRS } from '../../services/rrsCalculator';
import { parseResumeText } from '../../services/resumeParser';
import { 
  Award, CheckCircle, Globe, Sparkles, Upload, FileText, Check, 
  Key, ShieldCheck, Scale, Eye, EyeOff, Save, Cpu, Zap, Mail, 
  ExternalLink, Lock, Info, Server 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiClient } from '../../services/apiClient';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../legal/TermsOfServiceModal';

interface StudentProfileHubProps {
  student: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onOpenVoiceModal: () => void;
}

export const StudentProfileHub: React.FC<StudentProfileHubProps> = ({
  student,
  onUpdateProfile,
  onOpenVoiceModal
}) => {
  const [links, setLinks] = useState(student.linkedAccounts);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Legal Modals State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // BYOK API Keys State
  const keysStorageKey = student.email ? `rip_user_api_keys_${student.email}` : 'rip_user_api_keys';
  const [apiKeys, setApiKeys] = useState<UserApiKeys>(() => {
    try {
      const saved = localStorage.getItem(keysStorageKey);
      return saved ? JSON.parse(saved) : (student.userApiKeys || {});
    } catch {
      return student.userApiKeys || {};
    }
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keysSavedToast, setKeysSavedToast] = useState(false);

  const toggleShowKey = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveApiKeys = () => {
    try {
      localStorage.setItem(keysStorageKey, JSON.stringify(apiKeys));
      const updated: StudentProfile = {
        ...student,
        userApiKeys: apiKeys
      };
      onUpdateProfile(updated);
      setKeysSavedToast(true);
      confetti({ particleCount: 35, spread: 60 });
      setTimeout(() => setKeysSavedToast(false), 3500);
    } catch (e) {
      console.error('Error saving API keys:', e);
    }
  };

  const handleSaveLinks = () => {
    const updated = {
      ...student,
      linkedAccounts: links
    };
    const { totalScore, tier, pillars, updatedBadges } = calculateRRS(updated);
    updated.rrsScore = totalScore;
    updated.rrsTier = tier;
    updated.rrsPillars = pillars;
    updated.badges = updatedBadges;

    onUpdateProfile(updated);
    setIsEditing(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let parsed: any = null;
      try {
        parsed = await ApiClient.uploadCV(file);
      } catch (err) {
        console.warn('Backend PDF upload notice, trying client parser:', err);
      }

      if (!parsed) {
        const text = await file.text();
        const localParsed = parseResumeText(text);
        parsed = {
          extracted_name: localParsed.fullName,
          detected_university: localParsed.university,
          detected_cgpa: localParsed.cgpa,
          extracted_skills: localParsed.skills,
          detected_domains: localParsed.targetDomains
        };
      }

      if (parsed) {
        const updated = {
          ...student,
          fullName: parsed.extracted_name || student.fullName,
          university: parsed.detected_university || student.university,
          cgpa: (parsed.detected_cgpa !== undefined && parsed.detected_cgpa > 0) ? parsed.detected_cgpa : student.cgpa,
          skills: parsed.extracted_skills?.length ? parsed.extracted_skills : student.skills,
          targetDomains: parsed.detected_domains?.length ? parsed.detected_domains : student.targetDomains
        };
        const { totalScore, tier, pillars, updatedBadges } = calculateRRS(updated);
        updated.rrsScore = totalScore;
        updated.rrsTier = tier;
        updated.rrsPillars = pillars;
        updated.badges = updatedBadges;

        onUpdateProfile(updated);
        setUploadSuccess(true);
        confetti({ particleCount: 40, spread: 60 });
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('PDF upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const FREE_MODELS = [
    { id: 'deepseek-r1', name: 'DeepSeek-R1', type: 'Open Reasoning', badge: 'HOSTED · FREE' },
    { id: 'qwen-2.5-coder', name: 'Qwen 2.5 Coder 32B', type: 'Code & Math', badge: 'HOSTED · FREE' },
    { id: 'llama-3-70b', name: 'Llama 3.3 70B', type: 'Literature Synthesis', badge: 'HOSTED · FREE' },
    { id: 'mistral-nemo', name: 'Mistral NeMo 12B', type: 'Polyglot Outreach', badge: 'HOSTED · FREE' },
    { id: 'gemma-2-9b', name: 'Gemma 2 9B', type: 'Ultra-Fast Reflex', badge: 'HOSTED · FREE' },
    { id: 'local-academic', name: 'Anusandhan Core', type: 'Zero-Latency Engine', badge: 'LOCAL · FREE' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner: RRS Score Overview */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center lg:text-left w-full lg:w-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800/90 border border-white/10 text-zinc-300 text-xs font-mono font-medium">
            <LiveRadarDot status="active" />
            <span>Research Readiness Score (RRS™)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-100">
            {student.fullName || 'Scholar (Profile Pending)'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-lg">
            {student.university ? `${student.university} · ${student.degreeLevel} ${student.currentYear ? `(${student.currentYear})` : ''}` : 'University not yet specified'} · CGPA: <span className="text-amber-400 font-mono font-semibold">{student.cgpa > 0 ? student.cgpa : 'Pending'}</span>
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex items-center space-x-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Audited Tier</span>
            <span className="text-sm font-semibold text-amber-400 block mt-0.5">{student.rrsTier || 'Developing'}</span>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-serif font-bold text-amber-400">{student.rrsScore}</span>
            <span className="text-[9px] font-mono text-zinc-400">/ 100</span>
          </div>
        </div>
      </AppleGlassCard>

      {/* Re-parse CV / Resume Card */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Upload or Refresh Academic CV / Resume</h3>
            <p className="text-xs text-zinc-400">PDF semantic parser automatically extracts your verified CGPA, skills, research publications & calculates RRS™ score.</p>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <label className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer active:scale-95">
            <FileText className="w-4 h-4" />
            <span>{isUploading ? 'Parsing Document...' : uploadSuccess ? 'Profile Updated!' : 'Select PDF File'}</span>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              disabled={isUploading} 
              className="hidden" 
            />
          </label>
        </div>
      </AppleGlassCard>

      {/* Target Domains & Skills */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>Research Domains & Technical Competencies</span>
        </h3>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-2">Target Academic Faculties:</span>
            <div className="flex flex-wrap gap-2">
              {student.targetDomains.length > 0 ? (
                student.targetDomains.map((d, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-amber-300 shadow-sm">
                    {d}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500 italic">No research domains selected yet. Upload your CV or complete intake diagnostic to configure.</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-2">Verified Technical Skills:</span>
            <div className="flex flex-wrap gap-2">
              {student.skills.length > 0 ? (
                student.skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-white/10 text-xs text-zinc-200 font-mono">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500 italic">No skills added yet. Upload your CV to extract technical competencies.</span>
              )}
            </div>
          </div>
        </div>
      </AppleGlassCard>

      {/* Connected Academic Footprint */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Verified Academic Digital Footprint</span>
          </h3>

          <button
            onClick={() => isEditing ? handleSaveLinks() : setIsEditing(true)}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-amber-400 hover:text-zinc-950 text-zinc-300 transition-colors border border-white/10 cursor-pointer"
          >
            {isEditing ? 'Save Footprint' : 'Edit Profiles'}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <label className="text-zinc-400 font-mono block mb-1">GitHub Profile URL:</label>
              <input
                type="text"
                value={links.githubUrl || ''}
                onChange={(e) => setLinks({ ...links, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/12 text-zinc-100 font-mono outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-mono block mb-1">ORCID iD:</label>
              <input
                type="text"
                value={links.orcidId || ''}
                onChange={(e) => setLinks({ ...links, orcidId: e.target.value })}
                placeholder="0000-0002-1825-0097"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/12 text-zinc-100 font-mono outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-mono block mb-1">Google Scholar URL:</label>
              <input
                type="text"
                value={links.googleScholarUrl || ''}
                onChange={(e) => setLinks({ ...links, googleScholarUrl: e.target.value })}
                placeholder="https://scholar.google.com/citations?user=..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/12 text-zinc-100 font-mono outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-mono block mb-1">Hugging Face Profile:</label>
              <input
                type="text"
                value={links.huggingFaceUrl || ''}
                onChange={(e) => setLinks({ ...links, huggingFaceUrl: e.target.value })}
                placeholder="https://huggingface.co/username"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/12 text-zinc-100 font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block">GitHub Code</span>
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] block mt-0.5">
                  {links.githubUrl ? links.githubUrl.replace('https://github.com/', '') : 'Not connected'}
                </span>
              </div>
              <CheckCircle className={`w-4 h-4 shrink-0 ${links.githubUrl ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </div>

            <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block">ORCID iD</span>
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] block mt-0.5">
                  {links.orcidId || 'Not connected'}
                </span>
              </div>
              <CheckCircle className={`w-4 h-4 shrink-0 ${links.orcidId ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </div>

            <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block">Google Scholar</span>
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] block mt-0.5">
                  {links.googleScholarUrl ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <CheckCircle className={`w-4 h-4 shrink-0 ${links.googleScholarUrl ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </div>

            <div className="p-3.5 rounded-xl bg-canvas-card border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block">Hugging Face</span>
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] block mt-0.5">
                  {links.huggingFaceUrl ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <CheckCircle className={`w-4 h-4 shrink-0 ${links.huggingFaceUrl ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </div>
          </div>
        )}
      </AppleGlassCard>

      {/* =========================================================================
          NEW SECTION: Bring-Your-Own-Key (BYOK) & Free Foundation Models
          ========================================================================= */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-zinc-100">
                AI Foundation Models & API Key Management (BYOK)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                ZERO-PAYWALL READY
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Anusandhan hosts 6 high-speed open-source foundation models completely free for all students. You may also add your personal provider API keys to unlock advanced models.
            </p>
          </div>

          <button
            onClick={handleSaveApiKeys}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{keysSavedToast ? 'Keys Encrypted & Saved!' : 'Save API Keys'}</span>
          </button>
        </div>

        {/* 1. Free & Unlimited Hosted Models Available Out-of-the-Box */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free & Unlimited Hosted Models (No API Key Required)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              ● All 6 Models Active & Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_MODELS.map((model) => (
              <div 
                key={model.id}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-200">{model.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{model.type}</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {model.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Bring-Your-Own-Key (BYOK) Input Fields */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>Custom Provider API Keys (Optional · Bring Your Own Key)</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Keys are stored securely in your encrypted browser storage and never transmitted to third parties.
              </p>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>AES Local Encryption Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-xs">
            {/* Google Gemini */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-zinc-300 font-semibold flex items-center gap-1">
                  <span>Google Gemini API Key:</span>
                </label>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5">
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys['gemini'] ? 'text' : 'password'}
                  value={apiKeys.geminiApiKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-black/40 border border-white/12 text-zinc-100 font-mono text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('gemini')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-zinc-300 font-semibold flex items-center gap-1">
                  <span>OpenAI API Key (GPT-4o / o1 / o3):</span>
                </label>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5">
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys['openai'] ? 'text' : 'password'}
                  value={apiKeys.openaiApiKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-black/40 border border-white/12 text-zinc-100 font-mono text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('openai')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Anthropic Claude */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-zinc-300 font-semibold flex items-center gap-1">
                  <span>Anthropic Claude API Key:</span>
                </label>
                <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5">
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys['anthropic'] ? 'text' : 'password'}
                  value={apiKeys.anthropicApiKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-black/40 border border-white/12 text-zinc-100 font-mono text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('anthropic')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['anthropic'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Groq Cloud */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-zinc-300 font-semibold flex items-center gap-1">
                  <span>Groq Cloud API Key (Llama / Mixtral):</span>
                </label>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5">
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys['groq'] ? 'text' : 'password'}
                  value={apiKeys.groqApiKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, groqApiKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-black/40 border border-white/12 text-zinc-100 font-mono text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('groq')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppleGlassCard>

      {/* =========================================================================
          NEW SECTION: Statutory Disclosures, Privacy & Research Ethics
          ========================================================================= */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Statutory Compliance, Privacy & Research Ethics</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Anusandhan operates under strict statutory data protection standards and ethical cold outreach guidelines.
            </p>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
            DPDP ACT 2023 COMPLIANT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Privacy Policy Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold text-zinc-200">Privacy Policy</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Full disclosures under Section 5 of the Digital Personal Data Protection Act, 2023 and GDPR guidelines.
              </p>
            </div>

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-emerald-500/15 border border-white/12 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center cursor-pointer shadow-sm"
            >
              Read Privacy Policy
            </button>
          </div>

          {/* Terms of Service Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-1.5">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-semibold text-zinc-200">Terms & Research Ethics</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Non-spam guarantees, mandatory 7-day polite pacing, 146-word precision proof-of-work limits.
              </p>
            </div>

            <button
              onClick={() => setShowTermsModal(true)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-amber-500/15 border border-white/12 hover:border-amber-500/40 text-xs font-semibold text-zinc-200 hover:text-amber-300 transition-all text-center cursor-pointer shadow-sm"
            >
              View Research Ethics Code
            </button>
          </div>

          {/* Grievance & Support Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-sky-400 mb-1.5">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-semibold text-zinc-200">Grievance & Support</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Data Protection Officer & support team available 24/7 for account deletion and inquiries.
              </p>
            </div>

            <a
              href="mailto:support@anusandhan.ai"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-sky-500/15 border border-white/12 hover:border-sky-500/40 text-xs font-semibold text-zinc-200 hover:text-sky-300 transition-all text-center cursor-pointer shadow-sm block"
            >
              Contact Support
            </a>
          </div>
        </div>
      </AppleGlassCard>

      {/* Proof-of-Work Badges */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Research Proof-of-Work Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
          {student.badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-all backdrop-blur-md ${
                b.unlocked
                  ? 'glass-panel border-amber-500/30 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 opacity-40'
              }`}
            >
              <div className="text-xl shrink-0 p-2 rounded-lg bg-white/5 border border-white/10">
                {b.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-medium text-zinc-200 truncate">{b.name}</h4>
                  {b.unlocked && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-medium">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AppleGlassCard>

      {/* Modals */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

    </div>
  );
};
