'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { WinCondition, winConditionToString } from '@/data/SuggestionTypes';
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

function pickDiverseTeam(pool: Hero[]): Hero[] {
  const roles = ['Tank', 'Healer', 'Offlane'];
  const picked: Hero[] = [];
  const used = new Set<string>();
  // Guarantee one Tank, one Healer, one Offlane
  for (const role of roles) {
    const candidates = pool.filter(h => h.role === role && !used.has(h.name));
    if (candidates.length > 0) {
      const h = candidates[Math.floor(Math.random() * candidates.length)];
      picked.push(h);
      used.add(h.name);
    }
  }
  // Fill remaining 2 slots from DPS/Mage/Specialist (avoid duplicate healers)
  const fillers = pool.filter(h => !used.has(h.name) && h.role !== 'Healer');
  const shuffledFillers = shuffleArray(fillers);
  for (const h of shuffledFillers) {
    if (picked.length >= 5) break;
    picked.push(h);
    used.add(h.name);
  }
  return shuffleArray(picked);
}

function generateRandomDraft() {
  const shuffled = shuffleArray(ALL_HEROES);
  const bans = shuffled.slice(0, 6);
  const pool = shuffled.filter(h => !bans.includes(h));
  const team1Picks = pickDiverseTeam(pool);
  const remainingPool = pool.filter(h => !team1Picks.includes(h));
  const team2Picks = pickDiverseTeam(remainingPool);
  return {
    team1Bans: bans.slice(0, 3),
    team2Bans: bans.slice(3, 6),
    team1Picks,
    team2Picks,
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
        <select value={mapIdx} onChange={e => router.push(`/sample?map=${e.target.value}`)}
          className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
          {ALL_MAPS.map((m, i) => <option key={m.name} value={i}>{m.name}</option>)}
        </select>
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
          <WinConditionBadges picks={draft.team1Picks} analysis={analysis.team1} />
        </div>

        {/* Center Analysis */}
        <div className="w-80 flex flex-col gap-4">
          <ScoreComparisonBar score1={sampleCompScore(draft.team1Picks)} score2={sampleCompScore(draft.team2Picks)} />
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
            className="px-8 py-4 rounded-lg text-lg font-bold transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              background: 'rgba(0, 255, 255, 0.08)',
              border: '2px solid #00FFFF',
              color: '#00FFFF',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(0, 255, 255, 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(0, 255, 255, 0.08)'; }}
            title="Generate a new random draft"
          >
            🎲 Re-Roll Draft
          </button>
        </div>

        {/* Team 2 */}
        <div className="flex-1">
          <h2 className="font-bold mb-2" style={{ color: '#FF6666' }}>TEAM 2 <ScoreBadge picks={draft.team2Picks} /></h2>
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
          <WinConditionBadges picks={draft.team2Picks} analysis={analysis.team2} />
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
  { label: 'Tank', desc: 'Has a frontline tank for engage & peel', icon: '🛡️', color: '#6495ED', check: (h: Hero) => h.role === 'Tank' },
  { label: 'Healer', desc: 'Has a healer to sustain the team', icon: '✚', color: '#90EE90', check: (h: Hero) => h.role === 'Healer' },
  { label: 'DPS', desc: 'Has ranged damage dealer (DPS or Mage)', icon: '⚔️', color: '#FF6347', check: (h: Hero) => h.role === 'DPS' || h.role === 'Mage' },
  { label: 'Offlane', desc: 'Has a solo laner for off-lane pressure', icon: '⚙️', color: '#FFA500', check: (h: Hero) => h.role === 'Offlane' },
  { label: 'Waveclear', desc: 'Has waveclear to manage lanes', icon: '🌊', color: '#BA55D3', check: (h: Hero) => h.specialties.includes(Specialty.WAVECLEAR) },
];

function RoleBadges({ picks }: { picks: Hero[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {SAMPLE_ROLE_CHECKS.map(({ label, desc, icon, color, check }) => {
        const filled = picks.some(check);
        return (
          <span key={label} className="text-xs px-2 py-1 rounded-md font-medium cursor-default"
            title={`${label}: ${desc}`}
            style={{
              background: filled ? `${color}22` : 'rgba(255,0,0,0.1)',
              color: filled ? color : '#FF666699',
              border: `1px solid ${filled ? color + '66' : '#FF666633'}`,
              fontSize: '11px',
            }}>
            {icon} {filled ? '✓' : '✗'}
          </span>
        );
      })}
    </div>
  );
}

const WIN_CONDITION_COLORS: Record<string, string> = {
  [WinCondition.TEAMFIGHT]: '#4488FF',
  [WinCondition.POKE_SIEGE]: '#BA55D3',
  [WinCondition.DIVE]: '#FF6347',
  [WinCondition.SPLIT_MACRO]: '#FFA500',
  [WinCondition.PICK_COMP]: '#FF6666',
  [WinCondition.SUSTAIN_ATTRITION]: '#90EE90',
  [WinCondition.SNOWBALL_EARLY]: '#FFD700',
  [WinCondition.LATE_GAME_SCALE]: '#6495ED',
};

function WinConditionBadges({ analysis }: { picks?: Hero[]; analysis: { primary: WinCondition; scores: Record<WinCondition, number> } }) {
  // Show primary + any secondary conditions scoring above a threshold
  const sorted = Object.entries(analysis.scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0)
    .slice(0, 3);
  return (
    <div className="flex gap-1.5 flex-wrap mt-3">
      {sorted.map(([wc, score], idx) => {
        const color = WIN_CONDITION_COLORS[wc] || '#00FFFF';
        const isPrimary = idx === 0;
        return (
          <span key={wc} className="text-[10px] font-semibold px-2 py-1 rounded-full cursor-default"
            title={`${winConditionToString(wc as WinCondition)} (strength: ${score})`}
            style={{
              background: `${color}${isPrimary ? '33' : '1A'}`,
              color,
              border: `1px solid ${color}${isPrimary ? '88' : '44'}`,
            }}>
            {winConditionToString(wc as WinCondition)}
          </span>
        );
      })}
    </div>
  );
}

function ScoreComparisonBar({ score1, score2 }: { score1: number; score2: number }) {
  const total = score1 + score2 || 1;
  const pct1 = Math.round((score1 / total) * 100);
  const diff = Math.abs(score1 - score2);
  const verdict = diff <= 10 ? 'Close Match' : diff <= 25 ? (score1 > score2 ? 'Team 1 Favored' : 'Team 2 Favored') : (score1 > score2 ? 'Team 1 Advantage' : 'Team 2 Advantage');
  const verdictColor = diff <= 10 ? '#FFD700' : score1 > score2 ? '#4488FF' : '#FF6666';
  return (
    <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold" style={{ color: '#4488FF' }}>{score1}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: verdictColor, background: `${verdictColor}1A`, border: `1px solid ${verdictColor}44` }}>
          {verdict}
        </span>
        <span className="text-xs font-bold" style={{ color: '#FF6666' }}>{score2}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct1}%`, background: 'linear-gradient(90deg, #4488FF, #6699FF)' }} />
        <div className="h-full transition-all duration-500" style={{ width: `${100 - pct1}%`, background: 'linear-gradient(90deg, #FF6666, #FF4444)' }} />
      </div>
    </div>
  );
}
