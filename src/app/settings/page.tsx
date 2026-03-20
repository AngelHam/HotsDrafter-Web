'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DraftSettings, AnalysisMode } from '@/data/DraftSettings';
import { clearHistory } from '@/data/DraftHistory';
import { ALL_HEROES, ALL_MAPS } from '@/data/HeroData';

const CARD = { background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' } as const;

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED',
  Healer: '#90EE90',
  DPS: '#FF6347',
  Mage: '#BA55D3',
  Offlane: '#FFA500',
  Specialist: '#A9A9A9',
};

const ROLE_ICONS: Record<string, string> = {
  Tank: '🛡️',
  Healer: '💚',
  DPS: '⚔️',
  Mage: '🔮',
  Offlane: '🗡️',
  Specialist: '🔧',
};

const WEIGHT_TOOLTIPS: Record<string, string> = {
  Synergy: 'How well this hero combos with your existing teammates',
  Counter: 'How effectively this hero shuts down enemy picks',
  'Map Fitness': 'How strong this hero is on the selected battleground',
  'Role Need': 'Whether your team still needs this role filled',
  'Win Condition': 'How well this hero supports your team\'s win strategy',
};

const THEME_PALETTE = [
  { label: 'Background', color: '#1a1a2e' },
  { label: 'Card', color: 'rgb(30, 40, 70)' },
  { label: 'Accent', color: '#00FFFF' },
  { label: 'Gold', color: '#FFD700' },
  { label: 'Blue', color: '#4488FF' },
  { label: 'Red', color: '#FF6666' },
  { label: 'Green', color: '#00FF00' },
  { label: 'Border', color: 'rgb(68,102,136)' },
];

