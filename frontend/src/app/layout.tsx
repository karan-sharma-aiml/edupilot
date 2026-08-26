import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppContent } from '@/components/providers/app-content';
import { Navbar } from '@/components/shared/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduPilot — Your Personal AI Learning Mentor',
  description: 'AI-powered personalized learning platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}>
        <AuthProvider>
          <Navbar />
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
