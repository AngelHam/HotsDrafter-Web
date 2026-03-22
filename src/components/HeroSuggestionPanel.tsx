'use client';

import React from 'react';
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

function getStarRating(score: number): { filled: number; empty: number } {
  let filled: number;
  if (score >= 80) filled = 5;
  else if (score >= 65) filled = 4;
  else if (score >= 50) filled = 3;
  else if (score >= 35) filled = 2;
  else filled = 1;
  return { filled, empty: 5 - filled };
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

function HeroSuggestionPanel({ suggestions, onSelect, title = 'Suggestions', mapName }: HeroSuggestionPanelProps) {
  const isBanPhase = title.toLowerCase().includes('ban');
  const indicatorColor = isBanPhase ? '#FF6666' : '#00FFFF';

  if (suggestions.length === 0) {
    return (
      <div className="p-2 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
        <h3 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: indicatorColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: indicatorColor }} />
          {title}
        </h3>
        <p className="text-xs opacity-70">No suggestions available yet</p>
      </div>
    );
  }

  return (
    <div className="p-2 rounded transition-opacity duration-200" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }} role="region" aria-label={title} aria-live="polite">
      <h3 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: indicatorColor }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: indicatorColor }} />
        {title}
      </h3>
      <div className="space-y-1" role="list" aria-label="Hero suggestions">
        {suggestions.map((s, i) => {
          const stars = getStarRating(s.totalScore);
          return (
          <button
            key={s.hero.name}
            onClick={() => onSelect?.(s)}
            className={`suggestion-card card-enter w-full p-2 rounded text-left${i === 0 ? ' suggestion-card-top-pick' : ''}`}
            style={{ animationDelay: `${i * 50}ms` }}
            title={i < 9 ? `Press ${i + 1} to quick-pick` : 'Suggestion'}
            role="listitem"
            aria-label={`Suggestion ${i + 1}: ${s.hero.nicknames[0]} - ${s.hero.role} - ${stars.filled} stars`}
          >
            {/* Line 1: Rank + Portrait + Name + Role + Stars */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold w-4 text-center flex-shrink-0" style={{ color: '#FFD700' }}>
                {i + 1}.
              </span>
              <HeroPortrait hero={s.hero} size="sm" onClick={undefined} />
              <span className="text-xs font-semibold truncate">{s.hero.nicknames[0]}</span>
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
              <span className="relative group/score flex-shrink-0 ml-auto">
                <span className="text-[11px] cursor-help" style={{ color: '#FFD700', letterSpacing: '-1px' }}>
                  {'★'.repeat(stars.filled)}{'☆'.repeat(stars.empty)}
                </span>
                <span className="hidden group-hover/score:block">
                  <ScoreTooltip s={s} />
                </span>
              </span>
            </div>
            {/* Line 2: Reason text — full width, not truncated */}
            <p className="text-[11px] opacity-80 mt-1 ml-6 leading-snug">{s.explanation}</p>
            {/* Line 3: Synergy/counter tags */}
            {(s.synergyCount > 0 || s.counterCount > 0 || s.counteredByCount > 0) && (
              <div className="flex gap-2 mt-1 ml-6 flex-wrap">
                {s.synergyWith && s.synergyWith.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#90EE90', background: '#90EE9015' }}>
                    Synergy: {s.synergyWith.join(', ')}
                  </span>
                )}
                {s.countersAgainst && s.countersAgainst.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#FF6347', background: '#FF634715' }}>
                    Counters: {s.countersAgainst.join(', ')}
                  </span>
                )}
                {s.synergyCount > 0 && (!s.synergyWith || s.synergyWith.length === 0) && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#90EE90', background: '#90EE9015' }}>+{s.synergyCount} syn</span>
                )}
                {s.counterCount > 0 && (!s.countersAgainst || s.countersAgainst.length === 0) && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#FF6347', background: '#FF634715' }}>↑{s.counterCount} ctr</span>
                )}
                {s.counteredByCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#FFA500', background: '#FFA50015' }}>
                    ⚠{s.counteredByCount} threat{s.counteredByCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(HeroSuggestionPanel);
