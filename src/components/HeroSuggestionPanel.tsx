'use client';

import type { HeroSuggestion } from '@/data/SuggestionTypes';
import HeroPortrait from './HeroPortrait';

const SUGGESTION_ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9',
};

interface HeroSuggestionPanelProps {
  suggestions: HeroSuggestion[];
  onSelect?: (suggestion: HeroSuggestion) => void;
  title?: string;
}

export default function HeroSuggestionPanel({ suggestions, onSelect, title = 'Suggestions' }: HeroSuggestionPanelProps) {
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
        {suggestions.map((s, i) => (
          <button
            key={s.hero.name}
            onClick={() => onSelect?.(s)}
            className="flex items-center gap-2 w-full p-2 rounded transition-all hover:bg-white/10 text-left"
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
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                  background: s.totalScore >= 50 ? '#00FF0022' : s.totalScore >= 30 ? '#FFD70022' : '#FF666622',
                  color: s.totalScore >= 50 ? '#90EE90' : s.totalScore >= 30 ? '#FFD700' : '#FF6666',
                  border: `1px solid ${s.totalScore >= 50 ? '#90EE9044' : s.totalScore >= 30 ? '#FFD70044' : '#FF666644'}`,
                }}>
                  {s.totalScore.toFixed(0)}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', minWidth: 60 }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(s.totalScore, 100)}%`,
                    background: `linear-gradient(90deg, ${s.totalScore >= 50 ? '#90EE90' : s.totalScore >= 30 ? '#FFD700' : '#FF6666'}, ${s.totalScore >= 50 ? '#90EE9088' : s.totalScore >= 30 ? '#FFD70088' : '#FF666688'})`,
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
        ))}
      </div>
    </div>
  );
}
