import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Star, Share2, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { AnusandhanLogo } from '../common/AnusandhanLogo';

interface CommunityListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityListingModal: React.FC<CommunityListingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const listings = [
    {
      platform: 'GitHub',
      badge: '100% Open Source',
      status: 'live',
      color: '#ffffff',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
      title: 'GitHub Codebase & Repository',
      description: 'MIT licensed repository with complete architecture documentation, microservices, and test suites.',
      ctaText: 'View on GitHub',
      url: 'https://github.com/soumyadeepsarkar-2004/Anusandhan',
      tag: 'Live & Active'
    },
    {
      platform: 'Documentation',
      badge: 'Official Docs',
      status: 'live',
      color: '#F59E0B',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      title: 'VitePress Architecture & API Docs',
      description: 'Comprehensive guides on academic scrapers, RRS radar scoring, and ethical human-in-the-loop email pacing.',
      ctaText: 'Read Documentation',
      url: 'https://soumyadeepsarkar-2004.github.io/Anusandhan/',
      tag: 'Live & Deployed'
    },
    {
      platform: 'Releases',
      badge: 'Git Tagged',
      status: 'live',
      color: '#10B981',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      ),
      title: 'Official v1.0.0 Release Tag',
      description: 'Source code distribution, architecture tags, and milestone commit verified on GitHub.',
      ctaText: 'View v1.0.0 Tag',
      url: 'https://github.com/soumyadeepsarkar-2004/Anusandhan/releases/tag/v1.0.0',
      tag: 'v1.0.0 Live'
    },
    {
      platform: 'X / Twitter',
      badge: 'Creator Updates',
      status: 'live',
      color: '#1DA1F2',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      title: 'Creator Updates (@sarkar58153)',
      description: 'Follow creator updates, research fellowship alerts, and release announcements directly on X.',
      ctaText: 'Follow @sarkar58153',
      url: 'https://x.com/sarkar58153',
      tag: 'Live Account'
    },
    {
      platform: 'Product Hunt',
      badge: 'Launch Kit Ready',
      status: 'pending',
      color: '#DA552F',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M13.6 8.4h-3.4v4.3h3.4c1.2 0 2.1-1 2.1-2.1s-1-2.2-2.1-2.2zm-1.6-8.4C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm1.6 15.6h-5v-10h5c2.7 0 4.9 2.2 4.9 4.9s-2.2 5.1-4.9 5.1z" />
        </svg>
      ),
      title: 'Product Hunt Submission Kit',
      description: 'Launch assets, tagline, and maker comment prepared. Direct link to create and publish your post on Product Hunt.',
      ctaText: 'Open Product Hunt Draft',
      url: 'https://www.producthunt.com/posts/new/OPGNCT3GA47JX2UOP5E426NGVQUKXDFBFG',
      tag: 'Draft Live & Active'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl aceternity-glass rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.48)] overflow-hidden flex flex-col relative z-10 max-h-[90vh] bg-zinc-950/85"
        >
          {/* Ambient Glowing Orbs */}
          <div className="ambient-orb -top-20 -left-20 w-80 h-80 bg-amber-500/15" />
          <div className="ambient-orb -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15" />

          {/* Top Sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center space-x-3">
              <AnusandhanLogo size="sm" showText={false} />
              <div>
                <h3 className="text-lg font-serif font-medium text-zinc-100 flex items-center gap-2">
                  <span>Community, Documentation & Releases</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    Verified
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Open-source codebase, official documentation, GitHub releases, and community links
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close listings modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="p-5 space-y-3.5 overflow-y-auto custom-scrollbar">
            {listings.map((item) => (
              <div
                key={item.platform}
                className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{ 
                      backgroundColor: `${item.color}15`, 
                      borderColor: `${item.color}35`,
                      color: item.color 
                    }}
                  >
                    {item.icon}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        item.status === 'live'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 text-zinc-200 hover:text-white text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  <span>{item.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </a>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Free · No Paywalls · DPDP Act 2023 Compliant</span>
            </span>
            <span className="text-[11px] text-zinc-400">Anusandhan (अनुसंधान)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
