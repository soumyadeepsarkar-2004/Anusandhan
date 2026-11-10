import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { StudentProfile, ResearchDomain } from '../../types';
import { parseResumeText } from '../../services/resumeParser';
import { calculateRRS } from '../../services/rrsCalculator';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveProfile
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [formData, setFormData] = useState<StudentProfile>(student);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const availableDomains: ResearchDomain[] = [
    'Artificial Intelligence & ML',
    'Quantum Computing & Information',
    'Computational Biology & Genomics',
    'Robotics & Autonomous Systems',
    'Clean Energy & Materials Science',
    'Neuroscience & Brain-Computer Interfaces',
    'High Energy & Theoretical Physics',
    'Cybersecurity & Distributed Systems'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const parsed = parseResumeText(text || file.name);

      const updated = {
        ...formData,
        ...parsed,
        fullName: parsed.fullName || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') || formData.fullName,
      };

      const { totalScore, tier, pillars, updatedBadges } = calculateRRS(updated);
      updated.rrsScore = totalScore;
      updated.rrsTier = tier;
      updated.rrsPillars = pillars;
      updated.badges = updatedBadges;

      setFormData(updated);
      onSaveProfile(updated);
      setIsProcessing(false);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { totalScore, tier, pillars, updatedBadges } = calculateRRS(formData);
    const updated = {
      ...formData,
      rrsScore: totalScore,
      rrsTier: tier,
      rrsPillars: pillars,
      badges: updatedBadges
    };
    onSaveProfile(updated);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  const toggleDomain = (domain: ResearchDomain) => {
    const exists = formData.targetDomains.includes(domain);
    const updated = exists
      ? formData.targetDomains.filter(d => d !== domain)
      : [...formData.targetDomains, domain];
    setFormData({ ...formData, targetDomains: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      {/* Ambient Glowing Orbs */}
      <div className="ambient-orb -top-20 -left-20 w-80 h-80 bg-amber-500/15" />
      <div className="ambient-orb -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15" />

      {/* Aceternity UI / 21st.dev Layered Glassmorphic Card */}
      <div className="w-full max-w-2xl aceternity-glass rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.48)] overflow-hidden flex flex-col max-h-[90vh] relative bg-zinc-950/85">
        {/* Specular Top Sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div>
            <h3 className="text-lg font-serif font-medium text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Student Profile Intake & CV Parser</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload your CV to auto-extract technical signals, or configure details manually.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-2 bg-white/[0.02] border-b border-white/10 text-xs font-medium backdrop-blur-md">
          <button
            onClick={() => setMode('upload')}
            className={`min-h-[44px] py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              mode === 'upload' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Option A: Instant CV Upload (AI Parse)
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`min-h-[44px] py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              mode === 'manual' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Option B: Manual Profile Form
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {mode === 'upload' ? (
            <div className="space-y-6">
              
              {/* Dropzone */}
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
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragOver
                    ? 'border-amber-400 bg-amber-500/15'
                    : 'border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-amber-500/40 hover:bg-white/[0.05]'
                }`}
              >
                <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-bounce" />
                <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                  Drag and drop your Resume / CV here
                </h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Supports PDF, TXT, or DOCX formats (max 10 MB)
                </p>

                <label className="min-h-[44px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all active:scale-98">
                  <span>Browse File on Computer</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="min-h-[44px] w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Institutional Email (.edu / .ac.in)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="min-h-[44px] w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">University / Institute</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="min-h-[44px] w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">CGPA / GPA (out of 10 or 4)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 8.0 })}
                    className="min-h-[44px] w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Target Domains */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Target Research Domains (Select 1 or more)</label>
                <div className="flex flex-wrap gap-2">
                  {availableDomains.map((dom) => {
                    const isSelected = formData.targetDomains.includes(dom);
                    return (
                      <button
                        type="button"
                        key={dom}
                        onClick={() => toggleDomain(dom)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm'
                            : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {dom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Featured Project */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Featured Research Project Title</label>
                <input
                  type="text"
                  value={formData.featuredProject.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    featuredProject: { ...formData.featuredProject, title: e.target.value }
                  })}
                  className="min-h-[44px] w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none mb-2"
                />
                <textarea
                  rows={2}
                  value={formData.featuredProject.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    featuredProject: { ...formData.featuredProject, description: e.target.value }
                  })}
                  placeholder="Describe your research methodology, PyTorch experiments, or benchmark findings..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-zinc-100 focus:border-amber-500/60 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all active:scale-98"
                >
                  Save Profile & Calculate RRS
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
