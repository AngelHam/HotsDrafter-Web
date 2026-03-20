'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS, findHeroByName } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { HeroRelationships } from '@/data/HeroRelationships';
import { winConditionToString } from '@/data/SuggestionTypes';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { ROLE_COLORS } from '@/components/RoleFilterBar';
import HeroPortrait from '@/components/HeroPortrait';
import HeroDetailPopup from '@/components/HeroDetailPopup';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Specialty, specialtyToString } from '@/data/Specialty';
import { EffectiveRange } from '@/data/Hero';
import type { Hero } from '@/data/Hero';

const SLOT_ROLE_HINTS = ['🛡️ Tank', '✚ Healer', '⚔️ DPS', '🏹 Offlane', '✦ Flex'];

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  Standard: 'Balanced - all roles filled',
  Dive: 'Aggressive dive composition',
  Poke: 'Long-range siege damage',
  Wombo: 'AoE combo team',
};

const TEAM_TEMPLATES: Record<string, string[]> = {
  Standard: ['Johanna', 'Malfurion', 'Sonya', 'Jaina', 'Raynor'],
  Dive: ['Diablo', 'Uther', 'Illidan', 'Greymane', 'Genji'],
  Poke: ['Johanna', 'Deckard', 'Azmodan', 'Chromie', 'Hanzo'],
  Wombo: ['E.T.C.', 'Stukov', 'Jaina', 'Kael\'thas', 'Mephisto'],
};

function toTeamSlots(heroNames: string[]): (Hero | null)[] {
  const found = heroNames
    .map(name => findHeroByName(name) ?? null)
    .slice(0, 5);

  while (found.length < 5) {
    found.push(null);
  }

  return found;
}

