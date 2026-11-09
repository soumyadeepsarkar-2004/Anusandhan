import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../legal/TermsOfServiceModal';
import { AnusandhanLogo } from '../common/AnusandhanLogo';
import { useTheme } from '../../context/ThemeContext';

export const Footer: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { isDark } = useTheme();

  return (
    <footer className="relative mt-24 border-t border-[var(--border-subtle)] bg-[var(--surface-bg)]/90 backdrop-blur-3xl py-16 text-xs transition-colors duration-300">
      {/* Specular Top Sheen Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      
      {/* Ambient Floor Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-amber-500/5 blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 mb-12">
          
          {/* Column 1: Brand & Purpose */}
          <div className="space-y-3.5">
            <div className="flex items-center">
              <AnusandhanLogo size="sm" />
            </div>

            <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-sans">
              Autonomous research internship intelligence platform. Literature-grounded cold outreach, verifiable proof-of-work matching, and 24/7 opportunity harvesting.
            </p>

            <div className="flex items-center space-x-2 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
              <span>Multi-domain continuous ingestion active</span>
            </div>
          </div>

          {/* Column 2: Supported Fellowship Programs */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Elite Fellowship Programs
            </h4>
            <ul className="space-y-2 text-[var(--text-secondary)] font-sans">
              <li>
                <a href="https://www.daad.in/en/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  <span>DAAD WISE (Germany)</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              </li>
              <li>
                <a href="https://www.mitacs.ca/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  <span>Mitacs Globalink (Canada)</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              </li>
              <li>
                <a href="https://careers.cern/summer" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  <span>CERN Summer Student (Geneva)</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              </li>
              <li>
                <a href="https://ethz.ch" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  <span>ETH Student Summer Research</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              </li>
              <li>
                <a href="https://iusstf.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  <span>S.N. Bose Scholars (USA)</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Academic Feeds */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Ingested Knowledge Graphs
            </h4>
            <ul className="space-y-2 text-[var(--text-secondary)] font-sans">
              <li>
                <a href="https://openalex.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-block">
                  OpenAlex Scholarly Graph
                </a>
              </li>
              <li>
                <a href="https://arxiv.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-block">
                  arXiv CS & Physics Preprints
                </a>
              </li>
              <li>
                <a href="https://www.semanticscholar.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-block">
                  Semantic Scholar API
                </a>
              </li>
              <li>
                <a href="https://orcid.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-block">
                  ORCID Researcher Registry
                </a>
              </li>
              <li>
                <a href="https://csrankings.org/" target="_blank" rel="noreferrer" className="hover:text-amber-500 hover:translate-x-0.5 transition-all inline-block">
                  CSRankings Global Faculty Metrics
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Compliance & Ethics */}
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Ethics & Compliance
            </h4>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] mb-3 font-sans">
              Anusandhan adheres strictly to university email standards. We enforce mandatory human confirmation, 7-day pacing, and zero bulk spam.
            </p>

            <div className="space-y-2 text-[11px] font-mono">
              <div>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-[var(--text-secondary)] hover:text-amber-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Privacy Policy (DPDP Act 2023)</span>
                </button>
              </div>
              <div>
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-[var(--text-secondary)] hover:text-amber-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                  <span>Terms & Research Ethics Code</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Strip */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[var(--text-muted)] text-[11px] font-mono gap-2">
          <div>
            © 2026–2027 Anusandhan. Built for ambitious global researchers.
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
              Privacy
            </button>
            <span>·</span>
            <button onClick={() => setShowTerms(true)} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
              Terms
            </button>
            <span>·</span>
            <a href="mailto:support@anusandhan.ai" className="hover:text-[var(--text-primary)] transition-colors">
              Support & Inquiries
            </a>
          </div>
        </div>

      </div>

      {/* Legal Modals */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </footer>
  );
};
