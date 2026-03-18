'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadHistory, clearHistory, deleteDraft, type DraftRecord } from '@/data/DraftHistory';
import { findHeroByName } from '@/data/HeroData';
import HeroPortrait from '@/components/HeroPortrait';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<DraftRecord[]>([]);

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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}>← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#BA55D3' }}>📜 Draft History</h1>
        {history.length > 0 && (
          <button onClick={handleClear} className="text-sm px-3 py-1 rounded" style={{ color: '#FF6666', border: '1px solid #FF666633' }}>
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl opacity-40 mb-2">No drafts saved yet</p>
            <p className="text-sm opacity-30">Complete an Interactive Draft to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record, i) => (
              <div key={i} className="p-4 rounded flex items-start gap-4" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold" style={{ color: '#FFD700' }}>📍 {record.mapName}</span>
                    <span className="text-xs opacity-50">{new Date(record.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span style={{ color: '#4488FF' }}>Team 1:</span>
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {record.team1Picks.map(name => {
                          const hero = findHeroByName(name);
                          return hero ? <HeroPortrait key={name} hero={hero} size="sm" /> : <span key={name} className="text-xs">{name}</span>;
                        })}
                      </div>
                      <span className="opacity-50">Bans: {record.team1Bans.join(', ')}</span>
                      <br />
                      <span style={{ color: '#00FFFF' }}>{record.team1WinCondition}</span>
                    </div>
                    <div>
                      <span style={{ color: '#FF6666' }}>Team 2:</span>
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {record.team2Picks.map(name => {
                          const hero = findHeroByName(name);
                          return hero ? <HeroPortrait key={name} hero={hero} size="sm" /> : <span key={name} className="text-xs">{name}</span>;
                        })}
                      </div>
                      <span className="opacity-50">Bans: {record.team2Bans.join(', ')}</span>
                      <br />
                      <span style={{ color: '#00FFFF' }}>{record.team2WinCondition}</span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 opacity-70">{record.verdict}</p>
                </div>
                <button onClick={() => handleDelete(i)} className="text-xs px-2 py-1 rounded" style={{ color: '#FF6666', border: '1px solid #FF666633' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
