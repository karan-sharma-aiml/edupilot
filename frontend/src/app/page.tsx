"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/page-transition';
import { GradientText } from '@/components/shared/gradient-text';
import { GlassCard } from '@/components/shared/glass-card';
import { Map, BookOpen, Brain, BarChart, Target, Zap } from 'lucide-react';

const features = [
  {
    icon: <Map className="h-6 w-6 text-blue-400" />,
    title: 'AI Roadmap Generator',
    description: 'Get a personalized weekly learning plan tailored to your goals and pace.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-purple-400" />,
    title: 'Smart Lessons',
    description: 'AI-powered explanations with real examples and step-by-step guidance.',
  },
  {
    icon: <Brain className="h-6 w-6 text-violet-400" />,
    title: 'Adaptive Quizzes',
    description: 'Test your knowledge with AI-generated questions that adapt to your level.',
  },
  {
    icon: <BarChart className="h-6 w-6 text-blue-400" />,
    title: 'Progress Tracking',
    description: 'Visual dashboard to monitor your learning journey and streaks.',
  },
  {
    icon: <Target className="h-6 w-6 text-purple-400" />,
    title: 'Smart Recommendations',
    description: 'AI suggests what to study next based on your performance.',
  },
  {
    icon: <Zap className="h-6 w-6 text-violet-400" />,
    title: 'Daily Missions',
    description: 'Stay on track with daily learning goals and topics.',
  },
];

const reasons = [
  {
    title: 'A plan that fits you',
    description: 'Start with your goal, pace, and experience level. Your roadmap is shaped around the way you learn.',
  },
  {
    title: 'Learn by doing',
    description: 'Move from clear explanations to focused quizzes that turn new ideas into lasting understanding.',
  },
  {
    title: 'Progress you can see',
    description: 'Keep momentum with visible milestones, completion tracking, and a next step that is always clear.',
  },
];

export default function LandingPage() {
  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background elements */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="pointer-events-none absolute -top-40 left-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[128px]" />
        <div className="pointer-events-none absolute top-40 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-[128px]" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">E</span>
            EduPilot
          </div>
          <Link href="/onboarding">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Log in
            </motion.button>
          </Link>
        </nav>

        {/* Hero */}
        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">
              <GradientText>Your Personal AI</GradientText>
              <br />
              Learning Mentor
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400">
              EduPilot creates personalized learning roadmaps powered by AI. Master any topic with adaptive guidance, smart quizzes, and real-time progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-medium text-white hover:from-blue-500 hover:to-purple-500 w-full sm:w-auto shadow-lg shadow-blue-900/20"
                >
                  Get Started
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/10 w-full sm:w-auto border border-white/10"
              >
                See How It Works
              </motion.button>
            </div>
          </motion.div>

          {/* Why EduPilot */}
          <section className="mt-28 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 max-w-2xl"
            >
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">Why EduPilot</p>
              <h2 className="text-3xl font-bold">A calmer way to make progress.</h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="border-l border-blue-500/40 pl-5"
                >
                  <h3 className="mb-2 text-lg font-semibold text-zinc-100">{reason.title}</h3>
                  <p className="text-sm leading-6 text-zinc-400">{reason.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features */}
          <div className="mt-40">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-16 text-3xl font-bold"
            >
              Everything you need to learn smarter
            </motion.h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="h-full text-left">
                    <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-100">{feature.title}</h3>
                    <p className="text-zinc-400">{feature.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-white/10 bg-zinc-950/60 backdrop-blur-md py-10 mt-16">
          <div className="max-w-7xl mx-auto px-6 text-center">

            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              EduPilot
            </h3>

            <p className="mt-3 text-zinc-300 text-base">
              Learn Smarter. Practice Better. Grow Faster.
            </p>

            <p className="mt-2 text-zinc-500 text-sm">
              AI-Powered Personalized Learning Platform
            </p>

            <div className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-zinc-600 to-transparent mx-auto"></div>

            <p className="mt-6 text-xs text-zinc-500">
              © 2026 <span className="font-semibold text-zinc-300">Team EduPilot</span>. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
