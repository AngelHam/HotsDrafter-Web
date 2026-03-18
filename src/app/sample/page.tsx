'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import type { Hero } from '@/data/Hero';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateRandomDraft() {
  const shuffled = shuffleArray(ALL_HEROES);
  return {
    team1Bans: shuffled.slice(0, 3),
    team2Bans: shuffled.slice(3, 6),
    team1Picks: shuffled.slice(6, 11),
    team2Picks: shuffled.slice(11, 16),
  };
}

// Stable initial draft for SSR (avoids hydration mismatch)
const INITIAL_DRAFT = {
  team1Bans: ALL_HEROES.slice(0, 3),
  team2Bans: ALL_HEROES.slice(3, 6),
  team1Picks: ALL_HEROES.slice(6, 11),
  team2Picks: ALL_HEROES.slice(11, 16),
};

function SampleDraftInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapIdx = parseInt(searchParams.get('map') || '0', 10);
  const map = ALL_MAPS[mapIdx] || ALL_MAPS[0];

  const [draft, setDraft] = useState(INITIAL_DRAFT);

  // Randomize on mount to avoid hydration mismatch
  useEffect(() => {
    setDraft(generateRandomDraft());
  }, []);

  const analysis = useMemo(() => {
    const t1 = new TeamComposition(draft.team1Picks);
    const t2 = new TeamComposition(draft.team2Picks);
    return {
      team1: analyzeWinCondition(t1, t2),
      team2: analyzeWinCondition(t2, t1),
    };
  }, [draft]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">
          ← Back
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>🎲 Sample Draft</h1>
        <span className="text-sm" style={{ color: '#FFD700' }}>📍 {map.name}</span>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Team 1 */}
        <div className="flex-1">
          <h2 className="font-bold mb-3" style={{ color: '#4488FF' }}>TEAM 1</h2>
          <div className="mb-3">
            <span className="text-xs font-semibold" style={{ color: '#FF6666' }}>BANS</span>
            <div className="flex gap-2 mt-1">
              {draft.team1Bans.map(h => (
                <div key={h.name} className="flex items-center gap-1">
                  <HeroPortrait hero={h} size="sm" banned />
                  <span className="text-xs" style={{ color: '#FF6666' }}>{h.nicknames[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>PICKS</span>
          <div className="flex flex-col gap-2 mt-1">
            {draft.team1Picks.map(h => (
              <div key={h.name} className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)' }}>
                <HeroPortrait hero={h} size="md" selected />
                <div>
                  <span className="text-sm font-semibold">{h.nicknames[0]}</span>
                  <span className="text-xs ml-2 opacity-60">{h.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Analysis */}
        <div className="w-80 flex flex-col gap-4">
          <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-2" style={{ color: '#00FFFF' }}>Draft Analysis</h3>
            <p className="text-sm mb-2"><span style={{ color: '#4488FF' }}>Team 1:</span> {winConditionToString(analysis.team1.primary)}</p>
            <p className="text-xs opacity-80 mb-3">{analysis.team1.keyFocus}</p>
            <p className="text-sm mb-2"><span style={{ color: '#FF6666' }}>Team 2:</span> {winConditionToString(analysis.team2.primary)}</p>
            <p className="text-xs opacity-80">{analysis.team2.keyFocus}</p>
          </div>
          <button
            onClick={() => setDraft(generateRandomDraft())}
            className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{ background: '#FFD70022', border: '2px solid #FFD700', color: '#FFD700' }}
            title="Generate a new random draft"
          >
            🎲 Re-Roll Draft
          </button>
        </div>

        {/* Team 2 */}
        <div className="flex-1">
          <h2 className="font-bold mb-3" style={{ color: '#FF6666' }}>TEAM 2</h2>
          <div className="mb-3">
            <span className="text-xs font-semibold" style={{ color: '#FF6666' }}>BANS</span>
            <div className="flex gap-2 mt-1">
              {draft.team2Bans.map(h => (
                <div key={h.name} className="flex items-center gap-1">
                  <HeroPortrait hero={h} size="sm" banned />
                  <span className="text-xs" style={{ color: '#FF6666' }}>{h.nicknames[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>PICKS</span>
          <div className="flex flex-col gap-2 mt-1">
            {draft.team2Picks.map(h => (
              <div key={h.name} className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)' }}>
                <HeroPortrait hero={h} size="md" selected />
                <div>
                  <span className="text-sm font-semibold">{h.nicknames[0]}</span>
                  <span className="text-xs ml-2 opacity-60">{h.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SampleDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SampleDraftInner />
    </Suspense>
  );
}
