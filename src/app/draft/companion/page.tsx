'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { DraftingTool, DRAFT_TEAM_ORDER, DRAFT_IS_BAN } from '@/data/DraftingTool';
import { HeroSuggestionEngine } from '@/data/HeroSuggestionEngine';
import { DraftSettings } from '@/data/DraftSettings';
import { HeroRelationships } from '@/data/HeroRelationships';
import HeroPortrait from '@/components/HeroPortrait';
import { ROLE_COLORS } from '@/components/RoleFilterBar';
import DraftProgressBar from '@/components/DraftProgressBar';
import type { Hero } from '@/data/Hero';
import type { HeroSuggestion } from '@/data/SuggestionTypes';

// ─── Helpers ───────────────────────────────────────────────

function getStarRating(score: number): { filled: number; empty: number } {
  let filled: number;
  if (score >= 80) filled = 5;
  else if (score >= 65) filled = 4;
  else if (score >= 50) filled = 3;
  else if (score >= 35) filled = 2;
  else filled = 1;
  return { filled, empty: 5 - filled };
}

function starString(score: number): string {
  const { filled, empty } = getStarRating(score);
  return '★'.repeat(filled) + '☆'.repeat(empty);
}

const ROLE_ICONS: Record<string, string> = {
  Tank: '🛡', Healer: '✚', DPS: '⚔', Mage: '✦', Offlane: '⚙', Specialist: '☆',
};

function buildReasons(s: HeroSuggestion, team1Picks: Hero[], team2Picks: Hero[]): string[] {
  const reasons: string[] = [];
  if (s.synergyWith.length > 0) {
    reasons.push(`Synergy w/ ${s.synergyWith.slice(0, 2).join(', ')}`);
  }
  if (s.countersAgainst.length > 0) {
    reasons.push(`Counters ${s.countersAgainst.slice(0, 2).join(', ')}`);
  }
  if (s.roleNeedScore > 0.6) {
    reasons.push(`Fills ${s.hero.role} need`);
  }
  if (s.mapFitnessScore > 0.6) {
    reasons.push('Strong on this map');
  }
  if (reasons.length === 0) {
    reasons.push('Good pick for this draft');
  }
  return reasons;
}

// ─── Compact Team Panel ────────────────────────────────────

