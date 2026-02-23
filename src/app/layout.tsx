import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';

export const metadata = { title: 'Open Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 antialiased text-neutral-900 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
