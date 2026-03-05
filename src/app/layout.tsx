import './globals.css';
import { Header } from '@/components/header';
import { Analytics } from '@vercel/analytics/next';
import { IBM_Plex_Mono } from 'next/font/google';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata = { title: 'Open Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.variable} min-h-screen bg-surface font-mono transition-colors duration-300 antialiased text-slate-200`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          <Header />
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
