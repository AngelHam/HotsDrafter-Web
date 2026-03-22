'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_MAPS, ALL_HEROES } from '@/data/HeroData';
import { DraftSettings } from '@/data/DraftSettings';
import MapCard from '@/components/MapCard';
import HeroPortrait from '@/components/HeroPortrait';
import TutorialOverlay, { HOME_TUTORIAL_STEPS, HOME_STORAGE_KEY, shouldShowHomeTutorial } from '@/components/TutorialOverlay';
import { loadHistory } from '@/data/DraftHistory';
import type { Hero } from '@/data/Hero';

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347',
  Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#87CEEB',
};

function formatSpecialty(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const HERO_TIPS: Record<string, string> = {
  Tank: 'Initiate fights and protect your backline.',
  Healer: 'Keep your team alive through sustained fights.',
  DPS: 'Maximize damage output in teamfights.',
  Mage: 'Control zones and burst down priority targets.',
  Offlane: 'Win the solo lane and apply macro pressure.',
  Specialist: 'Create unique advantages with unconventional play.',
};

const HeroSpotlight = React.memo(function HeroSpotlight() {
  const [spotlightIdx, setSpotlightIdx] = useState(() => Math.floor(Math.random() * ALL_HEROES.length));
  const [spotlightVisible, setSpotlightVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlightVisible(false);
      setTimeout(() => {
        setSpotlightIdx(prev => (prev + 1) % ALL_HEROES.length);
        setSpotlightVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const spotlightHero = ALL_HEROES[spotlightIdx];

  return (
    <div className="flex items-center justify-center mb-6 w-full max-w-md px-2 sm:px-0">
      <div className="hero-spotlight-fade flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-xl w-full transition-all hover:brightness-110"
        style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${ROLE_COLORS[spotlightHero.role] || '#446688'}55`, opacity: spotlightVisible ? 1 : 0 }}>
        <HeroPortrait hero={spotlightHero} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base" style={{ color: '#FFD700' }}>{spotlightHero.nicknames[0]}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ROLE_COLORS[spotlightHero.role] || '#888'}33`, color: ROLE_COLORS[spotlightHero.role] || '#888', border: `1px solid ${ROLE_COLORS[spotlightHero.role] || '#888'}55` }}>
              {spotlightHero.role}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {spotlightHero.specialties.slice(0, 2).map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}>
                {formatSpecialty(s)}
              </span>
            ))}
          </div>
          <p className="text-[10px] opacity-50 mt-1.5 leading-snug">
            {HERO_TIPS[spotlightHero.role] || 'A versatile hero for any team composition.'}
          </p>
        </div>
      </div>
    </div>
  );
});

const FirstPickToggle = React.memo(function FirstPickToggle() {
  const [firstPick, setFirstPick] = useState(1);

  useEffect(() => {
    DraftSettings.load();
    setFirstPick(DraftSettings.firstPickTeam);
  }, []);

  const handleToggle = (team: number) => {
    setFirstPick(team);
    DraftSettings.firstPickTeam = team;
    DraftSettings.save();
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs opacity-60" style={{ color: '#A9A9A9' }}>First Pick:</span>
      <button onClick={() => handleToggle(1)}
        className="text-xs px-2.5 py-1 rounded-l transition-colors"
        style={{
          background: firstPick === 1 ? 'rgba(0,255,255,0.18)' : 'rgba(30,40,70,0.7)',
          color: firstPick === 1 ? '#00FFFF' : '#667788',
          border: `1px solid ${firstPick === 1 ? '#00FFFF88' : '#44668833'}`,
          borderRight: 'none',
          fontWeight: firstPick === 1 ? 600 : 400,
        }}>
        Team 1 (You) {firstPick === 1 ? '▸' : ''}
      </button>
      <button onClick={() => handleToggle(2)}
        className="text-xs px-2.5 py-1 rounded-r transition-colors"
        style={{
          background: firstPick === 2 ? 'rgba(0,255,255,0.18)' : 'rgba(30,40,70,0.7)',
          color: firstPick === 2 ? '#00FFFF' : '#667788',
          border: `1px solid ${firstPick === 2 ? '#00FFFF88' : '#44668833'}`,
          borderLeft: 'none',
          fontWeight: firstPick === 2 ? 600 : 400,
        }}>
        {firstPick === 2 ? '◂' : ''} Team 2 (Enemy)
      </button>
    </div>
  );
});

