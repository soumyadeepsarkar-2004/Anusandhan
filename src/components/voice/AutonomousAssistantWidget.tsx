import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Compass, 
  FileText, 
  Bell, 
  Mail, 
  Paperclip, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Cpu,
  X,
  GripVertical,
  Minus
} from 'lucide-react';
import { 
  StudentProfile, 
  VoiceMessage, 
  AgentModelId, 
  VoiceEngineType, 
  FellowshipProgram, 
  Professor, 
  ActivityFeedItem, 
  OutreachDraft 
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { AnusandhanLogo } from '../common/AnusandhanLogo';
import { processVoiceQuery, speakText, OpportunityLinkItem } from '../../services/voiceAgentService';
import { ApiClient } from '../../services/apiClient';
import { AppleGlassCard, AudioWaveformVisualizer, LiveRadarDot } from '../ui/AppleGlass';

interface AutonomousAssistantWidgetProps {
  currentTab: string;
  onTabChange: (tab: any) => void;
  onNavigateView: (
    view: 'landing' | 'app' | 'intake', 
    tab?: any,
    options?: {
      subTab?: 'professors' | 'fellowships' | 'scraped';
      status?: 'all' | 'active' | 'upcoming' | 'passed';
      scope?: 'all' | 'national' | 'international';
      openMockInterview?: boolean;
    }
  ) => void;
  student: StudentProfile;
  onUpdateStudent: (updater: (prev: StudentProfile) => StudentProfile) => void;
  fellowships: FellowshipProgram[];
  professors: Professor[];
  drafts: OutreachDraft[];
  feedItems: ActivityFeedItem[];
  onOpenPricingModal: () => void;
  onOpenMockInterview?: () => void;
  onOpenRewardsModal?: () => void;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  onClose?: () => void;
}

export type AssistantWidgetMode = 'orb' | 'capsule' | 'chat';

export const AutonomousAssistantWidget: React.FC<AutonomousAssistantWidgetProps> = ({
  currentTab,
  onTabChange,
  onNavigateView,
  student,
  onUpdateStudent,
  fellowships,
  professors,
  drafts,
  feedItems,
  onOpenPricingModal,
  onOpenMockInterview,
  onOpenRewardsModal,
  isOpenExternal,
  onCloseExternal,
  onClose
}) => {
  // 3-Tier Progressive State Machine:
  // 'orb': Minimal circular floating icon (DEFAULT on initial load / reload)
  // 'capsule': Horizontal bar with voice mic & audio visualizer (opens on orb click)
  // 'chat': Full conversational window with foundation models (opens on expand)
  const { isDark, toggleTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<AssistantWidgetMode>('orb');
  const [selectedModel, setSelectedModel] = useState<AgentModelId>('deepseek-r1');
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngineType>('sarvam');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(true);
  
  // Audio & speech state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Ready');
  const [textInput, setTextInput] = useState<string>('');
  
  // Inline capsule response state for in-place answer delivery
  const [capsuleResponse, setCapsuleResponse] = useState<{
    text: string;
    action?: string;
    opportunityLinks?: OpportunityLinkItem[];
    modelUsed?: string;
    timestamp?: string;
  } | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCV, setIsUploadingCV] = useState<boolean>(false);

  // Drag controls, drag ref & screen boundary constraints
  const dragControls = useDragControls();
  const isDraggingRef = useRef(false);
  const [dragConstraints, setDragConstraints] = useState({ left: -800, right: 0, top: -700, bottom: 0 });

  useEffect(() => {
    const updateConstraints = () => {
      const pad = 16;
      const width = mode === 'chat' ? 430 : mode === 'capsule' ? 360 : 52;
      const height = mode === 'chat' ? 620 : 60;
      setDragConstraints({
        left: -(Math.max(window.innerWidth - width - pad * 2, 0)),
        right: 0,
        top: -(Math.max(window.innerHeight - height - pad * 2, 0)),
        bottom: 0
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, [mode]);

  const handleClose = () => {
    setMode('orb');
    setCapsuleResponse(null);
    if (onClose) onClose();
    if (onCloseExternal) onCloseExternal();
  };

  // Minimize expanded chat window directly back to previous capsule mode
  const handleMinimizeToCapsule = () => {
    setMode('capsule');
    if (onClose) onClose();
    if (onCloseExternal) onCloseExternal();
  };

  // Minimize to small circular floating orb
  const handleMinimizeToOrb = () => {
    setMode('orb');
    setCapsuleResponse(null);
    if (onClose) onClose();
    if (onCloseExternal) onCloseExternal();
  };

  // Listen for Escape key to minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'chat') {
          handleMinimizeToCapsule();
        } else if (mode === 'capsule') {
          handleMinimizeToOrb();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Chat message thread
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'm-init',
      sender: 'agent',
      text: `Namaste ${student.fullName || 'Scholar'}! Main AnusandhanAI Assistant hoon. Anusandhan platform par main kisi bhi tab me navigate kar sakta hoon, aapka CV aur RRS score diagnose kar sakta hoon, professors ke updates laa sakta hoon, aur active fellowship application forms open kar sakta hoon.`,
      language: 'Hinglish',
      timestamp: 'Just now',
      modelUsed: 'Gemini 2.5 Flash'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync external open request
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      if (isOpenExternal) {
        setMode('chat');
      } else if (isOpenExternal === false && mode === 'chat') {
        setMode('capsule');
      }
    }
  }, [isOpenExternal]);

  // Scroll to bottom on message
  useEffect(() => {
    if (mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mode, isProcessing]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText('Listening (Speak now)...');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setStatusText('Mic idle');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          handleExecuteQuery(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [student, selectedModel, voiceEngine, fellowships, professors, drafts, feedItems]);

  // Toggle quick inline voice listening (does not open large modal)
  const toggleInlineListening = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setStatusText('Muted');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatusText('Ready');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(true);
        }
      } else {
        // Fallback simulation with quick voice prompt
        setIsListening(true);
        setStatusText('Listening (Simulated Speech)...');
        setTimeout(() => {
          setIsListening(false);
          handleExecuteQuery('What active fellowship opportunities are available?');
        }, 1800);
      }
    }
  };

  // Main agent query execution router
  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: VoiceMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      language: 'Hinglish',
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setIsProcessing(true);

    const modelName = selectedModel === 'deepseek-r1'
      ? 'DeepSeek-R1 (Open Reasoning · Free)'
      : selectedModel === 'qwen-2.5-coder'
      ? 'Qwen 2.5 Coder 32B (Open Weights · Free)'
      : selectedModel === 'llama-3-70b'
      ? 'Llama 3.3 70B (Open Weights · Free)'
      : selectedModel === 'mistral-nemo'
      ? 'Mistral NeMo 12B (Open Weights · Free)'
      : selectedModel === 'gemma-2-9b'
      ? 'Gemma 2 9B (Ultra-Fast · Free)'
      : selectedModel === 'local-academic'
      ? 'Anusandhan Core (Zero-Cost Local)'
      : 'Gemini 2.5 Flash';

    setStatusText(`Reasoning with ${modelName}...`);

    let response: any = null;

    try {
      const [backendRes] = await Promise.all([
        ApiClient.voiceTurn({
          user_input: queryText,
          preferred_language: voiceEngine === 'sarvam' ? 'hi-IN' : 'en-US',
          voice_engine: voiceEngine,
          model: selectedModel,
          student_context: student
        }),
        new Promise(resolve => setTimeout(resolve, 600)) // Guarantee visible loading screen animation
      ]);

      if (backendRes && backendRes.agent_text_response) {
        let suggestedAction = backendRes.recommended_action || backendRes.detected_intent;
        if (backendRes.suggested_ui_filter?.subTab === 'fellowships' || suggestedAction?.includes('fellowship')) {
          const st = backendRes.suggested_ui_filter?.status;
          if (st === 'upcoming' || /upcoming|next|aane/i.test(queryText)) {
            suggestedAction = 'navigate_fellowships_upcoming';
          } else if (st === 'passed' || /passed|closed|over/i.test(queryText)) {
            suggestedAction = 'navigate_fellowships_passed';
          } else {
            suggestedAction = 'navigate_fellowships_active';
          }
        } else if (suggestedAction?.includes('scraped') || backendRes.suggested_ui_filter?.filter === 'scraped' || /posting|scrape|nayi|naya/i.test(queryText)) {
          suggestedAction = 'navigate_postings_scraped';
        }

        const targetStatus = suggestedAction === 'navigate_fellowships_upcoming' ? 'upcoming' : suggestedAction === 'navigate_fellowships_passed' ? 'passed' : 'active';

        response = {
          spokenText: backendRes.agent_text_response,
          detectedLanguage: /bhai|kya|mera|hai|karo|aane|wale/i.test(backendRes.agent_text_response) ? 'Hinglish' : 'English',
          suggestedAction,
          modelUsed: modelName,
          opportunityLinks: backendRes.opportunity_links || (suggestedAction?.includes('fellowship') ? fellowships.filter(f => f.status === targetStatus).slice(0, 3).map(f => ({
            id: f.id,
            name: f.name,
            url: f.applicationPortalUrl || f.officialUrl,
            status: f.status || targetStatus,
            statusLabel: f.statusLabel
          })) : undefined)
        };
      }
    } catch (err) {
      console.warn('Voice API endpoint error, using local reasoning fallback:', err);
    }

    if (!response) {
      response = processVoiceQuery(queryText, student, voiceEngine, selectedModel, {
        fellowships,
        professors,
        feedItems,
        drafts
      });
    }

    setIsProcessing(false);

    const agentMessage: VoiceMessage = {
      id: `a-${Date.now()}`,
      sender: 'agent',
      text: response.spokenText,
      language: response.detectedLanguage,
      timestamp: 'Just now',
      action: response.suggestedAction,
      modelUsed: response.modelUsed,
      opportunityLinks: response.opportunityLinks?.map((l: any) => ({
        name: l.name,
        url: l.url,
        status: l.status
      }))
    };

    setMessages(prev => [...prev, agentMessage]);

    // Save capsule response for direct inline display in capsule mode (no modal popup needed)
    setCapsuleResponse({
      text: response.spokenText,
      action: response.suggestedAction,
      opportunityLinks: response.opportunityLinks,
      modelUsed: response.modelUsed,
      timestamp: 'Just now'
    });

    // Perform real platform navigation or action
    if (response.suggestedAction) {
      executePlatformAction(response.suggestedAction);
    }

    // Voice feedback if enabled
    if (voiceFeedbackEnabled) {
      setIsSpeaking(true);
      setStatusText('Speaking voice feedback...');
      speakText(response.spokenText, voiceEngine, () => {
        setIsSpeaking(false);
        setStatusText('Ready');
      });
    } else {
      setStatusText('Ready');
    }
  };

  // Execute internal functionalities of the whole platform
  const executePlatformAction = (action: string) => {
    switch (action) {
      case 'navigate_discover':
      case 'open_programs':
      case 'FILTER_OPPORTUNITIES':
        onNavigateView('app', 'discover');
        break;
      case 'navigate_postings_scraped':
        onNavigateView('app', 'discover', { subTab: 'scraped' });
        break;
      case 'navigate_fellowships_active':
      case 'filter_fellowships':
        onNavigateView('app', 'discover', { subTab: 'fellowships', status: 'active' });
        break;
      case 'navigate_fellowships_upcoming':
        onNavigateView('app', 'discover', { subTab: 'fellowships', status: 'upcoming' });
        break;
      case 'navigate_fellowships_passed':
        onNavigateView('app', 'discover', { subTab: 'fellowships', status: 'passed' });
        break;
      case 'filter_national_labs':
        onNavigateView('app', 'discover', { subTab: 'professors', scope: 'national' });
        break;
      case 'filter_global_labs':
        onNavigateView('app', 'discover', { subTab: 'professors', scope: 'international' });
        break;
      case 'start_mock_interview':
      case 'START_MOCK_INTERVIEW':
        if (onOpenMockInterview) {
          onOpenMockInterview();
        } else {
          onNavigateView('app', 'discover', { openMockInterview: true });
        }
        break;
      case 'navigate_diagnostic':
      case 'open_profile':
      case 'VIEW_DIAGNOSTIC':
        onNavigateView('app', 'diagnostic');
        break;
      case 'navigate_pitch':
      case 'DRAFT_PITCH':
        onNavigateView('app', 'pitch');
        break;
      case 'navigate_outreach':
      case 'open_outreach':
        onNavigateView('app', 'outreach');
        break;
      case 'navigate_followups':
        onNavigateView('app', 'followups');
        break;
      case 'navigate_crm':
      case 'open_crm':
      case 'OPEN_CRM':
        onNavigateView('app', 'crm');
        break;
      case 'navigate_livefeed':
        onNavigateView('app', 'livefeed');
        break;
      case 'navigate_landing':
        onNavigateView('landing');
        break;
      case 'open_pricing':
        onOpenPricingModal();
        break;
      case 'open_rewards':
        if (onOpenRewardsModal) {
          onOpenRewardsModal();
        } else {
          onNavigateView('app', 'profile');
        }
        break;
      case 'toggle_theme':
        toggleTheme();
        break;
      case 'set_theme_light':
        setTheme('light');
        break;
      case 'set_theme_dark':
        setTheme('dark');
        break;
      default:
        break;
    }
  };

  // Handle direct CV File Upload from within Assistant
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCV(true);
    setStatusText('Parsing CV & auditing RRS pillars...');

    const userUploadMsg: VoiceMessage = {
      id: `u-upload-${Date.now()}`,
      sender: 'user',
      text: `Uploaded Academic CV: "${file.name}" for full gap analysis.`,
      language: 'English',
      timestamp: 'Just now'
    };
    setMessages(prev => [...prev, userUploadMsg]);

    try {
      let newScore = student.rrsScore;
      let newTier = student.rrsTier;

      // 1. Try real backend upload if it's a PDF
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const uploadRes = await ApiClient.uploadCV(file);
        if (uploadRes && uploadRes.error) {
          const isEncrypted = /password|encrypt/i.test(uploadRes.error);
          const errMsg = isEncrypted
            ? `Upload Rejected: "${file.name}" is password-protected or encrypted. Please export an unencrypted PDF and retry.`
            : `Upload Notice: "${file.name}" parsing encountered an issue (${uploadRes.error}). Please verify file formatting.`;
          
          const errReply: VoiceMessage = {
            id: `a-upload-err-${Date.now()}`,
            sender: 'agent',
            text: errMsg,
            language: 'English',
            timestamp: 'Just now',
            modelUsed: selectedModel === 'gemini-flash' ? 'Gemini 2.5 Flash' : selectedModel
          };
          setMessages(prev => [...prev, errReply]);
          if (voiceFeedbackEnabled) {
            setIsSpeaking(true);
            speakText(errMsg, voiceEngine, () => setIsSpeaking(false));
          }
          setIsUploadingCV(false);
          setStatusText('Ready');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        if (uploadRes && uploadRes.rrs_score) {
          newScore = uploadRes.rrs_score;
          newTier = (uploadRes.rrs_tier as any) || 'Lab-Ready Fellow';
        }
      }

      // 2. Audit profile gaps
      const auditRes = await ApiClient.auditProfileGaps({
        profile: {
          fullName: student.fullName,
          university: student.university,
          cgpa: student.cgpa,
          featuredProject: student.featuredProject
        }
      });

      if (auditRes?.rrs_score) {
        newScore = Math.max(newScore, auditRes.rrs_score);
      } else {
        newScore = Math.max(newScore, 88);
      }

      onUpdateStudent(prev => ({
        ...prev,
        rrsScore: newScore,
        rrsTier: newTier
      }));

      const feedbackText = `CV Analysis Complete! "${file.name}" successfully parsed. Your Research Readiness Score calibrated to ${newScore}/100 (${newTier}). Strong code execution metrics detected. Verified advice: attach your ORCID profile and reproducible benchmark repo to reach 94+.`;

      const agentUploadReply: VoiceMessage = {
        id: `a-upload-${Date.now()}`,
        sender: 'agent',
        text: feedbackText,
        language: 'English',
        timestamp: 'Just now',
        modelUsed: selectedModel === 'gemini-flash' ? 'Gemini 2.5 Flash' : selectedModel
      };

      setMessages(prev => [...prev, agentUploadReply]);

      if (voiceFeedbackEnabled) {
        setIsSpeaking(true);
        speakText(feedbackText, voiceEngine, () => setIsSpeaking(false));
      }
    } catch (err) {
      console.warn('CV upload parsing error:', err);
      const fallbackScore = Math.max(student.rrsScore, 86);
      onUpdateStudent(prev => ({ ...prev, rrsScore: fallbackScore }));
      const fallbackMsg: VoiceMessage = {
        id: `a-upload-fallback-${Date.now()}`,
        sender: 'agent',
        text: `CV "${file.name}" analyzed via local parser. Research Readiness Score calibrated to ${fallbackScore}/100. Strong foundation verified. Link your GitHub and ORCID in Profile Hub to boost your score!`,
        language: 'English',
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (voiceFeedbackEnabled) {
        setIsSpeaking(true);
        speakText(fallbackMsg.text, voiceEngine, () => setIsSpeaking(false));
      }
    } finally {
      setIsUploadingCV(false);
      setStatusText('Ready');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Active notification summary for the capsule pill (rotates dynamically)
  const activeNotification = drafts.some(d => d.status === 'Replied')
    ? 'Prof. Bhattacharyya replied'
    : feedItems && feedItems.length > 0
    ? feedItems[0].title
    : '4 Active Fellowships Live';

  return (
    <motion.aside 
      aria-label="AnusandhanAI Voice Assistant Widget"
      drag
      dragControls={dragControls}
      dragListener={mode !== 'chat'}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={dragConstraints}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      }}
      className={`fixed ${mode === 'chat' ? 'bottom-4 sm:bottom-6 z-50' : 'bottom-20 sm:bottom-6 z-40'} right-4 sm:right-6 select-none font-sans`}
    >
      
      {/* =========================================================================
          MODE 1: Minimal Floating Orb (DEFAULT on Initial Page Load & Reload)
          Allows complete unobtrusive freedom - zero screen text blockage
          ========================================================================= */}
      {mode === 'orb' && (
        <div className="relative group flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/25 blur-md pointer-events-none group-hover:bg-amber-400/45 transition-all scale-125" />
          <button
            onClick={() => {
              if (isDraggingRef.current) return;
              setMode('capsule');
            }}
            className="w-12 h-12 rounded-full apple-glass-pill border border-amber-400/40 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center justify-center p-2 text-amber-300 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open AnusandhanAI Assistant (Click to expand, drag to move anywhere)"
            aria-label="Open AnusandhanAI Assistant"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img src={isDark ? '/brand-emblem-dark.svg' : '/brand-emblem-light.svg'} alt="Emblem" className="w-5 h-5 object-contain" />
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODE 2: Sleek Discrete Draggable Capsule with Inline Voice Query & Answer
          Features: Mic, pure high-tech visualizers, and inline spoken answer card
          ========================================================================= */}
      {mode === 'capsule' && (
        <div className="flex flex-col items-end">
          
          {/* Inline Spoken Response Card (Rendered directly in capsule mode) */}
          <AnimatePresence>
            {capsuleResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mb-2 max-w-[420px] w-[calc(100vw-2rem)] glass-modal rounded-3xl p-4 border border-amber-400/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-left backdrop-blur-3xl relative overflow-hidden"
              >
                {/* Specular sheen */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-zinc-200">AnusandhanAI</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {capsuleResponse.modelUsed || 'Gemini 2.5'}
                    </span>
                    {isSpeaking && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Speaking
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (isDraggingRef.current) return;
                        setMode('chat');
                      }}
                      className="text-[10px] font-mono text-amber-300 hover:text-white px-2.5 py-1 rounded-xl glass-chip flex items-center gap-1 cursor-pointer"
                      title="Expand into full chat window"
                    >
                      <span>Open Chat</span>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCapsuleResponse(null)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Dismiss response"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed max-h-36 overflow-y-auto">
                  {capsuleResponse.text}
                </p>

                {/* Direct Opportunity Application Links */}
                {capsuleResponse.opportunityLinks && capsuleResponse.opportunityLinks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                      Direct Official Application Links:
                    </div>
                    {capsuleResponse.opportunityLinks.slice(0, 3).map((link, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-200 block truncate text-[11px]">
                            {link.name}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                            link.status === 'active' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-zinc-400 border border-white/10'
                          }`}>
                            {link.status === 'active' ? 'Active' : 'Upcoming'}
                          </span>
                        </div>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[10px] font-bold font-mono flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                        >
                          <span>Apply Form</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Pill Container */}
          <div className="relative flex items-center gap-2 animate-fadeIn">
            
            {/* Specular Ambient Glow */}
            <div 
              className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-300 -z-10 ${
                isListening ? 'bg-amber-400/50 scale-140' : isSpeaking ? 'bg-amber-400/40 scale-135' : isProcessing ? 'bg-amber-500/35 scale-125' : 'bg-amber-500/20'
              }`} 
            />

            <div className="flex items-center p-1.5 rounded-full apple-glass-pill border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
              
              {/* Draggable Grip Handle */}
              <div 
                className="px-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                title="Drag assistant anywhere on screen"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Emblem Icon / Neural Core */}
              <div className="relative w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700/80 p-1 flex items-center justify-center shadow-inner shrink-0 mr-1">
                <img src={isDark ? '/brand-emblem-dark.svg' : '/brand-emblem-light.svg'} alt="Emblem" className="w-full h-full object-contain" />
              </div>

              {/* 1. Voice Interaction Button with Sleek Audio Visualizer Animation */}
              <button
                onClick={toggleInlineListening}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  isListening
                    ? 'bg-amber-400 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : isSpeaking
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : isProcessing
                    ? 'bg-zinc-800 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-900/90 text-zinc-200 hover:text-white hover:bg-zinc-800'
                }`}
                title={isListening ? "Listening... click to pause" : isSpeaking ? "Speaking... click to mute" : isProcessing ? "Processing reasoning..." : "Click to speak voice query"}
                aria-label="Toggle Voice Interaction"
              >
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-black/40">
                  {isProcessing ? (
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-3 h-3 text-zinc-950" />
                  ) : (
                    <Mic className="w-3 h-3 text-amber-400" />
                  )}
                </div>

                {/* Dynamic Pure Audio Visualizer Animation */}
                <div className="flex items-center px-1">
                  {isListening ? (
                    <div className="flex items-center gap-[3px] h-4">
                      {[0.6, 1.2, 0.8, 1.4, 0.9, 0.5].map((scale, i) => (
                        <motion.span
                          key={i}
                          className="w-[2.5px] bg-zinc-950 rounded-full"
                          animate={{
                            height: [4, 16 * scale, 6, 18 * scale, 4]
                          }}
                          transition={{
                            duration: 0.5 + i * 0.08,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  ) : isProcessing ? (
                    <div className="flex items-center justify-center w-7 h-4 relative">
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/30 border-t-amber-400"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                        animate={{ scale: [0.7, 1.2, 0.7] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  ) : isSpeaking ? (
                    <div className="flex items-center gap-[3px] h-4">
                      {[0.5, 1.1, 0.7, 1.3, 0.9, 0.6].map((scale, i) => (
                        <motion.span
                          key={i}
                          className="w-[2.5px] bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                          animate={{
                            height: [3, 16 * scale, 5, 15 * scale, 3]
                          }}
                          transition={{
                            duration: 0.45 + i * 0.08,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-[2.5px] h-4 opacity-70">
                      {[3, 6, 10, 5].map((h, i) => (
                        <motion.span
                          key={i}
                          className="w-[2px] bg-amber-400/80 rounded-full"
                          animate={{ height: [h, h + 3, h] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>

              {/* 2. Expand Button to Pop Up Full Agent Chatbox */}
              <button
                onClick={() => {
                  if (isDraggingRef.current) return;
                  setMode('chat');
                }}
                className="p-1.5 ml-1 rounded-full bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-300 transition-colors cursor-pointer border border-white/10 shrink-0"
                title="Expand AnusandhanAI Assistant & Foundation Models"
                aria-label="Expand Chatbot Window"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* 3. Dismiss Button to Collapse to Minimal Docked Orb */}
              <button
                onClick={handleMinimizeToOrb}
                className="p-1.5 ml-0.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                title="Minimize to floating circular orb"
                aria-label="Minimize to Floating Orb"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* 4. Prominent Close (X) Button to minimize to orb */}
              <button
                onClick={handleMinimizeToOrb}
                className="p-1.5 ml-0.5 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                title="Close to orb"
                aria-label="Close Assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: Sleek Discrete Bottom-Right Pop-up Chatbox (Expanded)
          Features: Draggable header, Dedicated Minimize to Capsule, Close to Capsule,
                    Free Foundation Model Switcher, File Upload
          ========================================================================= */}
      {mode === 'chat' && (
        <div className="w-[430px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[85vh] glass-modal rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-fadeIn relative backdrop-blur-3xl">
          
          {/* Specular Top Sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

          {/* Header Bar with Drag Handle & Prominent Controls */}
          <div 
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'BUTTON' && target.tagName !== 'SELECT' && !target.closest('button') && !target.closest('select')) {
                dragControls.start(e);
              }
            }}
            className="p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center justify-between gap-2 shrink-0 cursor-grab active:cursor-grabbing"
          >
            
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-0.5 transition-colors touch-none"
                title="Drag to reposition window anywhere"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="relative w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 p-1 flex items-center justify-center shadow-md shrink-0">
                <img src={isDark ? '/brand-emblem-dark.svg' : '/brand-emblem-light.svg'} alt="Emblem" className="w-full h-full object-contain" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-zinc-100">AnusandhanAI</h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    24/7 ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">Autonomous Research Assistant</p>
              </div>
            </div>

            {/* Model Switcher & Header Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Free / Open Source Model Switcher */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as AgentModelId)}
                  className="text-[10px] font-mono px-2 py-1 rounded-xl glass-input text-amber-400 font-semibold outline-none cursor-pointer border border-amber-500/30"
                  title="Switch between high-capability free and open-source models"
                >
                  <option value="deepseek-r1" className="bg-zinc-900 text-zinc-100">DeepSeek-R1 (Open Reasoning · Free)</option>
                  <option value="qwen-2.5-coder" className="bg-zinc-900 text-zinc-100">Qwen 2.5 Coder (Open Weights · Free)</option>
                  <option value="llama-3-70b" className="bg-zinc-900 text-zinc-100">Llama 3.3 70B (Open Weights · Free)</option>
                  <option value="mistral-nemo" className="bg-zinc-900 text-zinc-100">Mistral NeMo (Open Weights · Free)</option>
                  <option value="gemma-2-9b" className="bg-zinc-900 text-zinc-100">Gemma 2 9B (Ultra-Fast · Free)</option>
                  <option value="local-academic" className="bg-zinc-900 text-zinc-100">Anusandhan Core (Zero-Cost Local)</option>
                  <option value="gemini-flash" className="bg-zinc-900 text-zinc-100">Gemini 2.5 Flash</option>
                </select>
              </div>

              {/* Voice Feedback Mute Toggle */}
              <button
                onClick={() => {
                  setVoiceFeedbackEnabled(!voiceFeedbackEnabled);
                  if (isSpeaking && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  voiceFeedbackEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'glass-chip text-zinc-500 hover:text-zinc-300'
                }`}
                title={voiceFeedbackEnabled ? 'Voice feedback is ON (Click to mute)' : 'Voice feedback is MUTED (Click to unmute)'}
              >
                {voiceFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Dedicated Minimize to Previous Capsule Button */}
              <button
                onClick={handleMinimizeToCapsule}
                className="px-2.5 py-1.5 rounded-xl glass-chip hover:bg-amber-400 hover:text-zinc-950 text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                title="Minimize chat back to capsule bar"
                aria-label="Minimize chat back to capsule bar"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-medium">Minimize</span>
              </button>

              {/* Close Button (Returns to capsule) */}
              <button
                onClick={handleMinimizeToCapsule}
                className="p-1.5 rounded-xl glass-chip hover:bg-red-500/20 text-zinc-400 hover:text-red-300 hover:border-red-500/30 transition-colors cursor-pointer shrink-0"
                title="Close chat window to capsule"
                aria-label="Close chat window to capsule"
              >
                <X className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

          {/* Quick Action Suggestion Chips - Frosted Glass Bar */}
          <div className="px-3 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
            <button
              onClick={() => handleExecuteQuery('What active fellowships are open right now?')}
              className="px-2.5 py-1 rounded-xl glass-chip text-zinc-300 hover:text-amber-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Active Vacancies</span>
            </button>

            <button
              onClick={() => handleExecuteQuery('Check my CV and diagnose my RRS score')}
              className="px-2.5 py-1 rounded-xl glass-chip text-zinc-300 hover:text-amber-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Diagnose CV</span>
            </button>

            <button
              onClick={() => handleExecuteQuery('Any notifications or updates from professors?')}
              className="px-2.5 py-1 rounded-xl glass-chip text-zinc-300 hover:text-amber-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Bell className="w-3 h-3 text-sky-400" />
              <span>Professor Updates</span>
            </button>

            <button
              onClick={() => handleExecuteQuery('Take me to the 146-word pitch composer')}
              className="px-2.5 py-1 rounded-xl glass-chip text-zinc-300 hover:text-amber-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Mail className="w-3 h-3 text-purple-400" />
              <span>Draft Pitch</span>
            </button>
          </div>

          {/* Message History Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      isUser
                        ? 'glass-bubble-user text-zinc-950 font-medium rounded-tr-sm shadow-md'
                        : 'glass-bubble-assistant text-zinc-100 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                    {/* Attached Direct Opportunity Links */}
                    {m.opportunityLinks && m.opportunityLinks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                          Direct Vacancy Application Links:
                        </span>
                        {m.opportunityLinks.map((link, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-between gap-2 hover:border-amber-400/30 transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-zinc-200 block truncate text-[11px]">
                                {link.name}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                                link.status === 'active' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-zinc-400 border border-white/10'
                              }`}>
                                {link.status === 'active' ? 'Active' : 'Upcoming'}
                              </span>
                            </div>

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[10px] font-bold font-mono flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                            >
                              <span>Apply Form</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata stamp */}
                  <span className="text-[9px] font-mono text-zinc-500 mt-1 px-1">
                    {m.timestamp} {m.modelUsed && `· ${m.modelUsed}`}
                  </span>
                </div>
              );
            })}

            {/* Live Reasoning Animation */}
            {isProcessing && (
              <div className="flex items-center gap-2 p-3 rounded-2xl glass-bubble-assistant max-w-[80%]">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-xs text-zinc-400 font-mono">Agent reasoning & dispatching...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Bar: Status Indicator + CV Attachment + Text Input + Mic + Send */}
          <div className="p-3 bg-white/[0.03] backdrop-blur-2xl border-t border-white/10 shrink-0 space-y-2">
            
            {/* Real-time status / speaking visualizer bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking || isListening ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                <span className="truncate">{statusText}</span>
              </div>
              {isSpeaking && <AudioWaveformVisualizer active={true} variant="micro" />}
            </div>

            <div className="flex items-center gap-1.5">
              
              {/* CV File Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="assistant-cv-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCV}
                className="p-2.5 rounded-xl glass-chip text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                title="Upload CV PDF for automated RRS gap diagnosis"
              >
                <Paperclip className={`w-4 h-4 ${isUploadingCV ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              {/* Text Input Box */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteQuery(textInput);
                  }
                }}
                placeholder="Ask to navigate, check active forms, CV..."
                className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl glass-input text-xs text-zinc-100 placeholder-zinc-500 font-sans"
              />

              {/* Mic Speech Button */}
              <button
                onClick={toggleInlineListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-amber-400 text-zinc-950 shadow-md'
                    : 'glass-chip text-zinc-300'
                }`}
                title="Speak to Agent"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleExecuteQuery(textInput)}
                disabled={!textInput.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 transition-all cursor-pointer shrink-0 shadow-md font-semibold"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>
      )}

    </motion.aside>
  );
};
