'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { DraftingTool, DRAFT_TEAM_ORDER, DRAFT_IS_BAN, matchesRoleFilter } from '@/data/DraftingTool';
import { HeroSuggestionEngine } from '@/data/HeroSuggestionEngine';
import { DraftSettings } from '@/data/DraftSettings';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { saveDraft } from '@/data/DraftHistory';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import RoleFilterBar from '@/components/RoleFilterBar';
import HeroSuggestionPanel from '@/components/HeroSuggestionPanel';
import TeamPanel from '@/components/TeamPanel';
import DraftProgressBar from '@/components/DraftProgressBar';
import type { Hero } from '@/data/Hero';

function DraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapIdx = parseInt(searchParams.get('map') || '0', 10);
  const map = ALL_MAPS[mapIdx] || ALL_MAPS[0];

  const [draft] = useState(() => new DraftingTool(ALL_HEROES));
  const [step, setStep] = useState(0);
  const [roleFilter, setRoleFilter] = useState('All');
  const [, setTick] = useState(0); // Force re-render

  useEffect(() => { DraftSettings.load(); }, []);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const engine = useMemo(() => new HeroSuggestionEngine(draft, map), [draft, map]);

  const currentTeam = step < 16 ? DRAFT_TEAM_ORDER[step] : 0;
  const isBan = step < 16 ? DRAFT_IS_BAN[step] : false;
  const isComplete = step >= 16;

  const available = draft.getAvailableHeroes();
  const filtered = available.filter(h => matchesRoleFilter(h, roleFilter));

  const suggestions = useMemo(() => {
    if (isComplete || step >= 16) return [];
    if (isBan) return engine.generateBanSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount);
    return engine.generateSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount);
  }, [engine, currentTeam, isBan, roleFilter, isComplete, step]);

  const handleHeroClick = (hero: Hero) => {
    if (isComplete) return;
    if (isBan) {
      draft.banHero(currentTeam, hero);
    } else {
      draft.pickHero(currentTeam, hero);
    }
    setStep(s => s + 1);
    forceUpdate();
  };

  const handleUndo = () => {
    if (step === 0) return;
    const prevStep = step - 1;
    const prevTeam = DRAFT_TEAM_ORDER[prevStep];
    const wasBan = DRAFT_IS_BAN[prevStep];

    if (wasBan) {
      const bans = draft.getTeamBans(prevTeam);
      if (bans.length > 0) {
        const hero = bans.pop()!;
        (draft as any).availableHeroes?.add(hero); // Re-add
      }
    } else {
      const picks = draft.getTeamPicks(prevTeam);
      if (picks.length > 0) {
        const hero = picks.pop()!;
        (draft as any).availableHeroes?.add(hero);
      }
    }
    setStep(prevStep);
    forceUpdate();
  };

  const handleReset = () => {
    draft.reset(ALL_HEROES);
    setStep(0);
    forceUpdate();
  };

  // Win condition analysis when draft is complete
  const analysis = useMemo(() => {
    if (!isComplete) return null;
    const t1 = new TeamComposition(draft.team1Picks);
    const t2 = new TeamComposition(draft.team2Picks);
    const a1 = analyzeWinCondition(t1, t2);
    const a2 = analyzeWinCondition(t2, t1);

    // Auto-save to history
    saveDraft({
      timestamp: new Date().toISOString(),
      mapName: map.name,
      firstPickTeam: 1,
      team1Picks: draft.team1Picks.map(h => h.nicknames[0]),
      team2Picks: draft.team2Picks.map(h => h.nicknames[0]),
      team1Bans: draft.team1Bans.map(h => h.nicknames[0]),
      team2Bans: draft.team2Bans.map(h => h.nicknames[0]),
      team1Score: 0, team2Score: 0,
      team1WinCondition: winConditionToString(a1.primary),
      team2WinCondition: winConditionToString(a2.primary),
      verdict: `Team 1: ${winConditionToString(a1.primary)} vs Team 2: ${winConditionToString(a2.primary)}`,
    });

    return { team1: a1, team2: a2 };
  }, [isComplete, draft, map]);

  const statusText = isComplete
    ? '✅ Draft Complete!'
    : `Team ${currentTeam} — ${isBan ? '🚫 BAN' : '✅ PICK'} a hero (Step ${step + 1}/16)`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}>
            ← Back
          </button>
          <button onClick={handleReset} className="text-sm px-3 py-1 rounded" style={{ color: '#FF6666', border: '1px solid #FF666633' }}>
            Reset
          </button>
          <button onClick={handleUndo} disabled={step === 0} className="text-sm px-3 py-1 rounded disabled:opacity-30" style={{ color: '#FFD700', border: '1px solid #FFD70033' }}>
            Undo
          </button>
        </div>
        <span className="text-sm font-semibold" style={{ color: '#FFD700' }}>📍 {map.name}</span>
        <RoleFilterBar activeFilter={roleFilter} onFilterChange={setRoleFilter} />
      </div>

      {/* Status + Progress */}
      <div className="flex flex-col items-center gap-2 py-3" style={{ background: 'rgba(20, 25, 45, 0.5)' }}>
        <span className="text-sm font-bold" style={{ color: isBan ? '#FF6666' : '#00FFFF' }}>{statusText}</span>
        <DraftProgressBar currentStep={step} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Team 1 Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel teamNumber={1} picks={draft.team1Picks} bans={draft.team1Bans} />
        </div>

        {/* Center: Hero Grid + Suggestions */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Suggestions */}
          <HeroSuggestionPanel
            suggestions={suggestions}
            onSelect={(s) => handleHeroClick(s.hero)}
            title={isBan ? '🚫 Ban Suggestions' : '✅ Pick Suggestions'}
          />

          {/* Hero Grid */}
          {!isComplete && (
            <div className="flex-1 overflow-auto p-2 rounded" style={{ background: 'rgba(20, 25, 45, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
                {filtered.map(hero => (
                  <HeroPortrait key={hero.name} hero={hero} size="md" onClick={() => handleHeroClick(hero)} />
                ))}
              </div>
            </div>
          )}

          {/* Analysis (when complete) */}
          {isComplete && analysis && (
            <div className="grid grid-cols-2 gap-3">
              <AnalysisCard title="Team 1 Strategy" analysis={analysis.team1} color="#4488FF" />
              <AnalysisCard title="Team 2 Strategy" analysis={analysis.team2} color="#FF6666" />
            </div>
          )}
        </div>

        {/* Team 2 Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel teamNumber={2} picks={draft.team2Picks} bans={draft.team2Bans} />
        </div>
      </div>
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
