import React, { useState } from 'react';
import { FileText, X, AlertOctagon, CheckCircle2, ShieldAlert, Scale, RefreshCw } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xl p-4 overflow-y-auto">
      {/* Ambient Lighting Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col p-6 sm:p-8 overflow-hidden glass-modal rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
        {/* Specular Top Sheen */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {lang === 'en' ? 'Terms of Service & Academic Outreach Code' : 'सेवा की शर्तें एवं शैक्षणिक आचार संहिता'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Mandatory Anti-Spam Ethics · Human-in-the-Loop Protocol · Effective 2026
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
              aria-label="Terms of service language"
              className="bg-white/[0.05] border border-white/12 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 outline-none focus:border-amber-500 font-mono cursor-pointer backdrop-blur-md"
            >
              <option value="en" className="bg-zinc-900 text-white">English (Official)</option>
              <option value="hi" className="bg-zinc-900 text-white">हिंदी (Hindi)</option>
            </select>

            <button
              onClick={onClose}
              aria-label="Close terms of service"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-6 text-xs text-zinc-300 leading-relaxed font-sans">
          
          {lang === 'en' ? (
            <>
              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  1. Platform Purpose & Agreement
                </h3>
                <p>
                  By creating an account, uploading a CV, or generating research outreach drafts on <strong>Anusandhan (अनुसंधान)</strong>, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
                </p>
              </div>

              {/* Section 2: Anti-Spam Code */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>2. Academic Cold Outreach Ethical Code (Strict Anti-Spam)</span>
                </h3>
                <p>
                  Faculty professors and laboratory directors receive hundreds of unstructured emails weekly. To preserve academic goodwill and student credibility, you agree to adhere strictly to our Academic Outreach Guardrails:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/30">
                    <span className="font-mono text-amber-400 font-semibold block mb-1">
                      Daily Outreach Rate Limit (Max 5/Day)
                    </span>
                    <span className="text-zinc-300">
                      Users are strictly restricted from dispatching more than 5 cold outreach emails per 24 hours. Mass-blasting or bulk automated mail merging is prohibited and results in immediate account suspension.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/30">
                    <span className="font-mono text-amber-400 font-semibold block mb-1">
                      146-Word Precision Standard
                    </span>
                    <span className="text-zinc-300">
                      Pitches must not exceed 146 words. Each email must reference a specific verified paper published by the professor between 2024 and 2026 and detail a concrete, reproducible contribution proposal.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/30">
                    <span className="font-mono text-amber-400 font-semibold block mb-1">
                      Mandatory Human-in-the-Loop Review
                    </span>
                    <span className="text-zinc-300">
                      AI draft synthesis generates candidate letters, but no email is dispatched without the explicit, manual review and one-click authorization of the student.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/30">
                    <span className="font-mono text-amber-400 font-semibold block mb-1">
                      Ethical 7-Day Smart Follow-Up
                    </span>
                    <span className="text-zinc-300">
                      Only one single polite follow-up nudge is permitted, strictly following a mandatory 7-calendar-day waiting period. Harassment or repeated badgering is grounds for termination.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Honesty */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  3. Academic Honesty & Representation
                </h3>
                <p>
                  You certify that all coursework, CGPA/GPA scores, GitHub repositories, and past research experience submitted via the intake flow are genuine and verifiable. Misrepresenting academic credentials or submitting forged recommendation requests violates university honor codes and our terms.
                </p>
              </div>

              {/* Section 4: Fellowship Disclaimer */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  4. Non-Affiliation & Admission Disclaimers
                </h3>
                <p>
                  Anusandhan provides research discovery intelligence, paper telemetry, and structured communication tools. We are not directly affiliated with, sponsored by, or an agent of DAAD, Mitacs, CERN, IISc, TIFR, or the Max Planck Society. Selection and funding decisions remain under the sole and independent authority of the respective fellowship committees and lab directors.
                </p>
              </div>

              {/* Section 5: Billing & Refunds */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  5. Subscriptions, Credits & Cancellation
                </h3>
                <p>
                  Paid Scholar Pro subscriptions and institutional passes provide additional daily quota allocations and deep paper deconstruction analysis. Subscriptions may be cancelled at any time from the account dashboard. Unused credits reset at each monthly billing cycle. Inquiries regarding billing disputes should be routed to <strong>billing@anusandhan.ai</strong>.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Hindi Terms */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  १. सेवा की स्वीकृति
                </h3>
                <p>
                  अनुसंधान का उपयोग करके आप इन नियमों और आचार संहिता का पालन करने के लिए बाध्य हैं।
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  २. सख्त एंटी-स्पैम नियम
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li><strong>प्रति दिन अधिकतम 5 ईमेल:</strong> प्रोफेसरों को स्पैम से बचाने के लिए 24 घंटे में अधिकतम 5 ईमेल की सीमा।</li>
                  <li><strong>146 शब्दों की सीमा:</strong> प्रत्येक ईमेल संक्षिप्त और प्रोफेसर के हालिया शोध पत्र पर आधारित होना चाहिए।</li>
                  <li><strong>मानव समीक्षा अनिवार्य:</strong> कोई भी ईमेल छात्र की प्रत्यक्ष समीक्षा और अनुमोदन के बिना स्वचालित रूप से नहीं भेजा जाता।</li>
                  <li><strong>7 दिनों का अंतराल:</strong> फॉलो-अप केवल 7 दिनों के बाद ही अनुमत है।</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  ३. चयन की गैर-गारंटी
                </h3>
                <p>
                  यह प्लेटफ़ॉर्म शोध अवसरों की खोज में मदद करता है। चयन और फ़ेलोशिप का अंतिम निर्णय संबंधित संस्थानों (DAAD, CERN, IISc, TIFR) के अधिकार क्षेत्र में है।
                </p>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-500">Governed under Indian Information Technology Act & Laws of Karnataka</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold cursor-pointer transition-all shadow-md active:scale-95"
          >
            {lang === 'en' ? 'I Accept & Agree' : 'मैं सहमत हूँ'}
          </button>
        </div>

      </div>
    </div>
  );
};
