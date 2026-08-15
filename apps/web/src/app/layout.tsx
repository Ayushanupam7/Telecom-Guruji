import React from 'react';
import { Roboto, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { QuickToolsDrawer } from '@/components/QuickToolsDrawer';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Telecom Guruji — AI-Powered Learning & Verification Platform',
  description: 'Telecom Guruji verifies meaningful learning progress through structured modules, video engagement tracking, and randomized quiz assessments.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body className={`${roboto.className} font-sans min-h-screen flex flex-col antialiased tracking-normal relative`}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <ToastProvider>
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 lg:pb-8">
                  {children}
                </main>
                <BottomNav />
                <QuickToolsDrawer />
                <Footer />
              </ToastProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
