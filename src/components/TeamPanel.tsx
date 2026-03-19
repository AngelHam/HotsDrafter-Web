'use client';

import type { Hero } from '@/data/Hero';
import { Specialty } from '@/data/Specialty';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import HeroPortrait from './HeroPortrait';

const ROLE_COLORS_MAP: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

interface TeamPanelProps {
  teamNumber: number;
  picks: Hero[];
  bans: Hero[];
  isActive?: boolean;
  enemyPicks?: Hero[];
  onHeroClick?: (hero: Hero) => void;
}

const ROLE_CHECKS = [
  { label: 'Tank', icon: '🛡️', check: (h: Hero) => h.role === 'Tank' },
  { label: 'Healer', icon: '✚', check: (h: Hero) => h.role === 'Healer' },
  { label: 'DPS', icon: '⚔️', check: (h: Hero) => h.role === 'DPS' || h.role === 'Mage' },
  { label: 'Offlane', icon: '⚙️', check: (h: Hero) => h.role === 'Offlane' || h.specialties.includes(Specialty.DOUBLE_SOAKING) },
  { label: 'Waveclear', icon: '🌊', check: (h: Hero) => h.specialties.includes(Specialty.WAVECLEAR) },
];

export default function TeamPanel({ teamNumber, picks, bans, isActive, enemyPicks = [], onHeroClick }: TeamPanelProps) {
  const teamColor = teamNumber === 1 ? '#4488FF' : '#FF6666';
  const teamLabel = teamNumber === 1 ? 'TEAM 1 (You)' : 'TEAM 2 (Enemy)';

  // Compute a simple composition score (0-100)
  const compScore = picks.length > 0 ? computeCompScore(picks) : null;
  const scoreColor = compScore !== null ? (compScore >= 80 ? '#90EE90' : compScore >= 50 ? '#FFD700' : '#FF6666') : '#666';

  return (
    <div className={`p-3 rounded transition-all ${isActive ? 'team-panel-active' : ''}`} style={{
      background: 'rgba(30, 40, 70, 0.7)',
      border: isActive ? `2px solid ${teamColor}` : '1px solid rgba(68,102,136,0.5)',
      boxShadow: isActive ? `0 0 15px ${teamColor}33, inset 0 0 20px ${teamColor}11` : 'none',
    }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold" style={{ color: teamColor }}>{teamLabel}</h3>
        {compScore !== null && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: scoreColor + '22', color: scoreColor, border: `1px solid ${scoreColor}44` }}>
            {compScore}
          </span>
        )}
      </div>
      {compScore !== null && (
        <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${compScore}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)` }} />
        </div>
      )}

      {/* Role Coverage */}
      {picks.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {ROLE_CHECKS.map(({ label, icon, check }) => {
            const filled = picks.some(check);
            return (
              <span key={label} className="text-xs px-1 py-0.5 rounded" title={label}
                style={{ background: filled ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)', color: filled ? '#90EE90' : '#FF6666', border: `1px solid ${filled ? '#90EE9044' : '#FF666644'}` }}>
                {icon}{filled ? '✓' : '✗'}
              </span>
            );
          })}
        </div>
      )}

      {/* Composition Alerts */}
      {picks.length >= 3 && (
        <div className="mb-2 space-y-1">
          {!picks.some(h => h.role === 'Tank') && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,0,0,0.15)', color: '#FF6666', border: '1px solid #FF666633' }}>
              ⚠️ No Tank!
            </div>
          )}
          {!picks.some(h => h.role === 'Healer') && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,0,0,0.15)', color: '#FF6666', border: '1px solid #FF666633' }}>
              ⚠️ No Healer!
            </div>
          )}
          {!picks.some(h => h.specialties.includes(Specialty.WAVECLEAR)) && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,0,0,0.15)', color: '#FF6666', border: '1px solid #FF666633' }}>
              ⚠️ No Waveclear!
            </div>
          )}
          {picks.filter(h => h.role === 'Healer').length >= 2 && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid #FFA50033' }}>
              ⚠️ Double Healer
            </div>
          )}
          {picks.filter(h => h.role === 'Tank').length >= 2 && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid #FFA50033' }}>
              ⚠️ Double Tank
            </div>
          )}
        </div>
      )}

      {/* Bans */}
      <div className="mb-3">
        <span className="text-xs font-semibold" style={{ color: '#FF6666' }}>BANS</span>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center" style={{ width: 42 }}>
              <div className="rounded" title={bans[i] ? `Ban ${i + 1}: ${bans[i].nicknames[0]} (${bans[i].role})` : `Ban Slot ${i + 1}`} style={{
                width: 40, height: 40,
                background: 'rgba(255,102,102,0.1)',
                border: '1px solid rgba(255,102,102,0.3)',
                borderStyle: bans[i] ? 'solid' : 'dashed',
              }}>
                {bans[i] && <div className="animate-pop-in cursor-pointer" onClick={() => onHeroClick?.(bans[i])}><HeroPortrait hero={bans[i]} size="sm" banned /></div>}
              </div>
              {bans[i] && (
                <span className="text-[8px] mt-0.5 text-center leading-tight truncate w-full" style={{ color: '#FF6666', opacity: 0.8 }}>
                  {bans[i].nicknames[0]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Picks */}
      <div>
        <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>PICKS</span>
        <div className="flex flex-col gap-1.5 mt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="rounded" title={picks[i] ? `Pick ${i + 1}: ${picks[i].nicknames[0]}` : `Pick Slot ${i + 1}`} style={{
                width: 40, height: 40,
                background: 'rgba(255,215,0,0.1)',
                border: `1px solid ${picks[i] ? '#FFD700' : 'rgba(255,215,0,0.2)'}`,
                borderStyle: picks[i] ? 'solid' : 'dashed',
              }}>
                {picks[i] && <div className="animate-pop-in cursor-pointer" onClick={() => onHeroClick?.(picks[i])}><HeroPortrait hero={picks[i]} size="sm" selected /></div>}
              </div>
              <span className="text-xs truncate opacity-80">
                {picks[i] ? (() => {
                  const hero = picks[i];
                  const icyDb = IcyVeinsDatabase.getInstance();
                  const counteredBy = enemyPicks.filter(e => icyDb.counters(e.nicknames[0], hero.nicknames[0]));
                  return (
                    <span className="flex items-center gap-1">
                      <span className="truncate">{hero.nicknames[0]}</span>
                      <span className="text-[9px] px-1 rounded flex-shrink-0" style={{ background: ROLE_COLORS_MAP[hero.role] + '22', color: ROLE_COLORS_MAP[hero.role] || '#888' }}>
                        {hero.role}
                      </span>
                      {counteredBy.length > 0 && (
                        <span className="text-[8px] px-1 rounded flex-shrink-0" style={{ background: 'rgba(255,99,71,0.2)', color: '#FF6347', border: '1px solid #FF634722' }}
                          title={`Countered by: ${counteredBy.map(e => e.nicknames[0]).join(', ')}`}>
                          ⚠{counteredBy.length}
                        </span>
                      )}
                    </span>
                  );
                })() : (
                  <span className="opacity-40 italic">
                    {i === 0 ? '🛡️ Tank?' : i === 1 ? '✚ Healer?' : i === 2 ? '⚔️ DPS?' : i === 3 ? '⚙️ Offlane?' : '✨ Flex?'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Synergy Lines */}
      {picks.length >= 2 && <SynergyLines picks={picks} />}

      {/* Damage Type Mix */}
      {picks.length >= 2 && (() => {
        const physical = picks.filter(h => h.role === 'DPS' || h.specialties.includes(Specialty.SUSTAINED_DAMAGE)).length;
        const magical = picks.filter(h => h.role === 'Mage' || h.specialties.includes(Specialty.BURST_DAMAGE)).length;
        const label = physical > magical + 1 ? 'Heavy Physical' : magical > physical + 1 ? 'Heavy Magical' : 'Balanced';
        const color = label === 'Balanced' ? '#90EE90' : '#FFA500';
        return (
          <div className="mt-2 pt-1" style={{ borderTop: '1px solid rgba(68,102,136,0.2)' }}>
            <div className="flex items-center gap-1">
              <span className="text-[9px] opacity-50">DMG:</span>
              <div className="flex-1 flex h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ flex: physical || 1, background: '#FF634788' }} />
                <div style={{ flex: magical || 1, background: '#BA55D388' }} />
              </div>
              <span className="text-[8px]" style={{ color }}>{label}</span>
            </div>
            {/* Range indicator */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] opacity-50">RNG:</span>
              <div className="flex gap-0.5 flex-1">
                {picks.map((h, idx) => (
                  <div key={idx} className="h-1.5 rounded-full" style={{ flex: 1, background: `rgba(0,255,255,${0.15 + h.effectiveRange * 0.15})` }} title={`${h.nicknames[0]}: ${h.effectiveRange}/5`} />
                ))}
              </div>
              <span className="text-[8px] opacity-50">{(picks.reduce((s, h) => s + h.effectiveRange, 0) / picks.length).toFixed(1)}</span>
            </div>
            {/* Engage/CC indicator */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] opacity-50">UTIL:</span>
              <div className="flex gap-1 flex-1">
                {[
                  { label: 'CC', has: picks.some(h => h.specialties.includes(Specialty.HARD_CC)), color: '#87CEEB' },
                  { label: 'Engage', has: picks.some(h => h.specialties.includes(Specialty.ENGAGE)), color: '#FFD700' },
                  { label: 'Peel', has: picks.some(h => h.specialties.includes(Specialty.DISENGAGE)), color: '#90EE90' },
                ].map(({ label, has, color }) => (
                  <span key={label} className="text-[7px] px-0.5 rounded" style={{ background: has ? color + '22' : 'rgba(255,255,255,0.04)', color: has ? color : '#555' }}>
                    {label}{has ? '✓' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function computeCompScore(picks: Hero[]): number {
  let score = 20; // Base score for having picks

  const hasTank = picks.some(h => h.role === 'Tank');
  const hasHealer = picks.some(h => h.role === 'Healer');
  const hasDPS = picks.some(h => h.role === 'DPS' || h.role === 'Mage');
  const hasOfflane = picks.some(h => h.role === 'Offlane');
  const hasWaveclear = picks.some(h => h.specialties.includes(Specialty.WAVECLEAR));
  const hasEngage = picks.some(h => h.specialties.includes(Specialty.ENGAGE));
  const hasHardCC = picks.some(h => h.specialties.includes(Specialty.HARD_CC));

  // Role fulfillment (max 50 points)
  if (hasTank) score += 15;
  if (hasHealer) score += 15;
  if (hasDPS) score += 10;
  if (hasOfflane) score += 10;

  // Specialty coverage (max 30 points)
  if (hasWaveclear) score += 10;
  if (hasEngage) score += 10;
  if (hasHardCC) score += 10;

  // Penalty for duplicates
  const tankCount = picks.filter(h => h.role === 'Tank').length;
  const healerCount = picks.filter(h => h.role === 'Healer').length;
  if (tankCount >= 2) score -= 10;
  if (healerCount >= 2) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function SynergyLines({ picks }: { picks: Hero[] }) {
  const icyVeins = IcyVeinsDatabase.getInstance();
  const synergies: string[] = [];

  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      const a = picks[i].nicknames[0];
      const b = picks[j].nicknames[0];
      if (icyVeins.hasSynergy(a, b)) {
        synergies.push(`${a} + ${b}`);
      }
    }
  }

  if (synergies.length === 0) return null;

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(68,102,136,0.3)' }}>
      <span className="text-[10px] font-semibold" style={{ color: '#90EE90' }}>SYNERGIES</span>
      <div className="mt-0.5 space-y-0.5">
        {synergies.slice(0, 3).map(s => (
          <p key={s} className="text-[10px]" style={{ color: '#90EE90' }}>✦ {s}</p>
        ))}
        {synergies.length > 3 && (
          <p className="text-[10px] opacity-50">+{synergies.length - 3} more</p>
        )}
      </div>
    </div>
  );
}
