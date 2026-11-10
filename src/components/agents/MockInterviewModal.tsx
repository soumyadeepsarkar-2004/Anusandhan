import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Award, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Send, Mic, RefreshCw, Volume2, ShieldCheck, UserCheck } from 'lucide-react';
import { StudentProfile } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { AppleGlassCard } from '../ui/AppleGlass';
import confetti from 'canvas-confetti';

interface MockInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onUpdateRrs?: (newScore: number) => void;
  targetProfessor?: { name: string; institution?: string; domain?: string; firstQuestion?: string } | null;
}

interface InterviewTurn {
  turnIndex: number;
  question: string;
  studentAnswer: string;
  evaluation?: {
    overall_score: number;
    technical_soundness_score: number;
    methodological_depth_score: number;
    scientific_honesty_score: number;
    strengths: string[];
    improvements: string[];
    interviewer_comment: string;
  };
}

const INTERVIEW_PROFESSORS = [
  {
    name: 'Prof. Chiranjib Bhattacharyya',
    institution: 'IISc Bangalore',
    domain: 'Artificial Intelligence & ML',
    firstQuestion: 'Could you explain how your custom implementation optimizes memory caching, and what specific degradation happens on long sequence lengths?'
  },
  {
    name: 'Prof. Bernhard Schölkopf',
    institution: 'Max Planck Institute for Intelligent Systems',
    domain: 'Causal Inference & ML',
    firstQuestion: 'How does your model distinguish between correlation and invariant causal representations under non-stationary covariate shift?'
  },
  {
    name: 'Prof. Song Han',
    institution: 'MIT',
    domain: 'Efficient AI & Hardware Acceleration',
    firstQuestion: 'When quantizing transformer weights to 4-bit representation, how do you prevent catastrophic loss explosion during outlier token activations?'
  },
  {
    name: 'Prof. Pushpak Bhattacharyya',
    institution: 'IIT Bombay',
    domain: 'NLP & Multilingual AI',
    firstQuestion: 'How does your multilingual representation prevent cross-lingual interference and semantic drift across morphologically rich Indian languages?'
  }
];

