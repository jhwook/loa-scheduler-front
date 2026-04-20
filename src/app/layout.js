import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppMotionProvider } from '@/components/motion/AppMotionProvider';
import { AppHeader } from '@/components/layout/AppHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'LoA Scheduler',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" data-theme="dim">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-base-100 text-base-content min-h-screen antialiased`}
      >
        <AppMotionProvider>
          <AppHeader />
          <div className="pt-16">{children}</div>
        </AppMotionProvider>
      </body>
    </html>
  );
}
