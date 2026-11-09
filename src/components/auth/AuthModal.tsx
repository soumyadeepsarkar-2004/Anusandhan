import React, { useState } from 'react';
import { X, Lock, Mail, User, School, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AnusandhanLogo } from '../common/AnusandhanLogo';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  if (!isOpen) return null;

  const { login, register, oauthLogin } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('Artificial Intelligence & ML');
  const [cgpa, setCgpa] = useState('8.5');

  const handleOAuth = async (provider: 'google' | 'linkedin' | 'github') => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await oauthLogin(provider);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `${provider} sign-in failed.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          fullName,
          university: university || 'State / Regional University',
          fieldOfStudy,
          cgpa: parseFloat(cgpa) || 8.5
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl animate-fadeIn">
      {/* Specular Ambient Glow */}
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-tr from-amber-500/15 via-amber-400/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Glassmorphism Dialog Card - Contained Viewport */}
      <div className="w-full max-w-lg apple-glass rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative max-h-[88vh]">
        {/* Specular Top Sheen Line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        {/* Header Strip */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3">
            <AnusandhanLogo size="sm" showText={false} />
            <div>
              <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100">
                {mode === 'signin' ? 'Sign In to Anusandhan' : 'Create Scholar Account'}
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === 'signin' ? 'Access your research lab applications' : 'Global fellowships & lab matchmaking'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle - Liquid Glass Pill */}
        <div className="mx-5 mt-4 p-1 apple-glass-pill rounded-2xl grid grid-cols-2 text-xs font-mono shrink-0">
          <button
            onClick={() => { setMode('signin'); setErrorMessage(null); }}
            className={`min-h-[38px] py-2 rounded-xl transition-colors cursor-pointer font-medium ${
              mode === 'signin'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`min-h-[38px] py-2 rounded-xl transition-colors cursor-pointer font-medium ${
              mode === 'register'
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body - Scrollable Container */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Social OAuth Buttons - Google, LinkedIn, GitHub */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isSubmitting}
              className="min-h-[42px] px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-white/25 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
              title="Sign in with Google"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="hidden sm:inline">Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('linkedin')}
              disabled={isSubmitting}
              className="min-h-[42px] px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-[#0A66C2]/40 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
              title="Sign in with LinkedIn"
            >
              <svg className="w-4 h-4 text-[#0A66C2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.62 1.62 0 0 0-1.62 1.62c0 .89.73 1.62 1.62 1.62s1.62-.73 1.62-1.62c0-.9-.73-1.62-1.62-1.62z"/>
              </svg>
              <span className="hidden sm:inline">LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={isSubmitting}
              className="min-h-[42px] px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-white/30 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
              title="Sign in with GitHub"
            >
              <svg className="w-4 h-4 text-zinc-100 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[11px] text-zinc-500">or continue with email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 leading-relaxed font-sans flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        className="min-h-[42px] w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 focus:border-amber-400/70 focus:bg-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">University / College</label>
                    <div className="relative">
                      <School className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="e.g. IIT Bombay / NIT Trichy"
                        className="min-h-[42px] w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 focus:border-amber-400/70 focus:bg-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Academic CGPA (out of 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="5"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.85"
                      className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 focus:border-amber-400/70 focus:bg-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Target Research Domain</label>
                    <select
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/12 focus:border-amber-400/70 text-xs text-zinc-100 cursor-pointer transition-colors"
                    >
                      <option value="Artificial Intelligence & ML">AI & Machine Learning</option>
                      <option value="Robotics & Autonomous Systems">Robotics & Autonomous Systems</option>
                      <option value="Computational Biology & Genomics">Computational Biology & Genomics</option>
                      <option value="Quantum Computing & Information">Quantum Computing</option>
                      <option value="High Energy & Theoretical Physics">Physics & HPC</option>
                      <option value="Cybersecurity & Distributed Systems">Distributed Systems</option>
                      <option value="Clean Energy & Materials Science">Clean Energy & Materials</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@institution.edu or personal email"
                  className="min-h-[44px] w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 focus:border-amber-400/70 focus:bg-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="min-h-[44px] w-full pl-9 pr-10 py-2 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 focus:border-amber-400/70 focus:bg-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-h-[44px] min-w-[40px] absolute right-0 top-0 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors shadow-[0_10px_25px_rgba(245,158,11,0.25)] active:scale-98 cursor-pointer flex items-center justify-center space-x-2 mt-4"
            >
              <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-3 text-center border-t border-white/10 mt-3">
            <p className="text-xs text-zinc-400">
              {mode === 'signin' ? "Don't have an account yet?" : 'Already registered?'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'register' : 'signin');
                  setErrorMessage(null);
                }}
                className="ml-1.5 text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
              >
                {mode === 'signin' ? 'Create Free Account' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Institutional Compliance Seal */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Session · DPDPA 2023 Compliant · Direct SQLite Persistence</span>
          </div>

        </div>

      </div>
    </div>
  );
};
