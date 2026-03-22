import type { Metadata } from "next";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: 'HotsDrafter — Heroes of the Storm Draft Assistant',
  description: 'Smart draft suggestions powered by synergy, counter, and map analysis. Free, no login required.',
  openGraph: {
    title: 'HotsDrafter',
    description: 'Heroes of the Storm draft assistant with smart suggestions, counter analysis, and team composition tools.',
    siteName: 'HotsDrafter',
    type: 'website',
    url: 'https://hots-drafter-web.vercel.app',
  },
  twitter: {
    card: 'summary',
    title: 'HotsDrafter',
    description: 'HotS draft assistant with synergy and counter analysis.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-cyan-600 focus:text-white focus:px-4 focus:py-2"
          >
            Skip to main content
          </a>
          {children}
          <GlobalNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
