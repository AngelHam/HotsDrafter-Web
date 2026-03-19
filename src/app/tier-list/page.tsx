'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import HeroPortrait from '@/components/HeroPortrait';
import HeroDetailPopup from '@/components/HeroDetailPopup';
import type { Hero } from '@/data/Hero';

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

const TIER_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666',
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
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>🏆 Meta Tier List</h1>
        <div />
      </div>

      <div className="p-4 max-w-5xl mx-auto w-full">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select value={selectedMap} onChange={e => setSelectedMap(e.target.value)}
            className="text-sm px-2 py-1 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', color: '#FFD700', border: '1px solid rgba(68,102,136,0.5)' }}>
            <option value="all">All Maps (Average)</option>
            {ALL_MAPS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>

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
            className="text-sm px-3 py-1 rounded ml-auto" style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff', width: 150 }} />
          {entries.length >= 2 && (
            <button onClick={() => router.push(`/compare?h1=${encodeURIComponent(entries[0].hero.nicknames[0])}&h2=${encodeURIComponent(entries[1].hero.nicknames[0])}`)}
              className="text-[10px] px-2 py-1 rounded hover:bg-white/10 whitespace-nowrap" style={{ color: '#87CEEB', border: '1px solid #87CEEB33' }}
              title={`Compare ${entries[0].hero.nicknames[0]} vs ${entries[1].hero.nicknames[0]}`}>
              ⚖️ Compare Top 2
            </button>
          )}
        </div>

        {/* Tier Distribution Bar */}
        <div className="flex gap-0.5 mb-4 rounded overflow-hidden" style={{ height: 6 }}>
          {tiers.map(tier => {
            const count = entries.filter(e => e.tier === tier).length;
            if (count === 0) return null;
            return (
              <div key={tier} title={`${tier}-tier: ${count} heroes`} style={{
                flex: count,
                background: TIER_COLORS[tier],
                opacity: 0.7,
              }} />
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
                <span className="text-lg font-bold px-2.5 py-0.5 rounded" style={{ background: TIER_COLORS[tier] + '22', color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}44` }}>
                  {tier}
                </span>
                <span className="text-xs opacity-50">{tierEntries.length} hero{tierEntries.length !== 1 ? 'es' : ''}</span>
                <div className="flex gap-0.5 ml-2">
                  {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(r => {
                    const c = tierEntries.filter(e => e.hero.role === r).length;
                    if (c === 0) return null;
                    const rc: Record<string, string> = { Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9' };
                    return <span key={r} className="text-[9px] px-1 rounded" style={{ background: (rc[r] || '#888') + '22', color: rc[r] }} title={`${r}: ${c}`}>{c}</span>;
                  })}
                </div>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                {tierEntries.map(e => (
                  <div key={e.hero.name} className="flex flex-col items-center p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => setDetailHero(e.hero)}
                    title={`${e.hero.nicknames[0]} (${e.hero.role}) — Score: ${e.score.toFixed(1)}${selectedMap === 'all' ? ` | S-tier: ${e.sTierMaps} maps, A-tier: ${e.aTierMaps} maps` : ''}`}>
                    <HeroPortrait hero={e.hero} size="md" showName />
                    {selectedMap === 'all' && e.sTierMaps > 0 && (
                      <span className="text-[8px] mt-0.5" style={{ color: '#FFD700' }}>★{e.sTierMaps}</span>
                    )}
                  </div>
                ))}
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
