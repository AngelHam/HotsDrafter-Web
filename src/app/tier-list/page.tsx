'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { specialtyToString } from '@/data/Specialty';
import HeroPortrait from '@/components/HeroPortrait';
import HeroDetailPopup from '@/components/HeroDetailPopup';
import type { Hero } from '@/data/Hero';

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

const TIER_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666',
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  S: 'Meta-defining', A: 'Strong picks', B: 'Solid choices', C: 'Situational', D: 'Weak on this map',
};

const MAP_DESCRIPTIONS: Record<string, string> = {
  'all': 'Averaged across all maps — best for general tier ranking.',
  'Alterac Pass': 'Large map with cavalry objective. Favors split-pushing and waveclear.',
  'Battlefield of Eternity': 'PvE race objective. Favors teamfighters and sustained DPS.',
  'Braxis Holdout': 'Two-lane map with zerg objective. Favors strong waveclear and objective control.',
  'Cursed Hollow': 'Large three-lane map. Favors global heroes and balanced team compositions.',
  'Dragon Shire': 'Three-lane control point map. Favors global presence and objective control.',
  'Garden of Terror': 'Three-lane seed objective. Favors objective control and waveclear.',
  'Infernal Shrines': 'PvE shrine objective. Favors AoE waveclear and teamfighting.',
  'Sky Temple': 'Three-lane temple objective. Favors global presence and objective control.',
  'Tomb of the Spider Queen': 'Small close-quarters map. Favors waveclear and teamfighting.',
  'Towers of Doom': 'Indirect core damage map. Favors pick potential and siege pressure.',
  'Volskaya Foundry': 'Protector objective. Favors teamfighting, objective control, and siege.',
};

interface HeroTierEntry {
  hero: Hero;
  tier: string;
  score: number;
  sTierMaps: number;
  aTierMaps: number;
}

