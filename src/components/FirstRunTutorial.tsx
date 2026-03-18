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
    content: 'The center grid shows all 89 heroes with their portraits. Heroes are color-coded by role: 🛡️ Blue = Tank, ✚ Green = Healer, ⚔️ Red = DPS, ✨ Purple = Mage, ⚙️ Orange = Offlane.',
    highlight: 'Use the search box to filter by name, or the role buttons to filter by role.',
  },
  {
    title: 'Suggestion Scoring',
    icon: '📊',
    content: 'The suggestion panel scores each hero using 9 factors: Synergy (20%), Counter (22%), Map Fitness (12%), Role Need (18%), Win Condition (10%), Range (8%), Draft Position (4%), Damage Balance (3%), Counterpick Risk (3%).',
    highlight: 'Green scores (50+) are excellent. Orange (30-49) are good. Red (<30) are situational.',
  },
  {
    title: 'Team Panels',
    icon: '👥',
    content: 'The left and right panels show each team\'s bans and picks. Role indicators (Tank ✓, Healer ✗) show what your team has and still needs. Composition alerts warn about missing roles.',
    highlight: 'Watch for ⚠️ alerts like "No Tank!" or "No Healer!" after 3+ picks.',
  },
  {
    title: 'Draft Timeline',
    icon: '📍',
    content: 'The progress bar shows the 16-step draft order: 4 bans → 5 picks → 2 bans → 5 picks. Steps are color-coded by team (Blue = Team 1, Red = Team 2).',
    highlight: 'Step numbers help you track exactly where you are in the draft.',
  },
  {
    title: 'Controls',
    icon: '🎮',
    content: 'Undo: Revert last pick/ban (Ctrl+Z). Reset: Clear entire draft (Esc). Role Filters: Show only specific roles. Search: Find heroes by name.',
    highlight: 'You can also click suggestions to auto-pick the recommended hero.',
  },
  {
    title: 'You\'re Ready!',
    icon: '🏆',
    content: 'Select a map on the home page, click Interactive Draft, and start building your perfect team composition. Good luck in the Nexus!',
    highlight: 'Tip: The app saves your settings and draft history automatically.',
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
          <button onClick={handleSkip} className="text-sm px-4 py-2 rounded opacity-50 hover:opacity-100" style={{ color: '#999' }}>
            Skip Tutorial
          </button>
          <button onClick={handleNext} className="text-sm px-6 py-2 rounded font-bold transition-all hover:scale-105"
            style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}>
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
