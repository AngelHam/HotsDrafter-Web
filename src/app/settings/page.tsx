'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DraftSettings, AnalysisMode } from '@/data/DraftSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [suggestionCount, setSuggestionCount] = useState(5);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.Full);
  const [quickDraft, setQuickDraft] = useState(false);
  const [firstPickTeam, setFirstPickTeam] = useState(1);

  useEffect(() => {
    DraftSettings.load();
    setSuggestionCount(DraftSettings.suggestionCount);
    setAnalysisMode(DraftSettings.currentAnalysisMode);
    setQuickDraft(DraftSettings.quickDraft);
    setFirstPickTeam(DraftSettings.firstPickTeam);
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">← Back</button>
        <h1 className="text-lg font-bold" style={{ color: '#A9A9A9' }}>⚙️ Settings</h1>
        <div />
      </div>

      <div className="flex-1 flex justify-center p-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Suggestion Count */}
          <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
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

          {/* Analysis Mode */}
          <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
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

          {/* Reset */}

          {/* First Pick Team */}
          <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>First Pick Team</h3>
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
                  title={`Team ${t} picks first`}>
                  Team {t}{t === 1 ? ' (You)' : ' (Enemy)'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Draft */}
          <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Quick Draft</h3>
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

          {/* Reset */}
          <button onClick={handleReset}
            className="w-full px-4 py-3 rounded font-semibold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#FF666622', border: '2px solid #FF6666', color: '#FF6666' }}
            title="Reset all settings to defaults">
            Reset All Settings
          </button>

          <p className="text-center text-xs opacity-30 mt-4">HotsDrafter v2 Web — Settings are saved automatically</p>
        </div>
      </div>
    </div>
  );
}
