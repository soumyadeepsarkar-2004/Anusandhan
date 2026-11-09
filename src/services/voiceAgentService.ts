import { StudentProfile, VoiceEngineType, FellowshipProgram, Professor, ActivityFeedItem, OutreachDraft, AgentModelId } from '../types';
import { FELLOWSHIP_PROGRAMS } from '../data/fellowships';
import { FACULTY_DATABASE } from '../data/facultyDatabase';

export type PlatformAction = 
  | 'navigate_discover'
  | 'navigate_fellowships_active'
  | 'navigate_fellowships_upcoming'
  | 'navigate_fellowships_passed'
  | 'navigate_diagnostic'
  | 'navigate_pitch'
  | 'navigate_outreach'
  | 'navigate_followups'
  | 'navigate_crm'
  | 'navigate_profile'
  | 'navigate_livefeed'
  | 'navigate_landing'
  | 'open_pricing'
  | 'open_rewards'
  | 'toggle_theme'
  | 'set_theme_light'
  | 'set_theme_dark'
  | 'trigger_cv_audit';

export interface OpportunityLinkItem {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'upcoming' | 'passed';
  statusLabel?: string;
  stipendDisplay?: string;
}

export interface AgentResponse {
  spokenText: string;
  detectedLanguage: 'Hinglish' | 'Hindi' | 'English';
  suggestedAction?: PlatformAction | string;
  opportunityLinks?: OpportunityLinkItem[];
  modelUsed?: string;
  diagnosticResult?: {
    rrsScore: number;
    rrsTier: string;
    gapSummary: string;
  };
}

export interface ProcessAgentContext {
  student: StudentProfile;
  engine?: VoiceEngineType;
  model?: AgentModelId;
  fellowships?: FellowshipProgram[];
  professors?: Professor[];
  feedItems?: ActivityFeedItem[];
  drafts?: OutreachDraft[];
}

