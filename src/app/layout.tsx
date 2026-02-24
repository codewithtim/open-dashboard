import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';

export const metadata = { title: 'Open Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F4F7FE] dark:bg-[#0B1437] transition-colors duration-300 antialiased text-neutral-900 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
