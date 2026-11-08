import React, { useState } from 'react';
import { StudentProfile } from '../../types';
import { calculateRRS } from '../../services/rrsCalculator';
import { Award, CheckCircle, Globe, Sparkles, Upload, FileText, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiClient } from '../../services/apiClient';
import { AppleGlassCard, LiveRadarDot } from '../ui/AppleGlass';

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
      const parsed = await ApiClient.uploadCV(file);
      if (parsed) {
        const updated = {
          ...student,
          fullName: parsed.extracted_name || student.fullName,
          university: parsed.detected_university || student.university,
          cgpa: parsed.detected_cgpa || student.cgpa,
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
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('PDF upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner: RRS Score Overview */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center lg:text-left w-full lg:w-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800/90 border border-white/10 text-zinc-300 text-xs font-mono font-medium">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider uppercase">Research Readiness Scorecard (RRS)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-zinc-100">
            {student.fullName || 'Uncalibrated Scholar Profile'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            {student.university ? (
              <>{student.degreeLevel} · {student.university} · CGPA <span className="text-amber-400 font-mono font-semibold">{student.cgpa}/10</span></>
            ) : (
              'Upload your CV in Intake Diagnostic to extract your GPA and calculate your RRS score.'
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1 justify-center lg:justify-start">
            {student.targetDomains.map(d => (
              <span key={d} className="glass-chip px-2.5 py-1 rounded-xl text-zinc-300 text-[11px] font-mono">
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Big Metric Gauge & Re-upload action */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/12 w-full sm:w-auto justify-center shadow-inner">
          <div className="text-center sm:text-left">
            <div className="text-4xl sm:text-5xl font-semibold text-zinc-100 font-mono tracking-tight">
              {student.rrsScore}
              <span className="text-lg text-zinc-500 font-normal">/100</span>
            </div>
            <span className="text-xs font-medium text-amber-400 uppercase font-mono mt-1 block">
              {student.rrsTier}
            </span>
          </div>

          <div className="text-left text-xs space-y-1.5 text-zinc-400 sm:pl-5 sm:border-l sm:border-white/10 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <p className="text-zinc-200 font-medium">Diagnostic Overview:</p>
            <p className="text-[11px] text-emerald-400 font-mono">✓ 4.8x Higher PI Reply Chance</p>
            <p className="text-[11px] text-zinc-300 font-mono">✓ DAAD & Mitacs Compatible</p>
            
            <label className="min-h-[38px] text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer pt-1 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Parsing PDF...' : uploadSuccess ? 'Updated from PDF!' : 'Upload Updated PDF'}</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </AppleGlassCard>

      {/* 5 Scientific Pillars Breakdown - Clean & Restrained */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <AppleGlassCard glowOnHover={false} className="p-4 space-y-1">
          <span className="text-[11px] text-zinc-400 uppercase font-mono block tracking-wider">Pillar 1: Code</span>
          <div className="text-lg font-semibold text-zinc-100 font-mono">{student.rrsPillars.codeExecution} <span className="text-xs text-zinc-500 font-normal">/25</span></div>
          <p className="text-[11px] text-zinc-400 leading-snug">PyTorch / CUDA reproduction</p>
        </AppleGlassCard>

        <AppleGlassCard glowOnHover={false} className="p-4 space-y-1">
          <span className="text-[11px] text-zinc-400 uppercase font-mono block tracking-wider">Pillar 2: Lit</span>
          <div className="text-lg font-semibold text-amber-400 font-mono">{student.rrsPillars.researchMethodology} <span className="text-xs text-zinc-500 font-normal">/25</span></div>
          <p className="text-[11px] text-zinc-400 leading-snug">arXiv / paper citations</p>
        </AppleGlassCard>

        <AppleGlassCard glowOnHover={false} className="p-4 space-y-1">
          <span className="text-[11px] text-zinc-400 uppercase font-mono block tracking-wider">Pillar 3: GPA</span>
          <div className="text-lg font-semibold text-emerald-400 font-mono">{student.rrsPillars.academicFoundations} <span className="text-xs text-zinc-500 font-normal">/20</span></div>
          <p className="text-[11px] text-zinc-400 leading-snug">CGPA & university standing</p>
        </AppleGlassCard>

        <AppleGlassCard glowOnHover={false} className="p-4 space-y-1">
          <span className="text-[11px] text-zinc-400 uppercase font-mono block tracking-wider">Pillar 4: Tools</span>
          <div className="text-lg font-semibold text-zinc-200 font-mono">{student.rrsPillars.labTooling} <span className="text-xs text-zinc-500 font-normal">/15</span></div>
          <p className="text-[11px] text-zinc-400 leading-snug">ROS2, JAX, Docker, Triton</p>
        </AppleGlassCard>

        <AppleGlassCard glowOnHover={false} className="p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-zinc-400 uppercase font-mono block tracking-wider">Pillar 5: Trust</span>
          <div className="text-lg font-semibold text-zinc-200 font-mono">{student.rrsPillars.professionalism} <span className="text-xs text-zinc-500 font-normal">/15</span></div>
          <p className="text-[11px] text-zinc-400 leading-snug">.edu email & ORCID verified</p>
        </AppleGlassCard>
      </div>

      {/* Linked Scholar Accounts */}
      <AppleGlassCard glowOnHover={false} className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Verified Scholar Profiles & Proof-of-Work</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Linking live repositories and scholarly profiles embeds verified proof into your outreach drafts.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs cursor-pointer border border-white/10 transition-colors self-start sm:self-auto"
          >
            {isEditing ? 'Cancel' : 'Edit Links'}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-zinc-400 font-mono mb-1">GitHub Profile URL</label>
              <input
                type="text"
                value={links.githubUrl || ''}
                onChange={(e) => setLinks({ ...links, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-xs text-zinc-100 outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-mono mb-1">ORCID iD</label>
              <input
                type="text"
                value={links.orcidId || ''}
                onChange={(e) => setLinks({ ...links, orcidId: e.target.value })}
                placeholder="0009-0004-8921-7712"
                className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-xs text-zinc-100 outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-mono mb-1">Google Scholar URL</label>
              <input
                type="text"
                value={links.googleScholarUrl || ''}
                onChange={(e) => setLinks({ ...links, googleScholarUrl: e.target.value })}
                placeholder="https://scholar.google.com/citations?user=..."
                className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-xs text-zinc-100 outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-mono mb-1">Hugging Face Profile</label>
              <input
                type="text"
                value={links.huggingFaceUrl || ''}
                onChange={(e) => setLinks({ ...links, huggingFaceUrl: e.target.value })}
                placeholder="https://huggingface.co/username"
                className="min-h-[44px] w-full px-3.5 py-2 rounded-xl glass-input text-xs text-zinc-100 outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
            <div className="sm:col-span-2 pt-2 flex justify-end">
              <button
                onClick={handleSaveLinks}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all active:scale-98"
              >
                Save & Recalculate RRS
              </button>
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

    </div>
  );
};
