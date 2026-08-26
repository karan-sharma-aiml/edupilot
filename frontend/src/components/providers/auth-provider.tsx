'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/services/api';
import { Toaster } from 'sonner';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, refreshToken, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    initialize();
    
    // If we have a refresh token but no access token, try to refresh
    const store = useAuthStore.getState();
    if (store.refreshToken && !store.accessToken) {
      api.refreshToken()
        .then((data) => setAuth(data.user, data.access_token, data.refresh_token))
        .catch(() => { clearAuth(); })
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      {children}
    </>
  );
}
