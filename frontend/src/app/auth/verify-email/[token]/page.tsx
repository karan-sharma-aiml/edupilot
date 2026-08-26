'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    api.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] z-10 shadow-2xl text-center"
      >
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
            EduPilot
          </h1>
        </Link>

        {status === 'loading' && (
          <div className="py-8">
            <LoadingSpinner message="Verifying your email..." />
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl text-white font-bold mb-2">Email Verified!</h2>
            <p className="text-zinc-400 mb-8">
              Your email has been successfully verified. You can now access all features.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl text-white font-bold mb-2">Verification Failed</h2>
            <p className="text-zinc-400 mb-8">{errorMessage}</p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all"
            >
              Return to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