const SHORTCUT_GROUPS = [
  {
    group: 'Draft',
    shortcuts: [
      { keys: ['1', '–', '9'], desc: 'Quick-pick suggestion by number' },
      { keys: ['U'], desc: 'Undo last pick or ban' },
      { keys: ['Ctrl', 'Z'], desc: 'Undo (alternative)' },
      { keys: ['R'], desc: 'Reset the entire draft' },
    ],
  },
  {
    group: 'Navigation',
    shortcuts: [
      { keys: ['/'], desc: 'Focus hero search box' },
      { keys: ['Tab'], desc: 'Cycle through role filters' },
    ],
  },
  {
    group: 'General',
    shortcuts: [
      { keys: ['Esc'], desc: 'Close modals & overlays' },
      { keys: ['?'], desc: 'Toggle keyboard shortcut help' },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [suggestionCount, setSuggestionCount] = useState(5);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.Full);
  const [quickDraft, setQuickDraft] = useState(false);
  const [firstPickTeam, setFirstPickTeam] = useState(1);
  const [showCoachingTips, setShowCoachingTips] = useState(true);
  const [hoveredWeight, setHoveredWeight] = useState<string | null>(null);

  useEffect(() => {
    DraftSettings.load();
    setSuggestionCount(DraftSettings.suggestionCount);
    setAnalysisMode(DraftSettings.currentAnalysisMode);
    setQuickDraft(DraftSettings.quickDraft);
    setFirstPickTeam(DraftSettings.firstPickTeam);
    setShowCoachingTips(DraftSettings.showCoachingTips);
  }, []);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const hero of ALL_HEROES) {
      counts[hero.role] = (counts[hero.role] || 0) + 1;
    }
    return counts;
  }, []);

  const maxRoleCount = useMemo(() => Math.max(...Object.values(roleCounts)), [roleCounts]);

  const getMapParam = () => {
    if (DraftSettings.useRandomMap || DraftSettings.selectedMapIndex < 0) {
      return Math.floor(Math.random() * ALL_MAPS.length).toString();
    }
    return DraftSettings.selectedMapIndex.toString();
  };

  const selectedMapName = useMemo(() => {
    DraftSettings.load();
    if (DraftSettings.useRandomMap || DraftSettings.selectedMapIndex < 0) return 'Random Map';
    return ALL_MAPS[DraftSettings.selectedMapIndex]?.name ?? 'Random Map';
  }, []);

  const handleSuggestionCount = (n: number) => {
    setSuggestionCount(n);
    DraftSettings.suggestionCount = n;
    DraftSettings.save();
  };

  const handleAnalysisMode = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    DraftSettings.currentAnalysisMode = mode;
    DraftSettings.save();
  };

  const handleReset = () => {
    DraftSettings.reset();
    setSuggestionCount(5);
    setAnalysisMode(AnalysisMode.Full);
    setQuickDraft(false);
    setFirstPickTeam(1);
    setShowCoachingTips(true);
  };

  return (
    <div className="min-h-screen flex flex-col page-enter pb-14" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 smooth-transition" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#A9A9A9' }}>⚙️ Settings</h1>
        <div />
      </div>

      <div className="flex-1 flex justify-center p-8">
        <div className="w-full max-w-lg space-y-6">

          {/* ── Quick Draft CTA ── */}
          <button
            onClick={() => router.push(`/draft?map=${getMapParam()}`)}
            className="w-full p-5 rounded-lg text-left transition-all hover:scale-[1.01] group"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,255,0.12) 0%, rgba(255,215,0,0.08) 100%)',
              border: '2px solid #00FFFF',
              boxShadow: '0 0 20px rgba(0,255,255,0.1)',
            }}
            title="Jump straight into a draft with current settings"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold" style={{ color: '#00FFFF' }}>⚡ Quick Draft</span>
                <p className="text-sm mt-1 opacity-70" style={{ color: '#ccc' }}>
                  Jump straight into a draft with current settings
                </p>
              </div>
              <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">→</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: '#87CEEB' }}>
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00FFFF33' }}>
                🗺️ {selectedMapName}
              </span>
              <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD70033' }}>
                📊 {analysisMode} Analysis
              </span>
              {quickDraft && (
                <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(144,238,144,0.1)', border: '1px solid #90EE9033' }}>
                  ⏩ No Bans
                </span>
              )}
            </div>
          </button>

          {/* ── Suggestion Count ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Suggestion Count</h3>
            <div className="flex gap-3">
              {[3, 5, 7].map(n => (
                <button key={n} onClick={() => handleSuggestionCount(n)}
                  className="px-4 py-2 rounded font-semibold transition-all hover:bg-white/10"
                  style={{
                    background: suggestionCount === n ? '#00FFFF22' : 'transparent',
                    border: `2px solid ${suggestionCount === n ? '#00FFFF' : 'rgba(68,102,136,0.5)'}`,
                    color: suggestionCount === n ? '#00FFFF' : '#888',
                  }}
                  title={`Show top ${n} suggestions`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* ── Analysis Mode ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Analysis Mode</h3>
            <div className="flex gap-3">
              <button onClick={() => handleAnalysisMode(AnalysisMode.Simple)}
                className="px-4 py-2 rounded font-semibold flex-1 transition-all hover:bg-white/10"
                style={{
                  background: analysisMode === AnalysisMode.Simple ? '#FFD70022' : 'transparent',
                  border: `2px solid ${analysisMode === AnalysisMode.Simple ? '#FFD700' : 'rgba(68,102,136,0.5)'}`,
                  color: analysisMode === AnalysisMode.Simple ? '#FFD700' : '#888',
                }}
                title="Use quick synergy/counter analysis">
                Simple
                <p className="text-xs opacity-60 mt-1">Synergies & Counters only</p>
              </button>
              <button onClick={() => handleAnalysisMode(AnalysisMode.Full)}
                className="px-4 py-2 rounded font-semibold flex-1 transition-all hover:bg-white/10"
                style={{
                  background: analysisMode === AnalysisMode.Full ? '#00FFFF22' : 'transparent',
                  border: `2px solid ${analysisMode === AnalysisMode.Full ? '#00FFFF' : 'rgba(68,102,136,0.5)'}`,
                  color: analysisMode === AnalysisMode.Full ? '#00FFFF' : '#888',
                }}
                title="Use full weighted draft analysis">
                Full
                <p className="text-xs opacity-60 mt-1">9-component weighted analysis</p>
              </button>
            </div>
          </div>

          {/* ── Scoring Weights ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Scoring Weights</h3>
            <div className="space-y-2">
              {[
                { label: 'Synergy', weight: 30, color: '#90EE90' },
                { label: 'Counter', weight: 25, color: '#FF6347' },
                { label: 'Map Fitness', weight: 20, color: '#87CEEB' },
                { label: 'Role Need', weight: 15, color: '#BA55D3' },
                { label: 'Win Condition', weight: 10, color: '#FFD700' },
              ].map(({ label, weight, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded transition-all cursor-default"
                  style={{
                    background: hoveredWeight === label ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredWeight(label)}
                  onMouseLeave={() => setHoveredWeight(null)}
                >
                  <span className="text-xs w-24 font-medium" style={{ color }}>{label}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${weight}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color}cc)`,
                        boxShadow: hoveredWeight === label ? `0 0 8px ${color}66` : 'none',
                      }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right font-semibold" style={{ color: hoveredWeight === label ? color : '#888' }}>{weight}%</span>
                </div>
              ))}
            </div>
            {/* Tooltip */}
            <div
              className="overflow-hidden transition-all"
              style={{
                maxHeight: hoveredWeight ? '40px' : '0',
                opacity: hoveredWeight ? 1 : 0,
              }}
            >
              <p className="text-xs mt-2 px-2 py-1 rounded" style={{ color: '#ccc', background: 'rgba(0,255,255,0.05)', border: '1px solid #00FFFF22' }}>
                💡 {hoveredWeight ? WEIGHT_TOOLTIPS[hoveredWeight] : ''}
              </p>
            </div>
            <p className="text-[10px] opacity-40 mt-2">Weights are optimized for balanced draft analysis</p>
          </div>

          {/* ── First Pick Team ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-2" style={{ color: '#00FFFF' }}>First Pick Team</h3>
            <p className="text-xs opacity-50 mb-3">Choose which team bans and picks first in the draft order</p>
            <div className="flex gap-3">
              {[1, 2].map(t => (
                <button key={t}
                  onClick={() => {
                    setFirstPickTeam(t);
                    DraftSettings.firstPickTeam = t;
                    DraftSettings.save();
                  }}
                  className="px-4 py-2 rounded font-semibold flex-1 transition-all hover:bg-white/10"
                  style={{
                    background: firstPickTeam === t ? (t === 1 ? '#4488FF22' : '#FF666622') : 'transparent',
                    border: `2px solid ${firstPickTeam === t ? (t === 1 ? '#4488FF' : '#FF6666') : 'rgba(68,102,136,0.5)'}`,
                    color: firstPickTeam === t ? (t === 1 ? '#4488FF' : '#FF6666') : '#888',
                  }}
                  title={`Team ${t} bans and picks first`}>
                  Team {t}{t === 1 ? ' (You)' : ' (Enemy)'}
                  <p className="text-xs opacity-60 mt-1">{t === 1 ? 'Standard — you ban/pick first' : 'Enemy leads — respond to their picks'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Quick Draft Toggle ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Quick Draft Mode</h3>
            <button
              onClick={() => {
                const next = !quickDraft;
                setQuickDraft(next);
                DraftSettings.quickDraft = next;
                DraftSettings.save();
              }}
              className="px-4 py-2 rounded font-semibold transition-all hover:bg-white/10"
              style={{
                background: quickDraft ? '#90EE9022' : 'transparent',
                border: `2px solid ${quickDraft ? '#90EE90' : 'rgba(68,102,136,0.5)'}`,
                color: quickDraft ? '#90EE90' : '#888',
              }}
              title="Skip all bans and go straight to picks"
            >
              {quickDraft ? '✅ Enabled' : 'Disabled'}
              <p className="text-xs opacity-60 mt-1">Skip bans — 10 picks only</p>
            </button>
          </div>

          {/* ── Coaching Tips Toggle ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-2" style={{ color: '#00FFFF' }}>💡 Coaching Tips</h3>
            <p className="text-xs opacity-50 mb-3">Show contextual tips during the draft to help with bans, picks, and composition</p>
            <button
              onClick={() => {
                const next = !showCoachingTips;
                setShowCoachingTips(next);
                DraftSettings.showCoachingTips = next;
                DraftSettings.save();
              }}
              className="px-4 py-2 rounded font-semibold transition-all hover:bg-white/10"
              style={{
                background: showCoachingTips ? '#FFD70022' : 'transparent',
                border: `2px solid ${showCoachingTips ? '#FFD700' : 'rgba(68,102,136,0.5)'}`,
                color: showCoachingTips ? '#FFD700' : '#888',
              }}
              title="Toggle coaching tips during draft"
            >
              {showCoachingTips ? '✅ Enabled' : 'Disabled'}
              <p className="text-xs opacity-60 mt-1">Contextual advice for each draft phase</p>
            </button>
          </div>

          {/* ── Reset Buttons ── */}
          <div className="flex gap-2">
            <button onClick={handleReset}
              className="flex-1 px-4 py-3 rounded font-semibold transition-all hover:scale-105 hover:bg-white/10"
              style={{ background: '#FF666622', border: '2px solid #FF6666', color: '#FF6666' }}
              title="Reset all settings to defaults">
              Reset Settings
            </button>
            <button onClick={() => { clearHistory(); alert('Draft history cleared!'); }}
              className="flex-1 px-4 py-3 rounded font-semibold transition-all hover:scale-105 hover:bg-white/10"
              style={{ background: '#FFA50022', border: '2px solid #FFA500', color: '#FFA500' }}
              title="Delete all saved draft history">
              Clear History
            </button>
          </div>

          {/* ── Theme ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>🎨 Theme</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 px-4 py-2 rounded font-semibold text-center" style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}>
                🌙 Dark Mode
                <p className="text-xs opacity-60 mt-1">Active</p>
              </div>
              <div className="flex-1 px-4 py-2 rounded font-semibold text-center opacity-40 cursor-not-allowed" style={{ border: '2px solid rgba(68,102,136,0.5)', color: '#888' }}>
                ☀️ Light
                <p className="text-xs opacity-60 mt-1">Coming Soon</p>
              </div>
            </div>
            {/* Color Palette Preview */}
            <div>
              <p className="text-[11px] opacity-50 mb-2">Color Palette</p>
              <div className="flex gap-1.5 flex-wrap">
                {THEME_PALETTE.map(({ label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1" title={`${label}: ${color}`}>
                    <div
                      className="w-7 h-7 rounded-md border transition-transform hover:scale-110"
                      style={{ background: color, borderColor: 'rgba(255,255,255,0.15)' }}
                    />
                    <span className="text-[9px] opacity-40">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Data Statistics ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>📊 Data Statistics</h3>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              {[
                { label: 'Total Heroes', value: String(ALL_HEROES.length), color: '#FFD700' },
                { label: 'Maps', value: String(ALL_MAPS.length), color: '#87CEEB' },
                { label: 'Win Conditions', value: '8', color: '#BA55D3' },
                { label: 'Specialties', value: '50+', color: '#00FFFF' },
                { label: 'Synergy Rules', value: '40+', color: '#90EE90' },
                { label: 'Counter Rules', value: '35+', color: '#FF6347' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="opacity-60">{label}</span>
                  <span className="font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Heroes by Role Breakdown */}
            <div>
              <p className="text-[11px] opacity-50 mb-2">Heroes by Role</p>
              <div className="space-y-1.5">
                {Object.entries(ROLE_COLORS).map(([role, color]) => {
                  const count = roleCounts[role] || 0;
                  return (
                    <div key={role} className="flex items-center gap-2">
                      <span className="text-xs w-5 text-center" title={role}>{ROLE_ICONS[role]}</span>
                      <span className="text-xs w-16" style={{ color }}>{role}</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / maxRoleCount) * 100}%`,
                            background: `linear-gradient(90deg, ${color}66, ${color}cc)`,
                          }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right font-mono" style={{ color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] opacity-30 mt-3">Last data update: July 2025 · Source: Icy Veins</p>
          </div>

          {/* ── Keyboard Shortcuts ── */}
          <div className="p-4 rounded" style={CARD}>
            <h3 className="font-bold mb-4" style={{ color: '#00FFFF' }}>⌨️ Keyboard Shortcuts</h3>
            <div className="space-y-4">
              {SHORTCUT_GROUPS.map(({ group, shortcuts }) => (
                <div key={group}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#FFD700', opacity: 0.7 }}>{group}</p>
                  <div className="space-y-1.5">
                    {shortcuts.map(({ keys, desc }) => (
                      <div key={desc} className="flex items-center justify-between px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-xs opacity-70">{desc}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {keys.map((k, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && k !== '–' && keys[i - 1] !== '–' && (
                                <span className="text-[10px] opacity-30">+</span>
                              )}
                              {k === '–' ? (
                                <span className="text-[10px] opacity-30">–</span>
                              ) : (
                                <kbd
                                  className="px-1.5 py-0.5 rounded font-mono text-[11px] min-w-[22px] text-center"
                                  style={{
                                    background: 'rgba(0,255,255,0.08)',
                                    color: '#00FFFF',
                                    border: '1px solid #00FFFF33',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                  }}
                                >
                                  {k}
                                </kbd>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── About ── */}
          <div className="p-5 rounded text-center" style={CARD}>
            <p className="font-bold text-base mb-1" style={{ color: '#00FFFF' }}>HotsDrafter v3.2</p>
            <p className="text-xs font-medium mb-3" style={{ color: '#FFD700', opacity: 0.8 }}>React Edition</p>
            <div className="space-y-1 text-xs opacity-50">
              <p>Built with Next.js, React 19, and Tailwind CSS</p>
              <p>Data sourced from Icy Veins</p>
              <p className="pt-1 font-mono text-[11px] opacity-60">github.com/hotsdrafter</p>
            </div>
            <div className="mt-3 flex justify-center gap-2 text-[10px] opacity-40">
              <span>{ALL_HEROES.length} Heroes</span>
              <span>·</span>
              <span>{ALL_MAPS.length} Maps</span>
              <span>·</span>
              <span>8 Win Conditions</span>
            </div>
          </div>

          {/* ── Nuclear Reset ── */}
          <button
            onClick={() => {
              if (window.confirm('Reset all settings to defaults? This will reload the page.')) {
                localStorage.removeItem('hotsDrafter-settings');
                localStorage.removeItem('hotsDrafter-history');
                window.location.reload();
              }
            }}
            className="w-full px-4 py-3 rounded font-semibold transition-all hover:scale-[1.02] hover:bg-red-500/10"
            style={{ background: 'transparent', border: '2px solid #FF4444', color: '#FF4444' }}
            title="Clear all saved settings and reload the page"
          >
            Reset All Settings
          </button>

          <p className="text-center text-xs opacity-30 mt-2 pb-4">Settings are saved automatically</p>
        </div>
      </div>
    </div>
  );
}
