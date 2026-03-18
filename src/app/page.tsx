'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_MAPS } from '@/data/HeroData';
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

      <div className="animate-fade-slide-up mt-8 flex flex-wrap gap-3 justify-center" style={{ animationDelay: '350ms' }}>
        <ActionButton label="Interactive Draft" icon="⚔️" color="#00FFFF" onClick={() => router.push(`/draft?map=${getMapParam()}`)} primary />
        <ActionButton label="Sample Draft" icon="🎲" color="#FFD700" onClick={() => router.push(`/sample?map=${getMapParam()}`)} />
        <ActionButton label="Team Builder" icon="🏗️" color="#90EE90" onClick={() => router.push('/team-builder')} />
        <ActionButton label="Draft History" icon="📜" color="#BA55D3" onClick={() => router.push('/history')} />
        <ActionButton label="Settings" icon="⚙️" color="#A9A9A9" onClick={() => router.push('/settings')} />
      </div>

      <div className="animate-fade-slide-up mt-12 text-xs opacity-40 text-center" style={{ animationDelay: '500ms' }}>
        <p>HotsDrafter v2 Web — Data from Icy Veins</p>
        <p className="mt-1">{ALL_MAPS.length} Maps • 89 Heroes • 8 Win Conditions</p>
      </div>
    </main>
  );
}

function ActionButton({ label, icon, color, onClick, primary }: {
  label: string; icon: string; color: string; onClick: () => void; primary?: boolean;
}) {
  return (
    <button onClick={onClick} className="px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
      style={{ background: primary ? `${color}22` : 'rgba(30, 40, 70, 0.7)', border: `2px solid ${color}`, color, minWidth: 160 }}>
      {icon} {label}
    </button>
  );
}
