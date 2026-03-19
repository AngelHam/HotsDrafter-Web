'use client';

import type { Hero } from '@/data/Hero';
import { specialtyToString } from '@/data/Specialty';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { ALL_MAPS } from '@/data/HeroData';
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
  const countersFor = icyVeins.getCountersFor(hero.nicknames[0]);
  const roleColor = ROLE_COLORS[hero.role] || '#999';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="max-w-md w-full mx-4 rounded-xl p-5 animate-pop-in overflow-y-auto max-h-[90vh]" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: `2px solid ${roleColor}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <HeroPortrait hero={hero} size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{hero.nicknames[0]}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm px-2 py-0.5 rounded" style={{ background: roleColor + '33', color: roleColor }}>{hero.role}</span>
            </div>
            {/* Range Bar */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] opacity-60">Range:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(r => (
                  <div key={r} className="rounded-sm" style={{
                    width: 14, height: 8,
                    background: r <= hero.effectiveRange ? '#00FFFF' : 'rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
              <span className="text-[10px] opacity-50">{hero.effectiveRange}/5</span>
            </div>
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
            <h3 className="text-xs font-bold mb-1" style={{ color: '#90EE90' }}>WORKS WELL WITH ({synergies.length})</h3>
            <div className="flex flex-wrap gap-1">
              {synergies.map(name => (
                <span key={name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(144,238,144,0.1)', border: '1px solid #90EE9033', color: '#90EE90' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Countered By */}
        {counters.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold mb-1" style={{ color: '#FF6347' }}>COUNTERED BY ({counters.length})</h3>
            <div className="flex flex-wrap gap-1">
              {counters.map(name => (
                <span key={name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,99,71,0.1)', border: '1px solid #FF634733', color: '#FF6347' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Counters (heroes this hero is strong against) */}
        {countersFor.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold mb-1" style={{ color: '#FFD700' }}>STRONG AGAINST ({countersFor.length})</h3>
            <div className="flex flex-wrap gap-1">
              {countersFor.map(name => (
                <span key={name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD70033', color: '#FFD700' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {hero.nicknames.length > 1 && (
          <p className="text-[10px] opacity-40 mt-2">Also known as: {hero.nicknames.slice(1).join(', ')}</p>
        )}

        {/* Map Tiers */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
          <h3 className="text-xs font-bold mb-1" style={{ color: '#87CEEB' }}>MAP TIERS</h3>
          <div className="flex flex-wrap gap-1">
            {ALL_MAPS.map(m => {
              const tier = icyVeins.getHeroTierOnMap(hero.nicknames[0], m.name);
              const tc: Record<string, string> = { S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666' };
              return (
                <span key={m.name} className="text-[9px] px-1 py-0.5 rounded" title={`${m.name}: ${tier}-tier`}
                  style={{ background: (tc[tier] || '#888') + '15', color: tc[tier] || '#888', border: `1px solid ${(tc[tier] || '#888')}33` }}>
                  {m.name.split(' ')[0]}:{tier}
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] opacity-30 mt-2 text-center">Right-click a hero in the draft to open this panel</p>
      </div>
    </div>
  );
}
