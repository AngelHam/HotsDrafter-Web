'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { specialtyToString, Specialty } from '@/data/Specialty';
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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <ComparePageInner />
    </Suspense>
  );
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [picker, setPicker] = useState<1 | 2 | null>(null);
  const [search, setSearch] = useState('');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [matchupRoleFilter, setMatchupRoleFilter] = useState<string>('All');

  // Pre-fill from URL params
  useEffect(() => {
    const h1 = searchParams.get('h1');
    const h2 = searchParams.get('h2');
    if (h1) { const found = ALL_HEROES.find(h => h.nicknames[0] === h1); if (found) setHero1(found); }
    if (h2) { const found = ALL_HEROES.find(h => h.nicknames[0] === h2); if (found) setHero2(found); }
  }, [searchParams]);

  const icyVeins = useMemo(() => IcyVeinsDatabase.getInstance(), []);

  const filteredHeroes = ALL_HEROES
    .filter(h => roleFilter === 'All' || h.role === roleFilter)
    .filter(h => !search || h.nicknames.some(n => n.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => a.nicknames[0].localeCompare(b.nicknames[0]));

  const filteredMatchups = useMemo(() => {
    if (matchupRoleFilter === 'All') return POPULAR_MATCHUPS;
    return POPULAR_MATCHUPS.filter(([n1, n2]) => {
      const h1 = ALL_HEROES.find(h => h.nicknames[0] === n1);
      const h2 = ALL_HEROES.find(h => h.nicknames[0] === n2);
      return (h1 && h1.role === matchupRoleFilter) || (h2 && h2.role === matchupRoleFilter);
    });
  }, [matchupRoleFilter]);

  const handlePick = (hero: Hero) => {
    if (picker === 1) setHero1(hero);
    else if (picker === 2) setHero2(hero);
    setPicker(null);
    setSearch('');
  };

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 smooth-transition" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>⚖️ Hero Compare</h1>
        <div />
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Hero Selection */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <HeroSlot hero={hero1} label="Hero 1" color="#4488FF" onClick={() => setPicker(1)} onDetail={h => setDetailHero(h)} onClear={hero1 ? () => setHero1(null) : undefined} />
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-3xl font-bold" style={{ color: '#FFD700' }}>VS</span>
            {hero1 && hero2 && (
              <button onClick={() => { const t = hero1; setHero1(hero2); setHero2(t); }}
                className="text-xs px-3 py-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#FFD700', border: '1px solid #FFD70044' }} title="Swap heroes">
                ⇄ Swap
              </button>
            )}
          </div>
          <HeroSlot hero={hero2} label="Hero 2" color="#FF6666" onClick={() => setPicker(2)} onDetail={h => setDetailHero(h)} onClear={hero2 ? () => setHero2(null) : undefined} />
        </div>

        {/* Empty State - Popular Matchups */}
        {(!hero1 || !hero2) && (
          <div className="space-y-4 animate-fade-slide-up">
            <div className="p-4 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-sm opacity-60 mb-1">Compare any two heroes side-by-side</p>
              <p className="text-xs opacity-40">See roles, specialties, map tiers, synergies, counters, and head-to-head matchup data</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold opacity-50">⚡ POPULAR MATCHUPS — click to compare</h3>
                <div className="flex gap-1">
                  {[{ role: 'All', color: '#00FFFF' }, { role: 'Tank', color: '#6495ED' }, { role: 'Healer', color: '#90EE90' }, { role: 'DPS', color: '#FF6347' }, { role: 'Mage', color: '#BA55D3' }, { role: 'Offlane', color: '#FFA500' }].map(({ role, color }) => (
                    <button key={role} onClick={() => setMatchupRoleFilter(role)}
                      className="text-[10px] px-2 py-0.5 rounded-full transition-all"
                      style={{
                        background: matchupRoleFilter === role ? color + '33' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${matchupRoleFilter === role ? color + '88' : 'rgba(68,102,136,0.3)'}`,
                        color: matchupRoleFilter === role ? color : '#777',
                      }}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredMatchups.length > 0 ? filteredMatchups.map(([n1, n2], i) => {
                  const h1 = ALL_HEROES.find(h => h.nicknames[0] === n1);
                  const h2 = ALL_HEROES.find(h => h.nicknames[0] === n2);
                  if (!h1 || !h2) return null;
                  return (
                    <button key={`${n1}-${n2}`} onClick={() => { setHero1(h1); setHero2(h2); }}
                      className="card-enter flex flex-col items-center gap-1 p-2 rounded text-xs smooth-transition hover:brightness-125"
                      style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.4)', animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-center justify-center gap-2 w-full">
                        <div className="flex flex-col items-center">
                          <HeroPortrait hero={h1} size="sm" />
                          <span className="text-[9px] opacity-70 mt-0.5 truncate max-w-[60px]">{h1.nicknames[0]}</span>
                        </div>
                        <span className="opacity-50 text-xs">vs</span>
                        <div className="flex flex-col items-center">
                          <HeroPortrait hero={h2} size="sm" />
                          <span className="text-[9px] opacity-70 mt-0.5 truncate max-w-[60px]">{h2.nicknames[0]}</span>
                        </div>
                      </div>
                      {(() => {
                        const counters1 = icyVeins.counters(n1, n2);
                        const counters2 = icyVeins.counters(n2, n1);
                        if (counters1) return <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(68,136,255,0.15)', color: '#4488FF' }}>⬆ {n1} favored</span>;
                        if (counters2) return <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,102,102,0.15)', color: '#FF6666' }}>⬆ {n2} favored</span>;
                        return <span className="text-[8px] opacity-30">Even</span>;
                      })()}
                    </button>
                  );
                }) : (
                  <p className="col-span-full text-xs text-center py-3 opacity-40">No matchups for this role filter</p>
                )}
              </div>
              <button
                onClick={() => {
                  const shuffled = [...ALL_HEROES].sort(() => Math.random() - 0.5);
                  setHero1(shuffled[0]);
                  setHero2(shuffled[1]);
                }}
                className="mt-3 w-full text-xs px-3 py-2 rounded transition-all hover:brightness-125 hover:bg-white/5"
                style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.4)', color: '#FFD700' }}>
                🎲 Random Matchup
              </button>
            </div>

            {/* Quick Info Panel */}
            <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#FFD700' }}>💡 How to Compare</p>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <li>• Click a hero slot above or pick a popular matchup</li>
                <li>• See synergies, counters, map tiers, and specialties side-by-side</li>
                <li>• Use this to learn which heroes counter each other</li>
              </ul>
            </div>
          </div>
        )}

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
            <CompareRow label="Specialty Count" v1={`${hero1.specialties.length} traits`} v2={`${hero2.specialties.length} traits`}
              highlight={hero1.specialties.length > hero2.specialties.length ? 1 : hero2.specialties.length > hero1.specialties.length ? 2 : 0} />
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

            {/* Matchup Verdict */}
            {(() => {
              const h1Name = hero1.nicknames[0];
              const h2Name = hero2.nicknames[0];
              const h1CountersH2 = icyVeins.counters(h1Name, h2Name);
              const h2CountersH1 = icyVeins.counters(h2Name, h1Name);
              const h1Synergies = icyVeins.getSynergies(h1Name).length;
              const h2Synergies = icyVeins.getSynergies(h2Name).length;
              const h1Countered = icyVeins.getCounters(h1Name).length;
              const h2Countered = icyVeins.getCounters(h2Name).length;
              const avg1 = ALL_MAPS.reduce((s, m) => s + icyVeins.getTierScore(h1Name, m.name), 0) / ALL_MAPS.length;
              const avg2 = ALL_MAPS.reduce((s, m) => s + icyVeins.getTierScore(h2Name, m.name), 0) / ALL_MAPS.length;
              
              let score1 = 0, score2 = 0;
              if (h1CountersH2) score1 += 3;
              if (h2CountersH1) score2 += 3;
              if (avg1 > avg2) score1 += 1; else if (avg2 > avg1) score2 += 1;
              if (h1Synergies > h2Synergies) score1 += 0.5; else if (h2Synergies > h1Synergies) score2 += 0.5;
              if (h1Countered < h2Countered) score1 += 0.5; else if (h2Countered < h1Countered) score2 += 0.5;
              
              let verdict: string;
              let verdictColor: string;
              if (score1 > score2 + 1) { verdict = `${h1Name} has a clear advantage`; verdictColor = '#4488FF'; }
              else if (score2 > score1 + 1) { verdict = `${h2Name} has a clear advantage`; verdictColor = '#FF6666'; }
              else if (score1 > score2) { verdict = `${h1Name} has a slight edge`; verdictColor = '#4488FF'; }
              else if (score2 > score1) { verdict = `${h2Name} has a slight edge`; verdictColor = '#FF6666'; }
              else { verdict = 'Even matchup — both are equally viable'; verdictColor = '#FFD700'; }
              
              return (
                <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${verdictColor}44` }}>
                  <h3 className="text-xs font-bold mb-2" style={{ color: verdictColor }}>⚖️ MATCHUP VERDICT</h3>
                  <p className="text-sm font-semibold" style={{ color: verdictColor }}>{verdict}</p>
                  <div className="flex gap-4 mt-2 text-[10px] opacity-60">
                    <span>Map avg: {avg1.toFixed(1)} vs {avg2.toFixed(1)}</span>
                    <span>Synergies: {h1Synergies} vs {h2Synergies}</span>
                    <span>Countered by: {h1Countered} vs {h2Countered}</span>
                  </div>
                </div>
              );
            })()}

            {/* Map Performance Chart */}
            <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <h3 className="text-xs font-bold mb-2" style={{ color: '#87CEEB' }}>📊 MAP PERFORMANCE</h3>
              <div className="space-y-1.5">
                {ALL_MAPS.map(map => {
                  const s1 = icyVeins.getTierScore(hero1.nicknames[0], map.name);
                  const s2 = icyVeins.getTierScore(hero2.nicknames[0], map.name);
                  return (
                    <div key={map.name} className="flex items-center gap-2 text-[10px]">
                      <span className="w-16 truncate opacity-60 text-right">{map.name.split(' ').slice(0, 2).join(' ')}</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 flex justify-end">
                          <div style={{ width: `${(s1 / 5) * 100}%`, height: 8, background: '#4488FF', borderRadius: '2px 0 0 2px', minWidth: 2 }} />
                        </div>
                        <span className="text-[9px] w-3 text-center opacity-40">|</span>
                        <div className="flex-1">
                          <div style={{ width: `${(s2 / 5) * 100}%`, height: 8, background: '#FF6666', borderRadius: '0 2px 2px 0', minWidth: 2 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] opacity-40">
                <span style={{ color: '#4488FF' }}>■ {hero1.nicknames[0]}</span>
                <span style={{ color: '#FF6666' }}>{hero2.nicknames[0]} ■</span>
              </div>
            </div>

            {/* Specialty Overlap */}
            {(() => {
              const shared = hero1.specialties.filter(s => hero2.specialties.includes(s));
              const unique1 = hero1.specialties.filter(s => !hero2.specialties.includes(s));
              const unique2 = hero2.specialties.filter(s => !hero1.specialties.includes(s));
              return (
                <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <h3 className="text-xs font-bold mb-2" style={{ color: '#00FFFF' }}>🔀 SPECIALTY OVERLAP</h3>
                  {shared.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[9px] opacity-50 block mb-1">Shared ({shared.length})</span>
                      <div className="flex flex-wrap gap-1">
                        {shared.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.15)', border: '1px solid #00FFFF44', color: '#00FFFF' }}>
                            {specialtyToString(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] opacity-50 block mb-1" style={{ color: '#4488FF' }}>Only {hero1.nicknames[0]} ({unique1.length})</span>
                      <div className="flex flex-wrap gap-1">
                        {unique1.length > 0 ? unique1.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(68,136,255,0.12)', border: '1px solid #4488FF33', color: '#4488FF' }}>
                            {specialtyToString(s)}
                          </span>
                        )) : <span className="text-[10px] opacity-30">None</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] opacity-50 block mb-1" style={{ color: '#FF6666' }}>Only {hero2.nicknames[0]} ({unique2.length})</span>
                      <div className="flex flex-wrap gap-1">
                        {unique2.length > 0 ? unique2.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,102,102,0.12)', border: '1px solid #FF666633', color: '#FF6666' }}>
                            {specialtyToString(s)}
                          </span>
                        )) : <span className="text-[10px] opacity-30">None</span>}
                      </div>
                    </div>
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
              <button onClick={() => { setPicker(null); setSearch(''); setRoleFilter('All'); }} className="text-sm px-2 py-1 hover:bg-white/10 rounded" style={{ color: '#FF6666' }}>✕</button>
            </div>
            <input type="text" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 mb-2 rounded text-sm focus:outline-none"
              style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
              autoFocus />
            <div className="flex gap-1 mb-3 flex-wrap">
              {['All', 'Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(role => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className="text-[10px] px-2 py-1 rounded transition-all"
                  style={{
                    background: roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') + '33' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') + '88' : 'rgba(68,102,136,0.3)'}`,
                    color: roleFilter === role ? (ROLE_COLORS[role] || '#00FFFF') : '#999',
                  }}>
                  {role} {role !== 'All' && <span className="opacity-50">({ALL_HEROES.filter(h => h.role === role).length})</span>}
                </button>
              ))}
            </div>
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

const POPULAR_MATCHUPS: [string, string][] = [
  ['Kerrigan', 'Illidan'], ['E.T.C.', 'Diablo'], ['Jaina', 'Li-Ming'],
  ['Muradin', "Anub'arak"], ['Rehgar', 'Brightwing'], ['Zeratul', 'Genji'],
  ['Sonya', 'Thrall'], ['Kael\'thas', 'Chromie'], ['Johanna', 'Garrosh'],
  ['Malfurion', 'Anduin'], ['Valla', 'Raynor'], ['Dehaka', 'Leoric'],
];

function HeroSlot({ hero, label, color, onClick, onDetail, onClear }: { hero: Hero | null; label: string; color: string; onClick: () => void; onDetail?: (h: Hero) => void; onClear?: () => void }) {
  return (
    <button onClick={onClick} onContextMenu={e => { e.preventDefault(); if (hero && onDetail) onDetail(hero); }} className="p-4 rounded text-center transition-all hover:brightness-110 relative group" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `2px solid ${hero ? color : 'rgba(68,102,136,0.5)'}` }}>
      {hero ? (
        <div className="flex flex-col items-center gap-2">
          <HeroPortrait hero={hero} size="lg" />
          <span className="text-sm font-bold">{hero.nicknames[0]}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: (ROLE_COLORS[hero.role] || '#888') + '33', color: ROLE_COLORS[hero.role] }}>{hero.role}</span>
          {onClear && (
            <span onClick={e => { e.stopPropagation(); onClear(); }} className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10" style={{ color: '#FF6666' }}>✕</span>
          )}
        </div>
      ) : (
        <div className="py-6">
          <span className="text-3xl block mb-2">🦸</span>
          <p className="text-sm font-semibold" style={{ color }}>{label}</p>
          <p className="text-xs opacity-40 mt-1">Click to select a hero</p>
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
