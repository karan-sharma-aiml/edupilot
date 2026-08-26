"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PageTransition } from '@/components/shared/page-transition';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { useAuthStore } from '@/stores/auth-store';
import { GlassCard } from '@/components/shared/glass-card';
import { GradientText } from '@/components/shared/gradient-text';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const goals = [
  "Crack Placement Interviews",
  "Master Data Science",
  "Become an AI Engineer",
  "Ace Semester Exams",
  "Learn Web Development",
  "Master System Design",
];

const studyTimes = [
  { value: 30, label: '30 min/day' },
  { value: 60, label: '1 hour/day' },
  { value: 120, label: '2 hours/day' },
  { value: 180, label: '3+ hours/day' },
];

const skillLevels = ['beginner', 'intermediate', 'advanced'];
const learningStyles = ['visual', 'reading', 'hands-on', 'mixed'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    goal: '',
    daily_study_time: 60,
    skill_level: 'beginner',
    learning_style: 'mixed',
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { setUser } = useAuthStore.getState();

      // Update the user profile with onboarding data
      const updatedUser = await api.completeOnboarding(data);
      setUser(updatedUser);

      await api.generateRoadmap(data);

      router.push('/roadmap/me');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate roadmap. Please try again.');
      setLoading(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="w-full max-w-xl relative z-10">
            {/* Progress bar */}
            <div className="mb-8 flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: step >= i ? '100%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            <GlassCard hover={false} className="min-h-[400px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingSpinner message="AI is crafting your personalized roadmap..." />
                </div>
              ) : (
                <>
                  {step > 1 && (
                    <button onClick={prevStep} className="text-zinc-400 hover:text-white mb-4 self-start">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}

                  <AnimatePresence mode="wait" custom={1}>
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col"
                      >
                        <h2 className="text-2xl font-bold mb-2">Let's personalize your learning journey</h2>
                        <p className="text-zinc-400 mb-8">What should we call you?</p>

                        <input
                          type="text"
                          value={data.name}
                          onChange={e => setData({ ...data, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                          autoFocus
                        />

                        <div className="mt-auto pt-8">
                          <button
                            onClick={nextStep}
                            disabled={!data.name.trim()}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-4 font-semibold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Continue <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col"
                      >
                        <h2 className="text-2xl font-bold mb-2">What do you want to learn?</h2>
                        <p className="text-zinc-400 mb-6">Be as specific as you like.</p>

                        <textarea
                          value={data.goal}
                          onChange={e => setData({ ...data, goal: e.target.value })}
                          placeholder="E.g., I want to master React and Next.js to build full-stack apps..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[120px] resize-none mb-6"
                        />

                        <div className="flex flex-wrap gap-2 mb-6">
                          {goals.map(g => (
                            <button
                              key={g}
                              onClick={() => setData({ ...data, goal: g })}
                              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              {g}
                            </button>
                          ))}
                        </div>

                        <div className="mt-auto pt-4">
                          <button
                            onClick={nextStep}
                            disabled={!data.goal.trim()}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-4 font-semibold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Continue <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col"
                      >
                        <h2 className="text-2xl font-bold mb-6">Your study preferences</h2>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-3">Daily study time</label>
                            <div className="grid grid-cols-2 gap-3">
                              {studyTimes.map(time => (
                                <button
                                  key={time.value}
                                  onClick={() => setData({ ...data, daily_study_time: time.value })}
                                  className={cn(
                                    "p-3 rounded-xl border text-sm font-medium transition-all",
                                    data.daily_study_time === time.value
                                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                  )}
                                >
                                  {time.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-3">Current skill level</label>
                            <div className="grid grid-cols-3 gap-3">
                              {skillLevels.map(level => (
                                <button
                                  key={level}
                                  onClick={() => setData({ ...data, skill_level: level as any })}
                                  className={cn(
                                    "p-3 rounded-xl border text-sm font-medium capitalize transition-all",
                                    data.skill_level === level
                                      ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                  )}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-3">Learning style</label>
                            <div className="grid grid-cols-2 gap-3">
                              {learningStyles.map(style => (
                                <button
                                  key={style}
                                  onClick={() => setData({ ...data, learning_style: style as any })}
                                  className={cn(
                                    "p-3 rounded-xl border text-sm font-medium capitalize transition-all",
                                    data.learning_style === style
                                      ? "bg-violet-500/20 border-violet-500 text-violet-400"
                                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                  )}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4">
                          <button
                            onClick={nextStep}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-4 font-semibold hover:bg-zinc-200 transition-colors"
                          >
                            Continue <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="step4"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col"
                      >
                        <h2 className="text-2xl font-bold mb-2">Ready to launch 🚀</h2>
                        <p className="text-zinc-400 mb-6">Here's what we have for you, {data.name}.</p>

                        <div className="bg-white/5 rounded-xl p-5 mb-8 border border-white/10 space-y-4">
                          <div>
                            <span className="text-sm text-zinc-500 block mb-1">Goal</span>
                            <span className="text-zinc-200 font-medium">{data.goal}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-zinc-500 block mb-1">Pace</span>
                              <span className="text-zinc-200 font-medium capitalize">{data.daily_study_time} mins/day</span>
                            </div>
                            <div>
                              <span className="text-sm text-zinc-500 block mb-1">Level</span>
                              <span className="text-zinc-200 font-medium capitalize">{data.skill_level}</span>
                            </div>
                            <div>
                              <span className="text-sm text-zinc-500 block mb-1">Style</span>
                              <span className="text-zinc-200 font-medium capitalize">{data.learning_style}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerate}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-semibold text-white shadow-lg shadow-purple-900/20 hover:from-blue-500 hover:to-purple-500"
                          >
                            Generate My Roadmap
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
