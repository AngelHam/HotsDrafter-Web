'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_MAPS, ALL_HEROES } from '@/data/HeroData';
import { DraftSettings } from '@/data/DraftSettings';
import MapCard from '@/components/MapCard';
import HeroPortrait from '@/components/HeroPortrait';
import FirstRunTutorial, { shouldShowTutorial } from '@/components/FirstRunTutorial';
import { loadHistory } from '@/data/DraftHistory';

export default function StartupPage() {
  const router = useRouter();
  const [selectedMapIdx, setSelectedMapIdx] = useState(-1);
  const [useRandom, setUseRandom] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [spotlightHero, setSpotlightHero] = useState(ALL_HEROES[0]);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    DraftSettings.load();
    setSelectedMapIdx(DraftSettings.selectedMapIndex);
    setUseRandom(DraftSettings.useRandomMap);
    if (shouldShowTutorial()) setShowTutorial(true);
    setSpotlightHero(ALL_HEROES[Math.floor(Math.random() * ALL_HEROES.length)]);
    setDraftCount(loadHistory().length);
  }, []);

  const handleMapSelect = (idx: number) => {
    if (idx === -1) {
      setUseRandom(true);
      setSelectedMapIdx(-1);
    } else {
      setUseRandom(false);
      setSelectedMapIdx(idx);
    }
    DraftSettings.useRandomMap = idx === -1;
    DraftSettings.selectedMapIndex = idx;
    DraftSettings.save();
  };

  const getMapParam = () => {
    if (useRandom || selectedMapIdx < 0) {
      return Math.floor(Math.random() * ALL_MAPS.length).toString();
    }
    return selectedMapIdx.toString();
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8" role="main" aria-label="HotsDrafter main menu">
      {showTutorial && <FirstRunTutorial onClose={() => setShowTutorial(false)} />}
      <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-4xl font-bold tracking-wider mb-2 text-center" style={{ color: '#00FFFF' }}>
          HOTS DRAFTER
        </h1>
        <p className="text-center text-sm opacity-60 mb-4">
          Heroes of the Storm Draft Assistant
        </p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <HeroPortrait hero={spotlightHero} size="sm" />
          <span className="text-xs opacity-60">Hero Spotlight: <span style={{ color: '#FFD700' }}>{spotlightHero.nicknames[0]}</span> — {spotlightHero.role}</span>
        </div>
      </div>

      <div className="animate-fade-slide-up w-full max-w-4xl" style={{ animationDelay: '100ms' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#4488FF' }}>Select Map</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          <MapCard map={null} selected={useRandom} onClick={() => handleMapSelect(-1)} />
          {ALL_MAPS.map((map, i) => (
            <MapCard key={map.name} map={map} selected={!useRandom && selectedMapIdx === i} onClick={() => handleMapSelect(i)} />
          ))}
        </div>
      </div>

      <div className="animate-fade-slide-up mt-8 flex flex-wrap gap-2 justify-center w-full max-w-4xl" style={{ animationDelay: '350ms' }}>
        <ActionButton label="Interactive Draft" icon="⚔️" color="#00FFFF" onClick={() => router.push(`/draft?map=${getMapParam()}`)} primary
          tooltip={useRandom ? 'Start a draft with a random map' : `Draft on ${ALL_MAPS[selectedMapIdx]?.name}`} />
        <ActionButton label="Sample Draft" icon="🎲" color="#FFD700" onClick={() => router.push(`/sample?map=${getMapParam()}`)}
          tooltip="Watch an AI-generated random draft with analysis" />
        <ActionButton label="Team Builder" icon="🏗️" color="#90EE90" onClick={() => router.push('/team-builder')}
          tooltip="Manually build 5v5 teams and compare compositions" />
        <ActionButton label="Hero Compare" icon="⚖️" color="#87CEEB" onClick={() => router.push('/compare')}
          tooltip="Compare two heroes side by side" />
        <ActionButton label="Tier List" icon="🏆" color="#FFD700" onClick={() => router.push('/tier-list')}
          tooltip="View hero rankings across all maps" />
        <ActionButton label="Draft History" icon="📜" color="#BA55D3" onClick={() => router.push('/history')}
          tooltip="View your previously completed drafts" />
        <ActionButton label="Settings" icon="⚙️" color="#A9A9A9" onClick={() => router.push('/settings')}
          tooltip="Configure suggestions, analysis mode, and shortcuts" />
      </div>

      {/* Quick Actions */}
      {draftCount > 0 && (
        <div className="animate-fade-slide-up mt-3 flex gap-2 justify-center" style={{ animationDelay: '370ms' }}>
          <button onClick={() => { const m = Math.floor(Math.random() * ALL_MAPS.length); router.push(`/draft?map=${m}`); }}
            className="text-[10px] px-3 py-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#FFD700', border: '1px solid #FFD70033' }}
            title="Jump straight into a random draft">
            ⚡ Quick Random Draft
          </button>
          {(() => {
            const last = loadHistory()[0];
            if (!last) return null;
            const mi = ALL_MAPS.findIndex(m => m.name === last.mapName);
            return (
              <button onClick={() => router.push(`/draft?map=${mi >= 0 ? mi : 0}`)}
                className="text-[10px] px-3 py-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#BA55D3', border: '1px solid #BA55D333' }}
                title={`Re-draft on ${last.mapName}`}>
                🔄 Re-draft {last.mapName.split(' ')[0]}
              </button>
            );
          })()}
        </div>
      )}

      {/* Selected Map Preview */}
      {!useRandom && selectedMapIdx >= 0 && ALL_MAPS[selectedMapIdx] && (
        <div className="animate-fade-slide-up mt-4 text-center text-xs" style={{ animationDelay: '400ms' }}>
          <span className="px-3 py-1 rounded" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00FFFF33', color: '#00FFFF' }}>
            🗺️ Selected: <strong>{ALL_MAPS[selectedMapIdx].name}</strong>
          </span>
        </div>
      )}

      {/* Last Draft Quick Summary */}
      {draftCount > 0 && (() => {
        const last = loadHistory()[0];
        if (!last) return null;
        return (
          <div className="animate-fade-slide-up mt-4 text-center" style={{ animationDelay: '450ms' }}>
            <span className="text-[10px] px-3 py-1 rounded opacity-60" style={{ background: 'rgba(186,85,211,0.1)', border: '1px solid #BA55D333', color: '#BA55D3' }}>
              Last draft: {last.mapName} — T1: {last.team1Picks.slice(0, 3).join(', ')} vs T2: {last.team2Picks.slice(0, 3).join(', ')}
            </span>
          </div>
        );
      })()}

      <div className="animate-fade-slide-up mt-12 text-xs opacity-40 text-center" style={{ animationDelay: '500ms' }}>
        <p>HotsDrafter v2 Web — Data from Icy Veins</p>
        <p className="mt-1">{ALL_MAPS.length} Maps • {ALL_HEROES.length} Heroes • 8 Win Conditions</p>
        <p className="mt-1 opacity-60">Scoring: Synergy 30% + Counter 25% + Map 20% + Role 15% + Win Condition 10%</p>
        {draftCount > 0 && <p className="mt-1 opacity-50">📊 {draftCount} draft{draftCount !== 1 ? 's' : ''} completed</p>}
      </div>
    </main>
  );
}

function ActionButton({ label, icon, color, onClick, primary, tooltip }: {
  label: string; icon: string; color: string; onClick: () => void; primary?: boolean; tooltip?: string;
}) {
  return (
    <button onClick={onClick} className="px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
      style={{ background: primary ? `${color}22` : 'rgba(30, 40, 70, 0.7)', border: `2px solid ${color}`, color, minWidth: 155 }}
      title={tooltip || label}>
      {icon} {label}
    </button>
  );
}
