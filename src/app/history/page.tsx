'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loadHistory, saveDraft, clearHistory, deleteDraft, type DraftRecord } from '@/data/DraftHistory';
import { findHeroByName, ALL_MAPS } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import HeroPortrait from '@/components/HeroPortrait';
import type { Hero } from '@/data/Hero';

const SAMPLE_DRAFTS: DraftRecord[] = [
  {
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    mapName: 'Cursed Hollow',
    firstPickTeam: 1,
    team1Picks: ['Muradin', 'Anduin', 'Sonya', 'Jaina', 'Valla'],
    team2Picks: ['Johanna', 'Brightwing', 'Thrall', 'Li-Ming', 'Raynor'],
    team1Bans: ['Maiev', 'Genji'],
    team2Bans: ['Deathwing', 'Abathur'],
    team1Score: 78, team2Score: 72,
    team1WinCondition: 'Teamfight', team2WinCondition: 'Poke / Siege',
    verdict: 'Team 1: Teamfight vs Team 2: Poke / Siege',
  },
  {
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    mapName: 'Infernal Shrines',
    firstPickTeam: 2,
    team1Picks: ['Diablo', 'Rehgar', 'Blaze', 'Kael\'thas', 'Greymane'],
    team2Picks: ['ETC', 'Stukov', 'Yrel', 'Chromie', 'Hanzo'],
    team1Bans: ['Maiev', 'Zeratul'],
    team2Bans: ['Lucio', 'Jaina'],
    team1Score: 85, team2Score: 68,
    team1WinCondition: 'Teamfight', team2WinCondition: 'Poke / Siege',
    verdict: 'Team 1: Teamfight vs Team 2: Poke / Siege',
  },
  {
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mapName: 'Dragon Shire',
    firstPickTeam: 1,
    team1Picks: ['Anub\'arak', 'Ana', 'Illidan', 'Kerrigan', 'Tychus'],
    team2Picks: ['Garrosh', 'Malfurion', 'Dehaka', 'Guldan', 'Cassia'],
    team1Bans: ['Brightwing', 'Uther'],
    team2Bans: ['Abathur', 'Murky'],
    team1Score: 91, team2Score: 74,
    team1WinCondition: 'Dive', team2WinCondition: 'Sustain / Attrition',
    verdict: 'Team 1: Dive vs Team 2: Sustain / Attrition',
  },
  {
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mapName: 'Towers of Doom',
    firstPickTeam: 1,
    team1Picks: ['ETC', 'Deckard', 'Ragnaros', 'Nazeebo', 'Fenix'],
    team2Picks: ['Arthas', 'Whitemane', 'Leoric', 'Azmodan', 'Sylvanas'],
    team1Bans: ['Chromie', 'Genji'],
    team2Bans: ['Deathwing', 'Maiev'],
    team1Score: 65, team2Score: 82,
    team1WinCondition: 'Poke / Siege', team2WinCondition: 'Split / Macro',
    verdict: 'Team 1: Poke / Siege vs Team 2: Split / Macro',
  },
];

/* -- Helpers ------------------------------------------------ */

function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} at ${time}`;
}

function resultBorderColor(t1: number, t2: number): string {
  if (t1 > t2) return '#00FFFF';
  if (t2 > t1) return '#FF6666';
  return '#FFD700';
}

function resolveHeroes(names: string[]): Hero[] {
  return names.map(n => findHeroByName(n)).filter((h): h is Hero => h !== undefined);
}

const MAP_ICONS: Record<string, string> = {
  'Alterac Pass': '🏔️', 'Battlefield of Eternity': '😈', 'Braxis Holdout': '🧬',
  'Cursed Hollow': '💀', 'Dragon Shire': '🐉', 'Garden of Terror': '🌿',
  'Infernal Shrines': '🔥', 'Sky Temple': '🏛️', 'Tomb of the Spider Queen': '🕷️',
  'Towers of Doom': '🏰', 'Volskaya Foundry': '⚙️',
};

const WC_COLORS: Record<string, string> = {
  'Teamfight': '#4488FF', 'Poke / Siege': '#FFA500', 'Dive': '#FF4466',
  'Split / Macro': '#90EE90', 'Pick': '#BA55D3', 'Sustain / Attrition': '#00CED1',
  'Snowball / Early': '#FFD700', 'Late Game': '#87CEEB',
};

/* -- Sub-components ----------------------------------------- */

function ScoreBar({ t1, t2 }: { t1: number; t2: number }) {
  const total = t1 + t2 || 1;
  const pct1 = Math.round((t1 / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold w-7 text-right" style={{ color: '#4488FF' }}>{t1}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct1}%`, background: `linear-gradient(90deg, #4488FF, ${pct1 > 50 ? '#90EE90' : '#FF6666'})` }} />
      </div>
      <span className="text-[11px] font-bold w-7" style={{ color: '#FF6666' }}>{t2}</span>
    </div>
  );
}

