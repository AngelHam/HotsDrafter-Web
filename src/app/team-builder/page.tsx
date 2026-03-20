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
import { Specialty, specialtyToString } from '@/data/Specialty';
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

      <div className="flex-1 flex gap-4 p-4">
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

          {analysis ? (
            <>
              <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Composition Analysis</h3>

                {/* Draft Grade & Role Balance */}
                <div className="grid grid-cols-2 gap-3 mb-3">
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
                <div className="grid grid-cols-2 gap-3 mb-3">
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
          <div className="rounded-lg p-5 w-[720px] max-h-[85vh] flex flex-col" style={{ background: '#1a1a2e', border: '2px solid #00FFFF' }}
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
                    <div className="grid grid-cols-7 gap-1.5">
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

function TeamSlots({ label, color, slots, onSlotClick, onClear, onClearAll, onHeroDetail, mapName }: {
  label: string; color: string; slots: (Hero | null)[];
  onSlotClick: (i: number) => void; onClear: (i: number) => void; onClearAll?: () => void; onHeroDetail?: (h: Hero) => void; mapName?: string;
}) {
  const picks = slots.filter(Boolean) as Hero[];
  const compScore = picks.length > 0 ? computeBuilderScore(picks) : null;
  const scoreColor = compScore !== null ? (compScore >= 80 ? '#90EE90' : compScore >= 50 ? '#FFD700' : '#FF6666') : '#666';

  return (
    <div className="w-56 flex-shrink-0">
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
