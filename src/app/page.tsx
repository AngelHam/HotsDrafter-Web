'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_MAPS, ALL_HEROES } from '@/data/HeroData';
import { DraftSettings } from '@/data/DraftSettings';
import MapCard from '@/components/MapCard';
import FirstRunTutorial, { shouldShowTutorial } from '@/components/FirstRunTutorial';

export default function StartupPage() {
  const router = useRouter();
  const [selectedMapIdx, setSelectedMapIdx] = useState(-1);
  const [useRandom, setUseRandom] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    DraftSettings.load();
    setSelectedMapIdx(DraftSettings.selectedMapIndex);
    setUseRandom(DraftSettings.useRandomMap);
    if (shouldShowTutorial()) setShowTutorial(true);
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
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {showTutorial && <FirstRunTutorial onClose={() => setShowTutorial(false)} />}
      <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-4xl font-bold tracking-wider mb-2 text-center" style={{ color: '#00FFFF' }}>
          HOTS DRAFTER
        </h1>
        <p className="text-center text-sm opacity-60 mb-8">
          Heroes of the Storm Draft Assistant
        </p>
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

      <div className="animate-fade-slide-up mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 w-full max-w-4xl" style={{ animationDelay: '350ms' }}>
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

      {/* Selected Map Preview */}
      {!useRandom && selectedMapIdx >= 0 && ALL_MAPS[selectedMapIdx] && (
        <div className="animate-fade-slide-up mt-4 text-center text-xs" style={{ animationDelay: '400ms' }}>
          <span className="px-3 py-1 rounded" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00FFFF33', color: '#00FFFF' }}>
            🗺️ Selected: <strong>{ALL_MAPS[selectedMapIdx].name}</strong>
          </span>
        </div>
      )}

      <div className="animate-fade-slide-up mt-12 text-xs opacity-40 text-center" style={{ animationDelay: '500ms' }}>
        <p>HotsDrafter v2 Web — Data from Icy Veins</p>
        <p className="mt-1">{ALL_MAPS.length} Maps • {ALL_HEROES.length} Heroes • 8 Win Conditions</p>
        <p className="mt-1 opacity-60">Scoring: Synergy 30% + Counter 25% + Map 20% + Role 15% + Win Condition 10%</p>
      </div>
    </main>
  );
}

function ActionButton({ label, icon, color, onClick, primary, tooltip }: {
  label: string; icon: string; color: string; onClick: () => void; primary?: boolean; tooltip?: string;
}) {
  return (
    <button onClick={onClick} className="px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 w-full"
      style={{ background: primary ? `${color}22` : 'rgba(30, 40, 70, 0.7)', border: `2px solid ${color}`, color }}
      title={tooltip || label}>
      {icon} {label}
    </button>
  );
}
