import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../legal/TermsOfServiceModal';
import { AnusandhanLogo } from '../common/AnusandhanLogo';
import { useTheme } from '../../context/ThemeContext';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

const FooterComponent: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  const [showPrivacyLocal, setShowPrivacyLocal] = useState(false);
  const [showTermsLocal, setShowTermsLocal] = useState(false);
  const { isDark } = useTheme();

  const handleOpenPrivacy = () => {
    if (onOpenPrivacy) {
      onOpenPrivacy();
    } else {
      setShowPrivacyLocal(true);
    }
  };

  const handleOpenTerms = () => {
    if (onOpenTerms) {
      onOpenTerms();
    } else {
      setShowTermsLocal(true);
    }
  };

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
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ethics & Compliance</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] mb-3 font-sans">
              Anusandhan adheres strictly to university email standards. We enforce mandatory human confirmation, 7-day anti-burnout pacing, and DPDP Act 2023 data fiduciary compliance.
            </p>

            <div className="space-y-2 text-[11px] font-sans">
              <div>
                <button
                  onClick={handleOpenPrivacy}
                  className="text-[var(--text-secondary)] hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Privacy Policy (DPDP Act 2023)</span>
                </button>
              </div>
              <div>
                <button
                  onClick={handleOpenTerms}
                  className="text-[var(--text-secondary)] hover:text-amber-500 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Terms & Research Ethics Code</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Product Hunt & Community Discovery */}
        <div className="mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-left">
            <span className="w-8 h-8 rounded-lg bg-[#DA552F]/15 border border-[#DA552F]/30 text-[#DA552F] flex items-center justify-center font-bold text-xs shrink-0">
              P
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">Product Hunt Community Launch</span>
                <span className="text-[10px] font-mono text-zinc-400">· Open Source Scholar Intelligence</span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Voted by researchers and students. Autonomous internships on autopilot.
              </p>
            </div>
          </div>

          <a
            href="https://www.producthunt.com/products/anusandhan"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Product Hunt</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Bottom Bar Strip - High Contrast, Theme-Adaptive Interactive Action Badges */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between text-xs font-mono gap-4">
          <div className="text-[var(--text-secondary)] text-center md:text-left text-[11px]">
            © 2026–2027 Anusandhan Technologies Pvt. Ltd. · All research rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a 
              href="https://soumyadeepsarkar-2004.github.io/Anusandhan/" 
              target="_blank" 
              rel="noreferrer" 
              className="px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm text-xs"
            >
              <span>VitePress Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button 
              onClick={handleOpenPrivacy} 
              className="px-3.5 py-1.5 rounded-full bg-[var(--surface-card)] hover:bg-amber-500/10 border border-[var(--border-subtle)] hover:border-amber-500/40 text-[var(--text-primary)] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy Policy</span>
            </button>

            <button 
              onClick={handleOpenTerms} 
              className="px-3.5 py-1.5 rounded-full bg-[var(--surface-card)] hover:bg-amber-500/10 border border-[var(--border-subtle)] hover:border-amber-500/40 text-[var(--text-primary)] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Terms of Service</span>
            </button>

            <a 
              href="mailto:support@anusandhan.ai" 
              className="px-3.5 py-1.5 rounded-full bg-[var(--surface-card)] hover:bg-amber-500/10 border border-[var(--border-subtle)] hover:border-amber-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-all inline-flex items-center gap-1.5 shadow-sm text-xs"
            >
              <span>Support & Inquiries</span>
            </a>
          </div>
        </div>

      </div>

      {/* Legal Modals Fallback */}
      <PrivacyPolicyModal isOpen={showPrivacyLocal} onClose={() => setShowPrivacyLocal(false)} />
      <TermsOfServiceModal isOpen={showTermsLocal} onClose={() => setShowTermsLocal(false)} />
    </footer>
  );
};

export const Footer = React.memo(FooterComponent);
