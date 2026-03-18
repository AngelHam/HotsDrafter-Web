'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition } from '@/data/WinConditionAnalyzer';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import type { Hero } from '@/data/Hero';

export default function TeamBuilderPage() {
  const router = useRouter();
  const [team1, setTeam1] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [team2, setTeam2] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [mapIdx, setMapIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState<{ team: number; slot: number } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

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
  };

  const clearSlot = (team: number, slot: number) => {
    if (team === 1) { const c = [...team1]; c[slot] = null; setTeam1(c); }
    else { const c = [...team2]; c[slot] = null; setTeam2(c); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#90EE90' }}>🏗️ Team Builder</h1>
        <select value={mapIdx} onChange={e => setMapIdx(Number(e.target.value))}
          className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
          {ALL_MAPS.map((m, i) => <option key={m.name} value={i}>{m.name}</option>)}
        </select>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Team 1 */}
        <TeamSlots label="TEAM 1" color="#4488FF" slots={team1}
          onSlotClick={(i) => setPickerOpen({ team: 1, slot: i })}
          onClear={(i) => clearSlot(1, i)} />

        {/* Center Analysis */}
        <div className="flex-1 flex flex-col gap-4">
          {analysis ? (
            <>
              <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="font-bold mb-2" style={{ color: '#00FFFF' }}>Composition Analysis</h3>
                <p className="text-sm mb-1"><span style={{ color: '#4488FF' }}>Team 1:</span> {winConditionToString(analysis.team1.primary)}</p>
                <p className="text-xs opacity-80 mb-3">{analysis.team1.keyFocus}</p>
                <p className="text-sm mb-1"><span style={{ color: '#FF6666' }}>Team 2:</span> {winConditionToString(analysis.team2.primary)}</p>
                <p className="text-xs opacity-80">{analysis.team2.keyFocus}</p>
              </div>
            </>
          ) : (
            <div className="p-4 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <p className="text-sm opacity-60">Add 2+ heroes to each team for analysis</p>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <TeamSlots label="TEAM 2" color="#FF6666" slots={team2}
          onSlotClick={(i) => setPickerOpen({ team: 2, slot: i })}
          onClear={(i) => clearSlot(2, i)} />
      </div>

      {/* Hero Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-lg p-4 max-w-3xl max-h-[80vh] overflow-auto" style={{ background: '#1a1a2e', border: '2px solid #00FFFF' }}>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold" style={{ color: '#00FFFF' }}>Select Hero</h3>
              <button onClick={() => { setPickerOpen(null); setPickerSearch(''); }} className="text-sm px-2 py-1" style={{ color: '#FF6666' }} title="Close hero picker">✕ Close</button>
            </div>
            <input
              type="text"
              placeholder="🔍 Search heroes..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              className="w-full px-3 py-1.5 mb-3 rounded text-sm focus:outline-none"
              style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
              autoFocus
            />
            {['Tank', 'Healer', 'Offlane', 'Mage', 'DPS', 'Specialist'].map(role => {
              const roleHeroes = ALL_HEROES
                .filter(h => h.role === role && !pickedNames.has(h.name))
                .filter(h => !pickerSearch || h.nicknames.some(n => n.toLowerCase().includes(pickerSearch.toLowerCase())));
              if (roleHeroes.length === 0) return null;
              return (
                <div key={role} className="mb-3">
                  <h4 className="text-xs font-bold mb-1 opacity-60">{role}s</h4>
                  <div className="flex flex-wrap gap-1">
                    {roleHeroes.map(hero => (
                      <HeroPortrait key={hero.name} hero={hero} size="md" showName onClick={() => { handlePick(hero); setPickerSearch(''); }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSlots({ label, color, slots, onSlotClick, onClear }: {
  label: string; color: string; slots: (Hero | null)[];
  onSlotClick: (i: number) => void; onClear: (i: number) => void;
}) {
  return (
    <div className="w-56 flex-shrink-0">
      <h2 className="font-bold mb-3" style={{ color }}>{label}</h2>
      <div className="flex flex-col gap-2">
        {slots.map((hero, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${hero ? color : 'rgba(68,102,136,0.3)'}` }}
            onClick={() => hero ? undefined : onSlotClick(i)}>
            {hero ? (
              <>
                <HeroPortrait hero={hero} size="sm" selected />
                <span className="text-sm flex-1">{hero.nicknames[0]}</span>
                <button onClick={(e) => { e.stopPropagation(); onClear(i); }} className="text-xs px-1" style={{ color: '#FF6666' }} title={`Clear slot ${i + 1}`}>✕</button>
              </>
            ) : (
              <span className="text-sm opacity-40 cursor-pointer" onClick={() => onSlotClick(i)}>+ Pick {i + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