export default function TierListPage() {
  const router = useRouter();
  const [selectedMap, setSelectedMap] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);

  const icyVeins = useMemo(() => IcyVeinsDatabase.getInstance(), []);

  const entries = useMemo(() => {
    return ALL_HEROES.map(hero => {
      const name = hero.nicknames[0];
      let totalScore = 0;
      let sTierMaps = 0;
      let aTierMaps = 0;

      if (selectedMap === 'all') {
        for (const map of ALL_MAPS) {
          const s = icyVeins.getTierScore(name, map.name);
          totalScore += s;
          if (icyVeins.getHeroTierOnMap(name, map.name) === 'S') sTierMaps++;
          if (icyVeins.getHeroTierOnMap(name, map.name) === 'A') aTierMaps++;
        }
        totalScore = totalScore / ALL_MAPS.length;
      } else {
        totalScore = icyVeins.getTierScore(name, selectedMap);
        if (icyVeins.getHeroTierOnMap(name, selectedMap) === 'S') sTierMaps = 1;
        if (icyVeins.getHeroTierOnMap(name, selectedMap) === 'A') aTierMaps = 1;
      }

      let tier: string;
      if (totalScore >= 4.5) tier = 'S';
      else if (totalScore >= 3.5) tier = 'A';
      else if (totalScore >= 2.5) tier = 'B';
      else if (totalScore >= 1.5) tier = 'C';
      else tier = 'D';

      // For single map, use exact tier
      if (selectedMap !== 'all') {
        tier = icyVeins.getHeroTierOnMap(name, selectedMap);
      }

      return { hero, tier, score: totalScore, sTierMaps, aTierMaps } as HeroTierEntry;
    })
    .filter(e => roleFilter === 'All' || e.hero.role === roleFilter)
    .filter(e => !searchQuery || e.hero.nicknames.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => b.score - a.score);
  }, [selectedMap, roleFilter, searchQuery, icyVeins]);

  const tiers = ['S', 'A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 smooth-transition" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>🏆 Meta Tier List</h1>
        <div />
      </div>

      <div className="p-3 sm:p-4 max-w-5xl mx-auto w-full pb-16">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div>
            <select value={selectedMap} onChange={e => setSelectedMap(e.target.value)}
              className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
              <option value="all">All Maps (Average)</option>
              {ALL_MAPS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
            {selectedMap && MAP_DESCRIPTIONS[selectedMap] && (
              <p className="text-[10px] italic mt-1 opacity-50" style={{ color: '#87CEEB' }}>
                {MAP_DESCRIPTIONS[selectedMap]}
              </p>
            )}
          </div>

          <div className="flex gap-1">
            {['All', 'Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(role => (
              <button key={role} onClick={() => setRoleFilter(role)}
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') + '22' : 'transparent',
                  border: `1px solid ${roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') + '66' : 'rgba(68,102,136,0.3)'}`,
                  color: roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') : '#888',
                }}>
                {role}
              </button>
            ))}
          </div>

          <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="text-sm px-3 py-1 rounded ml-auto w-full sm:w-[150px]" style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }} />
          {entries.length >= 2 && (
            <button onClick={() => router.push(`/compare?h1=${encodeURIComponent(entries[0].hero.nicknames[0])}&h2=${encodeURIComponent(entries[1].hero.nicknames[0])}`)}
              className="text-xs px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105"
              style={{ color: '#00FFFF', border: '2px solid #00FFFF', background: 'rgba(0,255,255,0.08)', boxShadow: '0 0 8px rgba(0,255,255,0.15)' }}
              title={`Compare ${entries[0].hero.nicknames[0]} vs ${entries[1].hero.nicknames[0]}`}>
              ⚔️ Compare Top 2
            </button>
          )}
        </div>

        {/* Tier Distribution Bar */}
        <div className="flex gap-0.5 mb-4 rounded overflow-hidden" style={{ height: 12 }}>
          {tiers.map(tier => {
            const count = entries.filter(e => e.tier === tier).length;
            if (count === 0) return null;
            const pct = entries.length > 0 ? (count / entries.length) * 100 : 0;
            return (
              <div key={tier} title={`${tier}-tier: ${count} heroes`} className="relative flex items-center justify-center" style={{
                flex: count,
                background: TIER_COLORS[tier],
                opacity: 0.7,
              }}>
                {pct > 10 && (
                  <span className="text-[7px] font-bold" style={{ color: '#000', opacity: 0.8 }}>{Math.round(pct)}%</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tier Summary */}
        <div className="flex gap-3 mb-4 justify-center">
          {tiers.map(tier => {
            const count = entries.filter(e => e.tier === tier).length;
            return (
              <span key={tier} className="text-[10px] px-2 py-0.5 rounded" style={{ background: TIER_COLORS[tier] + '15', color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}33` }}>
                {tier}: {count}
              </span>
            );
          })}
        </div>

        {/* Tier Sections */}
        {tiers.map(tier => {
          const tierEntries = entries.filter(e => e.tier === tier);
          if (tierEntries.length === 0) return null;
          return (
            <div key={tier} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold px-2.5 py-0.5 rounded" style={{
                    background: TIER_COLORS[tier] + '22',
                    color: TIER_COLORS[tier],
                    border: `1px solid ${TIER_COLORS[tier]}44`,
                    ...(tier === 'S' ? { boxShadow: `0 0 12px ${TIER_COLORS.S}55, 0 0 24px ${TIER_COLORS.S}22`, borderColor: TIER_COLORS.S + '88', textShadow: `0 0 8px ${TIER_COLORS.S}88` } : {}),
                  }}>
                    {tier} <span className="text-xs font-normal opacity-70">({tierEntries.length})</span>
                  </span>
                  <span className="text-[9px] mt-0.5" style={{ color: TIER_COLORS[tier], opacity: 0.5 }}>{TIER_DESCRIPTIONS[tier]}</span>
                </div>
                <div className="flex gap-0.5 ml-2">
                  {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(r => {
                    const c = tierEntries.filter(e => e.hero.role === r).length;
                    if (c === 0) return null;
                    const rc: Record<string, string> = { Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9' };
                    return <span key={r} className="text-[9px] px-1 rounded" style={{ background: (rc[r] || '#888') + '22', color: rc[r] }} title={`${r}: ${c}`}>{c}</span>;
                  })}
                </div>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
                {tierEntries.map((e, i) => {
                  return (
                  <div key={e.hero.name} className="card-enter group relative flex flex-col items-center p-1.5 rounded hover:bg-white/5 smooth-transition cursor-pointer"
                    onClick={() => setDetailHero(e.hero)}
                    style={{
                      ...(e.tier === 'S' ? { boxShadow: '0 0 6px rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.05)' } : undefined),
                      animationDelay: `${i * 30}ms`,
                    }}
                    title={`${e.hero.nicknames[0]} (${e.hero.role}) — Score: ${e.score.toFixed(1)}${selectedMap === 'all' ? ` | S-tier: ${e.sTierMaps} maps, A-tier: ${e.aTierMaps} maps` : ''}`}>
                    <HeroPortrait hero={e.hero} size="md" showName />
                    <span className="text-[8px] px-1.5 py-0.5 rounded mt-0.5" style={{ background: (ROLE_COLORS[e.hero.role] || '#888') + '22', color: ROLE_COLORS[e.hero.role] || '#888', border: `1px solid ${(ROLE_COLORS[e.hero.role] || '#888')}33` }}>
                      {e.hero.role}
                    </span>
                    {e.hero.specialties.length > 0 && (
                      <span className="text-[7px] mt-0.5 opacity-60 text-center leading-tight" style={{ color: '#aaa', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
                        {specialtyToString(e.hero.specialties[0])}
                      </span>
                    )}
                    {selectedMap === 'all' && e.sTierMaps > 0 && (
                      <span className="text-[8px] mt-0.5" style={{ color: '#FFD700' }}>★{e.sTierMaps}</span>
                    )}
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20 whitespace-nowrap text-center"
                      style={{ background: 'rgba(15, 20, 40, 0.95)', border: '1px solid rgba(68,102,136,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      <div className="text-[10px] font-semibold" style={{ color: ROLE_COLORS[e.hero.role] || '#ccc' }}>{e.hero.role}</div>
                      <div className="text-[9px]" style={{ color: TIER_COLORS[e.tier] }}>Score: {e.score.toFixed(1)}</div>
                      {e.hero.specialties.length > 0 && (
                        <div className="text-[8px] mt-0.5 opacity-70" style={{ color: '#aaa' }}>{e.hero.specialties.slice(0, 2).map(s => specialtyToString(s)).join(' · ')}</div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <p className="text-center text-[10px] opacity-30 mt-6 mb-4">Tier data sourced from Icy Veins community guides</p>
      </div>
      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}
    </div>
  );
}
