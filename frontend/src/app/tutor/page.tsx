'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Copy, RotateCcw, Send, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { PageTransition } from '@/components/shared/page-transition';
import { GlassCard } from '@/components/shared/glass-card';
import { MarkdownContent } from '@/components/shared/markdown-content';

export default function TutorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [currentTopic, setCurrentTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessages = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessages.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const askTutor = async (text: string, history: ChatMessage[] = messages) => {
        const trimmedMessage = text.trim();
        if (!trimmedMessage || isLoading) return;

        setMessage('');
        setMessages((previous) => [...previous, { role: 'user', content: trimmedMessage }]);
        setIsLoading(true);
        try {
            const response = await api.chat(trimmedMessage, currentTopic.trim(), history);
            setMessages((previous) => [...previous, { role: 'assistant', content: response.response }]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to get a response from the AI Tutor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void askTutor(message);
    };

    const regenerate = () => {
        if (isLoading || messages.length < 2) return;
        const lastUserIndex = [...messages].map((item) => item.role).lastIndexOf('user');
        if (lastUserIndex < 0) return;
        const lastUser = messages[lastUserIndex];
        setMessages(messages.slice(0, lastUserIndex));
        setIsLoading(true);
        void api.chat(lastUser.content, currentTopic.trim(), messages.slice(0, lastUserIndex))
            .then((response) => {
                setMessages((previous) => [...previous, { role: 'user', content: lastUser.content }, { role: 'assistant', content: response.response }]);
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : 'Unable to regenerate the response');
                setMessages((previous) => [...previous, lastUser]);
            })
            .finally(() => setIsLoading(false));
    };

    const copyResponse = async (content: string) => {
        await navigator.clipboard.writeText(content);
        toast.success('Response copied');
    };

    return (
        <ProtectedRoute>
            <PageTransition>
                <main className="min-h-screen max-w-5xl mx-auto px-6 py-10">
                    <header className="mb-8 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">AI Tutor</h1>
                                <p className="text-sm text-zinc-400">Ask questions and learn with guided explanations.</p>
                            </div>
                        </div>
                    </header>

                    <GlassCard hover={false} className="p-0 overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/10">
                            <label className="flex-1">
                                <span className="sr-only">Current topic</span>
                                <input
                                    value={currentTopic}
                                    onChange={(event) => setCurrentTopic(event.target.value)}
                                    placeholder="Current topic (optional)"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setMessages([])}
                                disabled={!messages.length || isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                            >
                                <Trash2 className="h-4 w-4" /> Clear chat
                            </button>
                        </div>

                        <div className="h-[min(60vh,560px)] overflow-y-auto p-4 sm:p-6 space-y-6">
                            {!messages.length && (
                                <div className="h-full min-h-64 flex flex-col items-center justify-center text-center text-zinc-500">
                                    <Bot className="h-10 w-10 mb-4 text-blue-400/70" />
                                    <p className="text-zinc-300 font-medium">What would you like to understand?</p>
                                    <p className="text-sm mt-2 max-w-sm">Ask for an explanation, example, analogy, or practice question.</p>
                                </div>
                            )}

                            {messages.map((item, index) => (
                                <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {item.role === 'assistant' && (
                                        <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-xl px-4 py-3 ${item.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10'}`}>
                                        {item.role === 'assistant' ? <MarkdownContent content={item.content} /> : <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>}
                                        {item.role === 'assistant' && (
                                            <div className="mt-3 flex gap-3 border-t border-white/10 pt-2">
                                                <button type="button" onClick={() => void copyResponse(item.content)} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
                                                    <Copy className="h-3.5 w-3.5" /> Copy
                                                </button>
                                                {index === messages.length - 1 && (
                                                    <button type="button" onClick={regenerate} disabled={isLoading} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-40">
                                                        <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {item.role === 'user' && (
                                        <div className="h-8 w-8 shrink-0 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                                            <UserRound className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center"><Bot className="h-4 w-4" /></div>
                                    <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce [animation-delay:120ms]">.</span><span className="animate-bounce [animation-delay:240ms]">.</span></span>
                                </div>
                            )}
                            <div ref={endOfMessages} />
                        </div>

                        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 flex gap-3">
                            <label className="sr-only" htmlFor="tutor-message">Ask the AI Tutor</label>
                            <textarea
                                id="tutor-message"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        event.currentTarget.form?.requestSubmit();
                                    }
                                }}
                                placeholder="Ask a question..."
                                rows={1}
                                disabled={isLoading}
                                className="min-w-0 flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                            />
                            <button type="submit" disabled={!message.trim() || isLoading} aria-label="Send message" className="h-11 w-11 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-40">
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                    </GlassCard>
                </main>
            </PageTransition>
        </ProtectedRoute>
    );
}
