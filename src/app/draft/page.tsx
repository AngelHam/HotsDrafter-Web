'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { DraftingTool, DRAFT_TEAM_ORDER, DRAFT_IS_BAN, matchesRoleFilter } from '@/data/DraftingTool';
import { HeroSuggestionEngine } from '@/data/HeroSuggestionEngine';
import { DraftSettings } from '@/data/DraftSettings';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { Specialty } from '@/data/Specialty';
import { saveDraft } from '@/data/DraftHistory';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import RoleFilterBar, { ROLE_COLORS } from '@/components/RoleFilterBar';
import HeroSuggestionPanel from '@/components/HeroSuggestionPanel';
import TeamPanel from '@/components/TeamPanel';
import DraftProgressBar from '@/components/DraftProgressBar';
import HeroDetailPopup from '@/components/HeroDetailPopup';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import type { Hero } from '@/data/Hero';

function computeCompScore(picks: Hero[]): number {
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

function DraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapIdx = parseInt(searchParams.get('map') || '0', 10);
  const map = ALL_MAPS[mapIdx] || ALL_MAPS[0];

  const [draft] = useState(() => new DraftingTool(ALL_HEROES));
  const [step, setStep] = useState(0);
  // Snapshot picks/bans as state so React detects changes
  const [team1Picks, setTeam1Picks] = useState<Hero[]>([]);
  const [team2Picks, setTeam2Picks] = useState<Hero[]>([]);
  const [team1Bans, setTeam1Bans] = useState<Hero[]>([]);
  const [team2Bans, setTeam2Bans] = useState<Hero[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroView, setHeroView] = useState<'grid' | 'roles'>('grid');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25);
  const hasSavedDraft = useRef(false);

  useEffect(() => { DraftSettings.load(); }, []);

  const isQuickDraft = DraftSettings.quickDraft;
  const firstPick = DraftSettings.firstPickTeam;

  // Swap team order if Team 2 has first pick
  const teamOrder = useMemo(() => {
    if (firstPick === 2) return DRAFT_TEAM_ORDER.map(t => t === 1 ? 2 : 1);
    return DRAFT_TEAM_ORDER;
  }, [firstPick]);

  // In quick draft mode, compute which steps to use (only non-ban steps)
  const activeSteps = useMemo(() => {
    if (!isQuickDraft) return teamOrder.map((_, i) => i);
    return teamOrder.map((_, i) => i).filter(i => !DRAFT_IS_BAN[i]);
  }, [isQuickDraft, teamOrder]);

  const totalSteps = activeSteps.length;
  const realStep = step < totalSteps ? activeSteps[step] : 16;

  const engine = useMemo(() => new HeroSuggestionEngine(draft, map), [draft, map]);
  const icyVeins = useMemo(() => IcyVeinsDatabase.getInstance(), []);

  const currentTeam = realStep < 16 ? teamOrder[realStep] : 0;
  const isBan = realStep < 16 ? DRAFT_IS_BAN[realStep] : false;
  const isComplete = step >= totalSteps;

  // Show ALL heroes, mark unavailable as dimmed
  const [heroSort, setHeroSort] = useState<'name' | 'role' | 'tier'>('name');

  const allHeroesSorted = useMemo(() => {
    const sorted = [...ALL_HEROES];
    if (heroSort === 'name') sorted.sort((a, b) => a.nicknames[0].localeCompare(b.nicknames[0]));
    else if (heroSort === 'role') sorted.sort((a, b) => a.role.localeCompare(b.role) || a.nicknames[0].localeCompare(b.nicknames[0]));
    else if (heroSort === 'tier') sorted.sort((a, b) => icyVeins.getTierScore(b.nicknames[0], map.name) - icyVeins.getTierScore(a.nicknames[0], map.name));
    return sorted;
  }, [heroSort, icyVeins, map.name]);
  const filtered = useMemo(() => allHeroesSorted.filter(h => {
    if (!matchesRoleFilter(h, roleFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return h.nicknames.some(n => n.toLowerCase().includes(q)) || h.name.toLowerCase().includes(q);
    }
    return true;
  }), [allHeroesSorted, roleFilter, searchQuery]);

  const groupedByRole = useMemo(() => {
    const order = ['Tank', 'Healer', 'Offlane', 'DPS', 'Mage', 'Specialist'];
    return order
      .map(role => ({ role, heroes: filtered.filter(hero => hero.role === role) }))
      .filter(group => group.heroes.length > 0);
  }, [filtered]);

  const suggestions = useMemo(() => {
    if (isComplete || step >= 16) return [];
    if (isBan) return engine.generateBanSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount);
    return engine.generateSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount);
  }, [engine, currentTeam, isBan, roleFilter, isComplete, step]);

  useEffect(() => {
    if (!timerEnabled || isComplete) {
      return;
    }

    setTimeLeft(timerDuration);
  }, [step, timerDuration, timerEnabled, isComplete]);

  // Auto-disable timer when draft completes
  useEffect(() => {
    if (isComplete && timerEnabled) setTimerEnabled(false);
  }, [isComplete, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled || isComplete || timeLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timerEnabled, isComplete, timeLeft]);

  const syncDraftState = () => {
    setTeam1Picks([...draft.team1Picks]);
    setTeam2Picks([...draft.team2Picks]);
    setTeam1Bans([...draft.team1Bans]);
    setTeam2Bans([...draft.team2Bans]);
  };

  const handleHeroClick = (hero: Hero) => {
    if (isComplete) return;
    if (isBan) {
      draft.banHero(currentTeam, hero);
    } else {
      draft.pickHero(currentTeam, hero);
    }
    setSearchQuery('');
    syncDraftState();
    setStep(s => s + 1);
  };

  const handleUndo = () => {
    if (step === 0) return;
    const prevStep = step - 1;
    const prevRealStep = activeSteps[prevStep];
    const prevTeam = teamOrder[prevRealStep];
    const wasBan = DRAFT_IS_BAN[prevRealStep];
    draft.undoBanOrPick(prevTeam, wasBan);
    syncDraftState();
    setStep(prevStep);
  };

  const handleReset = () => {
    if (step > 0 && !window.confirm('Reset the entire draft? All picks and bans will be cleared.')) return;
    draft.reset(ALL_HEROES);
    syncDraftState();
    setStep(0);
  };

  // Keyboard shortcuts (Ctrl+Z undo, Escape reset, 1-9 suggestion quick-pick)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.key === 'Escape') {
        if (detailHero) { setDetailHero(null); return; } // Close popup first
        handleReset();
      }

      const index = Number.parseInt(e.key, 10);
      if (!Number.isNaN(index) && index >= 1 && index <= 9) {
        const suggestion = suggestions[index - 1];
        if (suggestion) {
          e.preventDefault();
          handleHeroClick(suggestion.hero);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Win condition analysis when draft is complete
  const analysis = useMemo(() => {
    if (!isComplete) return null;
    const t1 = new TeamComposition(team1Picks);
    const t2 = new TeamComposition(team2Picks);
    const a1 = analyzeWinCondition(t1, t2);
    const a2 = analyzeWinCondition(t2, t1);

    return { team1: a1, team2: a2 };
  }, [isComplete, draft, map]);

  // Auto-save to history once when draft completes
  useEffect(() => {
    if (!isComplete || !analysis || hasSavedDraft.current) return;
    hasSavedDraft.current = true;
    const t1 = new TeamComposition(team1Picks);
    const t2 = new TeamComposition(team2Picks);
    const a1 = analyzeWinCondition(t1, t2);
    const a2 = analyzeWinCondition(t2, t1);
    saveDraft({
      timestamp: new Date().toISOString(),
      mapName: map.name,
      firstPickTeam: firstPick,
      team1Picks: team1Picks.map(h => h.nicknames[0]),
      team2Picks: team2Picks.map(h => h.nicknames[0]),
      team1Bans: team1Bans.map(h => h.nicknames[0]),
      team2Bans: team2Bans.map(h => h.nicknames[0]),
      team1Score: computeCompScore(team1Picks), team2Score: computeCompScore(team2Picks),
      team1WinCondition: winConditionToString(a1.primary),
      team2WinCondition: winConditionToString(a2.primary),
      verdict: `Team 1: ${winConditionToString(a1.primary)} vs Team 2: ${winConditionToString(a2.primary)}`,
    });
  }, [isComplete, analysis]);

  const yourTeam = firstPick === 2 ? 2 : 1;
  const isYourTurn = currentTeam === yourTeam;

  // Determine draft phase name
  const phaseName = isComplete ? '' : realStep <= 3 ? 'Ban Phase 1' : realStep <= 8 ? 'Pick Phase 1' : realStep <= 10 ? 'Ban Phase 2' : 'Pick Phase 2';

  const statusText = isComplete
    ? '✅ Draft Complete!'
    : `${isYourTurn ? '🟢 Your' : '🔴 Enemy'} Turn — ${isBan ? '🚫 BAN' : `✅ PICK ${team1Picks.length + team2Picks.length + 1}/10`} (${step + 1}/${totalSteps})`;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 flex-wrap gap-2" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">
            ← Back
          </button>
          <button onClick={handleReset} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Reset entire draft">
            Reset
          </button>
          <button onClick={handleUndo} disabled={step === 0} className="text-sm px-3 py-1 rounded disabled:opacity-30 hover:bg-white/10" style={{ color: '#FFD700', border: '1px solid #FFD70033' }} title="Undo last pick/ban (Ctrl+Z)">
            Undo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold cursor-help" style={{ color: '#FFD700' }}
            title={`${map.name}\nS-tier: ${icyVeins.getSTierHeroes(map.name).slice(0, 5).join(', ') || 'None listed'}`}>
            📍 {map.name}
          </span>
          {isQuickDraft && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(144,238,144,0.15)', color: '#90EE90', border: '1px solid #90EE9033' }}>
              ⚡ Quick
            </span>
          )}
          {(team1Picks.length > 0 || team1Bans.length > 0) && (
            <span className="text-[10px] opacity-40">
              B:{team1Bans.length + team2Bans.length} P:{team1Picks.length + team2Picks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/settings')} className="text-sm px-2 py-1 rounded hover:bg-white/10" style={{ color: '#A9A9A9', border: '1px solid #A9A9A933' }} title="Settings">
            ⚙️
          </button>
          <RoleFilterBar activeFilter={roleFilter} onFilterChange={(f) => { setRoleFilter(f); document.querySelector('[data-hero-grid]')?.scrollTo(0, 0); }} />
        </div>
      </div>

      {/* Status + Progress */}
      <div className="flex flex-col items-center gap-2 py-3" style={{ background: 'rgba(20, 25, 45, 0.5)' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: isBan ? '#FF6666' : (isYourTurn ? '#00FFFF' : '#FF6666') }}>{statusText}</span>
          {phaseName && <span className="text-[10px] px-1.5 py-0.5 rounded opacity-60" style={{ background: 'rgba(255,255,255,0.05)', color: isBan ? '#FF6666' : '#00FFFF' }}>{phaseName}</span>}
          {team1Picks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(144,238,144,0.1)', color: '#90EE90', border: '1px solid #90EE9022' }}>
              Score: {computeCompScore(team1Picks)}
            </span>
          )}
          {team1Picks.length > 0 && (
            <span className="text-[10px] flex gap-0.5">
              {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane'].map(r => {
                const c: Record<string, string> = { Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500' };
                const has = team1Picks.some(h => h.role === r);
                return <span key={r} className="w-2 h-2 rounded-full" style={{ background: has ? c[r] : 'rgba(255,255,255,0.1)' }} title={`${r}: ${has ? '✓' : '✗'}`} />;
              })}
            </span>
          )}
        </div>
        <DraftProgressBar currentStep={step} teamOrder={teamOrder} />

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => {
              setTimerEnabled(prev => {
                const next = !prev;
                if (next) {
                  setTimeLeft(timerDuration);
                }
                return next;
              });
            }}
            className="text-xs px-2 py-1 rounded hover:bg-white/10"
            style={{
              color: timerEnabled ? '#90EE90' : '#A9A9A9',
              border: `1px solid ${timerEnabled ? '#90EE9055' : '#A9A9A955'}`,
            }}
            title={timerEnabled ? 'Disable draft timer' : 'Enable draft timer'}
          >
            ⏱️ Timer {timerEnabled ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => setTimerDuration(v => Math.max(10, v - 5))}
            className="text-xs px-2 py-1 rounded hover:bg-white/10"
            style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
            title="Decrease timer duration"
          >
            -5s
          </button>
          <button
            onClick={() => setTimerDuration(v => Math.min(90, v + 5))}
            className="text-xs px-2 py-1 rounded hover:bg-white/10"
            style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
            title="Increase timer duration"
          >
            +5s
          </button>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${timerEnabled && timeLeft <= 5 ? 'animate-pulse' : ''}`}
            style={{
              color: timerEnabled ? (timeLeft <= 5 ? '#FF6666' : timeLeft <= 10 ? '#FFA500' : '#00FFFF') : '#A9A9A9',
              border: `1px solid ${timerEnabled ? (timeLeft <= 5 ? '#FF666655' : timeLeft <= 10 ? '#FFA50055' : '#00FFFF55') : '#A9A9A955'}`,
              background: timerEnabled ? (timeLeft <= 5 ? 'rgba(255,102,102,0.1)' : 'rgba(255,255,255,0.04)') : 'transparent',
            }}
            title="Per-step draft countdown"
          >
            {timerEnabled ? (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
                  <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <circle cx="7" cy="7" r="5.5" fill="none"
                    stroke={timeLeft <= 5 ? '#FF6666' : timeLeft <= 10 ? '#FFA500' : '#00FFFF'}
                    strokeWidth="1.5" strokeLinecap="round"
                    strokeDasharray={`${(timeLeft / timerDuration) * 34.56} 34.56`}
                    transform="rotate(-90 7 7)" />
                </svg>
                {timeLeft}s
              </span>
            ) : `Duration: ${timerDuration}s`}
          </span>
        </div>
      </div>

      {/* Banned Heroes Strip */}
      {(team1Bans.length > 0 || team2Bans.length > 0) && (
        <div className="flex items-center justify-center gap-3 px-4 py-1" style={{ background: 'rgba(255,102,102,0.04)' }}>
          {team1Bans.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] opacity-40">T1 bans:</span>
              {team1Bans.map(h => (
                <span key={h.name} className="text-[9px] px-1 rounded" style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666' }}>{h.nicknames[0]}</span>
              ))}
            </div>
          )}
          {team2Bans.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] opacity-40">T2 bans:</span>
              {team2Bans.map(h => (
                <span key={h.name} className="text-[9px] px-1 rounded" style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666' }}>{h.nicknames[0]}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coaching Tip */}
      {!isComplete && (team1Picks.length + team1Bans.length > 0 || step > 0) && (
        <div className="px-4 py-1 text-center" style={{ background: 'rgba(0,255,255,0.03)' }}>
          <span className="text-[10px] opacity-50">
            💡 {(() => {
              if (isBan && !isYourTurn) {
                const sTier = icyVeins.getSTierHeroes(map.name).filter(name => {
                  return allHeroesSorted.some(h => h.nicknames[0] === name && draft.isAvailable(h));
                });
                if (sTier.length > 0) return `Enemy may ban: ${sTier.slice(0, 3).join(', ')}`;
                return 'Enemy is banning — watch for targeted bans';
              }
              if (isBan && team1Bans.length === 0) return 'Ban high-impact heroes your team struggles against';
              if (isBan) return 'Consider banning heroes that counter your planned composition';
              if (team1Picks.length === 0) return 'Secure a strong tank or high-priority pick first';
              if (!team1Picks.some(h => h.role === 'Tank') && team1Picks.length >= 2) return 'Your team needs a Tank — prioritize one soon';
              if (!team1Picks.some(h => h.role === 'Healer') && team1Picks.length >= 3) return 'No Healer yet — draft one before it\'s too late';
              if (team1Picks.length >= 4) return 'Last pick — fill the remaining role gap';
              return 'Check suggestions for optimal synergy picks';
            })()}
          </span>
        </div>
      )}

      {/* Counter Threat Warnings */}
      {!isComplete && team1Picks.length > 0 && team2Picks.length > 0 && (() => {
        const threats: string[] = [];
        for (const enemy of team2Picks) {
          for (const ally of team1Picks) {
            if (icyVeins.counters(enemy.nicknames[0], ally.nicknames[0])) {
              threats.push(`${enemy.nicknames[0]} counters your ${ally.nicknames[0]}`);
            }
          }
        }
        if (threats.length === 0) return null;
        return (
          <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap justify-center" style={{ background: 'rgba(255,99,71,0.1)', borderBottom: '1px solid #FF634733' }}>
            <span className="text-[10px] font-bold" style={{ color: '#FF6347' }}>⚠️ THREATS:</span>
            {threats.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,99,71,0.15)', color: '#FF6347', border: '1px solid #FF634722' }}>
                {t}
              </span>
            ))}
            {threats.length > 3 && <span className="text-[10px] opacity-50">+{threats.length - 3} more</span>}
          </div>
        );
      })()}

      {/* Mobile Team Panels */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 py-2" style={{ background: 'rgba(20, 25, 45, 0.35)' }}>
        <TeamPanel teamNumber={1} picks={[...team1Picks]} bans={[...team1Bans]} isActive={!isComplete && currentTeam === 1} enemyPicks={[...team2Picks]} onHeroClick={h => setDetailHero(h)} />
        <TeamPanel teamNumber={2} picks={[...team2Picks]} bans={[...team2Bans]} isActive={!isComplete && currentTeam === 2} enemyPicks={[...team1Picks]} onHeroClick={h => setDetailHero(h)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Team 1 Panel - hidden on mobile */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <TeamPanel teamNumber={1} picks={[...team1Picks]} bans={[...team1Bans]} isActive={!isComplete && currentTeam === 1} enemyPicks={[...team2Picks]} onHeroClick={h => setDetailHero(h)} />
        </div>

        {/* Center: Hero Grid + Suggestions */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Suggestions */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setSuggestionsCollapsed(c => !c)}
              className="w-full text-left text-xs font-semibold px-3 py-1.5 rounded-t flex items-center justify-between lg:hidden"
              style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)', borderBottom: suggestionsCollapsed ? '1px solid rgba(68,102,136,0.5)' : 'none', color: '#00FFFF' }}
            >
              <span>{isBan ? '🚫 Ban Suggestions' : '✅ Pick Suggestions'} ({suggestions.length})</span>
              <span>{suggestionsCollapsed ? '▶' : '▼'}</span>
            </button>
            <div className={`${suggestionsCollapsed ? 'hidden lg:block' : ''} max-h-[340px] overflow-y-auto`}>
              <HeroSuggestionPanel
                suggestions={suggestions}
                onSelect={(s) => handleHeroClick(s.hero)}
                title={isBan ? '🚫 Ban Suggestions' : '✅ Pick Suggestions'}
                mapName={map.name}
              />
            </div>
          </div>

          {/* Hero Search + Grid */}
          {!isComplete && (
            <div data-hero-grid className="flex-1 overflow-auto p-2 rounded" style={{ background: 'rgba(20, 25, 45, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
              {/* Hero Pool Stats */}
              <div className="flex gap-1.5 mb-1.5 justify-center flex-wrap">
                {[
                  { role: 'Tank', color: '#6495ED' }, { role: 'Healer', color: '#90EE90' },
                  { role: 'DPS', color: '#FF6347' }, { role: 'Mage', color: '#BA55D3' },
                  { role: 'Offlane', color: '#FFA500' }, { role: 'Specialist', color: '#A9A9A9' },
                ].map(({ role, color }) => {
                  const avail = ALL_HEROES.filter(h => h.role === role && draft.isAvailable(h)).length;
                  const total = ALL_HEROES.filter(h => h.role === role).length;
                  return (
                    <span key={role} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: color + '11', color, border: `1px solid ${color}22` }}>
                      {role.slice(0, 3)}: {avail}/{total}
                    </span>
                  );
                })}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search heroes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 mb-2 rounded text-sm focus:outline-none"
                  style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                    style={{ color: '#FF6666' }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setHeroView('grid')}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: heroView === 'grid' ? '#00FFFF' : '#A9A9A9',
                    border: `1px solid ${heroView === 'grid' ? '#00FFFF66' : '#A9A9A933'}`,
                    background: heroView === 'grid' ? 'rgba(0,255,255,0.12)' : 'transparent',
                  }}
                  title="Show all heroes in one grid"
                >
                  Grid View
                </button>
                <button
                  onClick={() => setHeroView('roles')}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: heroView === 'roles' ? '#00FFFF' : '#A9A9A9',
                    border: `1px solid ${heroView === 'roles' ? '#00FFFF66' : '#A9A9A933'}`,
                    background: heroView === 'roles' ? 'rgba(0,255,255,0.12)' : 'transparent',
                  }}
                  title="Group heroes by role"
                >
                  Role View
                </button>
                <select value={heroSort} onChange={e => setHeroSort(e.target.value as 'name' | 'role' | 'tier')}
                  className="text-[10px] px-1 py-0.5 rounded ml-1" style={{ background: 'rgba(30, 40, 70, 0.8)', color: '#00FFFF', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <option value="name">A-Z</option>
                  <option value="role">Role</option>
                  <option value="tier">Tier ↓</option>
                </select>
                <span className="text-[10px] ml-auto opacity-50">
                  {filtered.filter(h => draft.isAvailable(h)).length}/{filtered.length}
                </span>
              </div>

              {heroView === 'grid' ? (
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
                  {filtered.map(hero => {
                    const isAvail = draft.isAvailable(hero);
                    const tier = icyVeins.getHeroTierOnMap(hero.nicknames[0], map.name);
                    return (
                      <div key={hero.name} onContextMenu={e => { e.preventDefault(); setDetailHero(hero); }}
                        className="rounded" style={tier === 'S' && isAvail ? { boxShadow: '0 0 6px rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.05)' } : undefined}>
                        <HeroPortrait
                          hero={hero}
                          size="md"
                          dimmed={!isAvail}
                          showName
                          tierBadge={tier !== 'B' ? tier : undefined}
                          onClick={isAvail ? () => handleHeroClick(hero) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedByRole.map(group => (
                    <div key={group.role}>
                      <h4 className="text-xs font-bold mb-1 flex items-center gap-2" style={{ color: ROLE_COLORS[group.role] || '#FFD700' }}>
                        {group.role}
                        <span className="opacity-50 font-normal">({group.heroes.filter(h => draft.isAvailable(h)).length}/{group.heroes.length})</span>
                        {group.heroes.filter(h => draft.isAvailable(h) && icyVeins.getHeroTierOnMap(h.nicknames[0], map.name) === 'S').length > 0 && (
                          <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
                            ★{group.heroes.filter(h => draft.isAvailable(h) && icyVeins.getHeroTierOnMap(h.nicknames[0], map.name) === 'S').length}
                          </span>
                        )}
                      </h4>
                      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
                        {group.heroes.map(hero => {
                          const isAvail = draft.isAvailable(hero);
                          const tier = icyVeins.getHeroTierOnMap(hero.nicknames[0], map.name);
                          return (
                            <div key={hero.name} onContextMenu={e => { e.preventDefault(); setDetailHero(hero); }}>
                              <HeroPortrait
                                hero={hero}
                                size="md"
                                dimmed={!isAvail}
                                showName
                                tierBadge={tier !== 'B' ? tier : undefined}
                                onClick={isAvail ? () => handleHeroClick(hero) : undefined}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis + Replay (when complete) */}
          {isComplete && analysis && (
            <div className="space-y-3">
              {/* Team Comparison Header */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="p-3 rounded text-center" style={{ background: 'rgba(68,136,255,0.1)', border: '1px solid #4488FF44' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#4488FF' }}>Team 1</p>
                  <p className="text-lg font-bold" style={{ color: '#FFD700' }}>{computeCompScore(team1Picks)}</p>
                  <p className="text-[10px] opacity-60">Comp Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>VS</p>
                  <p className="text-[10px] opacity-50">📍 {map.name}</p>
                  {/* Advantage meter */}
                  {(() => {
                    const s1 = computeCompScore(team1Picks);
                    const s2 = computeCompScore(team2Picks);
                    const diff = s1 - s2;
                    const label = diff > 10 ? 'Team 1 Favored' : diff < -10 ? 'Team 2 Favored' : 'Even Match';
                    const color = diff > 10 ? '#4488FF' : diff < -10 ? '#FF6666' : '#FFD700';
                    return (
                      <div className="mt-1">
                        <div className="flex h-1.5 rounded-full overflow-hidden mx-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ width: `${Math.max(20, Math.min(80, 50 + diff))}%`, background: '#4488FF88' }} />
                          <div style={{ flex: 1, background: '#FF666688' }} />
                        </div>
                        <p className="text-[9px] mt-0.5 font-semibold" style={{ color }}>{label}</p>
                      </div>
                    );
                  })()}
                </div>
                <div className="p-3 rounded text-center" style={{ background: 'rgba(255,102,102,0.1)', border: '1px solid #FF666644' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#FF6666' }}>Team 2</p>
                  <p className="text-lg font-bold" style={{ color: '#FFD700' }}>{computeCompScore(team2Picks)}</p>
                  <p className="text-[10px] opacity-60">Comp Score</p>
                </div>
              </div>

              {/* Team Picks Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid #4488FF44' }}>
                  <div className="flex gap-1 justify-center mb-2">
                    {team1Picks.map(h => (
                      <HeroPortrait key={h.name} hero={h} size="sm" selected />
                    ))}
                  </div>
                  <p className="text-xs text-center opacity-70">{team1Picks.map(h => h.nicknames[0]).join(' · ')}</p>
                </div>
                <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid #FF666644' }}>
                  <div className="flex gap-1 justify-center mb-2">
                    {team2Picks.map(h => (
                      <HeroPortrait key={h.name} hero={h} size="sm" selected />
                    ))}
                  </div>
                  <p className="text-xs text-center opacity-70">{team2Picks.map(h => h.nicknames[0]).join(' · ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AnalysisCard title="Team 1 Strategy" analysis={analysis.team1} color="#4488FF" />
                <AnalysisCard title="Team 2 Strategy" analysis={analysis.team2} color="#FF6666" />
              </div>

              {/* Specialty Comparison */}
              <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="text-xs font-bold mb-2 text-center" style={{ color: '#00FFFF' }}>COVERAGE COMPARISON</h3>
                <div className="space-y-1">
                  {[
                    { label: 'Waveclear', spec: Specialty.WAVECLEAR },
                    { label: 'Engage', spec: Specialty.ENGAGE },
                    { label: 'Hard CC', spec: Specialty.HARD_CC },
                    { label: 'Burst', spec: Specialty.BURST_DAMAGE },
                    { label: 'Poke', spec: Specialty.POKE },
                    { label: 'Sustain', spec: Specialty.SUSTAINED_DAMAGE },
                  ].map(({ label, spec }) => {
                    const t1 = team1Picks.filter(h => h.specialties.includes(spec)).length;
                    const t2 = team2Picks.filter(h => h.specialties.includes(spec)).length;
                    return (
                      <div key={label} className="flex items-center gap-1 text-[10px]">
                        <div className="w-8 text-right" style={{ color: t1 > t2 ? '#4488FF' : t1 === t2 ? '#888' : '#666' }}>{t1}</div>
                        <div className="flex-1 flex h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${(t1 / 5) * 50}%`, background: '#4488FF99' }} />
                          <div className="flex-1" />
                          <div style={{ width: `${(t2 / 5) * 50}%`, background: '#FF666699' }} />
                        </div>
                        <div className="w-8" style={{ color: t2 > t1 ? '#FF6666' : t2 === t1 ? '#888' : '#666' }}>{t2}</div>
                        <span className="w-16 opacity-50">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <DraftReplay
                team1Picks={[...team1Picks]}
                team2Picks={[...team2Picks]}
                team1Bans={[...team1Bans]}
                team2Bans={[...team2Bans]}
              />
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleReset}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
                  title="Start a new draft on this map"
                >
                  🔄 Same Map Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#FFD70022', border: '2px solid #FFD700', color: '#FFD700' }}
                  title="Pick a different map"
                >
                  🗺️ New Map
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#BA55D322', border: '2px solid #BA55D3', color: '#BA55D3' }}
                  title="View saved drafts"
                >
                  📜 History
                </button>
                <button
                  onClick={() => {
                    const t1Picks = team1Picks.map(h => `${h.nicknames[0]} (${h.role})`).join(', ');
                    const t2Picks = team2Picks.map(h => `${h.nicknames[0]} (${h.role})`).join(', ');
                    const t1Bans = team1Bans.map(h => h.nicknames[0]).join(', ');
                    const t2Bans = team2Bans.map(h => h.nicknames[0]).join(', ');
                    const wc1 = analysis ? winConditionToString(analysis.team1.primary) : '';
                    const wc2 = analysis ? winConditionToString(analysis.team2.primary) : '';
                    const s1 = computeCompScore(team1Picks);
                    const s2 = computeCompScore(team2Picks);
                    const diff = s1 - s2;
                    const verdict = diff > 10 ? 'Team 1 Favored' : diff < -10 ? 'Team 2 Favored' : 'Even Match';
                    const text = [
                      `⚔️ HotsDrafter — ${map.name}`,
                      `━━━━━━━━━━━━━━━━━━━━`,
                      ``,
                      `🔵 TEAM 1 (Score: ${s1})`,
                      `  Bans: ${t1Bans}`,
                      `  Picks: ${t1Picks}`,
                      `  Strategy: ${wc1}`,
                      ``,
                      `🔴 TEAM 2 (Score: ${s2})`,
                      `  Bans: ${t2Bans}`,
                      `  Picks: ${t2Picks}`,
                      `  Strategy: ${wc2}`,
                      ``,
                      `📊 Verdict: ${verdict}`,
                    ].join('\n');
                    navigator.clipboard.writeText(text);
                    setExportCopied(true);
                    setTimeout(() => setExportCopied(false), 2000);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#90EE9022', border: '2px solid #90EE90', color: '#90EE90' }}
                  title="Copy draft summary to clipboard"
                >
                  {exportCopied ? '✅ Copied!' : '📋 Export'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Team 2 Panel - hidden on mobile */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <TeamPanel teamNumber={2} picks={[...team2Picks]} bans={[...team2Bans]} isActive={!isComplete && currentTeam === 2} enemyPicks={[...team1Picks]} onHeroClick={h => setDetailHero(h)} />
        </div>
      </div>
      {/* Hero Detail Popup */}
      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}
    </div>
  );
}