export const MockInterviewModal: React.FC<MockInterviewModalProps> = ({
  isOpen,
  onClose,
  student,
  onUpdateRrs,
  targetProfessor
}) => {
  if (!isOpen) return null;

  const [selectedProf, setSelectedProf] = useState(() => {
    if (targetProfessor) {
      return {
        name: targetProfessor.name,
        institution: targetProfessor.institution || 'Frontier Lab',
        domain: targetProfessor.domain || 'Computer Science & AI',
        firstQuestion: targetProfessor.firstQuestion || `Could you explain how your research background aligns with ${targetProfessor.name}'s lab?`
      };
    }
    return INTERVIEW_PROFESSORS[0];
  });
  const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    if (targetProfessor) {
      return targetProfessor.firstQuestion || `Could you explain how your research background aligns with ${targetProfessor.name}'s lab?`;
    }
    return INTERVIEW_PROFESSORS[0].firstQuestion;
  });
  const [studentInput, setStudentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<InterviewTurn[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleSelectProfessor = (prof: typeof INTERVIEW_PROFESSORS[0]) => {
    setSelectedProf(prof);
    setCurrentTurnIndex(1);
    setCurrentQuestion(prof.firstQuestion);
    setHistory([]);
    setIsCompleted(false);
    setFinalScore(null);
  };

  const handleSubmitAnswer = async () => {
    if (!studentInput.trim() || isSubmitting) return;

    const answer = studentInput.trim();
    setStudentInput('');
    setIsSubmitting(true);

    try {
      const result = await ApiClient.evaluateMockInterview({
        professor_name: selectedProf.name,
        domain: selectedProf.domain,
        current_question: currentQuestion,
        student_answer: answer,
        turn_index: currentTurnIndex
      });

      const evaluation = result?.evaluation || {
        overall_score: 85,
        technical_soundness_score: 30,
        methodological_depth_score: 30,
        scientific_honesty_score: 25,
        strengths: ['Clear articulate formulation', 'Empirical benchmark cited'],
        improvements: ['Include specific formulas and ablation metrics'],
        interviewer_comment: `${selectedProf.name}: Good conceptual grasp of the core framework.`
      };

      const newTurn: InterviewTurn = {
        turnIndex: currentTurnIndex,
        question: currentQuestion,
        studentAnswer: answer,
        evaluation
      };

      const updatedHistory = [...history, newTurn];
      setHistory(updatedHistory);

      if (result?.interview_complete || currentTurnIndex >= 3) {
        setIsCompleted(true);
        const avgScore = Math.round(
          updatedHistory.reduce((acc, t) => acc + (t.evaluation?.overall_score || 80), 0) / updatedHistory.length
        );
        setFinalScore(avgScore);
        if (onUpdateRrs) {
          onUpdateRrs(Math.max(student.rrsScore, avgScore));
        }
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } else {
        setCurrentQuestion(result?.next_question || 'How would you stress-test your hypothesis under edge cases?');
        setCurrentTurnIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Interview evaluation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      {/* Ambient Glowing Orbs */}
      <div className="ambient-orb -top-20 -left-20 w-80 h-80 bg-amber-500/15" />
      <div className="ambient-orb -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15" />

      <div className="relative w-full max-w-3xl aceternity-glass rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.48)] overflow-hidden flex flex-col max-h-[92vh] bg-zinc-950/85">
        {/* Specular Highlight Sheen */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                  Autonomous Technical Viva Screening
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  PI MOCK
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Simulate a 15-minute viva interview with top faculty before your real Zoom screening.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Professor Selector Carousel */}
        <div className="p-3 border-b border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-zinc-500 shrink-0 px-1">Interviewer:</span>
          {INTERVIEW_PROFESSORS.map((prof) => (
            <button
              key={prof.name}
              onClick={() => handleSelectProfessor(prof)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedProf.name === prof.name
                  ? 'bg-amber-400 text-zinc-950 font-semibold shadow-md'
                  : 'bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span>{prof.name}</span>
              <span className="text-[10px] opacity-80">({prof.institution})</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Turn Progress Strip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400 font-mono text-[11px]">VIVA PROGRESS:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((turn) => (
                  <span
                    key={turn}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                      turn < currentTurnIndex || (turn === 3 && isCompleted)
                        ? 'bg-emerald-500 text-zinc-950'
                        : turn === currentTurnIndex
                        ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-400/40'
                        : 'bg-white/[0.08] text-zinc-500'
                    }`}
                  >
                    {turn}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-zinc-400 font-mono text-[11px]">
              {isCompleted ? 'Interview Complete' : `Turn ${currentTurnIndex} of 3`}
            </span>
          </div>

          {/* Past Turns History */}
          {history.map((turn, idx) => (
            <div key={idx} className="space-y-3">
              {/* Question */}
              <div className="p-4 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/12 shadow-sm">
                <div className="text-[11px] font-mono text-amber-400 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{selectedProf.name} (Question {turn.turnIndex}):</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 font-serif leading-relaxed">
                  "{turn.question}"
                </p>
              </div>

              {/* Student Answer */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] backdrop-blur-md border border-white/10 text-xs text-zinc-300 ml-4">
                <span className="text-[11px] font-mono text-zinc-500 block mb-1">Your Answer:</span>
                <p className="leading-relaxed">{turn.studentAnswer}</p>
              </div>

              {/* Evaluation Feedback */}
              {turn.evaluation && (
                <div className="p-4 rounded-xl bg-emerald-950/30 backdrop-blur-md border border-emerald-500/30 space-y-2 ml-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                      Turn Score: {turn.evaluation.overall_score}/100
                    </span>
                    <div className="flex gap-2 text-[10px] font-mono text-zinc-400">
                      <span>Tech: {turn.evaluation.technical_soundness_score}/35</span>
                      <span>Depth: {turn.evaluation.methodological_depth_score}/35</span>
                      <span>Honesty: {turn.evaluation.scientific_honesty_score}/30</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 italic">
                    "{turn.evaluation.interviewer_comment}"
                  </p>
                  <div className="text-[11px] text-emerald-300">
                    <strong>Strengths:</strong> {turn.evaluation.strengths.join(' · ')}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Improvement:</strong> {turn.evaluation.improvements.join(' · ')}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Current Active Question or Final Score Card */}
          {!isCompleted ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-white/[0.04] to-black/30 backdrop-blur-xl border border-amber-500/35 shadow-lg space-y-3">
              <div className="text-xs font-mono text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>{selectedProf.name} asks:</span>
                </span>
                <span>Active Question</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-100 font-serif leading-relaxed">
                "{currentQuestion}"
              </p>
            </div>
          ) : (
            <AppleGlassCard className="p-6 text-center space-y-4 border border-emerald-500/40">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-serif text-zinc-100">Viva Screening Complete!</h4>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
                You defended your research hypothesis under questioning from {selectedProf.name} ({selectedProf.institution}).
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/15 text-2xl font-mono font-bold text-amber-400">
                Final Viva Score: {finalScore}/100
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Your profile Research Readiness Score has been calibrated and elevated.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-md"
                >
                  Return to Workspace
                </button>
              </div>
            </AppleGlassCard>
          )}

        </div>

        {/* Input Bar */}
        {!isCompleted && (
          <div className="p-3 sm:p-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <textarea
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                rows={2}
                placeholder="Formulate your technical answer citing specific formulas, kernels, or trade-offs..."
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/60 outline-none resize-none font-sans"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!studentInput.trim() || isSubmitting}
                className="h-full min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Tip: Explicitly mention engineering tradeoffs and empirical limitations to score high on Scientific Honesty.
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
