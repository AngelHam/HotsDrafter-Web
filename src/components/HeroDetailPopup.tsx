'use client';

import type { Hero } from '@/data/Hero';
import { specialtyToString } from '@/data/Specialty';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import HeroPortrait from './HeroPortrait';

interface HeroDetailPopupProps {
  hero: Hero;
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

export default function HeroDetailPopup({ hero, onClose }: HeroDetailPopupProps) {
  const icyVeins = IcyVeinsDatabase.getInstance();
  const synergies = icyVeins.getSynergies(hero.nicknames[0]);
  const counters = icyVeins.getCounters(hero.nicknames[0]);
  const roleColor = ROLE_COLORS[hero.role] || '#999';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="max-w-md w-full mx-4 rounded-xl p-5 animate-pop-in" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: `2px solid ${roleColor}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <HeroPortrait hero={hero} size="lg" />
          <div>
            <h2 className="text-xl font-bold">{hero.nicknames[0]}</h2>
            <span className="text-sm px-2 py-0.5 rounded" style={{ background: roleColor + '33', color: roleColor }}>{hero.role}</span>
            <span className="text-xs ml-2 opacity-60">Range: {hero.effectiveRange}/5</span>
          </div>
          <button onClick={onClose} className="ml-auto text-lg px-2" style={{ color: '#FF6666' }} title="Close hero details">✕</button>
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <h3 className="text-xs font-bold mb-1" style={{ color: '#00FFFF' }}>SPECIALTIES</h3>
          <div className="flex flex-wrap gap-1">
            {hero.specialties.map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00FFFF33', color: '#00FFFF' }}>
                {specialtyToString(s)}
              </span>
            ))}
          </div>
        </div>

        {/* Synergies */}
        {synergies.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold mb-1" style={{ color: '#90EE90' }}>SYNERGIES ({synergies.length})</h3>
            <p className="text-xs opacity-70">{synergies.join(', ')}</p>
          </div>
        )}

        {/* Counters */}
        {counters.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold mb-1" style={{ color: '#FF6347' }}>COUNTERED BY ({counters.length})</h3>
            <p className="text-xs opacity-70">{counters.join(', ')}</p>
          </div>
        )}

        {hero.nicknames.length > 1 && (
          <p className="text-[10px] opacity-40 mt-2">Also known as: {hero.nicknames.slice(1).join(', ')}</p>
        )}
      </div>
    </div>
  );
}