function AnalysisCard({ title, analysis, color }: { title: string; analysis: any; color: string }) {
  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${color}55` }}>
      <h3 className="font-bold mb-2" style={{ color }}>{title}</h3>
      <p className="text-sm mb-1"><span style={{ color: '#FFD700' }}>Win Condition:</span> {winConditionToString(analysis.primary)}</p>
      <p className="text-xs opacity-80 mb-2">{analysis.description}</p>
      <p className="text-xs"><span style={{ color: '#00FFFF' }}>Key Focus:</span> {analysis.keyFocus}</p>
      <p className="text-xs mt-1"><span style={{ color: '#FF6666' }}>Counter Strategy:</span> {analysis.enemyCounterStrategy}</p>
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading draft...</p></div>}>
      <DraftPageInner />
    </Suspense>
  );
}

function DraftReplay({ team1Picks, team2Picks, team1Bans, team2Bans }: {
  team1Picks: Hero[]; team2Picks: Hero[]; team1Bans: Hero[]; team2Bans: Hero[];
}) {
  const [replayStep, setReplayStep] = useState(0);

  // Reconstruct the timeline from draft order
  const timeline = useMemo(() => {
    const t1b = [...team1Bans], t2b = [...team2Bans];
    const t1p = [...team1Picks], t2p = [...team2Picks];
    const steps: { team: number; isBan: boolean; hero: Hero | null }[] = [];

    for (let i = 0; i < DRAFT_TEAM_ORDER.length; i++) {
      const team = DRAFT_TEAM_ORDER[i];
      const isBan = DRAFT_IS_BAN[i];
      const arr = isBan
        ? (team === 1 ? t1b : t2b)
        : (team === 1 ? t1p : t2p);
      steps.push({ team, isBan, hero: arr.shift() ?? null });
    }
    return steps;
  }, [team1Picks, team2Picks, team1Bans, team2Bans]);

  const current = timeline[replayStep];

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Draft Replay</h3>

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setReplayStep(s => Math.max(0, s - 1))}
          disabled={replayStep === 0}
          className="text-sm px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30"
          style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
          title="Previous step"
        >
          ← Prev
        </button>
        <span className="text-sm font-semibold" style={{ color: current?.isBan ? '#FF6666' : '#00FFFF' }}>
          Step {replayStep + 1}/16 — Team {current?.team} {current?.isBan ? 'BAN' : 'PICK'}
        </span>
        {current?.hero && (
          <div className="flex items-center gap-1">
            <HeroPortrait hero={current.hero} size="sm" banned={current.isBan} selected={!current.isBan} />
            <span className="text-xs font-semibold">{current.hero.nicknames[0]}</span>
          </div>
        )}
        <button
          onClick={() => setReplayStep(s => Math.min(15, s + 1))}
          disabled={replayStep >= 15}
          className="text-sm px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30"
          style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
          title="Next step"
        >
          Next →
        </button>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {timeline.map((s, i) => {
          const teamColor = s.team === 1 ? '#4488FF' : '#FF4444';
          return (
            <button
              key={i}
              onClick={() => setReplayStep(i)}
              className="rounded-sm flex items-center justify-center"
              style={{
                width: i === replayStep ? 28 : 20,
                height: i === replayStep ? 22 : 16,
                background: i <= replayStep ? (s.isBan ? '#FF666699' : teamColor + '99') : (s.isBan ? '#FF666633' : teamColor + '33'),
                border: i === replayStep ? '2px solid #FFD700' : '1px solid transparent',
                fontSize: 9,
                color: '#fff',
                fontWeight: i === replayStep ? 'bold' : 'normal',
              }}
              title={`Step ${i + 1}: Team ${s.team} ${s.isBan ? 'BAN' : 'PICK'} ${s.hero?.nicknames[0] || '?'}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {current?.hero && (
        <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'rgba(20, 25, 45, 0.5)', border: `1px solid ${current.isBan ? '#FF666644' : '#FFD70044'}` }}>
          <HeroPortrait hero={current.hero} size="lg" banned={current.isBan} selected={!current.isBan} />
          <div>
            <span className="text-lg font-bold">{current.hero.nicknames[0]}</span>
            <span className="text-sm ml-2 opacity-60">{current.hero.role}</span>
            <p className="text-xs mt-1 opacity-70">
              {current.isBan ? `Banned by Team ${current.team}` : `Picked by Team ${current.team}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


