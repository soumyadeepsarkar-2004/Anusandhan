import React, { useState } from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Lock, Globe, Building2, UserCheck, AlertTriangle } from 'lucide-react';
import { AppleGlassCard } from '../ui/AppleGlass';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {lang === 'en' ? 'Privacy Policy & Statutory Disclosures' : 'गोपनीयता नीति एवं वैधानिक खुलासे'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                DPDP Act 2023 (India) · GDPR (EU) · FERPA Compliant · Last Updated: 2026
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher for 8th Schedule Mandate */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
              aria-label="Privacy policy language"
              className="bg-white/[0.05] border border-white/12 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 outline-none focus:border-amber-500 font-mono cursor-pointer backdrop-blur-md"
            >
              <option value="en" className="bg-zinc-900 text-white">English (Official)</option>
              <option value="hi" className="bg-zinc-900 text-white">हिंदी (8th Schedule)</option>
            </select>

            <button
              onClick={onClose}
              aria-label="Close privacy policy"
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
                  1. Statutory Context & Legal Roles
                </h3>
                <p>
                  This Privacy Notice is provided by <strong>Anusandhan</strong> (&quot;Anusandhan&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), an open academic research platform and initiative founded and maintained by <strong>Soumyadeep Sarkar</strong>, in compliance with <strong>Section 5 of the Digital Personal Data Protection Act, 2023 (DPDP Act 2023)</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>Family Educational Rights and Privacy Act (FERPA)</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10">
                    <span className="font-mono text-zinc-400 block font-semibold text-[11px]">DATA FIDUCIARY (§ 2(i))</span>
                    <span className="text-white">Anusandhan Research Initiative · Lead: Soumyadeep Sarkar</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10">
                    <span className="font-mono text-zinc-400 block font-semibold text-[11px]">DATA PRINCIPAL (§ 2(j))</span>
                    <span className="text-white">Student applicant / independent research scholar</span>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  2. Purpose Specification & Educational Non-Resale Guarantee
                </h3>
                <p>
                  We collect student profile details, academic records (CGPA, coursework, university name), research papers, code repositories, and CV/resumes solely for the following specified, legitimate educational purposes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li>Algorithmic matching of student technical qualifications with open lab vacancies, research grants, and prestige fellowships (DAAD, Mitacs, CERN, TIFR, IISc).</li>
                  <li>Calculating Research Readiness Scores (RRS™) and diagnosing technical trajectory gaps.</li>
                  <li>Synthesizing 146-word precision cold pitch correspondence tailored to principal investigators.</li>
                  <li>Multi-lingual voice interview simulations and mock viva defense screening.</li>
                </ul>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  <strong>Strict Educational Non-Resale Guarantee (FERPA § 99.31 & DPDP § 6):</strong> Under no circumstances are student resumes, names, transcripts, or contact details sold, rented, monetized, or shared with commercial coaching centers or 3rd-party ad aggregators.
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  3. Rights of the Data Principal (India DPDP & EU GDPR)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-amber-400 font-semibold block mb-1">Right to Access (§ 11)</span>
                    <span>Download your complete telemetry, processed CV metrics, and draft history in structured JSON at any time.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-amber-400 font-semibold block mb-1">Right to Correction (§ 12(1))</span>
                    <span>Edit, update CGPA, add new publications, or refresh technical skills directly from the Student Profile Hub.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-amber-400 font-semibold block mb-1">Right to Erasure / Purge (§ 12(2))</span>
                    <span>Request permanent hard deletion of all stored resumes, embeddings, and credentials with immediate effect.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-amber-400 font-semibold block mb-1">Right of Nomination (§ 14)</span>
                    <span>Designate a representative to exercise privacy rights in the event of death or legal incapacity.</span>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  4. Protection of Minor Scholars (§ 9 DPDP Act)
                </h3>
                <p>
                  In accordance with Section 9 of the DPDP Act 2023, individuals under 18 years of age (&quot;children&quot;) must provide verified parental or lawful guardian authorization before submitting academic resumes. We enforce an absolute prohibition against behavioral profiling or targeted advertising directed at minor students.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  5. Statutory Grievance Redressal & Nodal Officer
                </h3>
                <p>
                  In accordance with Section 8(9) & Section 13 of the DPDP Act 2023, the designated project lead and data privacy custodian is:
                </p>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700/80 font-mono text-zinc-300 space-y-1.5">
                  <div><strong>Lead & Custodian:</strong> Soumyadeep Sarkar</div>
                  <div><strong>Initiative:</strong> Anusandhan (Open Academic Research Initiative)</div>
                  <div><strong>GitHub Project:</strong> <a href="https://github.com/soumyadeepsarkar-2004/Anusandhan" target="_blank" rel="noreferrer" className="text-amber-400 underline">github.com/soumyadeepsarkar-2004/Anusandhan</a></div>
                  <div><strong>Official Contact:</strong> <a href="mailto:soumyadeepsarkar2004@outlook.com" className="text-amber-400 underline">soumyadeepsarkar2004@outlook.com</a></div>
                  <div><strong>Response Time:</strong> Acknowledgment within 48 hours.</div>
                  <div className="text-[11px] text-zinc-400 pt-1">Escalation Authority: Data Protection Board of India (DPBI) at <a href="https://dpbi.gov.in" target="_blank" rel="noreferrer" className="underline text-amber-300">https://dpbi.gov.in</a></div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Hindi Translation under 8th Schedule Mandate */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  १. वैधानिक भूमिका एवं परिचय
                </h3>
                <p>
                  यह गोपनीयता सूचना <strong>डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDP Act 2023)</strong> की धारा 5 के अनुपालन में अनुसंधान (सौम्यदीप सरकार द्वारा संचालित ओपन एकेडेमिक रिसर्च इनिशिएटिव) द्वारा जारी की गई है।
                </p>
                <p>
                  हम छात्र आवेदक को &quot;डेटा प्रिंसिपल&quot; और अनुसंधान को &quot;डेटा फिड्यूशरी&quot; के रूप में वर्गीकृत करते हैं।
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  २. डेटा संग्रहण का सीमित उद्देश्य
                </h3>
                <p>
                  आपके रिज्यूमे और शैक्षणिक विवरण (अंक, शोध पत्र, विश्वविद्यालय) का उपयोग केवल निम्नलिखित शैक्षणिक उद्देश्यों के लिए किया जाता है:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li>विश्वस्तरीय प्रयोगशालाओं, प्रोफेसरों और छात्रवृत्ति (DAAD, Mitacs, CERN, TIFR) से मिलान।</li>
                  <li>अनुसंधान तत्परता स्कोर (RRS™) का मूल्यांकन और सुझाव।</li>
                  <li>प्रोफेसरों के लिए 146 शब्दों के सटीक ईमेल ड्राफ्ट तैयार करना।</li>
                </ul>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  <strong>डेटा सुरक्षा की गारंटी:</strong> आपका व्यक्तिगत बायोडाटा या संपर्क किसी भी व्यावसायिक कोचिंग सेंटर या तृतीय पक्ष को कभी नहीं बेचा जाएगा।
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  ३. डेटा प्रिंसिपल के अधिकार (धारा ११-१४)
                </h3>
                <p>
                  आपको अपने डेटा को देखने, संशोधित करने, डाउनलोड करने और पूरी तरह से मिटाने (राइट टू बी फॉरगॉटन) का पूर्ण अधिकार है।
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  ४. संपर्क एवं समाधान (Grievance & Support)
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 font-mono text-zinc-300 space-y-1.5">
                  <div><strong>परियोजना प्रमुख:</strong> सौम्यदीप सरकार (Soumyadeep Sarkar)</div>
                  <div><strong>पहल:</strong> अनुसंधान ओपन रिसर्च प्रोजेक्ट</div>
                  <div><strong>ईमेल:</strong> soumyadeepsarkar2004@outlook.com</div>
                  <div><strong>गिटहब:</strong> github.com/soumyadeepsarkar-2004/Anusandhan</div>
                  <div><strong>समय सीमा:</strong> 48 घंटों में पावती; त्वरित समाधान।</div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-500">Secured via TLS 1.3 & AES-256 GCM</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold cursor-pointer transition-all shadow-md active:scale-95"
          >
            {lang === 'en' ? 'Acknowledge & Close' : 'स्वीकार करें एवं बंद करें'}
          </button>
        </div>

      </div>
    </div>
  );
};