export default function StartupPage() {
  const router = useRouter();
  const [selectedMapIdx, setSelectedMapIdx] = useState(-1);
  const [useRandom, setUseRandom] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    DraftSettings.load();
    setSelectedMapIdx(DraftSettings.selectedMapIndex);
    setUseRandom(DraftSettings.useRandomMap);
    setDraftCount(loadHistory().length);
    const tutTimer = setTimeout(() => {
      if (shouldShowHomeTutorial()) setShowTutorial(true);
    }, 1000);
    return () => clearTimeout(tutTimer);
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
    <main className="min-h-screen flex flex-col items-center px-3 sm:px-4 py-6 sm:py-8 pb-20 page-enter" role="main" aria-label="HotsDrafter main menu">
      {showTutorial && <TutorialOverlay steps={HOME_TUTORIAL_STEPS} storageKey={HOME_STORAGE_KEY} onClose={() => setShowTutorial(false)} />}
      <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-wider mb-2 text-center" style={{ color: '#00FFFF' }}>
          HOTS DRAFTER
        </h1>
        <p className="text-center text-sm opacity-60 mb-4">
          Heroes of the Storm Draft Assistant
        </p>
        <HeroSpotlight />
      </div>

      <div className="animate-fade-slide-up w-full max-w-4xl" style={{ animationDelay: '100ms' }} data-tutorial-target="mapGrid">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#4488FF' }}>Select Map</h2>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          <div className="card-enter" style={{ animationDelay: '0ms' }}>
            <MapCard map={null} selected={useRandom} onClick={() => handleMapSelect(-1)} />
          </div>
          {ALL_MAPS.map((map, i) => (
            <div key={map.name} className="card-enter" style={{ animationDelay: `${(i + 1) * 50}ms` }}>
              <MapCard map={map} selected={!useRandom && selectedMapIdx === i} onClick={() => handleMapSelect(i)} />
            </div>
          ))}
        </div>
      </div>

      <div className="animate-fade-slide-up mt-6 sm:mt-8 flex flex-col items-center gap-3 w-full max-w-4xl" style={{ animationDelay: '350ms' }} data-tutorial-target="actionButtons">
        {/* First Pick Toggle + Interactive Draft */}
        <div className="flex flex-wrap items-center justify-center gap-3" title="Choose which team picks first in the draft">
          <FirstPickToggle />
          <ActionButton label="Interactive Draft" icon="⚔️" color="#00FFFF" onClick={() => router.push(`/draft?map=${getMapParam()}`)} primary
            tooltip={useRandom ? 'Start a draft with a random map' : `Draft on ${ALL_MAPS[selectedMapIdx]?.name}`} />
        </div>

        {/* Other action buttons */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 gap-2 justify-center w-full">
          <ActionButton label="Sample Draft" icon="🎲" color="#FFD700" onClick={() => router.push(`/sample?map=${getMapParam()}`)}
            tooltip="Watch an auto-generated random draft with analysis" />
          <ActionButton label="Team Builder" icon="🏗️" color="#90EE90" onClick={() => router.push('/team-builder')}
            tooltip="Manually build 5v5 teams and compare compositions" />
          <ActionButton label="Hero Compare" icon="⚖️" color="#87CEEB" onClick={() => router.push('/compare')}
            tooltip="Compare two heroes side by side" />
          <ActionButton label="Tier List" icon="🏆" color="#FFD700" onClick={() => router.push('/tier-list')}
            tooltip="View hero rankings across all maps" />
          <ActionButton label="Draft History" icon="📜" color="#BA55D3" onClick={() => router.push('/history')}
            tooltip="View your previously completed drafts" />
        </div>
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

      <div className="animate-fade-slide-up mt-8 grid grid-cols-3 sm:grid-cols-3 gap-2 justify-items-center max-w-md" style={{ animationDelay: '480ms' }}>
        {['Smart Suggestions', 'Ban Predictions', 'Counter Warnings', 'Win Conditions', 'Tier Lists', 'Coaching Tips'].map((f, i) => (
          <span key={f} className="animate-bounce-in feature-pill-shimmer text-xs px-3 py-1.5 rounded-full cursor-default transition-all duration-200 hover:scale-110 text-center"
            style={{ color: '#FFD700', border: '1px solid #FFD70025', animationDelay: `${480 + i * 60}ms` }}
            onMouseEnter={e => { (e.target as HTMLElement).style.boxShadow = '0 0 10px 2px rgba(255,215,0,0.2)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.boxShadow = 'none'; }}
          >{f}</span>
        ))}
      </div>

      <div className="animate-fade-slide-up mt-6 text-xs opacity-40 text-center" style={{ animationDelay: '500ms' }}>
        <p>HotsDrafter v3.2 — Data from Icy Veins</p>
        <p className="mt-1">{ALL_MAPS.length} Maps • {ALL_HEROES.length} Heroes • 8 Win Conditions</p>
        {draftCount > 0 && <p className="mt-1 opacity-50">📊 {draftCount} draft{draftCount !== 1 ? 's' : ''} completed</p>}
      </div>
    </main>
  );
}

function ActionButton({ label, icon, color, onClick, primary, tooltip, accent }: {
  label: string; icon: string; color: string; onClick: () => void; primary?: boolean; tooltip?: string; accent?: string;
}) {
  const borderColor = accent || color;
  return (
    <button onClick={onClick} className="action-btn px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm"
      style={{ background: primary ? `${color}22` : 'rgba(30, 40, 70, 0.7)', border: `2px solid ${borderColor}`, color, minWidth: 'auto', '--btn-glow': `${borderColor}40` } as React.CSSProperties}
      title={tooltip || label}>
      {icon} {label}
    </button>
  );
}
