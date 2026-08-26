"use client";

import { PageTransition } from '@/components/shared/page-transition';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/services/api';
import { DashboardData, Topic } from '@/types';

import { ProtectedRoute } from '@/components/shared/protected-route';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { GlassCard } from '@/components/shared/glass-card';
import { GradientText } from '@/components/shared/gradient-text';
import { Target, Flame, Brain, Trophy, ArrowRight, AlertCircle, CheckCircle2, BarChart3, Gauge, Sparkles, Clock3, TrendingUp, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [currentTopic, setCurrentTopic] = useState<{ topic: Topic; week_number: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      router.push('/onboarding');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const [dashboard, topic] = await Promise.all([
          api.getDashboard(studentId as string),
          api.getTodaysTopic(studentId as string),
        ]);
        setData(dashboard);
        setCurrentTopic(topic);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load your dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [studentId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your dashboard..." />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-12">Failed to load dashboard.</div>;
  }

  const avgScore = data.quiz_scores.length > 0
    ? Math.round(data.quiz_scores.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / data.quiz_scores.length * 100)
    : 0;

  const chartData = data.quiz_scores.map(s => ({
    name: s.topic.substring(0, 15) + '...',
    score: Math.round((s.score / s.total) * 100)
  }));

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen max-w-6xl mx-auto px-6 py-12">
          <header className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, <GradientText>{data.student.name}</GradientText></h1>
                <p className="text-zinc-400">Here's your learning progress overview.</p>
              </div>
              <Link
                href={currentTopic ? `/learn/${studentId}/${encodeURIComponent(currentTopic.topic.title)}` : `/roadmap/${studentId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
              >
                {currentTopic ? 'Continue Learning' : 'View Roadmap'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <GlassCard className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                <Target className="h-4 w-4 text-blue-400" /> Topics Completed
              </div>
              <div className="text-3xl font-bold text-white mt-auto">
                {data.roadmap_progress.completed}<span className="text-zinc-500 text-lg font-normal">/{data.roadmap_progress.total}</span>
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                <Trophy className="h-4 w-4 text-purple-400" /> Average Score
              </div>
              <div className="text-3xl font-bold text-white mt-auto">{avgScore}%</div>
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                <Flame className="h-4 w-4 text-orange-400" /> Learning Streak
              </div>
              <div className="text-3xl font-bold text-white mt-auto">{data.learning_streak} <span className="text-zinc-500 text-lg font-normal">days</span></div>
              <div className="text-xs text-zinc-500 mt-2">Best: {data.best_streak} days</div>
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-violet-400" /> Skill Level
              </div>
              <div className="text-2xl font-bold text-white mt-auto capitalize truncate">{data.student.skill_level}</div>
            </GlassCard>
          </div>

          {/* AI Recommendation */}
          {data.next_recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <GlassCard className="border-purple-500/30 bg-purple-500/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Brain className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 uppercase tracking-wider">
                    ✨ AI Recommendation
                  </div>
                  <h3 className="text-xl font-bold mb-1">{data.next_recommendation.topic_title}</h3>
                  <p className="text-zinc-400 text-sm">{data.next_recommendation.reason}</p>
                  {(data.next_recommendation.estimated_minutes || data.next_recommendation.difficulty) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                      {data.next_recommendation.estimated_minutes && <span className="rounded bg-white/10 px-2 py-1">{data.next_recommendation.estimated_minutes} min</span>}
                      {data.next_recommendation.difficulty && <span className="rounded bg-white/10 px-2 py-1 capitalize">{data.next_recommendation.difficulty}</span>}
                    </div>
                  )}
                </div>
                <div className="relative z-10 shrink-0">
                  <Link href={`/learn/${studentId}/${encodeURIComponent(data.next_recommendation.topic_title)}`}>
                    <button className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold w-full md:w-auto hover:bg-zinc-200 transition-colors">
                      {data.next_recommendation.type === 'revision' ? 'Review Topic' : 'Start Learning'} <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {data.learning_dna && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <GlassCard className="p-0 overflow-hidden">
                <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-500/20 p-2"><Sparkles className="h-5 w-5 text-violet-300" /></div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">AI Learning Intelligence</div>
                      <h3 className="text-xl font-semibold">My Learning DNA</h3>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> {data.learning_dna.learning_health.label}
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 p-6">
                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-zinc-950/40 border border-white/5 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500"><Gauge className="h-3.5 w-3.5 text-cyan-400" /> Learning Personality</div>
                        <p className="mt-3 text-sm text-zinc-200">{data.learning_dna.learning_personality}</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/40 border border-white/5 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500"><TrendingUp className="h-3.5 w-3.5 text-purple-400" /> Learning Speed</div>
                        <p className="mt-3 text-sm text-zinc-200">{data.learning_dna.learning_speed}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        { label: 'Retention Score', value: `${data.learning_dna.retention_score}%`, icon: 'R' },
                        { label: 'Confidence', value: `${data.learning_dna.confidence_score}%`, icon: 'C' },
                        { label: 'Current Strength', value: data.learning_dna.current_strength, icon: 'S' },
                        { label: 'Current Weakness', value: data.learning_dna.current_weakness, icon: 'W' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white/5 p-3 border border-white/5">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</div>
                          <div className="mt-2 text-sm font-semibold text-white break-words">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-violet-200"><Brain className="h-3.5 w-3.5" /> Recommendation</div>
                      <p className="mt-3 text-sm text-zinc-200">{data.learning_dna.revision_need}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-zinc-950/40 border border-white/5 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                        <span>Learning Health</span>
                        <span>{data.learning_dna.learning_health.score}/100</span>
                      </div>
                      <div className="mt-3 h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${data.learning_dna.learning_health.score}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="mt-3 text-sm text-zinc-300">{data.learning_dna.learning_health.summary}</p>
                    </div>

                    <div className="rounded-xl bg-zinc-950/40 border border-white/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500"><Clock3 className="h-3.5 w-3.5 text-amber-300" /> Best time to study</div>
                      <p className="text-sm text-zinc-200">{data.learning_dna.best_time_to_study}</p>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500"><Trophy className="h-3.5 w-3.5 text-yellow-300" /> Most improved skill</div>
                      <p className="text-sm text-zinc-200">{data.learning_dna.most_improved_skill}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 px-6 py-5">
                  <div className="mb-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Predictions</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.learning_dna.predictions.slice(0, 2).map((prediction, index) => (
                      <div key={index} className="rounded-xl bg-white/5 border border-white/5 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-sm font-medium text-white">{prediction.text}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${prediction.priority === 'high' ? 'bg-red-500/15 text-red-300' : 'bg-blue-500/15 text-blue-300'}`}>
                            {prediction.priority}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{prediction.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.section>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="md:col-span-2 space-y-8">
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-zinc-400" /> Quiz Performance
                </h3>
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                        <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">
                    Complete quizzes to see your performance chart.
                  </div>
                )}
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Overall Progress</h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-400">Roadmap completion</span>
                  <span className="font-medium">{Math.round(data.roadmap_progress.percentage)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.roadmap_progress.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </GlassCard>
            </div>

            {/* Sidebar Lists */}
            <div className="space-y-8">
              {data.weak_topics.length > 0 && (
                <GlassCard className="p-0 overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <h3 className="font-semibold">Needs Review</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {data.weak_topics.map((topic, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <span className="text-sm font-medium text-zinc-300 truncate pr-4">{topic}</span>
                        <Link href={`/learn/${studentId}/${encodeURIComponent(topic)}`}>
                          <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors shrink-0">
                            Review
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <GlassCard className="p-0 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <h3 className="font-semibold">Recently Completed</h3>
                </div>
                {data.completed_topics.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {data.completed_topics.slice(0, 5).map((topic, i) => (
                      <div key={i} className="p-4 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-sm text-zinc-400 truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-zinc-500">
                    No topics completed yet.
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
