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

// Map accent colors by map type
const MAP_ACCENT_COLORS: Record<string, string> = {
  'Battlefield of Eternity': '#FF6347',  // teamfight-heavy
  'Volskaya Foundry': '#FF6347',         // teamfight-heavy
  'Braxis Holdout': '#FF6347',           // teamfight-heavy
  'Infernal Shrines': '#FFA500',         // hybrid
  'Cursed Hollow': '#90EE90',            // macro/global
  'Dragon Shire': '#90EE90',             // macro/global
  'Sky Temple': '#90EE90',               // macro/global
  'Garden of Terror': '#87CEEB',         // soak/objective
  'Tomb of the Spider Queen': '#BA55D3', // pick/skirmish
  'Towers of Doom': '#BA55D3',           // pick/global
  'Alterac Pass': '#FFA500',             // camps/solo
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
  const accentColor = !isRandom ? MAP_ACCENT_COLORS[map.name] || 'rgba(68,102,136,0.5)' : undefined;

  return (
    <button
      onClick={onClick}
      className={`map-card-hover flex flex-col justify-center px-3 py-2 rounded text-left w-full hover:-translate-y-[2px] ${!isRandom ? 'map-card-accent' : ''}`}
      style={{
        minHeight: 72,
        background: selected ? 'rgba(0, 255, 255, 0.15)' : 'rgba(30, 40, 70, 0.7)',
        border: `2px solid ${selected ? '#00FFFF' : 'rgba(68, 102, 136, 0.5)'}`,
        color: isRandom ? '#FFD700' : '#FFFFFF',
        '--map-accent-color': accentColor,
      } as React.CSSProperties}
      title={`${name}${icons ? ` - ${icons}` : ''}${topHeroes.length ? ` | S-tier: ${topHeroes.join(', ')}` : ''}`}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm truncate block">{name}</span>
          <span className="text-xs opacity-70 mt-0.5 truncate block">{icons}</span>
          {topHeroes.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px]" style={{ color: '#FFD700', opacity: 0.8 }}>★</span>
              {topHeroes.map((hero, i) => (
                <span key={hero} className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.15)' }}>
                  {hero}
                </span>
              ))}
            </div>
          )}
        </div>
        {selected && <span className="text-sm flex-shrink-0" style={{ color: '#00FFFF' }}>✓</span>}
      </div>
    </button>
  );
}
