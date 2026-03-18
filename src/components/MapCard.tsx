'use client';

import type { HotsMap } from '@/data/Map';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';

interface MapCardProps {
  map: HotsMap | null; // null = Random
  selected: boolean;
  onClick: () => void;
}

const MAP_ICONS: Record<string, string> = {
  'Alterac Pass': '🏔️ Camps ⚔️ Solo',
  'Battlefield of Eternity': '⚔️ Objective 🎯 Teamfight',
  'Braxis Holdout': '🌊 Waves 🎯 Objective',
  'Cursed Hollow': '🌐 Global ⚖️ Balanced',
  'Dragon Shire': '🌐 Global 🎯 Objective',
  'Garden of Terror': '🎯 Objective 🌊 Soak',
  'Infernal Shrines': '🌊 Waves ⚔️ AoE',
  'Sky Temple': '🌐 Global 🎯 Objective',
  'Tomb of the Spider Queen': '🎯 Pick 🌊 Waves',
  'Towers of Doom': '🌐 Global 🎯 Pick',
  'Volskaya Foundry': '🎯 Objective ⚔️ Teamfight',
};

function getTopHeroes(mapName: string): string[] {
  const db = IcyVeinsDatabase.getInstance();
  return db.getSTierHeroes(mapName).slice(0, 3);
}

export default function MapCard({ map, selected, onClick }: MapCardProps) {
  const isRandom = !map;
  const name = isRandom ? '🎲 Random' : map.name;
  const icons = isRandom ? 'Any map, any strategy!' : (MAP_ICONS[map.name] || '');
  const topHeroes = !isRandom ? getTopHeroes(map.name) : [];

  return (
    <button
      onClick={onClick}
      className="flex flex-col justify-center px-3 py-2 rounded transition-all text-left w-full hover:brightness-110 hover:-translate-y-[1px]"
      style={{
        minHeight: 72,
        background: selected ? 'rgba(0, 255, 255, 0.15)' : 'rgba(30, 40, 70, 0.7)',
        border: `2px solid ${selected ? '#00FFFF' : 'rgba(68, 102, 136, 0.5)'}`,
        color: isRandom ? '#FFD700' : '#FFFFFF',
      }}
      title={`${name}${icons ? ` - ${icons}` : ''}${topHeroes.length ? ` | S-tier: ${topHeroes.join(', ')}` : ''}`}
    >
      <span className="font-bold text-sm truncate">{name}</span>
      <span className="text-xs opacity-70 mt-0.5 truncate">{icons}</span>
      {topHeroes.length > 0 && (
        <span className="text-[9px] mt-0.5 truncate" style={{ color: '#FFD700', opacity: 0.7 }}>
          ★ {topHeroes.join(', ')}
        </span>
      )}
    </button>
  );
}
