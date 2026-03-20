'use client';

import type { HeroSuggestion } from '@/data/SuggestionTypes';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import HeroPortrait from './HeroPortrait';

const SUGGESTION_ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

function getScoreColor(score: number): { color: string; gradient: string; bg: string; border: string } {
  if (score >= 26) return { color: '#4CAF50', gradient: 'linear-gradient(90deg, #388E3C, #4CAF50)', bg: '#4CAF5022', border: '#4CAF5044' };
  if (score >= 20) return { color: '#8BC34A', gradient: 'linear-gradient(90deg, #689F38, #8BC34A)', bg: '#8BC34A22', border: '#8BC34A44' };
  if (score >= 15) return { color: '#FFD700', gradient: 'linear-gradient(90deg, #FFA000, #FFD700)', bg: '#FFD70022', border: '#FFD70044' };
  if (score >= 10) return { color: '#FF9800', gradient: 'linear-gradient(90deg, #E65100, #FF9800)', bg: '#FF980022', border: '#FF980044' };
  return { color: '#F44336', gradient: 'linear-gradient(90deg, #C62828, #F44336)', bg: '#F4433622', border: '#F4433644' };
}

function ScoreTooltip({ s }: { s: HeroSuggestion }) {
  const components = [
    { label: 'Synergy', val: s.synergyScore, weight: 20 },
    { label: 'Counter', val: s.counterScore, weight: 22 },
    { label: 'Role Need', val: s.roleNeedScore, weight: 18 },
    { label: 'Map Fit', val: s.mapFitnessScore, weight: 12 },
    { label: 'Win Cond', val: s.winConditionScore, weight: 10 },
    { label: 'Range', val: s.rangeScore, weight: 8 },
    { label: 'Draft Pos', val: s.draftPositionScore, weight: 4 },
    { label: 'Dmg Bal', val: s.damageBalanceScore, weight: 3 },
    { label: 'CP Risk', val: s.counterpickRiskScore, weight: 3 },
  ];
  return (
    <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 p-2 rounded shadow-lg pointer-events-none"
      style={{ background: '#1a1a2eF0', border: '1px solid #00FFFF44' }}>
      <div className="text-[10px] font-bold mb-1.5" style={{ color: '#00FFFF' }}>Score Breakdown</div>
      {components.map(({ label, val, weight }) => {
        const contribution = val * weight;
        const barPct = Math.min(val * 100, 100);
        const { color } = getScoreColor(contribution);
        return (
          <div key={label} className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px] w-14 text-right opacity-70">{label}</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
            </div>
            <span className="text-[9px] w-6 text-right" style={{ color }}>{(val * 100).toFixed(0)}%</span>
          </div>
        );
      })}
      <div className="text-[9px] mt-1 pt-1 text-right font-bold" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: '#FFD700' }}>
        Total: {s.totalScore.toFixed(1)}
      </div>
    </div>
  );
}

interface HeroSuggestionPanelProps {
  suggestions: HeroSuggestion[];
  onSelect?: (suggestion: HeroSuggestion) => void;
  title?: string;
  mapName?: string;
}

