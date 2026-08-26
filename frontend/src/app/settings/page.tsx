'use client';

import { useState } from 'react';
import { Bell, Moon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { PageTransition } from '@/components/shared/page-transition';
import { GlassCard } from '@/components/shared/glass-card';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled ?? true);
    const [isSaving, setIsSaving] = useState(false);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const updatedUser = await api.updateMe({ notifications_enabled: notificationsEnabled });
            setUser(updatedUser);
            toast.success('Settings saved');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ProtectedRoute>
            <PageTransition>
                <main className="min-h-screen max-w-2xl mx-auto px-6 py-12">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Settings</h1>
                        <p className="text-zinc-400">Manage your EduPilot preferences.</p>
                    </header>

                    <GlassCard hover={false}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-blue-400" />
                                <div>
                                    <p className="font-medium">Learning notifications</p>
                                    <p className="text-sm text-zinc-500">Receive reminders about your learning progress.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={notificationsEnabled}
                                onClick={() => setNotificationsEnabled((enabled) => !enabled)}
                                className={`relative h-6 w-11 rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
                            >
                                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6 text-zinc-400">
                            <Moon className="h-5 w-5" />
                            <div>
                                <p className="font-medium text-zinc-200">Appearance</p>
                                <p className="text-sm">Dark theme is active.</p>
                            </div>
                        </div>

                        <button type="button" onClick={() => void saveSettings()} disabled={isSaving} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50">
                            {isSaving ? <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                            Save settings
                        </button>
                    </GlassCard>
                </main>
            </PageTransition>
        </ProtectedRoute>
    );
}