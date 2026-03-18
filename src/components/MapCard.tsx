'use client';

import type { HotsMap } from '@/data/Map';

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

export default function MapCard({ map, selected, onClick }: MapCardProps) {
  const isRandom = !map;
  const name = isRandom ? '🎲 Random' : map.name;
  const icons = isRandom ? 'Any map, any strategy!' : (MAP_ICONS[map.name] || '');

  return (
    <button
      onClick={onClick}
      className="flex flex-col justify-center px-3 py-2 rounded transition-all text-left w-full hover:brightness-110"
      style={{
        minHeight: 72,
        background: selected ? 'rgba(0, 255, 255, 0.15)' : 'rgba(30, 40, 70, 0.7)',
        border: `2px solid ${selected ? '#00FFFF' : 'rgba(68, 102, 136, 0.5)'}`,
        color: isRandom ? '#FFD700' : '#FFFFFF',
      }}
    >
      <span className="font-bold text-sm truncate">{name}</span>
      <span className="text-xs opacity-70 mt-1 truncate">{icons}</span>
    </button>
  );
}
