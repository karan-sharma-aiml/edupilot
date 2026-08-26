'use client';

import { FormEvent, useState } from 'react';
import { Copy, Download, FileText, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { NotesDocument } from '@/types';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { PageTransition } from '@/components/shared/page-transition';
import { GlassCard } from '@/components/shared/glass-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { MarkdownContent } from '@/components/shared/markdown-content';

export default function NotesPage() {
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState<NotesDocument | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const generate = async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (!topic.trim() || isLoading) {
            if (!topic.trim()) toast.error('Enter a topic to generate notes');
            return;
        }

        setIsLoading(true);
        try {
            const result = await api.generateNotes(topic.trim());
            setNotes(result);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to generate notes');
        } finally {
            setIsLoading(false);
        }
    };

    const copyNotes = async () => {
        if (!notes) return;
        await navigator.clipboard.writeText(notes.content);
        toast.success('Notes copied');
    };

    const downloadNotes = () => {
        if (!notes) return;
        const blob = new Blob([notes.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${notes.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notes.md`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Notes downloaded');
    };

    return (
        <ProtectedRoute>
            <PageTransition>
                <main className="min-h-screen max-w-5xl mx-auto px-6 py-10">
                    <header className="mb-8 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Notes Generator</h1>
                            <p className="text-sm text-zinc-400">Turn any topic into clear, structured study notes.</p>
                        </div>
                    </header>

                    <GlassCard hover={false} className="mb-8">
                        <form onSubmit={generate} className="flex flex-col sm:flex-row gap-3">
                            <label className="flex-1">
                                <span className="sr-only">Topic</span>
                                <input
                                    value={topic}
                                    onChange={(event) => setTopic(event.target.value)}
                                    placeholder="Enter a topic, e.g. Machine Learning"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                                    disabled={isLoading}
                                />
                            </label>
                            <button type="submit" disabled={isLoading || !topic.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40">
                                <Sparkles className="h-4 w-4" /> Generate notes
                            </button>
                        </form>
                    </GlassCard>

                    {isLoading && (
                        <GlassCard hover={false} className="min-h-64 flex items-center justify-center">
                            <LoadingSpinner message="Creating your study notes..." />
                        </GlassCard>
                    )}

                    {!isLoading && notes && (
                        <GlassCard hover={false}>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-sm text-zinc-500">Study notes</p>
                                    <h2 className="text-xl font-semibold">{notes.topic}</h2>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => void copyNotes()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">
                                        <Copy className="h-4 w-4" /> Copy
                                    </button>
                                    <button type="button" onClick={downloadNotes} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">
                                        <Download className="h-4 w-4" /> Download
                                    </button>
                                    <button type="button" onClick={() => void generate()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">
                                        <RotateCcw className="h-4 w-4" /> Regenerate
                                    </button>
                                </div>
                            </div>
                            <MarkdownContent content={notes.content} />
                        </GlassCard>
                    )}

                    {!isLoading && !notes && (
                        <GlassCard hover={false} className="min-h-64 flex flex-col items-center justify-center text-center text-zinc-500">
                            <FileText className="h-10 w-10 mb-4 text-purple-400/70" />
                            <p className="text-zinc-300 font-medium">Your notes will appear here</p>
                            <p className="text-sm mt-2">Choose a topic to create a focused study guide.</p>
                        </GlassCard>
                    )}
                </main>
            </PageTransition>
        </ProtectedRoute>
    );
}
