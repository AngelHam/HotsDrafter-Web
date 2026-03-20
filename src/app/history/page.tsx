'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadHistory, saveDraft, clearHistory, deleteDraft, type DraftRecord } from '@/data/DraftHistory';
import { findHeroByName, ALL_MAPS } from '@/data/HeroData';
import HeroPortrait from '@/components/HeroPortrait';

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

function ScoreBar({ t1, t2 }: { t1: number; t2: number }) {
  const total = t1 + t2 || 1;
  const pct1 = Math.round((t1 / total) * 100);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[10px] font-bold w-7 text-right" style={{ color: '#4488FF' }}>{t1}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct1}%`, background: `linear-gradient(90deg, #4488FF, ${pct1 > 50 ? '#90EE90' : '#FF6666'})` }} />
      </div>
      <span className="text-[10px] font-bold w-7" style={{ color: '#FF6666' }}>{t2}</span>
    </div>
  );
}

function HeroNameStrip({ names, banned = false }: { names: string[]; banned?: boolean }) {
  if (names.length === 0) {
    return <span className="opacity-40">None</span>;
  }

  return (
    <div className="flex gap-0.5 mt-1 flex-wrap">
      {names.map((name, idx) => {
        const hero = findHeroByName(name);
        if (!hero) {
          return (
            <span key={`${name}-${idx}`} className="text-xs px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {name}
            </span>
          );
        }

        return <HeroPortrait key={`${name}-${idx}`} hero={hero} size="sm" banned={banned} />;
      })}
    </div>
  );
}

