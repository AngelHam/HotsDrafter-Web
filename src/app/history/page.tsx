'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadHistory, clearHistory, deleteDraft, type DraftRecord } from '@/data/DraftHistory';
import { findHeroByName, ALL_MAPS } from '@/data/HeroData';
import HeroPortrait from '@/components/HeroPortrait';

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

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<DraftRecord[]>([]);
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#BA55D3' }}>📜 Draft History {history.length > 0 && <span className="text-xs font-normal opacity-60 ml-1">({history.length} draft{history.length !== 1 ? 's' : ''})</span>}</h1>
        {history.length > 0 && (
          <button onClick={handleClear} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Delete all saved drafts">
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Stats Dashboard */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(() => {
              const mapCounts = new Map<string, number>();
              let totalScore = 0; let scoreCount = 0;
              for (const r of history) {
                mapCounts.set(r.mapName, (mapCounts.get(r.mapName) || 0) + 1);
                if (r.team1Score > 0) { totalScore += r.team1Score; scoreCount++; }
              }
              const topMap = [...mapCounts.entries()].sort((a, b) => b[1] - a[1])[0];
              const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
              return (
                <>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
                    <p className="text-lg font-bold" style={{ color: '#FFD700' }}>{history.length}</p>
                    <p className="text-[10px] opacity-50">Total Drafts</p>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
                    <p className="text-sm font-bold truncate" style={{ color: '#00FFFF' }}>{topMap ? topMap[0].split(' ')[0] : '-'}</p>
                    <p className="text-[10px] opacity-50">Favorite Map</p>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.3)' }}>
                    <p className="text-lg font-bold" style={{ color: avgScore >= 80 ? '#90EE90' : avgScore >= 50 ? '#FFD700' : '#FF6666' }}>{avgScore || '-'}</p>
                    <p className="text-[10px] opacity-50">Avg Score</p>
                  </div>
                </>
              );
            })()}
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
        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl opacity-40 mb-2">No drafts saved yet</p>
            <p className="text-sm opacity-30">Complete an Interactive Draft to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((record, i) => {
              const isExpanded = expandedIdx === i;
              return (
              <div key={i}
                className="p-4 rounded cursor-pointer transition-all hover:brightness-110"
                style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${isExpanded ? '#00FFFF44' : 'rgba(68,102,136,0.5)'}` }}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold" style={{ color: '#FFD700' }}>📍 {record.mapName}</span>
                      {record.firstPickTeam && record.firstPickTeam !== 1 && (
                        <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666', border: '1px solid #FF666622' }}>
                          T{record.firstPickTeam} 1st
                        </span>
                      )}
                      {record.team1Score > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(68,136,255,0.15)', color: '#4488FF', border: '1px solid #4488FF33' }}>
                          T1: {record.team1Score}
                        </span>
                      )}
                      {record.team2Score > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,102,102,0.15)', color: '#FF6666', border: '1px solid #FF666633' }}>
                          T2: {record.team2Score}
                        </span>
                      )}
                      <span className="text-xs opacity-50">{new Date(record.timestamp).toLocaleString()}</span>
                      <span className="text-[10px] ml-auto opacity-40">{isExpanded ? '▼' : '▶'} Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
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
