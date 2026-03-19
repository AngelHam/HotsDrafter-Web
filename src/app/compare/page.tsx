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

const TIER_COMPARE_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666',
};

export default function ComparePage() {
  const router = useRouter();
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [picker, setPicker] = useState<1 | 2 | null>(null);
  const [search, setSearch] = useState('');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);

  const icyVeins = useMemo(() => IcyVeinsDatabase.getInstance(), []);

  const filteredHeroes = ALL_HEROES
    .filter(h => !search || h.nicknames.some(n => n.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => a.nicknames[0].localeCompare(b.nicknames[0]));

  const handlePick = (hero: Hero) => {
    if (picker === 1) setHero1(hero);
    else if (picker === 2) setHero2(hero);
    setPicker(null);
    setSearch('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>⚖️ Hero Compare</h1>
        <div />
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Hero Selection */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <HeroSlot hero={hero1} label="Hero 1" color="#4488FF" onClick={() => setPicker(1)} onDetail={h => setDetailHero(h)} />
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-2xl font-bold" style={{ color: '#FFD700' }}>VS</span>
            {hero1 && hero2 && (
              <button onClick={() => { const t = hero1; setHero1(hero2); setHero2(t); }}
                className="text-xs px-2 py-1 rounded hover:bg-white/10" style={{ color: '#FFD700', border: '1px solid #FFD70033' }} title="Swap heroes">
                ⇄ Swap
              </button>
            )}
          </div>
          <HeroSlot hero={hero2} label="Hero 2" color="#FF6666" onClick={() => setPicker(2)} onDetail={h => setDetailHero(h)} />
        </div>

        {/* Comparison Table */}
        {hero1 && hero2 && (
          <div className="space-y-3 animate-fade-slide-up">
            <CompareRow label="Role" v1={hero1.role} v2={hero2.role} c1={ROLE_COLORS[hero1.role]} c2={ROLE_COLORS[hero2.role]} />
            <CompareRow label="Range" v1={`${'█'.repeat(hero1.effectiveRange)}${'░'.repeat(5 - hero1.effectiveRange)} ${hero1.effectiveRange}/5`} v2={`${hero2.effectiveRange}/5 ${'█'.repeat(hero2.effectiveRange)}${'░'.repeat(5 - hero2.effectiveRange)}`} highlight={hero1.effectiveRange > hero2.effectiveRange ? 1 : hero2.effectiveRange > hero1.effectiveRange ? 2 : 0} />
            {(() => {
              const avg1 = ALL_MAPS.reduce((s, m) => s + icyVeins.getTierScore(hero1.nicknames[0], m.name), 0) / ALL_MAPS.length;
              const avg2 = ALL_MAPS.reduce((s, m) => s + icyVeins.getTierScore(hero2.nicknames[0], m.name), 0) / ALL_MAPS.length;
              return <CompareRow label="Avg Map Score" v1={avg1.toFixed(1)} v2={avg2.toFixed(1)} highlight={avg1 > avg2 ? 1 : avg2 > avg1 ? 2 : 0} c1="#87CEEB" c2="#87CEEB" />;
            })()}
            <CompareRow label="Specialties" v1={hero1.specialties.map(specialtyToString).join(', ')} v2={hero2.specialties.map(specialtyToString).join(', ')} />
            <CompareRow label="Total Synergies"
              v1={`${icyVeins.getSynergies(hero1.nicknames[0]).length} heroes`}
              v2={`${icyVeins.getSynergies(hero2.nicknames[0]).length} heroes`}
              c1="#90EE90" c2="#90EE90"
              highlight={icyVeins.getSynergies(hero1.nicknames[0]).length > icyVeins.getSynergies(hero2.nicknames[0]).length ? 1 : icyVeins.getSynergies(hero2.nicknames[0]).length > icyVeins.getSynergies(hero1.nicknames[0]).length ? 2 : 0} />
            <CompareRow label="Countered By"
              v1={`${icyVeins.getCounters(hero1.nicknames[0]).length} heroes`}
              v2={`${icyVeins.getCounters(hero2.nicknames[0]).length} heroes`}
              c1="#FF6347" c2="#FF6347"
              highlight={icyVeins.getCounters(hero1.nicknames[0]).length < icyVeins.getCounters(hero2.nicknames[0]).length ? 1 : icyVeins.getCounters(hero2.nicknames[0]).length < icyVeins.getCounters(hero1.nicknames[0]).length ? 2 : 0} />

            {/* Synergies */}
            <CompareRow label="Synergy Heroes"
              v1={icyVeins.getSynergies(hero1.nicknames[0]).slice(0, 4).join(', ') || 'None'}
              v2={icyVeins.getSynergies(hero2.nicknames[0]).slice(0, 4).join(', ') || 'None'}
              c1="#90EE90" c2="#90EE90" />

            <CompareRow label="Counter Heroes"
              v1={icyVeins.getCounters(hero1.nicknames[0]).slice(0, 4).join(', ') || 'None'}
              v2={icyVeins.getCounters(hero2.nicknames[0]).slice(0, 4).join(', ') || 'None'}
              c1="#FF6347" c2="#FF6347" />

            {/* Head to Head */}
            <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <h3 className="text-xs font-bold mb-2" style={{ color: '#FFD700' }}>HEAD TO HEAD</h3>
              <p className="text-xs opacity-80">
                {icyVeins.counters(hero1.nicknames[0], hero2.nicknames[0])
                  ? <span style={{ color: '#4488FF' }}>{hero1.nicknames[0]} counters {hero2.nicknames[0]}</span>
                  : icyVeins.counters(hero2.nicknames[0], hero1.nicknames[0])
                    ? <span style={{ color: '#FF6666' }}>{hero2.nicknames[0]} counters {hero1.nicknames[0]}</span>
                    : <span className="opacity-50">No direct counter relationship</span>
                }
              </p>
              <p className="text-xs opacity-80 mt-1">
                {icyVeins.hasSynergy(hero1.nicknames[0], hero2.nicknames[0])
                  ? <span style={{ color: '#90EE90' }}>✦ These heroes synergize well together!</span>
                  : <span className="opacity-50">No synergy relationship</span>
                }
              </p>
            </div>

            {/* Shared Specialties */}
            {(() => {
              const shared = hero1.specialties.filter(s => hero2.specialties.includes(s));
              if (shared.length === 0) return null;
              return (
                <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <h3 className="text-xs font-bold mb-1" style={{ color: '#00FFFF' }}>SHARED SPECIALTIES ({shared.length})</h3>
                  <div className="flex flex-wrap gap-1">
                    {shared.map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00FFFF33', color: '#00FFFF' }}>
                        {specialtyToString(s)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Map Tier Comparison */}
            <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <h3 className="text-xs font-bold mb-2" style={{ color: '#87CEEB' }}>MAP TIERS</h3>
              <div className="space-y-1">
                {ALL_MAPS.map(map => {
                  const t1 = icyVeins.getHeroTierOnMap(hero1.nicknames[0], map.name);
                  const t2 = icyVeins.getHeroTierOnMap(hero2.nicknames[0], map.name);
                  return (
                    <div key={map.name} className="flex items-center gap-2 text-[10px]">
                      <span className="w-20 truncate opacity-60">{map.name.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="w-5 text-center font-bold" style={{ color: TIER_COMPARE_COLORS[t1] || '#888' }}>{t1}</span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                      <span className="w-5 text-center font-bold" style={{ color: TIER_COMPARE_COLORS[t2] || '#888' }}>{t2}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}\n\n      {/* Picker Modal */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-auto" style={{ background: '#1a1a2e', border: '2px solid #00FFFF' }}>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold" style={{ color: '#00FFFF' }}>Select Hero {picker}</h3>
              <button onClick={() => { setPicker(null); setSearch(''); }} className="text-sm px-2 py-1 hover:bg-white/10 rounded" style={{ color: '#FF6666' }}>✕</button>
            </div>
            <input type="text" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 mb-3 rounded text-sm focus:outline-none"
              style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
              autoFocus />
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
              {filteredHeroes.map(h => (
                <HeroPortrait key={h.name} hero={h} size="md" showName onClick={() => handlePick(h)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSlot({ hero, label, color, onClick, onDetail }: { hero: Hero | null; label: string; color: string; onClick: () => void; onDetail?: (h: Hero) => void }) {
  return (
    <button onClick={onClick} onContextMenu={e => { e.preventDefault(); if (hero && onDetail) onDetail(hero); }} className="p-4 rounded text-center transition-all hover:brightness-110" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `2px solid ${hero ? color : 'rgba(68,102,136,0.5)'}` }}>
      {hero ? (
        <div className="flex flex-col items-center gap-2">
          <HeroPortrait hero={hero} size="lg" />
          <span className="text-sm font-bold">{hero.nicknames[0]}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: (ROLE_COLORS[hero.role] || '#888') + '33', color: ROLE_COLORS[hero.role] }}>{hero.role}</span>
        </div>
      ) : (
        <div className="py-6">
          <p className="text-sm opacity-40">{label}</p>
          <p className="text-xs opacity-30 mt-1">Click to select</p>
        </div>
      )}
    </button>
  );
}

function CompareRow({ label, v1, v2, c1, c2, highlight }: { label: string; v1: string; v2: string; c1?: string; c2?: string; highlight?: number }) {
  return (
    <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="text-[10px] font-bold mb-1.5 text-center opacity-60">{label.toUpperCase()}</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <p style={{ color: c1 || (highlight === 1 ? '#90EE90' : undefined) }} className={highlight === 2 ? 'opacity-50' : ''}>{v1}</p>
        <p className={`text-right ${highlight === 1 ? 'opacity-50' : ''}`} style={{ color: c2 || (highlight === 2 ? '#90EE90' : undefined) }}>{v2}</p>
      </div>
    </div>
  );
}