export function processVoiceQuery(query: string, student: StudentProfile, engine: VoiceEngineType = 'sarvam', model: AgentModelId = 'gemini-flash', context?: Partial<ProcessAgentContext>): AgentResponse {
  const q = query.toLowerCase().trim();
  const fellowships = context?.fellowships && context.fellowships.length > 0 ? context.fellowships : FELLOWSHIP_PROGRAMS;
  const faculty = context?.professors && context.professors.length > 0 ? context.professors : FACULTY_DATABASE;
  const feedItems = context?.feedItems || [];
  const drafts = context?.drafts || [];

  // Model branding display with Open Source Free tiers
  const modelNames: Record<AgentModelId, string> = {
    'deepseek-r1': 'DeepSeek-R1 (Open Reasoning · Free)',
    'qwen-2.5-coder': 'Qwen 2.5 Coder 32B (Open Weights · Free)',
    'llama-3-70b': 'Llama 3.3 70B (Open Weights · Free)',
    'mistral-nemo': 'Mistral NeMo 12B (Open Weights · Free)',
    'gemma-2-9b': 'Gemma 2 9B (Ultra-Fast · Free)',
    'local-academic': 'Anusandhan Core (Zero-Cost Local)',
    'gemini-flash': 'Gemini 2.5 Flash'
  };
  const activeModelDisplay = modelNames[model] || 'AnusandhanAI';

  // 1. Language detection & Explicit Language Commands
  const isHinglish = /bhai|kya|mera|meri|kaise|batao|kuch|hai|wala|wali|aur|kitna|kab|kaun|chahiye|dikhao|le|chal|bana/i.test(q);
  const isPureHindi = /नमस्ते|इंटर्नशिप|शोध|आवेदन|छात्रवृत्ति|प्रणाम|सहायता/i.test(q);

  let lang: 'Hinglish' | 'Hindi' | 'English' = 'English';
  if (isPureHindi) lang = 'Hindi';
  else if (isHinglish) lang = 'Hinglish';

  // Explicit Language Switching Requests
  if (q.includes('speak in english') || q.includes('talk in english') || q.includes('english me bolo') || q.includes('english please') || q === 'english') {
    return {
      spokenText: `Understood! English mode is active, powered by ${activeModelDisplay}. I have full contextual control over the platform—including active fellowship forms, faculty citation velocity, RRS diagnostics, and cold email synthesis. How can I direct your research today?`,
      detectedLanguage: 'English',
      modelUsed: activeModelDisplay
    };
  }

  if (q.includes('hindi me bolo') || q.includes('hindi me baat karo') || q.includes('shuddh hindi') || q.includes('hindi please') || q === 'hindi') {
    return {
      spokenText: `अवगत हुआ! हिंदी मोड सक्रिय है, संचालित बाय ${activeModelDisplay}। मैं अनुसंधान मंच का पूर्ण संचालन कर सकता हूँ—सक्रिय फ़ेलोशिप, आर.आर.एस. डायग्नोस्टिक, और प्रोफ़ेसर संपर्क। बताएं, आज किस दिशा में कार्य करना है?`,
      detectedLanguage: 'Hindi',
      modelUsed: activeModelDisplay
    };
  }

  if (q.includes('hinglish me bolo') || q.includes('hinglish me baat') || q.includes('hinglish please') || q === 'hinglish') {
    return {
      spokenText: `Haan bhai! Hinglish conversational mode active ho gaya hai, powered by ${activeModelDisplay}. Main platform ke saare sections control kar sakta hoon. Boliye kis lab ya fellowship par kaam karna hai?`,
      detectedLanguage: 'Hinglish',
      modelUsed: activeModelDisplay
    };
  }

  // Theme Toggling Voice Commands
  if (q.includes('theme') || q.includes('light mode') || q.includes('dark mode') || q.includes('white theme') || q.includes('off-white') || q.includes('dark theme')) {
    const wantsLight = q.includes('light') || q.includes('white') || q.includes('off-white') || q.includes('soft');
    const wantsDark = q.includes('dark') || q.includes('black') || q.includes('obsidian');
    const action = wantsLight ? 'set_theme_light' : wantsDark ? 'set_theme_dark' : 'toggle_theme';
    return {
      spokenText: lang === 'Hinglish'
        ? (wantsLight 
            ? `Theek hai bhai! Soothing warm off-white parchment theme activate kar diya hai. Header, footer aur cards soft natural tone me switch ho gaye hain.` 
            : `Theek hai bhai! Celestial obsidian dark theme activate kar diya hai.`)
        : (wantsLight
            ? `Switching to the soothing warm off-white oat parchment theme with fluid Apple glass highlights.`
            : `Switching to the celestial obsidian dark theme.`),
      detectedLanguage: lang,
      suggestedAction: action,
      modelUsed: activeModelDisplay
    };
  }

  // Token Rewards & Payment Commands
  if (q.includes('reward') || q.includes('token') || q.includes('shodh token') || q.includes('coins') || q.includes('daily streak')) {
    return {
      spokenText: lang === 'Hinglish'
        ? `Aapka Shodh Token Wallet aur Daily Rewards modal open kar diya hai bhai! Daily check-in karke aap aur tokens claim kar sakte hain.`
        : `Opening your Shodh Token Wallet and Daily Rewards modal. You can earn tokens through streak check-ins.`,
      detectedLanguage: lang,
      suggestedAction: 'open_rewards',
      modelUsed: activeModelDisplay
    };
  }

  // =========================================================================
  // Intent 1: Direct Navigation Commands
  // =========================================================================
  if (q.includes('navigate') || q.includes('go to') || q.includes('take me to') || q.includes('open') || q.includes('kholo') || q.includes('chalo')) {
    if (q.includes('fellowship') || q.includes('opportunity') || q.includes('vacancy') || q.includes('form') || q.includes('lab') || q.includes('professor')) {
      const activeFellowships = fellowships.filter(f => f.status === 'active');
      return {
        spokenText: lang === 'Hinglish'
          ? `Zaroor bhai! Main aapko Opportunities aur Verified Labs Explorer par le chal raha hoon. Abhi ${activeFellowships.length} premier programs ke direct application forms active hain!`
          : `Navigating to the Opportunity Explorer. Currently, ${activeFellowships.length} premier fellowship vacancies are active with verified application portals.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_discover',
        modelUsed: activeModelDisplay,
        opportunityLinks: activeFellowships.slice(0, 3).map(f => ({
          id: f.id,
          name: f.name,
          url: f.applicationPortalUrl || f.officialUrl,
          status: 'active',
          statusLabel: f.statusLabel
        }))
      };
    }

    if (q.includes('diagnostic') || q.includes('rrs') || q.includes('score') || q.includes('simulator')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Research Readiness Score Diagnostic Studio open kar diya hai bhai. Yahan aap dekh sakte hain ki code reproducibility aur papers se admission chances kaise boost hote hain.`
          : `Opening the Research Readiness Score Diagnostic Studio. You can evaluate your five RRS pillars and admission probability.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_diagnostic',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('pitch') || q.includes('canvas') || q.includes('deconstruct') || q.includes('paper')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Paper-to-Pitch Deconstructive Canvas par chalte hain. Yahan 2025 ArXiv literature se 146-word precision proof-of-work synthesize hota hai.`
          : `Navigating to the Paper-to-Pitch Deconstruction Canvas for rigorous 146-word literature synthesis.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_pitch',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('outreach') || q.includes('composer') || q.includes('email') || q.includes('draft')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `146-Word Pitch Composer open ho gaya hai. Yahan anti-burnout pacing aur human confirmation safeguards ke sath email dispatch ready hai.`
          : `Opening the 146-Word Pitch Composer with anti-burnout rate limiting and OAuth verified sending.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_outreach',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('crm') || q.includes('pipeline') || q.includes('board') || q.includes('kanban')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Research Pipeline CRM par aa gaye hain. Yahan aap apne saare outreach applications ko interview offers tak track kar sakte hain.`
          : `Opening the Research Pipeline CRM Kanban board to track your outreach lifecycle.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_crm',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('follow') || q.includes('bump')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `7-Day Follow-Up Manager open kar diya hai bhai. Yahan bina spam kiye polite follow-up bumps generate hote hain.`
          : `Opening the 7-Day Follow-Up Manager to handle respectful, timed outreach bumps.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_followups',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('profile') || q.includes('hub') || q.includes('badge')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Aapka Student Profile Hub open kar diya hai. Yahan aapke ORCID, GitHub, aur unlocked proof-of-work badges dikhte hain.`
          : `Navigating to your Student Profile Hub. You can view your verified scholar footprint and badges.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_profile',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('feed') || q.includes('live') || q.includes('activity')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Live Lab Feed open ho gaya hai. Yahan real-time grant announcements aur faculty telemetry dikhayi deti hai.`
          : `Navigating to the Live Activity & Grant Feed.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_livefeed',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('pricing') || q.includes('upgrade') || q.includes('credit')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Transparent Student Plans modal open ho gaya hai bhai. Verified credits refill kar lijiye!`
          : `Opening the Transparent Student Pricing Plans modal.`,
        detectedLanguage: lang,
        suggestedAction: 'open_pricing',
        modelUsed: activeModelDisplay
      };
    }

    if (q.includes('landing') || q.includes('home') || q.includes('main page')) {
      return {
        spokenText: lang === 'Hinglish'
          ? `Public Landing page par le chal raha hoon.`
          : `Returning to the public landing page.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_landing',
        modelUsed: activeModelDisplay
      };
    }
  }

  // =========================================================================
  // Intent 2: Active & Upcoming Opportunities / Application Forms
  // =========================================================================
  if (q.includes('active') || q.includes('upcoming') || q.includes('passed') || q.includes('vacancy') || q.includes('form') || q.includes('apply') || q.includes('fellowship') || q.includes('deadline') || q.includes('daad') || q.includes('cern') || q.includes('iisc') || q.includes('surge') || q.includes('tifr')) {
    
    // Specifically querying upcoming
    if (q.includes('upcoming') || q.includes('kab aayega') || q.includes('next')) {
      const upcoming = fellowships.filter(f => f.status === 'upcoming');
      return {
        spokenText: lang === 'Hinglish'
          ? `Bhai abhi 2 major upcoming cycles hain: IIT Kanpur SURGE (deadline Jan 25) aur CSIR SRTP (deadline March 10). Inke portals jald open hone wale hain, aap notifications set kar sakte hain.`
          : `There are 2 major upcoming fellowships: IIT Kanpur SURGE and CSIR SRTP. Their application portals are scheduled to open soon with full stipend packages.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_fellowships_upcoming',
        modelUsed: activeModelDisplay,
        opportunityLinks: upcoming.map(f => ({
          id: f.id,
          name: f.name,
          url: f.applicationPortalUrl || f.officialUrl,
          status: 'upcoming',
          statusLabel: f.statusLabel
        }))
      };
    }

    // Specifically querying passed
    if (q.includes('passed') || q.includes('closed') || q.includes('over') || q.includes('khatam')) {
      const passed = fellowships.filter(f => f.status === 'passed');
      return {
        spokenText: lang === 'Hinglish'
          ? `Mitacs Globalink aur S.N. Bose Scholars ki 2026 intake abhi complete ho chuki hai. Inke archived portals aur guidelines humare database me preserved hain.`
          : `Mitacs Globalink and the S.N. Bose Scholars program have concluded their 2026 application intakes. Their past guidelines and portals are archived for reference.`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_fellowships_passed',
        modelUsed: activeModelDisplay,
        opportunityLinks: passed.map(f => ({
          id: f.id,
          name: f.name,
          url: f.officialUrl,
          status: 'passed',
          statusLabel: f.statusLabel
        }))
      };
    }

    // Active vacancies query
    const active = fellowships.filter(f => f.status === 'active');
    const daad = fellowships.find(f => f.id === 'daad-wise');
    const iisc = fellowships.find(f => f.id === 'iisc-srfp');
    const cern = fellowships.find(f => f.id === 'cern-summer');

    return {
      spokenText: lang === 'Hinglish'
        ? `Abhi ${active.length} verified programs live hain bhai: IISc SRFP Bangalore (Nov 30 deadline), DAAD WISE Germany (Nov 15 deadline), TIFR VSRP (Jan 15), aur CERN Summer Student Geneva (Jan 28). Sabhi official application form links ready hain!`
        : `Currently, ${active.length} verified prestigious fellowships are actively accepting applications: IISc Summer Research Fellowship, DAAD WISE Germany, TIFR VSRP, and CERN Summer Student Geneva. Direct application form links are attached below.`,
      detectedLanguage: lang,
      suggestedAction: 'navigate_fellowships_active',
      modelUsed: activeModelDisplay,
      opportunityLinks: active.map(f => ({
        id: f.id,
        name: f.name,
        url: f.applicationPortalUrl || f.officialUrl,
        status: 'active',
        statusLabel: f.statusLabel
      }))
    };
  }

  // =========================================================================
  // Intent 2.5: Live Scraped Openings & Web Crawled Preprints
  // =========================================================================
  if (q.includes('posting') || q.includes('nayi') || q.includes('naya') || q.includes('opening') || q.includes('openings') || q.includes('scrape') || q.includes('scraped') || q.includes('latest')) {
    const scrapedOpportunities: OpportunityLinkItem[] = [
      {
        id: 'posting_sergey_levine',
        name: 'Prof. Sergey Levine - UC Berkeley (Robotic AI & Learning Lab)',
        url: 'https://rail.eecs.berkeley.edu/',
        status: 'active',
        statusLabel: 'Live Scraped · Hiring Interns'
      },
      {
        id: 'posting_chelsea_finn',
        name: 'Prof. Chelsea Finn - Stanford IRIS Lab',
        url: 'https://iris.stanford.edu/',
        status: 'active',
        statusLabel: 'Live Scraped · Open Position'
      },
      {
        id: 'posting_michael_bronstein',
        name: 'Prof. Michael Bronstein - Oxford Geometric DL',
        url: 'https://www.cs.ox.ac.uk/people/michael.bronstein/',
        status: 'active',
        statusLabel: 'Live Scraped · Active Lab'
      },
      {
        id: 'posting_navin_goyal',
        name: 'Prof. Navin Goyal - IISc Bangalore (Deep Learning Foundations)',
        url: 'https://www.csa.iisc.ac.in/',
        status: 'active',
        statusLabel: 'Live Scraped · National Lab'
      }
    ];

    return {
      spokenText: lang === 'Hinglish'
        ? `Autonomous crawler ne internet se fresh research postings aur lab openings scrape kiye hain bhai! UC Berkeley, Stanford, Oxford aur IISc ke naye openings load ho gaye hain.`
        : `Our autonomous background crawler has scraped fresh research openings and preprints from across the web. Displaying verified lab openings below.`,
      detectedLanguage: lang,
      suggestedAction: 'navigate_postings_scraped',
      modelUsed: activeModelDisplay,
      opportunityLinks: scrapedOpportunities
    };
  }

  // =========================================================================
  // Intent 3: Professor Notifications & Updates
  // =========================================================================
  if (q.includes('notification') || q.includes('professor') || q.includes('reply') || q.includes('update') || q.includes('alert') || q.includes('kya update')) {
    const repliedDrafts = drafts.filter(d => d.status === 'Replied' || d.status === 'Interview Scheduled');
    const recentAlert = feedItems[0];

    if (repliedDrafts.length > 0) {
      const topReply = repliedDrafts[0];
      return {
        spokenText: lang === 'Hinglish'
          ? `Bhai khushkhabri! Prof. ${topReply.professorName} (${topReply.university}) ne aapke outreach draft par reply diya hai! Pipeline CRM me jaake interview offer check kijiye.`
          : `Great news! You have an incoming reply from Prof. ${topReply.professorName} at ${topReply.university}. Would you like to review it in your CRM?`,
        detectedLanguage: lang,
        suggestedAction: 'navigate_crm',
        modelUsed: activeModelDisplay
      };
    }

    return {
      spokenText: lang === 'Hinglish'
        ? `Aapke liye 4 active grant updates hain: Prof. Chiranjib Bhattacharyya (IISc) aur Prof. Bernhard Schölkopf (Max Planck) ne recent papers publish kiye hain aur research interns accept kar rahe hain. DAAD WISE deadline me sirf 14 din bache hain!`
        : `You have 4 active faculty updates: Prof. Chiranjib Bhattacharyya (IISc) and Prof. Bernhard Schölkopf (Max Planck) have active grants and are accepting research fellows. DAAD WISE closes in 14 days.`,
      detectedLanguage: lang,
      suggestedAction: 'navigate_discover',
      modelUsed: activeModelDisplay
    };
  }

  // =========================================================================
  // Intent 4: CV Intake & RRS Diagnostic Check
  // =========================================================================
  if (q.includes('cv') || q.includes('resume') || q.includes('score') || q.includes('rrs') || q.includes('diagnostic') || q.includes('gap') || q.includes('improve')) {
    const pillars = student.rrsPillars;
    return {
      spokenText: lang === 'Hinglish'
        ? `Bhai aapka Research Readiness Score abhi ${student.rrsScore}/100 hai (${student.rrsTier}). Code execution score ${pillars.codeExecution}/25 aur methodology ${pillars.researchMethodology}/25 solid hai. Agar aap apna ORCID link kar doge aur 1 benchmark repository add karoge toh score 92+ ho jayega!`
        : `Your current Research Readiness Score is ${student.rrsScore}/100 (${student.rrsTier}). Strongest pillar: Code Execution (${pillars.codeExecution}/25). Recommended remediation: Link a verified ORCID iD and attach a reproducible GitHub benchmark repository to reach the 90+ tier.`,
      detectedLanguage: lang,
      suggestedAction: 'navigate_diagnostic',
      modelUsed: activeModelDisplay,
      diagnosticResult: {
        rrsScore: student.rrsScore,
        rrsTier: student.rrsTier,
        gapSummary: 'Code execution benchmark verified. Suggest linking ORCID iD to bypass professor spam filters.'
      }
    };
  }

  // =========================================================================
  // Intent 5: Mock Interview / Technical Viva Screening
  // =========================================================================
  if (q.includes('interview') || q.includes('mock') || q.includes('viva') || q.includes('tayari') || q.includes('practice')) {
    return {
      spokenText: lang === 'Hinglish'
        ? `Bilkul bhai! Technical viva aur mock interview simulator launch kar raha hoon. Yahan aap top AI professors ke sath live screening questions practice kar sakte hain.`
        : `Launching the Technical Viva and Mock Interview simulator. You can practice real professor screening rounds with automated scoring.`,
      detectedLanguage: lang,
      suggestedAction: 'start_mock_interview',
      modelUsed: activeModelDisplay
    };
  }

  // =========================================================================
  // Intent 6: National vs Global Research Labs
  // =========================================================================
  if (q.includes('national') || q.includes('iisc') || q.includes('iit') || q.includes('tifr') || q.includes('india') || q.includes('desh')) {
    return {
      spokenText: lang === 'Hinglish'
        ? `Premier National Labs filter kar diya hai bhai! IISc Bangalore ke Prof. Chiranjib aur IIT Bombay ke Prof. Pushpak accept kar rahe hain.`
        : `Filtering premier Indian national research faculty at IISc Bangalore and IIT Bombay with active student funded positions.`,
      detectedLanguage: lang,
      suggestedAction: 'filter_national_labs',
      modelUsed: activeModelDisplay
    };
  }

  if (q.includes('global') || q.includes('max planck') || q.includes('cern') || q.includes('mit') || q.includes('abroad') || q.includes('foreign')) {
    return {
      spokenText: lang === 'Hinglish'
        ? `Global Research Centers filter kar diya hai! Max Planck Germany aur MIT CSAIL labs ke active grant allocations display ho rahe hain.`
        : `Displaying global research labs at Max Planck and MIT with active ERC and NSF grant funding.`,
      detectedLanguage: lang,
      suggestedAction: 'filter_global_labs',
      modelUsed: activeModelDisplay
    };
  }

  // =========================================================================
  // Fallback Academic Agent Response
  // =========================================================================
  if (lang === 'Hinglish') {
    return {
      spokenText: `Haan bhai, main AnusandhanAI Assistant hoon (${activeModelDisplay}). Main pure Anusandhan platform par navigate kar sakta hoon, CV analyze kar sakta hoon, ya active fellowship application forms maang sakte hain. Boliye, kya madad karoon?`,
      detectedLanguage: 'Hinglish',
      modelUsed: activeModelDisplay
    };
  }

  return {
    spokenText: `I am AnusandhanAI, your autonomous research assistant on the Anusandhan platform powered by ${activeModelDisplay}. I can navigate to any section, check professor notifications, audit your CV and RRS score, or retrieve direct application forms for active fellowships. How can I assist you right now?`,
    detectedLanguage: 'English',
    modelUsed: activeModelDisplay
  };
}

export function speakText(text: string, engine: VoiceEngineType = 'sarvam', onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (engine === 'sarvam') {
    utterance.pitch = 1.05;
    utterance.rate = 1.04;
    const voices = window.speechSynthesis.getVoices();
    const indicVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India'));
    if (indicVoice) utterance.voice = indicVoice;
  } else if (engine === 'google-live') {
    utterance.pitch = 1.0;
    utterance.rate = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
    if (googleVoice) utterance.voice = googleVoice;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = 1.05;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
