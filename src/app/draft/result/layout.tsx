import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HotsDrafter — Draft Result',
  description: 'View a completed Heroes of the Storm draft with team compositions, win conditions, and analysis.',
  openGraph: {
    title: 'HotsDrafter — Draft Result',
    description: 'View a Heroes of the Storm draft with team analysis, synergies, and counter matchups.',
    siteName: 'HotsDrafter',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'HotsDrafter — Draft Result',
    description: 'Heroes of the Storm draft analysis with synergies, counters, and win conditions.',
  },
};

export default function DraftResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
