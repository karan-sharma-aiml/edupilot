"use client";

import { PageTransition } from '@/components/shared/page-transition';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Roadmap, Topic } from '@/types';

import { ProtectedRoute } from '@/components/shared/protected-route';
import { GlassCard } from '@/components/shared/glass-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { GradientText } from '@/components/shared/gradient-text';
import { PlayCircle, CheckCircle2, Circle, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function RoadmapPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [todaysTopic, setTodaysTopic] = useState<{ topic: Topic; week_number: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!studentId) {
      router.push('/onboarding');
      return;
    }

    const fetchData = async () => {
      try {
        const [rm, today] = await Promise.all([
          api.getRoadmap(studentId as string),
          api.getTodaysTopic(studentId as string)
        ]);
        setRoadmap(rm);
        setTodaysTopic(today);

        // Auto-expand current week
        const currentWeek = rm.weeks.find(w => w.is_current)?.week_number || 1;
        setExpandedWeeks({ [currentWeek]: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load your roadmap');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, router]);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your roadmap..." />
      </div>
    );
  }

  if (!roadmap) {
    return <div className="text-center p-12">Failed to load roadmap.</div>;
  }

  // Calculate overall progress
  const totalTopics = roadmap.weeks.reduce((acc, week) => acc + week.topics.length, 0);
  const completedTopics = roadmap.weeks.reduce((acc, week) => acc + week.topics.filter(t => t.is_completed).length, 0);
  const progressPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen max-w-4xl mx-auto px-6 py-12">
          <header className="mb-10">
            <h1 className="text-3xl font-bold mb-4">Your Learning Roadmap</h1>

            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-zinc-400">{Math.round(progressPercent)}% Completed</span>
            </div>

            <label className="relative block mt-6">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <span className="sr-only">Search topics</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search topics"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </header>

          {todaysTopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <GlassCard className="border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Target className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mb-4 uppercase tracking-wider">
                    Today's Mission
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{todaysTopic.topic.title}</h2>
                  <p className="text-zinc-400 mb-6 max-w-2xl">{todaysTopic.topic.description}</p>
                  <div className="flex items-center gap-4">
                    <Link href={`/learn/${studentId}/${encodeURIComponent(todaysTopic.topic.title)}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-900/20 hover:from-blue-500 hover:to-purple-500 transition-colors"
                      >
                        <PlayCircle className="h-5 w-5" /> Start Learning
                      </motion.button>
                    </Link>
                    <span className="text-sm text-zinc-500">{todaysTopic.topic.estimated_minutes} mins</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          <div className="space-y-6 relative">
            {/* Vertical line connecting weeks */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-white/10 hidden md:block" />

            {roadmap.weeks.map((week, i) => {
              const normalizedQuery = searchQuery.trim().toLowerCase();
              const visibleTopics = week.topics.filter(topic =>
                !normalizedQuery || `${topic.title} ${topic.description}`.toLowerCase().includes(normalizedQuery)
              );
              if (normalizedQuery && visibleTopics.length === 0) return null;
              const isExpanded = expandedWeeks[week.week_number];
              const weekCompleted = week.topics.every(t => t.is_completed);

              return (
                <motion.div
                  key={week.week_number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative z-10"
                >
                  <GlassCard hover={false} className={`p-0 transition-colors ${week.is_current ? 'border-purple-500/30' : ''}`}>
                    <button
                      onClick={() => toggleWeek(week.week_number)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`hidden md:flex h-12 w-12 rounded-full items-center justify-center -ml-12 border-4 border-zinc-950 ${weekCompleted ? 'bg-blue-500 text-white' : week.is_current ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {week.week_number}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Week {week.week_number}: {week.title}</h3>
                          <p className="text-sm text-zinc-400">{week.topics.filter(t => t.is_completed).length} of {week.topics.length} topics completed</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-3">
                        {visibleTopics.map(topic => {
                          const isCurrentTopic = todaysTopic?.topic.title === topic.title;

                          return (
                            <div key={topic.title} className={`flex items-start justify-between p-4 rounded-lg transition-colors group ${isCurrentTopic ? 'bg-purple-500/10 ring-1 ring-purple-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
                              <div className="flex gap-4">
                                <div className="mt-1">
                                  {topic.is_completed ? (
                                    <CheckCircle2 className="text-blue-500 h-5 w-5" />
                                  ) : isCurrentTopic ? (
                                    <PlayCircle className="text-purple-400 h-5 w-5 animate-pulse" />
                                  ) : (
                                    <Circle className="text-zinc-600 h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${topic.is_completed ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                                    {topic.title}
                                  </h4>
                                  <p className="text-sm text-zinc-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">{topic.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 pl-4 shrink-0">
                                {topic.is_completed && (
                                  <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                    Completed
                                  </span>
                                )}
                                <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                                  {topic.estimated_minutes}m
                                </span>
                                {!topic.is_completed && (
                                  <Link href={`/learn/${studentId}/${encodeURIComponent(topic.title)}`}>
                                    <button className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isCurrentTopic ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}>
                                      Learn
                                    </button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlassCard>

                  {/* Milestone check */}
                  {roadmap.milestones.find(m => m.week_number === week.week_number) && (
                    <div className="flex items-center justify-center my-8 text-zinc-500 md:ml-12">
                      <div className="h-px bg-white/10 flex-1 mr-4" />
                      <span className="text-xs uppercase tracking-widest font-semibold text-purple-400/80 bg-purple-400/10 px-3 py-1 rounded-full">Milestone Reached</span>
                      <div className="h-px bg-white/10 flex-1 ml-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}

// Just a dummy icon since I didn't import Target above but used it
function Target(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
