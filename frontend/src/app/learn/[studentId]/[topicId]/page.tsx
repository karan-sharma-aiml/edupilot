"use client";

import { PageTransition } from '@/components/shared/page-transition';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/services/api';

import { ProtectedRoute } from '@/components/shared/protected-route';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { GlassCard } from '@/components/shared/glass-card';
import { ArrowLeft, CheckCircle2, BrainCircuit } from 'lucide-react';

export default function LearnPage() {
  const { studentId, topicId } = useParams();
  const router = useRouter();
  const topicTitle = decodeURIComponent(topicId as string);

  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!studentId || !topicTitle) return;

    const fetchExplanation = async () => {
      try {
        const res = await api.explainTopic(studentId as string, topicTitle);
        setExplanation(res.explanation);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load this lesson');
        setExplanation("# Failed to load content\nPlease try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [studentId, topicTitle]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Find week and order for this topic to mark complete. 
      // Simplified: backend should handle by topic title or we fetch roadmap first.
      // Assuming api.completeTopic takes weekNumber and topicOrder, which we'd need to lookup.
      // For simplicity in UI since we don't have it, let's assume a simpler API call or just proceed to quiz

      // We will skip marking complete here if backend requires weekNumber, and do it after quiz.
      // Or we can just route to quiz directly.
      router.push(`/quiz/${studentId}/${encodeURIComponent(topicTitle)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open the quiz');
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <LoadingSpinner message="AI is generating your personalized lesson..." />
        <div className="mt-8 max-w-2xl w-full space-y-4">
          <div className="h-8 bg-white/5 rounded-lg w-3/4 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
          <div className="h-32 bg-white/5 rounded-xl w-full animate-pulse mt-8" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen max-w-3xl mx-auto px-6 py-8 pb-32">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 sticky top-0 bg-zinc-950/80 backdrop-blur-md py-4 z-10 border-b border-white/5">
            <Link href={`/roadmap/${studentId}`}>
              <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold truncate">{topicTitle}</h1>
          </div>

          {/* Content */}
          <GlassCard hover={false} className="p-8 md:p-10">
            <div className="prose prose-invert prose-blue max-w-none 
            prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl 
            prose-a:text-blue-400 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10
            prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-strong:text-zinc-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            </div>
          </GlassCard>

          {/* Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pointer-events-none">
            <div className="max-w-3xl mx-auto flex justify-end gap-4 pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleComplete}
                disabled={completing}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-xl font-semibold text-white shadow-lg shadow-purple-900/20 hover:from-blue-500 hover:to-purple-500 transition-colors"
              >
                <BrainCircuit className="h-5 w-5" />
                Take Quiz to Master
              </motion.button>
            </div>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
