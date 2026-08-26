"use client";

import { PageTransition } from '@/components/shared/page-transition';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Quiz, QuizResult } from '@/types';

import { ProtectedRoute } from '@/components/shared/protected-route';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { GlassCard } from '@/components/shared/glass-card';
import { GradientText } from '@/components/shared/gradient-text';
import { Check, X, ArrowRight, LayoutDashboard, Map } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function QuizPage() {
  const { studentId, topicId } = useParams();
  const router = useRouter();
  const topicTitle = decodeURIComponent(topicId as string);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!studentId || !topicTitle) return;

    const fetchQuiz = async () => {
      try {
        const q = await api.generateQuiz(studentId as string, topicTitle);
        setQuiz(q);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to generate this quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [studentId, topicTitle]);

  const handleSelect = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qIdx, aIdx]) => ({
        question_index: parseInt(qIdx),
        selected_answer: aIdx
      }));
      const res = await api.submitQuiz(studentId as string, quiz.id, formattedAnswers);
      // Merge quiz questions into result for the results view
      res.questions = quiz.questions;
      setResult(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit your quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Generating adaptive questions..." />
      </div>
    );
  }

  if (!quiz) {
    return <div className="text-center p-12">Failed to load quiz.</div>;
  }

  if (result) {
    const scorePercent = (result.score / result.total) * 100;

    return (
      <ProtectedRoute>
        <PageTransition>
          <div className="min-h-screen max-w-3xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Quiz Results</h1>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-white/10 relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                  <motion.circle
                    initial={{ strokeDashoffset: 289 }}
                    animate={{ strokeDashoffset: 289 - (289 * scorePercent) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="289" strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-3xl font-bold">
                  <GradientText>{result.score}/{result.total}</GradientText>
                </div>
              </div>
              <p className="mt-4 text-xl text-zinc-300">
                {scorePercent === 100 ? "Perfect score! You're a master." :
                  scorePercent >= 80 ? "Great job! Almost there." :
                    scorePercent >= 60 ? "Good effort, keep practicing." :
                      "Needs more review. You'll get it next time!"}
              </p>
            </div>

            <div className="space-y-6 mb-12">
              {result.questions.map((q, idx) => {
                const ans = result.answers.find(a => a.question_index === idx);
                const isCorrect = ans?.is_correct;
                const selected = ans?.selected_answer;

                return (
                  <GlassCard key={idx} hover={false} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <h3 className="font-medium mb-4">{q.question}</h3>
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === optIdx;
                        const isActuallyCorrect = q.correct_answer === optIdx;

                        return (
                          <div key={optIdx} className={cn(
                            "p-3 rounded-lg text-sm flex items-center justify-between",
                            isActuallyCorrect ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                              (isSelected && !isCorrect) ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                                "bg-white/5 text-zinc-400"
                          )}>
                            <span>{opt}</span>
                            {isActuallyCorrect && <Check className="h-4 w-4 text-green-400" />}
                            {(isSelected && !isCorrect) && <X className="h-4 w-4 text-red-400" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-sm text-zinc-300">
                      <span className="font-semibold text-blue-400 block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <Link href={`/roadmap/${studentId}`}>
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium transition-colors">
                  <Map className="h-5 w-5" /> Back to Roadmap
                </button>
              </Link>
              <Link href={`/dashboard/${studentId}`}>
                <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-purple-900/20 hover:from-blue-500 hover:to-purple-500 transition-colors">
                  <LayoutDashboard className="h-5 w-5" /> View Dashboard
                </button>
              </Link>
            </div>
          </div>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  const hasSelected = answers[currentQuestionIndex] !== undefined;

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen max-w-2xl mx-auto px-6 py-12 flex flex-col">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {submitting ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner message="Analyzing your answers..." />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-2xl font-medium mb-8 leading-relaxed">
                  {currentQ.question}
                </h2>

                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = answers[currentQuestionIndex] === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={cn(
                          "w-full text-left p-5 rounded-xl border transition-all duration-200",
                          isSelected
                            ? "bg-blue-500/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "border-blue-400 bg-blue-500 text-white" : "border-zinc-600"
                          )}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="mt-12 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!hasSelected || submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-colors"
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? "Submit Quiz" : "Next Question"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
