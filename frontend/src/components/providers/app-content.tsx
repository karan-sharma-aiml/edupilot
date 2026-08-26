'use client';

import { useAuthStore } from '@/stores/auth-store';

export function AppContent({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
        <div className={isAuthenticated ? 'pt-16' : undefined}>
            {children}
        </div>
    );
}
