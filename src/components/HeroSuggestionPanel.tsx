'use client';

import type { HeroSuggestion } from '@/data/SuggestionTypes';
import HeroPortrait from './HeroPortrait';

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
    <div className="p-3 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="text-sm font-bold mb-2" style={{ color: '#00FFFF' }}>{title}</h3>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <button
            key={s.hero.name}
            onClick={() => onSelect?.(s)}
            className="flex items-center gap-2 w-full p-2 rounded transition-all hover:bg-white/10 text-left"
          >
            <span className="text-xs font-bold w-5 text-center" style={{ color: '#FFD700' }}>
              {i + 1}
            </span>
            <HeroPortrait hero={s.hero} size="sm" onClick={undefined} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{s.hero.nicknames[0]}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FFD70033', color: '#FFD700' }}>
                  {s.totalScore.toFixed(0)}
                </span>
              </div>
              <p className="text-xs opacity-70 truncate">{s.explanation}</p>
              {(s.synergyCount > 0 || s.counterCount > 0) && (
                <div className="flex gap-2 mt-0.5">
                  {s.synergyCount > 0 && (
                    <span className="text-xs" style={{ color: '#90EE90' }}>
                      +{s.synergyCount} syn
                    </span>
                  )}
                  {s.counterCount > 0 && (
                    <span className="text-xs" style={{ color: '#FF6347' }}>
                      ↑{s.counterCount} ctr
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
