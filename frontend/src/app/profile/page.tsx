'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, UserRound } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { PageTransition } from '@/components/shared/page-transition';
import { GlassCard } from '@/components/shared/glass-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function ProfilePage() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [goal, setGoal] = useState(user?.goal || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        setIsSaving(true);
        try {
            const updatedUser = await api.updateMe({ name: name.trim(), goal: goal.trim() });
            setUser(updatedUser);
            toast.success('Profile saved successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to save your profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ProtectedRoute>
            <PageTransition>
                <main className="min-h-screen max-w-2xl mx-auto px-6 py-12">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-8 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Back
                    </button>

                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center">
                                <UserRound className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold">Your Profile</h1>
                        </div>
                        <p className="text-zinc-400">Keep your learning details up to date.</p>
                    </header>

                    {!user ? (
                        <LoadingSpinner message="Loading your profile..." />
                    ) : (
                        <GlassCard hover={false}>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{user.name}</p>
                                        <p className="text-sm text-zinc-400">{user.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="profile-name" className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
                                    <input
                                        id="profile-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="profile-email" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                                    <input
                                        id="profile-email"
                                        value={user.email}
                                        className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-zinc-500"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label htmlFor="profile-goal" className="block text-sm font-medium text-zinc-300 mb-2">Learning goal</label>
                                    <textarea
                                        id="profile-goal"
                                        value={goal}
                                        onChange={(event) => setGoal(event.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white resize-none"
                                        placeholder="What would you like to learn?"
                                        disabled={isSaving}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
                                </button>
                            </form>
                        </GlassCard>
                    )}
                </main>
            </PageTransition>
        </ProtectedRoute>
    );
}