function HeroRow({ names, banned = false }: { names: string[]; banned?: boolean }) {
  if (names.length === 0) return <span className="opacity-40 text-[10px]">None</span>;
  return (
    <div className="flex gap-0.5 flex-wrap">
      {names.map((name, idx) => {
        const hero = findHeroByName(name);
        if (!hero) {
          return (
            <span key={`${name}-${idx}`} className="text-[10px] px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {name}
            </span>
          );
        }
        return <HeroPortrait key={`${name}-${idx}`} hero={hero} size="xs" banned={banned} />;
      })}
    </div>
  );
}

function WcBadge({ label }: { label: string }) {
  const color = WC_COLORS[label] || '#00FFFF';
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ background: color + '18', color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function HeroDetailRow({ names, teamLabel, teamColor }: { names: string[]; teamLabel: string; teamColor: string }) {
  const heroes = resolveHeroes(names);
  return (
    <div>
      <p className="text-[10px] font-bold mb-1.5" style={{ color: teamColor }}>{teamLabel}</p>
      <div className="space-y-1">
        {heroes.map((hero, i) => (
          <div key={i} className="flex items-center gap-2">
            <HeroPortrait hero={hero} size="xs" />
            <span className="text-xs">{hero.nicknames[0]}</span>
            <span className="text-[10px] opacity-40">({hero.role})</span>
          </div>
        ))}
        {names.filter(n => !findHeroByName(n)).map((n, i) => (
          <div key={`missing-${i}`} className="flex items-center gap-2">
            <span className="text-xs opacity-50">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Stats computation -------------------------------------- */

interface HistoryStats {
  totalDrafts: number;
  mostDrafted: { name: string; count: number } | null;
  mostBanned: { name: string; count: number } | null;
  topMap: { name: string; count: number } | null;
  topStrategy: { name: string; count: number } | null;
  avgScore: number;
}

function computeStats(history: DraftRecord[]): HistoryStats | null {
  if (history.length === 0) return null;

  const heroCounts = new Map<string, number>();
  const banCounts = new Map<string, number>();
  const mapCounts = new Map<string, number>();
  const wcCounts = new Map<string, number>();
  let scoreSum = 0, scoreN = 0;

  for (const r of history) {
    mapCounts.set(r.mapName, (mapCounts.get(r.mapName) || 0) + 1);

    for (const h of [...r.team1Picks, ...r.team2Picks]) {
      heroCounts.set(h, (heroCounts.get(h) || 0) + 1);
    }
    for (const b of [...r.team1Bans, ...r.team2Bans]) {
      banCounts.set(b, (banCounts.get(b) || 0) + 1);
    }

    if (r.team1WinCondition) wcCounts.set(r.team1WinCondition, (wcCounts.get(r.team1WinCondition) || 0) + 1);
    if (r.team2WinCondition) wcCounts.set(r.team2WinCondition, (wcCounts.get(r.team2WinCondition) || 0) + 1);

    if (r.team1Score > 0) { scoreSum += r.team1Score; scoreN++; }
    if (r.team2Score > 0) { scoreSum += r.team2Score; scoreN++; }
  }

  const top = (m: Map<string, number>) => {
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
  };

  return {
    totalDrafts: history.length,
    mostDrafted: top(heroCounts),
    mostBanned: top(banCounts),
    topMap: top(mapCounts),
    topStrategy: top(wcCounts),
    avgScore: scoreN > 0 ? Math.round(scoreSum / scoreN) : 0,
  };
}

/* -- Main page ---------------------------------------------- */

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<DraftRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [heroSearch, setHeroSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');

  useEffect(() => {
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const stats = useMemo(() => computeStats(history), [history]);

  const filteredHistory = useMemo(() => {
    let result = history;
    if (mapFilter !== 'all') result = result.filter(r => r.mapName === mapFilter);
    if (heroSearch.trim()) {
      const q = heroSearch.trim().toLowerCase();
      result = result.filter(r =>
        [...r.team1Picks, ...r.team2Picks, ...r.team1Bans, ...r.team2Bans]
          .some(n => n.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'oldest') result = [...result].reverse();
    else if (sortBy === 'score') result = [...result].sort((a, b) => Math.max(b.team1Score, b.team2Score) - Math.max(a.team1Score, a.team2Score));
    return result;
  }, [history, mapFilter, heroSearch, sortBy]);

  const handleClear = () => { clearHistory(); setHistory([]); setExpandedIdx(null); };
  const handleDelete = (idx: number) => {
    deleteDraft(idx);
    setHistory(loadHistory());
    if (expandedIdx === idx) setExpandedIdx(null);
  };
  const handleLoadSamples = () => {
    for (const draft of SAMPLE_DRAFTS) saveDraft(draft);
    setHistory(loadHistory());
  };

  return (
    <div className="min-h-screen flex flex-col pb-14" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.95)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 transition-colors" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#BA55D3' }}>
          📜 Draft History
          {history.length > 0 && <span className="text-xs font-normal opacity-60 ml-1">({history.length})</span>}
        </h1>
        {history.length > 0 ? (
          <button onClick={handleClear} className="text-sm px-3 py-1 rounded hover:bg-white/10 transition-colors" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Delete all saved drafts">Clear All</button>
        ) : <div className="w-16" />}
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* -- Stats Dashboard -- */}
        {stats && (
          <div className="grid grid-cols-5 gap-2 mb-4">
            {/* Total Drafts */}
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-xl font-bold" style={{ color: '#FFD700' }}>{stats.totalDrafts}</p>
              <p className="text-[10px] opacity-50">Total Drafts</p>
            </div>
            {/* Most Drafted Hero */}
            <StatHeroCard stats={stats} type="drafted" />
            {/* Most Banned Hero */}
            <StatHeroCard stats={stats} type="banned" />
            {/* Most Popular Map */}
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-sm mb-0.5">{MAP_ICONS[stats.topMap?.name ?? ''] || '🗺️'}</p>
              <p className="text-[10px] font-bold truncate" style={{ color: '#00FFFF' }}>{stats.topMap?.name ?? '—'}</p>
              {stats.topMap && <p className="text-[10px] opacity-40">×{stats.topMap.count}</p>}
              <p className="text-[10px] opacity-50">Top Map</p>
            </div>
            {/* Average Score */}
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-lg font-bold" style={{ color: stats.avgScore >= 80 ? '#90EE90' : stats.avgScore >= 50 ? '#FFD700' : '#FF6666' }}>
                {stats.avgScore || '—'}
              </p>
              <p className="text-[10px] opacity-50">Avg Score</p>
            </div>
          </div>
        )}

        {/* -- Filters / Sort / Search -- */}
        {history.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <select value={mapFilter} onChange={e => setMapFilter(e.target.value)}
              className="text-xs px-2 py-1.5 rounded cursor-pointer" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="all">All Maps</option>
              {[...new Set(history.map(r => r.mapName))].sort().map(m => (
                <option key={m} value={m}>{MAP_ICONS[m] || '🗺️'} {m}</option>
              ))}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs px-2 py-1.5 rounded cursor-pointer" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#00FFFF', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="newest">↓ Newest First</option>
              <option value="oldest">↑ Oldest First</option>
              <option value="score">⭐ By Score</option>
            </select>
            <div className="relative ml-auto">
              <input
                type="text"
                placeholder="🔍 Search hero…"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                className="text-xs px-3 py-1.5 rounded w-44 placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#fff', border: '1px solid rgba(68,102,136,0.5)' }}
              />
              {heroSearch && (
                <button onClick={() => setHeroSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-40 hover:opacity-80">✕</button>
              )}
            </div>
            <span className="text-[10px] opacity-40">{filteredHistory.length} of {history.length}</span>
          </div>
        )}

        {/* -- Content -- */}
        {!loaded ? (
          <div className="text-center py-20">
            <p className="text-sm opacity-40 animate-pulse">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          /* -- Empty state -- */
          <div className="text-center py-16 animate-fade-slide-up">
            <span className="animate-icon-pulse text-5xl block mb-4 inline-block">📜</span>
            <p className="text-xl font-semibold mb-2" style={{ color: '#BA55D3' }}>No drafts saved yet</p>
            <p className="text-sm opacity-40 mb-6">Complete an Interactive Draft to see it here</p>
            <div className="flex gap-3 justify-center mb-4">
              <button onClick={() => router.push('/')} className="text-sm px-5 py-2.5 rounded font-semibold transition-all hover:scale-105 hover:brightness-110"
                style={{ color: '#00FFFF', border: '2px solid #00FFFF44', background: 'rgba(0,255,255,0.05)' }}>
                ⚔️ Start Your First Draft
              </button>
              <button onClick={handleLoadSamples} className="action-btn text-sm px-6 py-3 rounded-lg font-bold"
                style={{ color: '#1a1a2e', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.25)', '--btn-glow': 'rgba(255,215,0,0.4)' } as React.CSSProperties}>
                📦 Load Sample Data
              </button>
            </div>
            <p className="text-xs opacity-40 mb-8 max-w-sm mx-auto">
              Sample data includes 4 drafts across Cursed Hollow, Infernal Shrines, Dragon Shire &amp; Towers of Doom with full team compositions, scores, and win conditions.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded text-center transition-all hover:brightness-110" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">📊</span>
                <p className="text-[10px] opacity-40">Track your scores and stats</p>
              </div>
              <div className="p-3 rounded text-center transition-all hover:brightness-110" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">🗺️</span>
                <p className="text-[10px] opacity-40">Filter by map and strategy</p>
              </div>
              <div className="p-3 rounded text-center transition-all hover:brightness-110" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">🔄</span>
                <p className="text-[10px] opacity-40">Re-draft past games</p>
              </div>
            </div>
          </div>
        ) : (
          /* -- Draft entries list -- */
          <div className="space-y-3">
            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm opacity-40">No drafts match your filters</p>
                <button onClick={() => { setMapFilter('all'); setHeroSearch(''); }} className="text-xs mt-2 px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}>Clear Filters</button>
              </div>
            )}
            {filteredHistory.map((record, i) => {
              const isExpanded = expandedIdx === i;
              const mapIcon = MAP_ICONS[record.mapName] || '🗺️';
              const hasScores = record.team1Score > 0 || record.team2Score > 0;
              const borderColor = hasScores ? resultBorderColor(record.team1Score, record.team2Score) : '#FFD700';

              return (
                <div key={`${record.timestamp}-${i}`}
                  className="rounded cursor-pointer transition-all hover:brightness-110 overflow-hidden"
                  style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${isExpanded ? borderColor + '66' : 'rgba(68,102,136,0.4)'}`, borderLeft: `3px solid ${borderColor}` }}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <div className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Top row: map, date, badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: '#FFD700' }}>{mapIcon} {record.mapName}</span>
                          {record.firstPickTeam && (
                            <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: record.firstPickTeam === 1 ? 'rgba(68,136,255,0.1)' : 'rgba(255,102,102,0.1)', color: record.firstPickTeam === 1 ? '#4488FF' : '#FF6666', border: `1px solid ${record.firstPickTeam === 1 ? '#4488FF22' : '#FF666622'}` }}>
                              T{record.firstPickTeam} 1st
                            </span>
                          )}
                          <span className="text-[11px] opacity-40 ml-auto flex-shrink-0">{formatDate(record.timestamp)}</span>
                          <span className="text-[10px] opacity-30 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                        </div>

                        {/* Score bar */}
                        {hasScores && <div className="mb-2"><ScoreBar t1={record.team1Score} t2={record.team2Score} /></div>}

                        {/* Team compositions with portraits */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold" style={{ color: '#4488FF' }}>Team 1</span>
                              <WcBadge label={record.team1WinCondition} />
                            </div>
                            <HeroRow names={record.team1Picks} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold" style={{ color: '#FF6666' }}>Team 2</span>
                              <WcBadge label={record.team2WinCondition} />
                            </div>
                            <HeroRow names={record.team2Picks} />
                          </div>
                        </div>

                        {/* -- Expanded details -- */}
                        {isExpanded && (
                          <ExpandedDetails record={record} router={router} />
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                        className="text-xs px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0 opacity-40 hover:opacity-100"
                        style={{ color: '#FF6666' }}
                        title="Delete this draft record"
                      >✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* -- StatHeroCard (used in stats dashboard) ----------------- */

function StatHeroCard({ stats, type }: { stats: HistoryStats; type: 'drafted' | 'banned' }) {
  const data = type === 'drafted' ? stats.mostDrafted : stats.mostBanned;
  const color = type === 'drafted' ? '#90EE90' : '#FF6666';
  const label = type === 'drafted' ? 'Most Drafted' : 'Most Banned';

  return (
    <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
      {data ? (
        <>
          <div className="flex justify-center mb-0.5">
            {(() => {
              const hero = findHeroByName(data.name);
              return hero ? <HeroPortrait hero={hero} size="xs" banned={type === 'banned'} /> : <span className="text-sm">{type === 'drafted' ? '⚔️' : '🚫'}</span>;
            })()}
          </div>
          <p className="text-[10px] font-bold truncate" style={{ color }}>{data.name}</p>
          <p className="text-[10px] opacity-40">×{data.count}</p>
        </>
      ) : <p className="opacity-40 text-xs">—</p>}
      <p className="text-[10px] opacity-50">{label}</p>
    </div>
  );
}

/* -- Expanded detail panel ---------------------------------- */

function ExpandedDetails({ record, router }: { record: DraftRecord; router: ReturnType<typeof useRouter> }) {
  const t1Heroes = resolveHeroes(record.team1Picks);
  const t2Heroes = resolveHeroes(record.team2Picks);

  const analysis = useMemo(() => {
    if (t1Heroes.length === 0 || t2Heroes.length === 0) return null;
    const t1Comp = new TeamComposition(t1Heroes);
    const t2Comp = new TeamComposition(t2Heroes);
    return {
      team1: analyzeWinCondition(t1Comp, t2Comp),
      team2: analyzeWinCondition(t2Comp, t1Comp),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.timestamp]);

  return (
    <div className="mt-3 pt-3 text-xs space-y-3 animate-fade-slide-up" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
      {/* Full hero details */}
      <div className="grid grid-cols-2 gap-4">
        <HeroDetailRow names={record.team1Picks} teamLabel="Team 1 — Picks" teamColor="#4488FF" />
        <HeroDetailRow names={record.team2Picks} teamLabel="Team 2 — Picks" teamColor="#FF6666" />
      </div>

      {/* Bans */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold mb-1" style={{ color: '#4488FF' }}>Team 1 — Bans</p>
          <HeroRow names={record.team1Bans} banned />
        </div>
        <div>
          <p className="text-[10px] font-bold mb-1" style={{ color: '#FF6666' }}>Team 2 — Bans</p>
          <HeroRow names={record.team2Bans} banned />
        </div>
      </div>

      {/* Win condition analysis */}
      {analysis && (
        <div className="grid grid-cols-2 gap-4 p-2.5 rounded" style={{ background: 'rgba(20, 25, 45, 0.6)', border: '1px solid rgba(68,102,136,0.2)' }}>
          <div>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#4488FF' }}>Win Condition Analysis</p>
            <p className="text-[10px] opacity-70 mb-1">{analysis.team1.description}</p>
            <p className="text-[10px] opacity-50"><span className="font-semibold" style={{ color: '#90EE90' }}>Key Focus:</span> {analysis.team1.keyFocus}</p>
            <p className="text-[10px] opacity-50 mt-0.5"><span className="font-semibold" style={{ color: '#FF6666' }}>Counter:</span> {analysis.team1.enemyCounterStrategy}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#FF6666' }}>Win Condition Analysis</p>
            <p className="text-[10px] opacity-70 mb-1">{analysis.team2.description}</p>
            <p className="text-[10px] opacity-50"><span className="font-semibold" style={{ color: '#90EE90' }}>Key Focus:</span> {analysis.team2.keyFocus}</p>
            <p className="text-[10px] opacity-50 mt-0.5"><span className="font-semibold" style={{ color: '#FF6666' }}>Counter:</span> {analysis.team2.enemyCounterStrategy}</p>
          </div>
        </div>
      )}

      {/* Verdict */}
      <p className="text-[10px] opacity-60 italic">{record.verdict}</p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const mapIdx = ALL_MAPS.findIndex(m => m.name === record.mapName);
            router.push(`/draft?map=${mapIdx >= 0 ? mapIdx : 0}`);
          }}
          className="text-[11px] px-3 py-1.5 rounded font-semibold hover:bg-white/10 transition-colors"
          style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}
          title="Start a new draft on the same map"
        >🔄 Re-draft on Map</button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const text = [
              `HotsDrafter — ${record.mapName} (${formatDate(record.timestamp)})`,
              `Team 1: ${record.team1Picks.join(', ')} [${record.team1WinCondition}] (Score: ${record.team1Score})`,
              `Team 2: ${record.team2Picks.join(', ')} [${record.team2WinCondition}] (Score: ${record.team2Score})`,
              `Bans: ${record.team1Bans.join(', ')} | ${record.team2Bans.join(', ')}`,
              record.verdict,
            ].join('\n');
            navigator.clipboard.writeText(text);
          }}
          className="text-[11px] px-3 py-1.5 rounded font-semibold hover:bg-white/10 transition-colors"
          style={{ color: '#90EE90', border: '1px solid #90EE9033' }}
          title="Copy draft summary to clipboard"
        >📋 Copy Summary</button>
      </div>
    </div>
  );
}