function CompactTeam({ picks, bans, teamNum, label }: {
  picks: Hero[]; bans: Hero[]; teamNum: number; label: string;
}) {
  const color = teamNum === 1 ? '#4488FF' : '#FF4444';
  const hasTank = picks.some(h => h.role === 'Tank');
  const hasHealer = picks.some(h => h.role === 'Healer');
  const hasDPS = picks.some(h => h.role === 'DPS');
  const hasMage = picks.some(h => h.role === 'Mage');
  const hasOfflane = picks.some(h => h.role === 'Offlane');
  const hasSpec = picks.some(h => h.role === 'Specialist');
  const roles = [
    { key: 'Tank', icon: '🛡', has: hasTank },
    { key: 'Healer', icon: '✚', has: hasHealer },
    { key: 'DPS', icon: '⚔', has: hasDPS },
    { key: 'Mage', icon: '✦', has: hasMage },
    { key: 'Offlane', icon: '⚙', has: hasOfflane },
    { key: 'Specialist', icon: '☆', has: hasSpec },
  ];

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-bold mb-1 tracking-wide" style={{ color }}>
        {label}
      </h3>
      <div className="text-[10px] mb-1.5" style={{ color: '#9966CC', opacity: 0.8 }}>
        Bans: {bans.length > 0 ? bans.map(h => h.nicknames[0]).join(', ') : '—'}
      </div>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-1.5 py-0.5">
          {picks[i] ? (
            <>
              <HeroPortrait hero={picks[i]} size="xs" />
              <span className="text-xs font-medium truncate">{picks[i].nicknames[0]}</span>
              <span className="text-[10px] opacity-50">({picks[i].role})</span>
            </>
          ) : (
            <span className="text-xs opacity-25 pl-1">Pick {i + 1}</span>
          )}
        </div>
      ))}
      <div className="flex items-center gap-1 mt-1.5">
        {roles.map(r => (
          <span key={r.key} title={`${r.key}: ${r.has ? '✓' : '✗'}`}
            className="text-[10px]"
            style={{ opacity: r.has ? 1 : 0.25, color: r.has ? ROLE_COLORS[r.key] || '#888' : '#555' }}>
            {r.icon}{r.has ? '✓' : '✗'}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Compact Suggestion Card ───────────────────────────────

function CompactSuggestion({ suggestion, rank, onPick, team1Picks, team2Picks }: {
  suggestion: HeroSuggestion; rank: number; onPick: (hero: Hero) => void;
  team1Picks: Hero[]; team2Picks: Hero[];
}) {
  const reasons = buildReasons(suggestion, team1Picks, team2Picks);
  return (
    <button onClick={() => onPick(suggestion.hero)}
      className="w-full flex items-start gap-2 p-2 rounded-lg transition-all hover:brightness-125"
      style={{
        background: rank === 1 ? 'rgba(255,215,0,0.06)' : 'rgba(30, 40, 70, 0.4)',
        border: rank === 1 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(68,102,136,0.25)',
      }}>
      <span className="text-xs font-bold w-4 opacity-40 pt-0.5">{rank}.</span>
      <HeroPortrait hero={suggestion.hero} size="sm" />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold">{suggestion.hero.nicknames[0]}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              color: ROLE_COLORS[suggestion.hero.role] || '#888',
              border: `1px solid ${(ROLE_COLORS[suggestion.hero.role] || '#888')}44`,
              background: `${(ROLE_COLORS[suggestion.hero.role] || '#888')}11`,
            }}>
            {suggestion.hero.role}
          </span>
          <span className="text-xs" style={{ color: '#FFD700' }}>
            {starString(suggestion.totalScore)}
          </span>
        </div>
        <p className="text-[11px] opacity-60 mt-0.5 leading-snug truncate">
          {reasons.join(' • ')}
        </p>
      </div>
    </button>
  );
}

// ─── Main Page Content ─────────────────────────────────────

function CompanionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapIdx = parseInt(searchParams.get('map') || '0', 10);
  const initialMap = ALL_MAPS[mapIdx] || ALL_MAPS[0];

  const [selectedMapIdx, setSelectedMapIdx] = useState(mapIdx);
  const map = ALL_MAPS[selectedMapIdx] || ALL_MAPS[0];

  const [draft] = useState(() => new DraftingTool(ALL_HEROES));
  const [step, setStep] = useState(0);
  const [team1Picks, setTeam1Picks] = useState<Hero[]>([]);
  const [team2Picks, setTeam2Picks] = useState<Hero[]>([]);
  const [team1Bans, setTeam1Bans] = useState<Hero[]>([]);
  const [team2Bans, setTeam2Bans] = useState<Hero[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Suggestion history: track top suggestions at each draft step
  const [suggestionHistory, setSuggestionHistory] = useState<Array<{
    step: number;
    phase: 'ban' | 'pick';
    team: number;
    heroChosen: string;
    topSuggestions: Array<{ heroName: string; stars: number; reasons: string[] }>;
  }>>([]);

  useEffect(() => {
    DraftSettings.load();
    setSettingsVersion(v => v + 1);
    const unsub = DraftSettings.onChange(() => setSettingsVersion(v => v + 1));
    return () => unsub();
  }, []);

  const firstPick = DraftSettings.firstPickTeam;

  const teamOrder = useMemo(() => {
    if (firstPick === 2) return DRAFT_TEAM_ORDER.map(t => t === 1 ? 2 : 1);
    return DRAFT_TEAM_ORDER;
  }, [firstPick]);

  const totalSteps = 16;
  const realStep = step < totalSteps ? step : 16;
  const currentTeam = realStep < 16 ? teamOrder[realStep] : 0;
  const isBan = realStep < 16 ? DRAFT_IS_BAN[realStep] : false;
  const isComplete = step >= totalSteps;

  const engine = useMemo(() => new HeroSuggestionEngine(draft, map), [draft, map]);

  const yourTeam = firstPick === 2 ? 2 : 1;
  const isYourTurn = currentTeam === yourTeam;

  const phaseName = isComplete ? 'Draft Complete'
    : realStep <= 3 ? 'Ban Phase 1'
    : realStep <= 8 ? 'Pick Phase 1'
    : realStep <= 10 ? 'Ban Phase 2'
    : 'Pick Phase 2';

  const turnLabel = isComplete ? '✅ Draft Complete'
    : `${isYourTurn ? 'YOUR TURN' : 'ENEMY TURN'} — ${isBan ? 'BAN' : 'PICK'} PHASE`;

  // Available heroes for autocomplete
  const availableHeroes = useMemo(() => draft.getAvailableHeroes(), [team1Picks, team2Picks, team1Bans, team2Bans]);

  const matches = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    return availableHeroes
      .filter(h =>
        h.nicknames.some(n => n.toLowerCase().includes(q)) ||
        h.name.toLowerCase().includes(q) ||
        h.role.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, availableHeroes]);

  // Suggestions
  const suggestions = useMemo(() => {
    if (isComplete || step >= totalSteps) return [];
    return isBan
      ? engine.generateBanSuggestions(currentTeam, 'All', 5)
      : engine.generateSuggestions(currentTeam, 'All', 5);
  }, [engine, currentTeam, isBan, isComplete, step, settingsVersion, totalSteps]);

  const syncDraftState = useCallback(() => {
    setTeam1Picks([...draft.team1Picks]);
    setTeam2Picks([...draft.team2Picks]);
    setTeam1Bans([...draft.team1Bans]);
    setTeam2Bans([...draft.team2Bans]);
  }, [draft]);

  const handlePick = useCallback((hero: Hero) => {
    if (isComplete) return;

    // Record current suggestions before this pick/ban
    setSuggestionHistory(prev => [...prev, {
      step: step,
      phase: isBan ? 'ban' : 'pick',
      team: currentTeam,
      heroChosen: hero.nicknames[0],
      topSuggestions: suggestions.slice(0, 5).map(s => ({
        heroName: s.hero.nicknames[0],
        stars: getStarRating(s.totalScore).filled,
        reasons: buildReasons(s, team1Picks, team2Picks),
      })),
    }]);

    if (isBan) {
      draft.banHero(currentTeam, hero);
    } else {
      draft.pickHero(currentTeam, hero);
    }
    setSearchQuery('');
    setSelectedIdx(0);
    syncDraftState();
    setStep(s => s + 1);
  }, [draft, isComplete, isBan, currentTeam, syncDraftState, step, suggestions, team1Picks, team2Picks]);

  const handleUndo = useCallback(() => {
    if (step === 0) return;
    const prevStep = step - 1;
    const prevTeam = teamOrder[prevStep];
    const wasBan = DRAFT_IS_BAN[prevStep];
    draft.undoBanOrPick(prevTeam, wasBan);
    syncDraftState();
    setStep(prevStep);
  }, [step, teamOrder, draft, syncDraftState]);

  const handleReset = useCallback(() => {
    draft.reset(ALL_HEROES);
    syncDraftState();
    setStep(0);
    setSearchQuery('');
    setSelectedIdx(0);
  }, [draft, syncDraftState]);

  // Save suggestion history when draft completes
  const hasSavedSuggestions = useRef(false);
  useEffect(() => {
    if (!isComplete || hasSavedSuggestions.current) return;
    hasSavedSuggestions.current = true;
    localStorage.setItem('hotsDrafter-lastDraftSuggestions', JSON.stringify(suggestionHistory));
  }, [isComplete, suggestionHistory]);

  // Re-focus search after every action
  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [step]);

  // Keyboard shortcuts (global)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo]);

  // Search input key handling
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setSelectedIdx(prev => (prev + 1) % Math.max(matches.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        handlePick(matches[selectedIdx] || matches[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchQuery('');
      setSelectedIdx(0);
    }
  };

  // First pick toggle
  const handleFirstPickToggle = (team: number) => {
    DraftSettings.firstPickTeam = team;
    DraftSettings.save();
    setSettingsVersion(v => v + 1);
    handleReset();
  };

  // Highlight matching text in autocomplete
  const highlightMatch = (name: string, query: string) => {
    if (!query) return name;
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <span style={{ color: '#00FFFF', fontWeight: 'bold' }}>{name.slice(idx, idx + query.length)}</span>
        {name.slice(idx + query.length)}
      </>
    );
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-2 py-3 page-enter"
      style={{ background: '#1a1a2e' }}>
      <div className="w-full" style={{ maxWidth: 600 }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏰</span>
            <span className="text-sm font-bold tracking-wide" style={{ color: '#FFD700' }}>
              HotsDrafter Companion
            </span>
          </div>
          <Link href="/draft" className="text-[10px] opacity-50 hover:opacity-80 transition-opacity no-underline"
            style={{ color: '#00FFFF' }}>
            Full Draft →
          </Link>
        </div>

        {/* ── Map + First Pick + Progress ─────────────────── */}
        <div className="rounded-lg p-2.5 mb-2"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <label className="text-[10px] opacity-50">Map:</label>
            <select
              value={selectedMapIdx}
              onChange={e => setSelectedMapIdx(parseInt(e.target.value, 10))}
              className="text-xs px-2 py-1 rounded cursor-pointer"
              style={{
                background: 'rgba(20, 25, 45, 0.9)',
                color: '#FFD700',
                border: '1px solid rgba(68,102,136,0.5)',
                outline: 'none',
              }}>
              {ALL_MAPS.map((m, i) => (
                <option key={m.name} value={i}>{m.name}</option>
              ))}
            </select>

            <span className="text-[10px] opacity-50 ml-auto">First Pick:</span>
            <button onClick={() => handleFirstPickToggle(1)}
              className="text-[10px] px-2 py-0.5 rounded-l transition-colors"
              style={{
                background: firstPick === 1 ? 'rgba(68,136,255,0.2)' : 'transparent',
                color: firstPick === 1 ? '#4488FF' : '#556',
                border: `1px solid ${firstPick === 1 ? '#4488FF66' : '#44668833'}`,
                borderRight: 'none',
                fontWeight: firstPick === 1 ? 600 : 400,
              }}>T1</button>
            <button onClick={() => handleFirstPickToggle(2)}
              className="text-[10px] px-2 py-0.5 rounded-r transition-colors"
              style={{
                background: firstPick === 2 ? 'rgba(255,68,68,0.2)' : 'transparent',
                color: firstPick === 2 ? '#FF4444' : '#556',
                border: `1px solid ${firstPick === 2 ? '#FF444466' : '#44668833'}`,
                borderLeft: 'none',
                fontWeight: firstPick === 2 ? 600 : 400,
              }}>T2</button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold whitespace-nowrap"
              style={{ color: isComplete ? '#90EE90' : '#A9A9A9' }}>
              Step {Math.min(step + 1, 16)}/16
            </span>
            <div className="flex-1">
              <DraftProgressBar currentStep={step} teamOrder={teamOrder} />
            </div>
          </div>
        </div>

        {/* ── Team Panels ─────────────────────────────────── */}
        <div className="flex gap-3 rounded-lg p-2.5 mb-2"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
          <CompactTeam picks={team1Picks} bans={team1Bans} teamNum={1} label="TEAM 1 (You)" />
          <div className="w-px" style={{ background: 'rgba(68,102,136,0.4)' }} />
          <CompactTeam picks={team2Picks} bans={team2Bans} teamNum={2} label="TEAM 2 (Enemy)" />
        </div>

        {/* ── Turn Indicator + Search ─────────────────────── */}
        <div className="rounded-lg p-2.5 mb-2"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
          <div className="text-xs font-bold mb-2 tracking-wide"
            style={{
              color: isComplete ? '#90EE90'
                : isBan ? '#9966CC'
                : isYourTurn ? '#4488FF'
                : '#FF4444',
            }}>
            {turnLabel}
            <span className="text-[10px] font-normal opacity-50 ml-2">{phaseName}</span>
          </div>

          {!isComplete && (
            <div className="relative">
              <div className="flex items-center rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(20, 25, 45, 0.9)',
                  border: `1.5px solid ${matches.length > 0 ? '#00FFFF55' : 'rgba(68,102,136,0.5)'}`,
                }}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Type hero name..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedIdx(0); }}
                  onKeyDown={handleSearchKeyDown}
                  className="flex-1 bg-transparent text-sm px-3 py-2 outline-none"
                  style={{ color: '#fff' }}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Search heroes"
                  aria-expanded={matches.length > 0}
                  aria-controls="companion-autocomplete"
                />
                <span className="pr-3 text-sm opacity-40">🔍</span>
              </div>

              {/* Autocomplete dropdown */}
              {matches.length > 0 && (
                <div id="companion-autocomplete" role="listbox"
                  className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-lg"
                  style={{
                    background: 'rgba(15, 20, 40, 0.97)',
                    border: '1px solid rgba(68,102,136,0.6)',
                  }}>
                  {matches.map((hero, idx) => (
                    <button
                      key={hero.name}
                      role="option"
                      aria-selected={idx === selectedIdx}
                      onClick={() => handlePick(hero)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors text-left"
                      style={{
                        background: idx === selectedIdx ? 'rgba(0,255,255,0.1)' : 'transparent',
                        borderLeft: idx === selectedIdx ? '2px solid #00FFFF' : '2px solid transparent',
                      }}
                      onMouseEnter={() => setSelectedIdx(idx)}>
                      <HeroPortrait hero={hero} size="xs" />
                      <span className="text-sm flex-1 truncate">
                        {highlightMatch(hero.nicknames[0], searchQuery)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          color: ROLE_COLORS[hero.role] || '#888',
                          border: `1px solid ${(ROLE_COLORS[hero.role] || '#888')}44`,
                        }}>
                        {hero.role}
                      </span>
                    </button>
                  ))}
                  <div className="text-[9px] opacity-30 px-3 py-1 text-center">
                    ↑↓ navigate • Enter to confirm • Esc to clear
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Suggestions ─────────────────────────────────── */}
        {!isComplete && suggestions.length > 0 && (
          <div className="rounded-lg p-2.5 mb-2"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h4 className="text-[10px] font-bold tracking-wider mb-2 opacity-60">
              TOP SUGGESTIONS
            </h4>
            <div className="flex flex-col gap-1">
              {suggestions.slice(0, 5).map((s, i) => (
                <CompactSuggestion
                  key={s.hero.name}
                  suggestion={s}
                  rank={i + 1}
                  onPick={handlePick}
                  team1Picks={team1Picks}
                  team2Picks={team2Picks}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Draft Complete Summary ──────────────────────── */}
        {isComplete && (
          <div className="rounded-lg p-3 mb-2 text-center"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(144,238,144,0.4)' }}>
            <div className="text-lg mb-1">🎉</div>
            <p className="text-sm font-semibold" style={{ color: '#90EE90' }}>Draft Complete!</p>
            <p className="text-[11px] opacity-50 mt-1">All 16 steps finished. Good luck in your match!</p>
            <div className="flex justify-center gap-2 mt-3">
              <button onClick={handleReset}
                className="text-xs px-3 py-1.5 rounded transition-colors hover:brightness-125"
                style={{ color: '#FF6666', border: '1px solid #FF666633' }}>
                New Draft
              </button>
              <Link href={`/draft?map=${selectedMapIdx}`}
                className="text-xs px-3 py-1.5 rounded transition-colors hover:brightness-125 no-underline"
                style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}>
                Full Draft View
              </Link>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={step === 0}
              className="text-[11px] px-3 py-1 rounded transition-colors disabled:opacity-25 hover:bg-white/10"
              style={{ color: '#FFD700', border: '1px solid #FFD70033' }}
              title="Undo (Ctrl+Z)">
              ↩ Undo
            </button>
            <button onClick={handleReset} disabled={step === 0}
              className="text-[11px] px-3 py-1 rounded transition-colors disabled:opacity-25 hover:bg-white/10"
              style={{ color: '#FF6666', border: '1px solid #FF666633' }}>
              ✕ Reset
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] opacity-40">
            <span>Ctrl+Z undo</span>
            <span>•</span>
            <span>Tab cycle</span>
            <span>•</span>
            <span>Esc clear</span>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Page Wrapper with Suspense ────────────────────────────

export default function CompanionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <div className="text-sm opacity-50">Loading Companion Mode...</div>
      </div>
    }>
      <CompanionPageInner />
    </Suspense>
  );
}
