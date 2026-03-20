'use client';

import { useMemo, useEffect, useRef } from 'react';
import type { Hero } from '@/data/Hero';
import { Specialty, specialtyToString } from '@/data/Specialty';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { ALL_MAPS, ALL_HEROES } from '@/data/HeroData';
import { heroMatchesName } from '@/data/Hero';
import HeroPortrait from './HeroPortrait';

interface HeroDetailPopupProps {
  hero: Hero;
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

const TIER_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666',
};

const SPECIALTY_CATEGORIES: Record<string, { color: string; bg: string; border: string }> = (() => {
  const damage = { color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)' };
  const utility = { color: '#00DDFF', bg: 'rgba(0,221,255,0.12)', border: 'rgba(0,221,255,0.3)' };
  const defensive = { color: '#66DD88', bg: 'rgba(102,221,136,0.12)', border: 'rgba(102,221,136,0.3)' };
  const macro = { color: '#CC88FF', bg: 'rgba(204,136,255,0.12)', border: 'rgba(204,136,255,0.3)' };
  const healing = { color: '#88EEBB', bg: 'rgba(136,238,187,0.12)', border: 'rgba(136,238,187,0.3)' };
  const draft = { color: '#FFBB55', bg: 'rgba(255,187,85,0.12)', border: 'rgba(255,187,85,0.3)' };

  return {
    [Specialty.BURST_DAMAGE]: damage, [Specialty.SUSTAINED_DAMAGE]: damage, [Specialty.AOE_DAMAGE]: damage,
    [Specialty.POKE]: damage, [Specialty.FINISHER]: damage, [Specialty.SPELL_DAMAGE]: damage,
    [Specialty.AUTO_ATTACK]: damage, [Specialty.PERCENT_DAMAGE]: damage, [Specialty.EXECUTE_DAMAGE]: damage,
    [Specialty.ENGAGE]: utility, [Specialty.RE_ENGAGE]: utility, [Specialty.HARD_CC]: utility,
    [Specialty.SOFT_CC]: utility, [Specialty.PICK_POTENTIAL]: utility, [Specialty.ZONING]: utility,
    [Specialty.OBJECTIVE_CONTROL]: utility, [Specialty.BOSS_CONTROL]: utility, [Specialty.UTILITY_SUPPORT]: utility,
    [Specialty.DISENGAGE]: defensive, [Specialty.ANTI_DIVE]: defensive, [Specialty.ANTI_POKE]: defensive,
    [Specialty.SELF_SUSTAIN]: defensive, [Specialty.HIGH_DURABILITY]: defensive, [Specialty.LOW_DURABILITY]: defensive,
    [Specialty.MOBILITY]: defensive, [Specialty.DAMAGE_MITIGATION]: defensive,
    [Specialty.ARMOR_APPLICATION]: defensive, [Specialty.SHIELDS]: defensive,
    [Specialty.WAVECLEAR]: macro, [Specialty.DOUBLE_SOAKING]: macro, [Specialty.SPLIT_PUSHING]: macro,
    [Specialty.SIEGE_PUSHING]: macro, [Specialty.CAMP_TAKING]: macro, [Specialty.GLOBAL_PRESENCE]: macro,
    [Specialty.MACRO_SHOTCALLING]: macro,
    [Specialty.BURST_HEALING]: healing, [Specialty.SUSTAINED_HEALING]: healing, [Specialty.CLEANSE]: healing,
    [Specialty.FLEX_PICK]: draft, [Specialty.COUNTERPICK]: draft, [Specialty.SNOWBALL]: draft,
    [Specialty.LATE_GAME_SCALING]: draft, [Specialty.CHEESE]: draft, [Specialty.STEALTH]: draft,
  };
})();

function findHeroByName(name: string): Hero | undefined {
  return ALL_HEROES.find(h => heroMatchesName(h, name));
}

function RelationSection({ title, color, names, limit }: { title: string; color: string; names: string[]; limit: number }) {
  const displayed = names.slice(0, limit);
  const remaining = names.length - limit;

  if (names.length === 0) return null;

  return (
    <div className="mb-3">
      <h3 className="text-[11px] font-bold mb-1.5 flex items-center gap-1.5" style={{ color }}>
        {title}
        <span className="text-[9px] font-normal opacity-60">({names.length})</span>
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {displayed.map(name => {
          const heroObj = findHeroByName(name);
          return (
            <div key={name} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: color + '15', border: `1px solid ${color}33` }}>
              {heroObj && <HeroPortrait hero={heroObj} size="xs" />}
              <span className="text-[10px]" style={{ color }}>{name}</span>
            </div>
          );
        })}
        {remaining > 0 && (
          <span className="text-[9px] px-1.5 py-1 opacity-50">+{remaining} more</span>
        )}
      </div>
    </div>
  );
}