export default function HeroSuggestionPanel({ suggestions, onSelect, title = 'Suggestions', mapName }: HeroSuggestionPanelProps) {
  if (suggestions.length === 0) {
    return (
      <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#00FFFF' }}>{title}</h3>
        <p className="text-xs opacity-60">No suggestions available yet</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }} role="region" aria-label={title}>
      <h3 className="text-sm font-bold mb-2" style={{ color: '#00FFFF' }}>{title}</h3>
      <div className="space-y-2" role="list" aria-label="Hero suggestions">
        {suggestions.map((s, i) => {
          const sc = getScoreColor(s.totalScore);
          return (
          <button
            key={s.hero.name}
            onClick={() => onSelect?.(s)}
            className={`suggestion-card flex items-center gap-2 w-full p-2 rounded text-left${i === 0 ? ' suggestion-card-top-pick' : ''}`}
            title={i < 9 ? `Press ${i + 1} to quick-pick` : 'Suggestion'}
            role="listitem"
            aria-label={`Suggestion ${i + 1}: ${s.hero.nicknames[0]} - ${s.hero.role} - Score ${s.totalScore.toFixed(0)}`}
          >
            <span className="text-xs font-bold w-5 text-center" style={{ color: '#FFD700' }}>
              {i + 1}
            </span>
            <HeroPortrait hero={s.hero} size="sm" onClick={undefined} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold truncate">{s.hero.nicknames[0]}</span>
                <span className="text-[9px] px-1 rounded flex-shrink-0" style={{
                  background: SUGGESTION_ROLE_COLORS[s.hero.role] + '22',
                  color: SUGGESTION_ROLE_COLORS[s.hero.role] || '#888',
                }}>{s.hero.role}</span>
                {mapName && (() => {
                  const tier = IcyVeinsDatabase.getInstance().getHeroTierOnMap(s.hero.nicknames[0], mapName);
                  if (tier === 'B') return null;
                  const tc: Record<string, string> = { S: '#FFD700', A: '#90EE90', C: '#FFA500', D: '#FF6666' };
                  return <span className="text-[9px] px-1 rounded flex-shrink-0" style={{ background: (tc[tier] || '#888') + '15', color: tc[tier] }}>{tier}</span>;
                })()}
                <span className="relative group/score">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded cursor-help" style={{
                    background: sc.bg,
                    color: sc.color,
                    border: `1px solid ${sc.border}`,
                  }}>
                    {s.totalScore.toFixed(0)}
                  </span>
                  <span className="hidden group-hover/score:block">
                    <ScoreTooltip s={s} />
                  </span>
                </span>
                <span className="text-[10px]" style={{ color: '#FFD700', letterSpacing: '-1px' }} title={`Confidence: ${s.totalScore >= 60 ? 'Very High' : s.totalScore >= 45 ? 'High' : s.totalScore >= 30 ? 'Medium' : 'Low'}`}>
                  {'★'.repeat(Math.min(5, Math.max(1, Math.ceil(s.totalScore / 20))))}{'☆'.repeat(Math.max(0, 5 - Math.ceil(s.totalScore / 20)))}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', minWidth: 60 }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min((s.totalScore / 30) * 100, 100)}%`,
                    background: sc.gradient,
                  }} />
                </div>
              </div>
              <p className="text-xs opacity-70 truncate">{s.explanation}</p>
              {/* Component Score Breakdown */}
              <div className="flex gap-0.5 mt-1">
                {[
                  { label: 'Syn', val: s.synergyScore, color: '#90EE90' },
                  { label: 'Ctr', val: s.counterScore, color: '#FF6347' },
                  { label: 'Map', val: s.mapFitnessScore, color: '#87CEEB' },
                  { label: 'Role', val: s.roleNeedScore, color: '#BA55D3' },
                  { label: 'Win', val: s.winConditionScore, color: '#FFD700' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex-1 min-w-0" title={`${label}: ${val.toFixed(1)}`}>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(val * 5, 100)}%`, background: color + '99' }} />
                    </div>
                  </div>
                ))}
              </div>
              {(s.synergyCount > 0 || s.counterCount > 0) && (
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  {s.synergyWith && s.synergyWith.length > 0 && (
                    <span className="text-[10px]" style={{ color: '#90EE90' }}>
                      ✦ {s.synergyWith.join(', ')}
                    </span>
                  )}
                  {s.countersAgainst && s.countersAgainst.length > 0 && (
                    <span className="text-[10px]" style={{ color: '#FF6347' }}>
                      ↑ vs {s.countersAgainst.join(', ')}
                    </span>
                  )}
                  {s.synergyCount > 0 && (!s.synergyWith || s.synergyWith.length === 0) && (
                    <span className="text-[10px]" style={{ color: '#90EE90' }}>+{s.synergyCount} syn</span>
                  )}
                  {s.counterCount > 0 && (!s.countersAgainst || s.countersAgainst.length === 0) && (
                    <span className="text-[10px]" style={{ color: '#FF6347' }}>↑{s.counterCount} ctr</span>
                  )}
                </div>
              )}
              {s.counteredByCount > 0 && (
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[10px]" style={{ color: '#FFA500' }}>
                    ⚠️ {s.counteredByCount} threat{s.counteredByCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {i < 9 && (
                <div className="text-[10px] opacity-60 mt-0.5" style={{ color: '#00FFFF' }}>
                  Shortcut: {i + 1}
                </div>
              )}
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
