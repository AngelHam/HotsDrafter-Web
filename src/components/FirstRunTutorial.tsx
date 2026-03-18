'use client';

import { useState, useEffect } from 'react';

const TUTORIAL_PAGES = [
  {
    title: 'Welcome to HotsDrafter!',
    icon: '⚔️',
    content: 'Your intelligent drafting assistant for Heroes of the Storm. This tool helps you make optimal hero picks and bans by analyzing team synergies, counter-matchups, and map fitness.',
    highlight: 'Let\'s walk through the key features.',
  },
  {
    title: 'Hero Grid',
    icon: '🦸',
    content: 'The center grid shows all 90 heroes with their portraits and map tier badges (S/A/C/D). Heroes are color-coded by role: 🛡️ Blue = Tank, ✚ Green = Healer, ⚔️ Red = DPS, ✨ Purple = Mage, ⚙️ Orange = Offlane. Right-click any hero for detailed info.',
    highlight: 'Use the search box to filter by name, or the role buttons to filter by role.',
  },
  {
    title: 'Suggestion Scoring',
    icon: '📊',
    content: 'Each suggestion shows a total score plus 5 mini-bars: Synergy (30%), Counter (25%), Map Fitness (20%), Role Need (15%), and Win Condition (10%). Role tags and counterpick threat warnings help you evaluate quickly.',
    highlight: 'Green scores (50+) are excellent. Orange (30-49) are good. Red (<30) are situational.',
  },
  {
    title: 'Team Panels',
    icon: '👥',
    content: 'Side panels show bans (with names), picks (with role tags), composition score (0-100), role coverage indicators, and synergy connections between heroes. The active team\'s panel glows.',
    highlight: 'Watch for ⚠️ alerts like "No Tank!" or "Double Healer" after 3+ picks.',
  },
  {
    title: 'Draft Timeline',
    icon: '📍',
    content: 'The progress bar shows all 16 steps with visible numbers and team labels. The current step pulses gold. An optional countdown timer can be enabled for each step.',
    highlight: 'Step numbers help you track exactly where you are in the draft.',
  },
  {
    title: 'Controls & Shortcuts',
    icon: '⌨️',
    content: 'Ctrl+Z: Undo last action. Escape: Reset draft. 1-9: Quick-pick suggestions. Right-click: Hero details popup. Role filters and Grid/Role view toggle available.',
    highlight: 'Check Settings → Keyboard Shortcuts for the full reference.',
  },
  {
    title: 'More Features',
    icon: '🏆',
    content: 'Explore the Meta Tier List to see hero rankings across all maps. Use Team Builder for freeform composition analysis. Sample Draft generates random matchups with AI analysis. All drafts auto-save to History.',
    highlight: 'Select a map, click Interactive Draft, and start building your perfect team!',
  },
];

const STORAGE_KEY = 'hotsDrafter-tutorialSeen';

interface FirstRunTutorialProps {
  onClose: () => void;
}

export default function FirstRunTutorial({ onClose }: FirstRunTutorialProps) {
  const [page, setPage] = useState(0);
  const current = TUTORIAL_PAGES[page];

  const handleNext = () => {
    if (page < TUTORIAL_PAGES.length - 1) {
      setPage(p => p + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="max-w-lg w-full mx-4 rounded-xl p-6" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '2px solid #00FFFF' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{current.icon}</span>
          <h2 className="text-xl font-bold" style={{ color: '#00FFFF' }}>{current.title}</h2>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed mb-3 opacity-90">{current.content}</p>
        <p className="text-sm font-semibold mb-6" style={{ color: '#FFD700' }}>{current.highlight}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {TUTORIAL_PAGES.map((_, i) => (
            <div key={i} className="rounded-full" style={{
              width: 8, height: 8,
              background: i === page ? '#00FFFF' : i < page ? '#00FFFF44' : 'rgba(255,255,255,0.2)',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button onClick={handleSkip} className="text-sm px-4 py-2 rounded opacity-50 hover:opacity-100" style={{ color: '#999' }} title="Skip onboarding and continue">
            Skip Tutorial
          </button>
          <button onClick={handleNext} className="text-sm px-6 py-2 rounded font-bold transition-all hover:scale-105"
            style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
            title={page < TUTORIAL_PAGES.length - 1 ? 'Go to next tutorial step' : 'Finish tutorial and start drafting'}>
            {page < TUTORIAL_PAGES.length - 1 ? 'Next →' : 'Start Drafting! 🏆'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