export default function HeroDetailPopup({ hero, onClose }: HeroDetailPopupProps) {
  const icyVeins = IcyVeinsDatabase.getInstance();
  const synergies = icyVeins.getSynergies(hero.nicknames[0]);
  const counters = icyVeins.getCounters(hero.nicknames[0]);
  const countersFor = icyVeins.getCountersFor(hero.nicknames[0]);
  const roleColor = ROLE_COLORS[hero.role] || '#999';
  const dialogRef = useRef<HTMLDivElement>(null);

  const mapTiers = useMemo(() => {
    return ALL_MAPS.map(m => ({
      name: m.name,
      shortName: m.name.split(' ').map(w => w[0]).join(''),
      tier: icyVeins.getHeroTierOnMap(hero.nicknames[0], m.name),
    }));
  }, [hero.nicknames, icyVeins]);

  const bestMaps = mapTiers.filter(m => m.tier === 'S' || m.tier === 'A');
  const worstMaps = mapTiers.filter(m => m.tier === 'D');

  // Focus trap for modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog" aria-modal="true" aria-label={`${hero.nicknames[0]} details`}
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div ref={dialogRef} className="w-full mx-4 rounded-xl overflow-y-auto max-h-[90vh]"
        style={{
          maxWidth: 600,
          background: 'rgba(15, 20, 40, 0.98)',
          border: '1px solid rgba(68,102,136,0.6)',
          animation: 'heroDetailIn 0.25s ease-out',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start gap-4 p-5 pb-3">
          <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{
            width: 100, height: 100,
            border: `2px solid ${roleColor}`,
            boxShadow: `0 0 16px ${roleColor}44`,
          }}>
            <HeroPortrait hero={hero} size="lg" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-xl font-bold tracking-wide">{hero.nicknames[0]}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: roleColor + '28', color: roleColor, border: `1px solid ${roleColor}55` }}>
                {hero.role}
              </span>
              {hero.nicknames.length > 1 && (
                <span className="text-[10px] opacity-70 italic">
                  aka {hero.nicknames.slice(1).join(', ')}
                </span>
              )}
            </div>
            {/* Range Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] opacity-50 uppercase tracking-wider">Range</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(r => (
                  <div key={r} className="rounded-sm" style={{
                    width: 16, height: 8,
                    background: r <= hero.effectiveRange ? '#00FFFF' : 'rgba(255,255,255,0.08)',
                    boxShadow: r <= hero.effectiveRange ? '0 0 4px rgba(0,255,255,0.3)' : undefined,
                  }} />
                ))}
              </div>
              <span className="text-[10px] opacity-70">{hero.effectiveRange}/5</span>
            </div>
          </div>
          <button onClick={onClose}
            className="text-lg px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: '#FF6666' }} title="Close" aria-label="Close hero details">✕</button>
        </div>

        {/* Specialty Tags */}
        <div className="px-5 pb-3">
          <div className="rounded-lg p-3" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.25)' }}>
            <h3 className="text-[10px] font-bold mb-1.5 uppercase tracking-widest opacity-60">Specialties</h3>
            <div className="flex flex-wrap gap-1">
              {hero.specialties.map(s => {
                const cat = SPECIALTY_CATEGORIES[s] || { color: '#888', bg: 'rgba(136,136,136,0.12)', border: 'rgba(136,136,136,0.3)' };
                return (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color }}>
                    {specialtyToString(s)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Synergy & Counter Sections */}
        <div className="px-5 pb-3 grid grid-cols-1 gap-2">
          {/* Synergizes With */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.25)' }}>
            <RelationSection title="⚡ Synergizes With" color="#90EE90" names={synergies} limit={5} />
            <RelationSection title="🛡️ Countered By" color="#FF6347" names={counters} limit={5} />
            <RelationSection title="⚔️ Counters" color="#FFD700" names={countersFor} limit={5} />
            {synergies.length === 0 && counters.length === 0 && countersFor.length === 0 && (
              <p className="text-[10px] opacity-70 text-center py-2">No relationship data available</p>
            )}
          </div>
        </div>

        {/* Map Performance */}
        <div className="px-5 pb-4">
          <div className="rounded-lg p-3" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.25)' }}>
            <h3 className="text-[10px] font-bold mb-2 uppercase tracking-widest opacity-60">Map Performance</h3>

            {/* Best / Worst summary */}
            {(bestMaps.length > 0 || worstMaps.length > 0) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[10px]">
                {bestMaps.length > 0 && (
                  <span>
                    <span style={{ color: '#90EE90' }}>★ Best:</span>{' '}
                    <span className="opacity-70">{bestMaps.map(m => m.name).join(', ')}</span>
                  </span>
                )}
                {worstMaps.length > 0 && (
                  <span>
                    <span style={{ color: '#FF6666' }}>▼ Worst:</span>{' '}
                    <span className="opacity-70">{worstMaps.map(m => m.name).join(', ')}</span>
                  </span>
                )}
              </div>
            )}

            {/* Map tier grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {mapTiers.map(m => {
                const tc = TIER_COLORS[m.tier] || '#888';
                const isBest = m.tier === 'S';
                return (
                  <div key={m.name} className="flex items-center gap-1.5 px-1.5 py-1 rounded"
                    style={{
                      background: isBest ? tc + '18' : 'rgba(255,255,255,0.03)',
                      border: isBest ? `1px solid ${tc}33` : '1px solid transparent',
                    }}>
                    <span className="text-[9px] font-bold w-4 text-center rounded"
                      style={{ color: tc, textShadow: isBest ? `0 0 6px ${tc}66` : undefined }}>
                      {m.tier}
                    </span>
                    <span className="text-[10px] opacity-60 truncate">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroDetailIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