export default function TeamBuilderPage() {
  const router = useRouter();
  const [team1, setTeam1] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [team2, setTeam2] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [mapIdx, setMapIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState<{ team: number; slot: number } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);
  const [pickerRole, setPickerRole] = useState('All');

  const pickedNames = new Set([
    ...team1.filter(Boolean).map(h => h!.name),
    ...team2.filter(Boolean).map(h => h!.name),
  ]);

  const analysis = useMemo(() => {
    const t1Heroes = team1.filter(Boolean) as Hero[];
    const t2Heroes = team2.filter(Boolean) as Hero[];
    if (t1Heroes.length < 2 || t2Heroes.length < 2) return null;
    const tc1 = new TeamComposition(t1Heroes);
    const tc2 = new TeamComposition(t2Heroes);
    return {
      team1: analyzeWinCondition(tc1, tc2),
      team2: analyzeWinCondition(tc2, tc1),
    };
  }, [team1, team2]);

  const handlePick = (hero: Hero) => {
    if (!pickerOpen) return;
    const { team, slot } = pickerOpen;
    if (team === 1) {
      const copy = [...team1];
      copy[slot] = hero;
      setTeam1(copy);
    } else {
      const copy = [...team2];
      copy[slot] = hero;
      setTeam2(copy);
    }
    setPickerOpen(null);
    setPickerRole('All');
  };

  const clearSlot= (team: number, slot: number) => {
    if (team === 1) { const c = [...team1]; c[slot] = null; setTeam1(c); }
    else { const c = [...team2]; c[slot] = null; setTeam2(c); }
  };

  const applyTemplate = (team: 1 | 2, templateName: string) => {
    const template = TEAM_TEMPLATES[templateName];
    if (!template) return;

    const slots = toTeamSlots(template);
    if (team === 1) {
      setTeam1(slots);
    } else {
      setTeam2(slots);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 smooth-transition" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#90EE90' }}>🏗️ Team Builder</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { const t = [...team1]; setTeam1([...team2]); setTeam2(t); }}
            className="text-xs px-2 py-1 rounded hover:bg-white/10" style={{ color: '#FFD700', border: '1px solid #FFD70033' }} title="Swap Team 1 and Team 2">
            ⇄ Swap
          </button>
          <button onClick={() => { setTeam1([null, null, null, null, null]); setTeam2([null, null, null, null, null]); }}
            className="text-xs px-2 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Clear all heroes from both teams">
            ✕ Clear
          </button>
          <select value={mapIdx} onChange={e => setMapIdx(Number(e.target.value))}
            className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
            {ALL_MAPS.map((m, i) => <option key={m.name} value={i}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 pb-16">
        {/* Team 1 */}
        <TeamSlots label="TEAM 1" color="#4488FF" slots={team1}
          onSlotClick={(i) => setPickerOpen({ team: 1, slot: i })}
          onClear={(i) => clearSlot(1, i)}
          onClearAll={() => setTeam1([null, null, null, null, null])}
          onHeroDetail={h => setDetailHero(h)}
          mapName={ALL_MAPS[mapIdx]?.name} />

        {/* Center Analysis */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-2" style={{ color: '#FFD700' }}>Team Templates</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs mb-1 opacity-70">Apply to Team 1</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(TEAM_TEMPLATES).map(name => (
                    <button
                      key={`t1-${name}`}
                      data-testid={`t1-template-${name}`}
                      onClick={() => applyTemplate(1, name)}
                      className="text-xs px-2 py-1 rounded hover:bg-white/10"
                      style={{ color: '#4488FF', border: '1px solid #4488FF44' }}
                      title={TEMPLATE_DESCRIPTIONS[name] ?? `Apply ${name} template to Team 1`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs mb-1 opacity-70">Apply to Team 2</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(TEAM_TEMPLATES).map(name => (
                    <button
                      key={`t2-${name}`}
                      data-testid={`t2-template-${name}`}
                      onClick={() => applyTemplate(2, name)}
                      className="text-xs px-2 py-1 rounded hover:bg-white/10"
                      style={{ color: '#FF6666', border: '1px solid #FF666644' }}
                      title={TEMPLATE_DESCRIPTIONS[name] ?? `Apply ${name} template to Team 2`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Swap & Clear Controls */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setTeam1([null, null, null, null, null])}
              className="text-xs px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: '#4488FF', border: '1px solid #4488FF44' }}
              title="Clear all heroes from Team 1">
              🗑 Clear T1
            </button>
            <button onClick={() => { const t = [...team1]; setTeam1([...team2]); setTeam2(t); }}
              className="text-sm px-5 py-2 rounded-lg font-bold hover:scale-105 transition-all"
              style={{ color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD70044' }}
              title="Swap Team 1 and Team 2">
              ⇄ Swap Teams
            </button>
            <button onClick={() => setTeam2([null, null, null, null, null])}
              className="text-xs px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: '#FF6666', border: '1px solid #FF666644' }}
              title="Clear all heroes from Team 2">
              🗑 Clear T2
            </button>
          </div>

          {/* Map Specialty Info */}
          {(() => {
            const currentMap = ALL_MAPS[mapIdx];
            if (!currentMap) return null;
            const weights = currentMap.specialtyWeights;
            const sorted = (Object.entries(weights) as [string, number][])
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);
            return (
              <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#87CEEB' }}>📍 {currentMap.name} favors:</p>
                <div className="flex flex-wrap gap-1.5">
                  {sorted.map(([spec, weight]) => (
                    <span key={spec} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: weight >= 3 ? 'rgba(255,215,0,0.15)' : weight >= 2 ? 'rgba(0,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${weight >= 3 ? '#FFD70044' : weight >= 2 ? '#00FFFF33' : 'rgba(68,102,136,0.3)'}`,
                        color: weight >= 3 ? '#FFD700' : weight >= 2 ? '#00FFFF' : '#999',
                      }}>
                      {specialtyToString(spec as Specialty)} {weight >= 3 ? '★' : weight >= 2 ? '●' : '○'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <ErrorBoundary>
          {analysis ? (
            <>
              <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Composition Analysis</h3>

                {/* Draft Grade & Role Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {([
                    { heroes: team1.filter(Boolean) as Hero[], color: '#4488FF', label: 'Team 1' },
                    { heroes: team2.filter(Boolean) as Hero[], color: '#FF6666', label: 'Team 2' },
                  ] as const).map(({ heroes, color, label }) => {
                    const score = computeBuilderScore(heroes);
                    const { grade, color: gradeColor } = scoreToGrade(score);
                    return (
                      <div key={label} className="p-2 rounded" style={{ background: color + '11', border: `1px solid ${color}33` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color }}>{label} Grade</span>
                          <span className="text-xl font-black px-2.5 py-0.5 rounded" style={{ color: gradeColor, background: gradeColor + '22', border: `1px solid ${gradeColor}44` }}>{grade}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {BUILDER_ROLE_CHECKS.map(({ label: rl, icon, check }) => {
                            const filled = heroes.some(check);
                            return (
                              <span key={rl} className="text-[10px] px-1.5 py-0.5 rounded" title={rl}
                                style={{ background: filled ? 'rgba(0,255,0,0.12)' : 'rgba(255,0,0,0.12)', color: filled ? '#90EE90' : '#FF6666', border: `1px solid ${filled ? '#90EE9033' : '#FF666633'}` }}>
                                {icon} {filled ? '✓' : '✗'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Synergy Indicators */}
                {(() => {
                  const rels = HeroRelationships.getInstance();
                  const t1H = team1.filter(Boolean) as Hero[];
                  const t2H = team2.filter(Boolean) as Hero[];
                  const synergies: { team: string; teamColor: string; hero1: string; hero2: string; reason: string; score: number }[] = [];
                  for (let i = 0; i < t1H.length; i++) {
                    for (let j = i + 1; j < t1H.length; j++) {
                      const s = rels.getSynergyScore(t1H[i], t1H[j]);
                      if (s >= 2) synergies.push({ team: 'T1', teamColor: '#4488FF', hero1: t1H[i].nicknames[0], hero2: t1H[j].nicknames[0], reason: rels.getSynergyReason(t1H[i], t1H[j]), score: s });
                    }
                  }
                  for (let i = 0; i < t2H.length; i++) {
                    for (let j = i + 1; j < t2H.length; j++) {
                      const s = rels.getSynergyScore(t2H[i], t2H[j]);
                      if (s >= 2) synergies.push({ team: 'T2', teamColor: '#FF6666', hero1: t2H[i].nicknames[0], hero2: t2H[j].nicknames[0], reason: rels.getSynergyReason(t2H[i], t2H[j]), score: s });
                    }
                  }
                  if (synergies.length === 0) return null;
                  return (
                    <div className="mb-3 p-2 rounded" style={{ background: 'rgba(144,238,144,0.05)', border: '1px solid rgba(144,238,144,0.15)' }}>
                      <p className="text-[10px] font-bold mb-1.5" style={{ color: '#90EE90' }}>✦ SYNERGY PAIRS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {synergies.map(s => (
                          <span key={`${s.hero1}-${s.hero2}`} className="text-[10px] px-2 py-0.5 rounded-full cursor-default"
                            title={s.reason || `${s.hero1} & ${s.hero2} synergy`}
                            style={{ background: 'rgba(144,238,144,0.1)', border: '1px solid #90EE9033', color: '#90EE90' }}>
                            {s.score >= 3 ? '★' : '✦'} {s.hero1} + {s.hero2} <span style={{ color: s.teamColor, opacity: 0.7 }}>({s.team})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Win Condition Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="p-2 rounded" style={{ background: 'rgba(68,136,255,0.1)', border: '1px solid #4488FF44' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#4488FF' }}>Team 1 Strategy</p>
                    <p className="text-sm font-bold" style={{ color: '#FFD700' }}>{winConditionToString(analysis.team1.primary)}</p>
                    <p className="text-[10px] opacity-70 mt-1">{analysis.team1.description}</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,102,102,0.1)', border: '1px solid #FF666644' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#FF6666' }}>Team 2 Strategy</p>
                    <p className="text-sm font-bold" style={{ color: '#FFD700' }}>{winConditionToString(analysis.team2.primary)}</p>
                    <p className="text-[10px] opacity-70 mt-1">{analysis.team2.description}</p>
                  </div>
                </div>

                {/* Key Focus & Counter */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span style={{ color: '#4488FF' }}>Team 1 Focus:</span>{' '}
                    <span className="opacity-70">{analysis.team1.keyFocus}</span>
                  </div>
                  <div>
                    <span style={{ color: '#FF6666' }}>Team 2 Focus:</span>{' '}
                    <span className="opacity-70">{analysis.team2.keyFocus}</span>
                  </div>
                  <div className="pt-2" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
                    <span style={{ color: '#FF6347' }}>How to beat Team 1:</span>{' '}
                    <span className="opacity-70">{analysis.team1.enemyCounterStrategy}</span>
                  </div>
                  <div>
                    <span style={{ color: '#FF6347' }}>How to beat Team 2:</span>{' '}
                    <span className="opacity-70">{analysis.team2.enemyCounterStrategy}</span>
                  </div>
                </div>

                {/* Counter Matchups */}
                {(() => {
                  const ivDb = IcyVeinsDatabase.getInstance();
                  const t1H = team1.filter(Boolean) as Hero[];
                  const t2H = team2.filter(Boolean) as Hero[];
                  const matchups: string[] = [];
                  for (const a of t1H) {
                    for (const b of t2H) {
                      if (ivDb.counters(a.nicknames[0], b.nicknames[0])) matchups.push(`${a.nicknames[0]} ↑ ${b.nicknames[0]}`);
                      if (ivDb.counters(b.nicknames[0], a.nicknames[0])) matchups.push(`${b.nicknames[0]} ↑ ${a.nicknames[0]}`);
                    }
                  }
                  if (matchups.length === 0) return null;
                  return (
                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#FF6347' }}>COUNTER MATCHUPS</p>
                      <div className="flex flex-wrap gap-1">
                        {matchups.slice(0, 6).map(m => (
                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,99,71,0.1)', border: '1px solid #FF634722', color: '#FF6347' }}>{m}</span>
                        ))}
                        {matchups.length > 6 && <span className="text-[9px] opacity-40">+{matchups.length - 6} more</span>}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ═══ Specialty Coverage Comparison ═══ */}
              <SpecialtyCoverageChart
                team1={team1.filter(Boolean) as Hero[]}
                team2={team2.filter(Boolean) as Hero[]}
              />

              {/* ═══ Counter Matchup Matrix ═══ */}
              <CounterMatchupMatrix
                team1={team1.filter(Boolean) as Hero[]}
                team2={team2.filter(Boolean) as Hero[]}
              />

              {/* ═══ Map Recommendations ═══ */}
              <MapRecommendations
                team1={team1.filter(Boolean) as Hero[]}
                team2={team2.filter(Boolean) as Hero[]}
              />

              {/* ═══ Damage Type Balance ═══ */}
              <DamageTypeBalance
                team1={team1.filter(Boolean) as Hero[]}
                team2={team2.filter(Boolean) as Hero[]}
              />

              {/* ═══ Team Range Profile ═══ */}
              <TeamRangeProfile
                team1={team1.filter(Boolean) as Hero[]}
                team2={team2.filter(Boolean) as Hero[]}
              />
            </>
          ) : (
            <div className="p-4 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <p className="text-sm opacity-60 mb-2">Add 2+ heroes to each team for analysis</p>
              <p className="text-xs opacity-40">Click the &quot;+ Pick&quot; slots on either side, or use a Team Template above</p>
              <div className="mt-3 flex justify-center gap-4 flex-wrap">
                {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane'].map(role => {
                  const count = ALL_HEROES.filter(h => h.role === role).length;
                  return (
                    <span key={role} className="text-[10px] px-2 py-0.5 rounded" style={{ color: ROLE_COLORS[role] || '#aaa', border: `1px solid ${ROLE_COLORS[role] || '#aaa'}33` }}>
                      {role}: {count}
                    </span>
                  );
                })}
              </div>
              <p className="mt-4 text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Tip: Click any slot to add a hero, or apply a Team Template to get started quickly.
              </p>
            </div>
          )}
          </ErrorBoundary>
        </div>

        {/* Team 2 */}
        <TeamSlots label="TEAM 2" color="#FF6666" slots={team2}
          onSlotClick={(i) => setPickerOpen({ team: 2, slot: i })}
          onClear={(i) => clearSlot(2, i)}
          onClearAll={() => setTeam2([null, null, null, null, null])}
          onHeroDetail={h => setDetailHero(h)}
          mapName={ALL_MAPS[mapIdx]?.name} />
      </div>

      {/* Hero Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => { setPickerOpen(null); setPickerSearch(''); setPickerRole('All'); }}>
          <div className="rounded-lg p-4 sm:p-5 w-[92vw] max-w-[720px] max-h-[85vh] flex flex-col" style={{ background: '#1a1a2e', border: '2px solid #00FFFF' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: '#00FFFF' }}>
                Select Hero — {pickerOpen.team === 1 ? 'Team 1' : 'Team 2'}, Slot {pickerOpen.slot + 1}
              </h3>
              <button onClick={() => { setPickerOpen(null); setPickerSearch(''); setPickerRole('All'); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-lg"
                style={{ color: '#FF6666', border: '1px solid #FF666644' }} title="Close hero picker">✕</button>
            </div>
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search heroes by name..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              className="w-full px-3 py-2 mb-3 rounded text-sm focus:outline-none"
              style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
              autoFocus
            />
            {/* Role filter buttons */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {['All', 'Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(role => {
                const isActive = pickerRole === role;
                const rc = role === 'All' ? '#00FFFF' : (ROLE_COLORS[role] || '#A9A9A9');
                return (
                  <button key={role} onClick={() => setPickerRole(role)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: isActive ? rc + '33' : 'transparent',
                      color: isActive ? rc : '#666',
                      border: `1px solid ${isActive ? rc : 'rgba(68,102,136,0.3)'}`,
                      fontWeight: isActive ? 700 : 400,
                    }}>
                    {role === 'All' ? '🌐 All' : role}
                  </button>
                );
              })}
            </div>
            {/* Hero grid */}
            <div className="flex-1 overflow-auto">
              {(pickerRole === 'All' ? ['Tank', 'Healer', 'Offlane', 'Mage', 'DPS', 'Specialist'] : [pickerRole]).map(role => {
                const roleHeroes = ALL_HEROES
                  .filter(h => h.role === role)
                  .filter(h => !pickerSearch || h.nicknames.some(n => n.toLowerCase().includes(pickerSearch.toLowerCase())));
                if (roleHeroes.length === 0) return null;
                return (
                  <div key={role} className="mb-4">
                    <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: ROLE_COLORS[role] || '#A9A9A9' }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: ROLE_COLORS[role] || '#A9A9A9' }} />
                      {role}s <span className="opacity-50 font-normal">({roleHeroes.filter(h => !pickedNames.has(h.name)).length} available)</span>
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5">
                      {roleHeroes.map(hero => {
                        const isPicked = pickedNames.has(hero.name);
                        return (
                          <div key={hero.name} className="relative">
                            <div className={isPicked ? 'opacity-30 pointer-events-none grayscale' : ''}>
                              <HeroPortrait hero={hero} size="md" showName
                                onClick={isPicked ? undefined : () => { handlePick(hero); setPickerSearch(''); setPickerRole('All'); }} />
                            </div>
                            {isPicked && (
                              <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                                <span className="text-[8px] px-1 rounded bg-black/70 text-red-400 font-bold">PICKED</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}
    </div>
  );
}

const BUILDER_ROLE_CHECKS = [
  { label: 'Tank', icon: '🛡️', check: (h: Hero) => h.role === 'Tank' },
  { label: 'Healer', icon: '✚', check: (h: Hero) => h.role === 'Healer' },
  { label: 'DPS', icon: '⚔️', check: (h: Hero) => h.role === 'DPS' || h.role === 'Mage' },
  { label: 'Offlane', icon: '⚙️', check: (h: Hero) => h.role === 'Offlane' || h.specialties.includes(Specialty.DOUBLE_SOAKING) },
  { label: 'Waveclear', icon: '🌊', check: (h: Hero) => h.specialties.includes(Specialty.WAVECLEAR) },
];

function computeBuilderScore(heroes: Hero[]): number {
  let score = 20;
  if (heroes.some(h => h.role === 'Tank')) score += 15;
  if (heroes.some(h => h.role === 'Healer')) score += 15;
  if (heroes.some(h => h.role === 'DPS' || h.role === 'Mage')) score += 10;
  if (heroes.some(h => h.role === 'Offlane')) score += 10;
  if (heroes.some(h => h.specialties.includes(Specialty.WAVECLEAR))) score += 10;
  if (heroes.some(h => h.specialties.includes(Specialty.ENGAGE))) score += 10;
  if (heroes.some(h => h.specialties.includes(Specialty.HARD_CC))) score += 10;
  if (heroes.filter(h => h.role === 'Tank').length >= 2) score -= 10;
  if (heroes.filter(h => h.role === 'Healer').length >= 2) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function scoreToGrade(score: number): { grade: string; color: string } {
  if (score >= 85) return { grade: 'A', color: '#90EE90' };
  if (score >= 70) return { grade: 'B', color: '#87CEEB' };
  if (score >= 55) return { grade: 'C', color: '#FFD700' };
  if (score >= 40) return { grade: 'D', color: '#FFA500' };
  return { grade: 'F', color: '#FF6666' };
}

// ══════════════════════════════════════════════════════
// 1. Specialty Coverage Comparison (side-by-side bars)
// ══════════════════════════════════════════════════════
const COVERAGE_SPECIALTIES: { key: Specialty; label: string }[] = [
  { key: Specialty.WAVECLEAR, label: 'Waveclear' },
  { key: Specialty.ENGAGE, label: 'Engage' },
  { key: Specialty.HARD_CC, label: 'Hard CC' },
  { key: Specialty.BURST_DAMAGE, label: 'Burst' },
  { key: Specialty.POKE, label: 'Poke' },
  { key: Specialty.SELF_SUSTAIN, label: 'Sustain' },
  { key: Specialty.GLOBAL_PRESENCE, label: 'Global' },
];

function SpecialtyCoverageChart({ team1, team2 }: { team1: Hero[]; team2: Hero[] }) {
  const data = COVERAGE_SPECIALTIES.map(({ key, label }) => {
    const t1 = team1.filter(h => h.specialties.includes(key)).length;
    const t2 = team2.filter(h => h.specialties.includes(key)).length;
    return { label, t1, t2, max: Math.max(t1, t2, 1) };
  });
  const globalMax = Math.max(...data.map(d => d.max), 1);

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3 text-sm" style={{ color: '#00FFFF' }}>Specialty Coverage</h3>
      <div className="flex gap-4 mb-2 text-[10px]">
        <span style={{ color: '#4488FF' }}>● Team 1</span>
        <span style={{ color: '#FF6666' }}>● Team 2</span>
      </div>
      <div className="space-y-2">
        {data.map(({ label, t1, t2 }) => {
          const advantage = t1 > t2 ? 1 : t2 > t1 ? 2 : 0;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] w-16" style={{ color: advantage === 1 ? '#00FFFF' : advantage === 2 ? '#FF8888' : '#999' }}>
                  {label}
                </span>
                <span className="text-[9px]" style={{ color: '#666' }}>{t1} vs {t2}</span>
              </div>
              <div className="flex gap-1 items-center">
                {/* T1 bar (right-aligned, grows left) */}
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-3 rounded-l transition-all"
                    style={{
                      width: `${(t1 / globalMax) * 100}%`,
                      minWidth: t1 > 0 ? '4px' : '0',
                      background: advantage === 1
                        ? 'linear-gradient(90deg, #4488FF, #66BBFF)'
                        : '#4488FF',
                      boxShadow: advantage === 1 ? '0 0 6px rgba(0,255,255,0.3)' : 'none',
                    }}
                  />
                </div>
                <div className="w-px h-4" style={{ background: 'rgba(68,102,136,0.5)' }} />
                {/* T2 bar (left-aligned, grows right) */}
                <div className="flex-1">
                  <div
                    className="h-3 rounded-r transition-all"
                    style={{
                      width: `${(t2 / globalMax) * 100}%`,
                      minWidth: t2 > 0 ? '4px' : '0',
                      background: advantage === 2
                        ? 'linear-gradient(90deg, #FF8888, #FF6666)'
                        : '#FF6666',
                      boxShadow: advantage === 2 ? '0 0 6px rgba(0,255,255,0.3)' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 2. Counter Matchup Matrix
// ══════════════════════════════════════════════════════
function CounterMatchupMatrix({ team1, team2 }: { team1: Hero[]; team2: Hero[] }) {
  if (team1.length < 3 || team2.length < 3) return null;

  const rels = HeroRelationships.getInstance();

  type CellValue = 'counters' | 'countered' | 'neutral';
  const matrix: { row: Hero; cells: { col: Hero; value: CellValue; score: number }[] }[] =
    team1.map(t1Hero => ({
      row: t1Hero,
      cells: team2.map(t2Hero => {
        const counterScore = rels.getCounterScore(t1Hero, t2Hero);
        const counteredScore = rels.getCounterScore(t2Hero, t1Hero);
        let value: CellValue = 'neutral';
        let score = 0;
        if (counterScore >= 2 && counterScore > counteredScore) {
          value = 'counters';
          score = counterScore;
        } else if (counteredScore >= 2 && counteredScore > counterScore) {
          value = 'countered';
          score = counteredScore;
        }
        return { col: t2Hero, value, score };
      }),
    }));

  const cellStyle = (val: CellValue) => {
    switch (val) {
      case 'counters': return { bg: 'rgba(0,255,0,0.12)', color: '#90EE90', symbol: '✓' };
      case 'countered': return { bg: 'rgba(255,0,0,0.12)', color: '#FF6666', symbol: '✗' };
      default: return { bg: 'transparent', color: '#555', symbol: '—' };
    }
  };

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3 text-sm" style={{ color: '#00FFFF' }}>Counter Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '2px' }}>
          <thead>
            <tr>
              <th className="text-[9px] p-1" style={{ color: '#666' }}>T1 ↓ / T2 →</th>
              {team2.map(h => (
                <th key={h.name} className="text-[9px] p-1 text-center" style={{ color: '#FF6666' }}>
                  {h.nicknames[0].length > 8 ? h.nicknames[0].slice(0, 7) + '…' : h.nicknames[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ row, cells }) => (
              <tr key={row.name}>
                <td className="text-[9px] p-1" style={{ color: '#4488FF' }}>
                  {row.nicknames[0].length > 8 ? row.nicknames[0].slice(0, 7) + '…' : row.nicknames[0]}
                </td>
                {cells.map(({ col, value }) => {
                  const s = cellStyle(value);
                  return (
                    <td key={col.name} className="text-center p-1 rounded"
                      title={value === 'counters' ? `${row.nicknames[0]} counters ${col.nicknames[0]}` : value === 'countered' ? `${col.nicknames[0]} counters ${row.nicknames[0]}` : 'Neutral'}
                      style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: value !== 'neutral' ? 700 : 400 }}>
                      {s.symbol}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-2 text-[9px]">
        <span style={{ color: '#90EE90' }}>✓ = T1 counters</span>
        <span style={{ color: '#FF6666' }}>✗ = T2 counters</span>
        <span style={{ color: '#555' }}>— = Neutral</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 3. Map Recommendations
// ══════════════════════════════════════════════════════
function MapRecommendations({ team1, team2 }: { team1: Hero[]; team2: Hero[] }) {
  if (team1.length < 2 || team2.length < 2) return null;

  const mapScores = ALL_MAPS.map(m => {
    const t1Score = m.scoreTeam(team1);
    const t2Score = m.scoreTeam(team2);
    return { name: m.name, t1Score, t2Score, diff: t1Score - t2Score };
  });

  // Sort by T1 advantage (highest diff first)
  const sorted = [...mapScores].sort((a, b) => b.diff - a.diff);
  const bestForT1 = sorted.slice(0, 3);
  const bestForT2 = sorted.slice(-3).reverse().map(m => ({ ...m, diff: -m.diff }));
  const maxScore = Math.max(...mapScores.map(m => Math.max(m.t1Score, m.t2Score)), 1);

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3 text-sm" style={{ color: '#00FFFF' }}>Map Recommendations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Best maps for T1 */}
        <div>
          <p className="text-[10px] font-semibold mb-2" style={{ color: '#4488FF' }}>Best for Team 1</p>
          {bestForT1.map(m => (
            <div key={m.name} className="mb-2 p-2 rounded" style={{ background: 'rgba(68,136,255,0.08)', border: '1px solid rgba(68,136,255,0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: '#ccc' }}>{m.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: m.diff > 0 ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: m.diff > 0 ? '#90EE90' : '#FF6666' }}>
                  {m.diff > 0 ? '+' : ''}{m.diff.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-1 items-center">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(m.t1Score / maxScore) * 100}%`, background: '#4488FF' }} />
                </div>
                <span className="text-[8px] w-6 text-right" style={{ color: '#4488FF' }}>{m.t1Score.toFixed(1)}</span>
              </div>
              <div className="flex gap-1 items-center mt-0.5">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(m.t2Score / maxScore) * 100}%`, background: '#FF6666' }} />
                </div>
                <span className="text-[8px] w-6 text-right" style={{ color: '#FF6666' }}>{m.t2Score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Best maps for T2 */}
        <div>
          <p className="text-[10px] font-semibold mb-2" style={{ color: '#FF6666' }}>Best for Team 2</p>
          {bestForT2.map(m => (
            <div key={m.name} className="mb-2 p-2 rounded" style={{ background: 'rgba(255,102,102,0.08)', border: '1px solid rgba(255,102,102,0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: '#ccc' }}>{m.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: m.diff > 0 ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: m.diff > 0 ? '#90EE90' : '#FF6666' }}>
                  +{m.diff.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-1 items-center">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(m.t1Score / maxScore) * 100}%`, background: '#4488FF' }} />
                </div>
                <span className="text-[8px] w-6 text-right" style={{ color: '#4488FF' }}>{m.t1Score.toFixed(1)}</span>
              </div>
              <div className="flex gap-1 items-center mt-0.5">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(m.t2Score / maxScore) * 100}%`, background: '#FF6666' }} />
                </div>
                <span className="text-[8px] w-6 text-right" style={{ color: '#FF6666' }}>{m.t2Score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 4. Damage Type Balance
// ══════════════════════════════════════════════════════
const MAGICAL_SPECS = [Specialty.SPELL_DAMAGE, Specialty.BURST_DAMAGE, Specialty.AOE_DAMAGE];
const PHYSICAL_SPECS = [Specialty.AUTO_ATTACK, Specialty.EXECUTE_DAMAGE];

function classifyDamageType(hero: Hero): 'physical' | 'magical' | 'mixed' {
  const hasMagical = hero.specialties.some(s => MAGICAL_SPECS.includes(s));
  const hasPhysical = hero.specialties.some(s => PHYSICAL_SPECS.includes(s));
  if (hasMagical && hasPhysical) return 'mixed';
  if (hasMagical) return 'magical';
  if (hasPhysical) return 'physical';
  // Default: Tanks/Healers default to physical unless they have spell damage
  return hero.role === 'Mage' ? 'magical' : 'physical';
}

function DamageTypeBalance({ team1, team2 }: { team1: Hero[]; team2: Hero[] }) {
  const classify = (heroes: Hero[]) => {
    let phys = 0, mag = 0, mix = 0;
    heroes.forEach(h => {
      const t = classifyDamageType(h);
      if (t === 'physical') phys++;
      else if (t === 'magical') mag++;
      else mix++;
    });
    const total = Math.max(heroes.length, 1);
    return {
      physical: phys, magical: mag, mixed: mix,
      physPct: (phys / total) * 100,
      magPct: (mag / total) * 100,
      mixPct: (mix / total) * 100,
    };
  };

  const t1 = classify(team1);
  const t2 = classify(team2);

  const DamageBar = ({ data, color }: { data: ReturnType<typeof classify>; color: string }) => (
    <div>
      <div className="flex h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {data.physPct > 0 && (
          <div className="h-full flex items-center justify-center transition-all" title={`Physical: ${data.physical}`}
            style={{ width: `${data.physPct}%`, background: '#E8A83E', minWidth: '16px' }}>
            <span className="text-[8px] font-bold text-black">⚔</span>
          </div>
        )}
        {data.magPct > 0 && (
          <div className="h-full flex items-center justify-center transition-all" title={`Magical: ${data.magical}`}
            style={{ width: `${data.magPct}%`, background: '#8B5CF6', minWidth: '16px' }}>
            <span className="text-[8px] font-bold text-white">✦</span>
          </div>
        )}
        {data.mixPct > 0 && (
          <div className="h-full flex items-center justify-center transition-all" title={`Mixed: ${data.mixed}`}
            style={{ width: `${data.mixPct}%`, background: 'linear-gradient(90deg, #E8A83E, #8B5CF6)', minWidth: '16px' }}>
            <span className="text-[8px] font-bold text-white">⚡</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-1 text-[9px]">
        <span style={{ color: '#E8A83E' }}>⚔ Phys {data.physical}</span>
        <span style={{ color: '#8B5CF6' }}>✦ Magic {data.magical}</span>
        {data.mixed > 0 && <span style={{ color: '#ccc' }}>⚡ Mixed {data.mixed}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3 text-sm" style={{ color: '#00FFFF' }}>Damage Type Balance</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#4488FF' }}>Team 1</p>
          <DamageBar data={t1} color="#4488FF" />
        </div>
        <div>
          <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#FF6666' }}>Team 2</p>
          <DamageBar data={t2} color="#FF6666" />
        </div>
      </div>
      {((t1.physPct >= 80 && t1.physical >= 3) || (t2.physPct >= 80 && t2.physical >= 3)) && (
        <p className="text-[9px] mt-2 px-2 py-1 rounded" style={{ background: 'rgba(255,165,0,0.1)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.2)' }}>
          ⚠ {t1.physPct >= 80 && t1.physical >= 3 ? 'Team 1' : 'Team 2'} is heavily physical — vulnerable to Physical Armor.
        </p>
      )}
      {((t1.magPct >= 80 && t1.magical >= 3) || (t2.magPct >= 80 && t2.magical >= 3)) && (
        <p className="text-[9px] mt-2 px-2 py-1 rounded" style={{ background: 'rgba(255,165,0,0.1)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.2)' }}>
          ⚠ {t1.magPct >= 80 && t1.magical >= 3 ? 'Team 1' : 'Team 2'} is heavily magical — vulnerable to Spell Armor.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 5. Team Range Profile
// ══════════════════════════════════════════════════════
const RANGE_LABELS: Record<number, string> = {
  [EffectiveRange.MELEE]: 'Melee',
  [EffectiveRange.SHORT_RANGE]: 'Short',
  [EffectiveRange.MEDIUM_RANGE]: 'Medium',
  [EffectiveRange.LONG_RANGE]: 'Long',
  [EffectiveRange.EXTREME_RANGE]: 'Extreme',
};

function TeamRangeProfile({ team1, team2 }: { team1: Hero[]; team2: Hero[] }) {
  const rangeProfile = (heroes: Hero[]) => {
    if (heroes.length === 0) return { avg: 0, label: 'N/A', counts: {} as Record<number, number> };
    const counts: Record<number, number> = {};
    let sum = 0;
    heroes.forEach(h => {
      const r = h.effectiveRange;
      counts[r] = (counts[r] || 0) + 1;
      sum += r;
    });
    const avg = sum / heroes.length;
    const label = avg <= 1.5 ? 'Melee-Heavy'
      : avg <= 2.5 ? 'Short-Range'
      : avg <= 3.5 ? 'Balanced'
      : avg <= 4.5 ? 'Ranged-Heavy'
      : 'Extreme Range';
    return { avg, label, counts };
  };

  const t1 = rangeProfile(team1);
  const t2 = rangeProfile(team2);

  const RangeIndicator = ({ profile, color }: { profile: ReturnType<typeof rangeProfile>; color: string }) => (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold" style={{ color }}>{profile.label}</span>
        <span className="text-[9px]" style={{ color: '#666' }}>avg {profile.avg.toFixed(1)}</span>
      </div>
      {/* Range spectrum bar */}
      <div className="relative h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {/* Segments for each range tier */}
        {[1, 2, 3, 4, 5].map(r => (
          <div key={r} className="absolute top-0 h-full flex items-center justify-center text-[7px]"
            style={{
              left: `${((r - 1) / 5) * 100}%`,
              width: '20%',
              borderRight: r < 5 ? '1px solid rgba(68,102,136,0.3)' : 'none',
              color: '#555',
            }}>
            {RANGE_LABELS[r]}
          </div>
        ))}
        {/* Marker for average */}
        <div className="absolute top-0 h-full w-1 rounded transition-all"
          style={{
            left: `${((profile.avg - 1) / 4) * 100}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
      {/* Hero dots by range */}
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {[1, 2, 3, 4, 5].map(r => {
          const count = profile.counts[r] || 0;
          if (count === 0) return null;
          return (
            <span key={r} className="text-[8px] px-1.5 py-0.5 rounded"
              style={{ background: color + '15', color, border: `1px solid ${color}33` }}>
              {RANGE_LABELS[r]}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3 text-sm" style={{ color: '#00FFFF' }}>Team Range Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#4488FF' }}>Team 1</p>
          <RangeIndicator profile={t1} color="#4488FF" />
        </div>
        <div>
          <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#FF6666' }}>Team 2</p>
          <RangeIndicator profile={t2} color="#FF6666" />
        </div>
      </div>
    </div>
  );
}

function TeamSlots({ label, color, slots, onSlotClick, onClear, onClearAll, onHeroDetail, mapName }: {
  label: string; color: string; slots: (Hero | null)[];
  onSlotClick: (i: number) => void; onClear: (i: number) => void; onClearAll?: () => void; onHeroDetail?: (h: Hero) => void; mapName?: string;
}) {
  const picks = slots.filter(Boolean) as Hero[];
  const compScore = picks.length > 0 ? computeBuilderScore(picks) : null;
  const scoreColor = compScore !== null ? (compScore >= 80 ? '#90EE90' : compScore >= 50 ? '#FFD700' : '#FF6666') : '#666';

  return (
    <div className="w-full lg:w-56 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold" style={{ color }}>{label}</h2>
        <div className="flex items-center gap-1.5">
          {onClearAll && picks.length > 0 && (
            <button onClick={onClearAll} className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: '#FF6666', border: '1px solid #FF666633' }} title={`Clear all heroes from ${label}`}>
              Clear
            </button>
          )}
          {compScore !== null && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: scoreColor + '22', color: scoreColor, border: `1px solid ${scoreColor}44` }}>
              {compScore}
            </span>
          )}
        </div>
      </div>
      {/* Score bar */}
      {compScore !== null && (
        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${compScore}%`,
            background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)`,
          }} />
        </div>
      )}
      {picks.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {BUILDER_ROLE_CHECKS.map(({ label: rl, icon, check }) => {
            const filled = picks.some(check);
            return (
              <span key={rl} className="text-xs px-1 py-0.5 rounded" title={rl}
                style={{ background: filled ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)', color: filled ? '#90EE90' : '#FF6666', border: `1px solid ${filled ? '#90EE9044' : '#FF666644'}` }}>
                {icon}{filled ? '✓' : '✗'}
              </span>
            );
          })}
        </div>
      )}
      {picks.length > 0 && mapName && (() => {
        const ivDb = IcyVeinsDatabase.getInstance();
        const mapScores = picks.map(h => ivDb.getTierScore(h.nicknames[0], mapName));
        const avgScore = mapScores.reduce((a, b) => a + b, 0) / mapScores.length;
        const mapFit = avgScore >= 7 ? 'Great' : avgScore >= 5 ? 'Good' : avgScore >= 3 ? 'OK' : 'Poor';
        const fitColor = avgScore >= 7 ? '#90EE90' : avgScore >= 5 ? '#FFD700' : avgScore >= 3 ? '#FFA500' : '#FF6666';
        return (
          <div className="text-[10px] mb-1 px-1.5 py-0.5 rounded" style={{ background: fitColor + '15', color: fitColor, border: `1px solid ${fitColor}33` }}>
            📍 Map Fit: {mapFit} ({avgScore.toFixed(1)})
          </div>
        );
      })()}
      <div className="flex flex-col gap-2">
        {slots.map((hero, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${hero ? color : 'rgba(68,102,136,0.3)'}` }}
            onClick={() => hero ? undefined : onSlotClick(i)}>
            {hero ? (
              <>
                <div onContextMenu={e => { e.preventDefault(); if (onHeroDetail) onHeroDetail(hero); }}><HeroPortrait hero={hero} size="sm" selected /></div>
                <span className="text-sm flex-1">{hero.nicknames[0]}</span>
                {mapName && (() => {
                  const tier = IcyVeinsDatabase.getInstance().getHeroTierOnMap(hero.nicknames[0], mapName);
                  const tc: Record<string, string> = { S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666' };
                  return tier !== 'B' ? <span className="text-[8px] px-1 rounded" style={{ color: tc[tier], background: (tc[tier] || '#888') + '15' }}>{tier}</span> : null;
                })()}
                <button onClick={(e) => { e.stopPropagation(); onClear(i); }} className="text-xs px-1 rounded hover:bg-white/10" style={{ color: '#FF6666' }} title={`Clear slot ${i + 1}`}>✕</button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full py-1" onClick={() => onSlotClick(i)}>
                <span className="text-sm opacity-50 cursor-pointer">+ Pick {i + 1}</span>
                <span className="text-xs opacity-30 ml-auto">{SLOT_ROLE_HINTS[i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Synergy connections */}
      {(() => {
        const ivDb = IcyVeinsDatabase.getInstance();
        const heroes = slots.filter(Boolean) as Hero[];
        const syns: string[] = [];
        for (let i = 0; i < heroes.length; i++) {
          for (let j = i + 1; j < heroes.length; j++) {
            if (ivDb.hasSynergy(heroes[i].nicknames[0], heroes[j].nicknames[0])) {
              syns.push(`${heroes[i].nicknames[0]} + ${heroes[j].nicknames[0]}`);
            }
          }
        }
        if (syns.length === 0) return null;
        return (
          <div className="mt-2 pt-1" style={{ borderTop: '1px solid rgba(68,102,136,0.2)' }}>
            <span className="text-[9px] font-semibold" style={{ color: '#90EE90' }}>SYNERGIES</span>
            {syns.slice(0, 3).map(s => <p key={s} className="text-[9px]" style={{ color: '#90EE90' }}>✦ {s}</p>)}
            {syns.length > 3 && <p className="text-[9px] opacity-40">+{syns.length - 3} more</p>}
          </div>
        );
      })()}
    </div>
  );
}
