import React, { useState } from 'react';
import { ShieldCheck, Lock, Globe, FileText, CheckCircle2, ChevronDown } from 'lucide-react';

export interface ConsentState {
  resumeProcessing: boolean;
  aiDrafting: boolean;
  minorConsentVerified: boolean;
  isUnder18: boolean;
}

interface DPDPConsentBannerProps {
  onConsentChange: (consent: ConsentState) => void;
  onOpenPrivacyModal: () => void;
  onOpenTermsModal: () => void;
}

export const DPDPConsentBanner: React.FC<DPDPConsentBannerProps> = ({
  onConsentChange,
  onOpenPrivacyModal,
  onOpenTermsModal
}) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [resumeProcessing, setResumeProcessing] = useState(true);
  const [aiDrafting, setAiDrafting] = useState(true);
  const [isUnder18, setIsUnder18] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);

  const updateConsent = (
    newResume: boolean,
    newAi: boolean,
    newIsMinor: boolean,
    newParent: boolean
  ) => {
    onConsentChange({
      resumeProcessing: newResume,
      aiDrafting: newAi,
      isUnder18: newIsMinor,
      minorConsentVerified: !newIsMinor || newParent
    });
  };

  const handleResumeChange = (val: boolean) => {
    setResumeProcessing(val);
    updateConsent(val, aiDrafting, isUnder18, parentConsent);
  };

  const handleAiChange = (val: boolean) => {
    setAiDrafting(val);
    updateConsent(resumeProcessing, val, isUnder18, parentConsent);
  };

  const handleMinorChange = (val: boolean) => {
    setIsUnder18(val);
    updateConsent(resumeProcessing, aiDrafting, val, parentConsent);
  };

  const handleParentConsentChange = (val: boolean) => {
    setParentConsent(val);
    updateConsent(resumeProcessing, aiDrafting, isUnder18, val);
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-zinc-950/70 p-4 sm:p-5 text-xs text-zinc-300 space-y-3.5 backdrop-blur-md">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            {lang === 'en' ? 'Statutory Consent Notice (DPDP Act 2023 § 5 & § 6)' : 'वैधानिक सहमति सूचना (DPDP अधिनियम २०२३)'}
          </span>
        </div>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
          aria-label="Consent banner language"
          className="bg-zinc-900 border border-zinc-700 text-[11px] px-2 py-1 rounded text-zinc-300 font-mono outline-none cursor-pointer"
        >
          <option value="en">EN (English)</option>
          <option value="hi">HI (हिंदी)</option>
        </select>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-400">
        {lang === 'en'
          ? 'Anusandhan processes your academic transcripts, CV details, and publication links solely to match you with global faculty and synthesize outreach drafts. Zero data is sold to commercial coaching centers or ad networks.'
          : 'अनुसंधान आपके शैक्षणिक रिकॉर्ड और बायोडाटा का उपयोग केवल प्राध्यापकों से मिलान और पत्र ड्राफ्ट तैयार करने हेतु करता है। आपका डेटा किसी भी व्यावसायिक एजेंसी को नहीं बेचा जाता।'}
      </p>

      {/* Checkboxes */}
      <div className="space-y-2 text-[11px]">
        <label className="flex items-start space-x-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={resumeProcessing}
            onChange={(e) => handleResumeChange(e.target.checked)}
            className="mt-0.5 rounded accent-amber-500 cursor-pointer"
          />
          <span className="text-zinc-200">
            {lang === 'en'
              ? 'I consent to the collection and processing of my academic & resume data for lab matching (DPDP Act § 5).'
              : 'मैं प्रयोगशाला मिलान हेतु अपने शैक्षणिक डेटा के प्रसंस्करण की सहमति देता/देती हूँ।'}
          </span>
        </label>

        <label className="flex items-start space-x-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={aiDrafting}
            onChange={(e) => handleAiChange(e.target.checked)}
            className="mt-0.5 rounded accent-amber-500 cursor-pointer"
          />
          <span className="text-zinc-200">
            {lang === 'en'
              ? 'I consent to LLM-assisted draft synthesis tailored to professor publications.'
              : 'मैं प्रोफेसर शोध पत्रों के अनुरूप एआई ड्राफ्ट तैयार करने की अनुमति देता/देती हूँ।'}
          </span>
        </label>

        {/* Minor Scholar Protection Checkbox */}
        <div className="pt-1">
          <label className="flex items-center space-x-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={isUnder18}
              onChange={(e) => handleMinorChange(e.target.checked)}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>
              {lang === 'en'
                ? 'I am under 18 years of age (Requires Parent / Guardian Consent § 9)'
                : 'मेरी आयु 18 वर्ष से कम है (अभिभावक सहमति अनिवार्य)'}
            </span>
          </label>

          {isUnder18 && (
            <div className="mt-2 ml-5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <label className="flex items-start space-x-2 cursor-pointer text-amber-300 text-[11px]">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => handleParentConsentChange(e.target.checked)}
                  className="mt-0.5 rounded accent-amber-500 cursor-pointer"
                />
                <span>
                  {lang === 'en'
                    ? 'I confirm that my parent/legal guardian has reviewed and authorized this application.'
                    : 'मैं पुष्टि करता हूँ कि मेरे माता-पिता/अभिभावक ने इस आवेदन को अधिकृत किया है।'}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Legal Links */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            {lang === 'en' ? 'Read Privacy Policy' : 'गोपनीयता नीति पढ़ें'}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onOpenTermsModal}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            {lang === 'en' ? 'Terms & Anti-Spam Code' : 'नियम एवं आचार संहिता'}
          </button>
        </div>
        <span className="text-zinc-400">Grievance SLA: 48h / 30d</span>
      </div>

    </div>
  );
};