const MAP_ICONS: Record<string, string> = {
  'Alterac Pass': '🏔️', 'Battlefield of Eternity': '😈', 'Braxis Holdout': '🧬',
  'Cursed Hollow': '💀', 'Dragon Shire': '🐉', 'Garden of Terror': '🌿',
  'Infernal Shrines': '🔥', 'Sky Temple': '🏛️', 'Tomb of the Spider Queen': '🕷️',
  'Towers of Doom': '🏰', 'Volskaya Foundry': '⚙️',
};

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<DraftRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [wcFilter, setWcFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'map' | 'score'>('newest');

  const filteredHistory = (() => {
    let result = mapFilter === 'all' ? history : history.filter(r => r.mapName === mapFilter);
    if (wcFilter !== 'all') result = result.filter(r => r.team1WinCondition === wcFilter || r.team2WinCondition === wcFilter);
    if (sortBy === 'oldest') result = [...result].reverse();
    else if (sortBy === 'map') result = [...result].sort((a, b) => a.mapName.localeCompare(b.mapName));
    else if (sortBy === 'score') result = [...result].sort((a, b) => (b.team1Score + b.team2Score) - (a.team1Score + a.team2Score));
    return result;
  })();

  useEffect(() => {
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleDelete = (idx: number) => {
    deleteDraft(idx);
    setHistory(loadHistory());
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const handleLoadSamples = () => {
    for (const draft of SAMPLE_DRAFTS) saveDraft(draft);
    setHistory(loadHistory());
  };

  // Compute stats
  const stats = (() => {
    if (history.length === 0) return null;
    const mapCounts = new Map<string, number>();
    let totalT1 = 0, totalT2 = 0, scoreCount = 0;
    const wcCounts = new Map<string, number>();
    for (const r of history) {
      mapCounts.set(r.mapName, (mapCounts.get(r.mapName) || 0) + 1);
      if (r.team1Score > 0) { totalT1 += r.team1Score; scoreCount++; }
      if (r.team2Score > 0) { totalT2 += r.team2Score; }
      if (r.team1WinCondition) wcCounts.set(r.team1WinCondition, (wcCounts.get(r.team1WinCondition) || 0) + 1);
      if (r.team2WinCondition) wcCounts.set(r.team2WinCondition, (wcCounts.get(r.team2WinCondition) || 0) + 1);
    }
    const topMap = [...mapCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topWc = [...wcCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const avgT1 = scoreCount > 0 ? Math.round(totalT1 / scoreCount) : 0;
    const avgT2 = scoreCount > 0 ? Math.round(totalT2 / scoreCount) : 0;
    return { topMap, topWc, avgT1, avgT2, scoreCount };
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#BA55D3' }}>📜 Draft History {history.length > 0 && <span className="text-xs font-normal opacity-60 ml-1">({history.length} draft{history.length !== 1 ? 's' : ''})</span>}</h1>
        {history.length > 0 ? (
          <button onClick={handleClear} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Delete all saved drafts">
            Clear All
          </button>
        ) : <div className="w-16" />}
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-xl font-bold" style={{ color: '#FFD700' }}>{history.length}</p>
              <p className="text-[10px] opacity-50">Total Drafts</p>
            </div>
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-xs mb-0.5">{MAP_ICONS[stats.topMap?.[0]] || '🗺️'}</p>
              <p className="text-sm font-bold truncate" style={{ color: '#00FFFF' }}>{stats.topMap ? stats.topMap[0] : '-'}</p>
              <p className="text-[10px] opacity-50">Most Picked Map</p>
            </div>
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-lg font-bold" style={{ color: stats.avgT1 >= 80 ? '#90EE90' : stats.avgT1 >= 50 ? '#FFD700' : '#FF6666' }}>{stats.avgT1 || '-'}</p>
              <p className="text-[10px] opacity-50">Avg T1 Score</p>
            </div>
            <div className="p-2.5 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-sm font-bold truncate" style={{ color: '#BA55D3' }}>{stats.topWc ? stats.topWc[0] : '-'}</p>
              <p className="text-[10px] opacity-50">Top Strategy</p>
            </div>
          </div>
        )}
        {history.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <select value={mapFilter} onChange={e => setMapFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="all">All Maps</option>
              {[...new Set(history.map(r => r.mapName))].sort().map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="text-[10px] opacity-40">{filteredHistory.length} of {history.length}</span>
            <select value={wcFilter} onChange={e => setWcFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#00FFFF', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="all">All Strategies</option>
              {[...new Set(history.flatMap(r => [r.team1WinCondition, r.team2WinCondition]).filter(Boolean))].sort().map(wc => (
                <option key={wc} value={wc}>{wc}</option>
              ))}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs px-2 py-1 rounded ml-auto" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#00FFFF', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="map">By Map</option>
              <option value="score">By Score</option>
            </select>
          </div>
        )}
        {!loaded ? (
          <div className="text-center py-20">
            <p className="text-sm opacity-40 animate-pulse">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 animate-fade-slide-up">
            <span className="text-5xl block mb-4">📜</span>
            <p className="text-xl font-semibold mb-2" style={{ color: '#BA55D3' }}>No drafts saved yet</p>
            <p className="text-sm opacity-40 mb-6">Complete an Interactive Draft to see it here</p>
            <div className="flex gap-3 justify-center mb-8">
              <button onClick={() => router.push('/')} className="text-sm px-5 py-2.5 rounded font-semibold transition-all hover:scale-105 hover:brightness-110"
                style={{ color: '#00FFFF', border: '2px solid #00FFFF44', background: 'rgba(0,255,255,0.05)' }}>
                ⚔️ Start Your First Draft
              </button>
              <button onClick={handleLoadSamples} className="text-sm px-5 py-2.5 rounded font-semibold transition-all hover:scale-105 hover:brightness-110"
                style={{ color: '#FFD700', border: '2px solid #FFD70044', background: 'rgba(255,215,0,0.05)' }}>
                📦 Load Sample Data
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">📊</span>
                <p className="text-[10px] opacity-40">Track your scores and stats</p>
              </div>
              <div className="p-3 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">🗺️</span>
                <p className="text-[10px] opacity-40">Filter by map and strategy</p>
              </div>
              <div className="p-3 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.2)' }}>
                <span className="text-lg block mb-1">🔄</span>
                <p className="text-[10px] opacity-40">Re-draft past games</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((record, i) => {
              const isExpanded = expandedIdx === i;
              const mapIcon = MAP_ICONS[record.mapName] || '🗺️';
              const hasScores = record.team1Score > 0 || record.team2Score > 0;
              return (
              <div key={i}
                className="p-4 rounded cursor-pointer transition-all hover:brightness-110"
                style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${isExpanded ? '#00FFFF44' : 'rgba(68,102,136,0.5)'}` }}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold" style={{ color: '#FFD700' }}>{mapIcon} {record.mapName}</span>
                      {record.firstPickTeam && record.firstPickTeam !== 1 && (
                        <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666', border: '1px solid #FF666622' }}>
                          T{record.firstPickTeam} 1st
                        </span>
                      )}
                      <span className="text-xs opacity-50 ml-auto">{new Date(record.timestamp).toLocaleString()}</span>
                      <span className="text-[10px] opacity-40">{isExpanded ? '▼' : '▶'}</span>
                    </div>

                    {/* Score comparison bar */}
                    {hasScores && <ScoreBar t1={record.team1Score} t2={record.team2Score} />}

                    <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                      <div>
                        <span style={{ color: '#4488FF' }}>Team 1:</span>
                        <HeroNameStrip names={record.team1Picks} />
                      </div>
                      <div>
                        <span style={{ color: '#FF6666' }}>Team 2:</span>
                        <HeroNameStrip names={record.team2Picks} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 text-xs space-y-2 animate-fade-slide-up" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="opacity-50">Bans:</span>
                            <HeroNameStrip names={record.team1Bans} banned />
                            <p className="mt-1"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid #00FFFF22' }}>{record.team1WinCondition}</span></p>
                          </div>
                          <div>
                            <span className="opacity-50">Bans:</span>
                            <HeroNameStrip names={record.team2Bans} banned />
                            <p className="mt-1"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid #00FFFF22' }}>{record.team2WinCondition}</span></p>
                          </div>
                        </div>
                        <p className="opacity-70">{record.verdict}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const mapIdx = ALL_MAPS.findIndex(m => m.name === record.mapName);
                              router.push(`/draft?map=${mapIdx >= 0 ? mapIdx : 0}`);
                            }}
                            className="text-[10px] px-2 py-1 rounded hover:bg-white/10"
                            style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}
                            title="Start a new draft on the same map"
                          >
                            🔄 Re-draft
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = [
                                `HotsDrafter — ${record.mapName}`,
                                `Team 1: ${record.team1Picks.join(', ')} (${record.team1WinCondition})`,
                                `Team 2: ${record.team2Picks.join(', ')} (${record.team2WinCondition})`,
                                `Bans: ${record.team1Bans.join(', ')} | ${record.team2Bans.join(', ')}`,
                                record.verdict,
                              ].join('\n');
                              navigator.clipboard.writeText(text);
                            }}
                            className="text-[10px] px-2 py-1 rounded hover:bg-white/10"
                            style={{ color: '#90EE90', border: '1px solid #90EE9033' }}
                            title="Copy draft summary to clipboard"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(i); }} className="text-xs px-2 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Delete this draft record">
                    ✕
                  </button>
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
