'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import HeroDetailPopup from '@/components/HeroDetailPopup';
import { Specialty } from '@/data/Specialty';
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
  const [detailHero, setDetailHero] = useState<Hero | null>(null);

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
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">
          ← Back
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>🎲 Sample Draft</h1>
        <span className="text-sm" style={{ color: '#FFD700' }}>📍 {map.name}</span>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Team 1 */}
        <div className="flex-1">
          <h2 className="font-bold mb-2" style={{ color: '#4488FF' }}>TEAM 1 <ScoreBadge picks={draft.team1Picks} /></h2>
          <RoleBadges picks={draft.team1Picks} />
          <div className="mb-3 mt-2">
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
              <div key={h.name} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5" style={{ background: 'rgba(30, 40, 70, 0.7)' }} onClick={() => setDetailHero(h)}>
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
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Draft Analysis</h3>
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-sm font-semibold mb-1"><span style={{ color: '#4488FF' }}>Team 1:</span> {winConditionToString(analysis.team1.primary)}</p>
              <p className="text-xs opacity-70 mb-1">{analysis.team1.description}</p>
              <p className="text-[10px]"><span style={{ color: '#00FFFF' }}>Focus:</span> <span className="opacity-70">{analysis.team1.keyFocus}</span></p>
              <p className="text-[10px]"><span style={{ color: '#FF6666' }}>Counter:</span> <span className="opacity-70">{analysis.team1.enemyCounterStrategy}</span></p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1"><span style={{ color: '#FF6666' }}>Team 2:</span> {winConditionToString(analysis.team2.primary)}</p>
              <p className="text-xs opacity-70 mb-1">{analysis.team2.description}</p>
              <p className="text-[10px]"><span style={{ color: '#00FFFF' }}>Focus:</span> <span className="opacity-70">{analysis.team2.keyFocus}</span></p>
              <p className="text-[10px]"><span style={{ color: '#FF6666' }}>Counter:</span> <span className="opacity-70">{analysis.team2.enemyCounterStrategy}</span></p>
            </div>
          </div>
          <button
            onClick={() => setDraft(generateRandomDraft())}
            className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#FFD70022', border: '2px solid #FFD700', color: '#FFD700' }}
            title="Generate a new random draft"
          >
            🎲 Re-Roll Draft
          </button>
        </div>

        {/* Team 2 */}
        <div className="flex-1">
          <h2 className="font-bold mb-2" style={{ color: '#FF6666' }}>TEAM 2 <ScoreBadge picks={draft.team2Picks} /></h2>
          <RoleBadges picks={draft.team2Picks} />
          <RoleBadges picks={draft.team2Picks} />
          <div className="mb-3 mt-2">
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
              <div key={h.name} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5" style={{ background: 'rgba(30, 40, 70, 0.7)' }} onClick={() => setDetailHero(h)}>
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
      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}
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

function sampleCompScore(picks: Hero[]): number {
  let score = 20;
  if (picks.some(h => h.role === 'Tank')) score += 15;
  if (picks.some(h => h.role === 'Healer')) score += 15;
  if (picks.some(h => h.role === 'DPS' || h.role === 'Mage')) score += 10;
  if (picks.some(h => h.role === 'Offlane')) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.WAVECLEAR))) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.ENGAGE))) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.HARD_CC))) score += 10;
  if (picks.filter(h => h.role === 'Tank').length >= 2) score -= 10;
  if (picks.filter(h => h.role === 'Healer').length >= 2) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function ScoreBadge({ picks }: { picks: Hero[] }) {
  const score = sampleCompScore(picks);
  const color = score >= 80 ? '#90EE90' : score >= 50 ? '#FFD700' : '#FF6666';
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded ml-2" style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
      {score}
    </span>
  );
}

const SAMPLE_ROLE_CHECKS = [
  { label: 'Tank', icon: '🛡️', check: (h: Hero) => h.role === 'Tank' },
  { label: 'Healer', icon: '✚', check: (h: Hero) => h.role === 'Healer' },
  { label: 'DPS', icon: '⚔️', check: (h: Hero) => h.role === 'DPS' || h.role === 'Mage' },
  { label: 'Offlane', icon: '⚙️', check: (h: Hero) => h.role === 'Offlane' },
  { label: 'Waveclear', icon: '🌊', check: (h: Hero) => h.specialties.includes(Specialty.WAVECLEAR) },
];

function RoleBadges({ picks }: { picks: Hero[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {SAMPLE_ROLE_CHECKS.map(({ label, icon, check }) => {
        const filled = picks.some(check);
        return (
          <span key={label} className="text-xs px-1 py-0.5 rounded" title={label}
            style={{ background: filled ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)', color: filled ? '#90EE90' : '#FF6666', border: `1px solid ${filled ? '#90EE9044' : '#FF666644'}` }}>
            {icon}{filled ? '✓' : '✗'}
          </span>
        );
      })}
    </div>
  );
}
