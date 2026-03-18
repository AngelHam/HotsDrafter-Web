'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DraftSettings, AnalysisMode } from '@/data/DraftSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [suggestionCount, setSuggestionCount] = useState(5);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.Full);

  useEffect(() => {
    DraftSettings.load();
    setSuggestionCount(DraftSettings.suggestionCount);
    setAnalysisMode(DraftSettings.currentAnalysisMode);
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }}>← Back</button>
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
                  className="px-4 py-2 rounded font-semibold transition-all"
                  style={{
                    background: suggestionCount === n ? '#00FFFF22' : 'transparent',
                    border: `2px solid ${suggestionCount === n ? '#00FFFF' : 'rgba(68,102,136,0.5)'}`,
                    color: suggestionCount === n ? '#00FFFF' : '#888',
                  }}>
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
                className="px-4 py-2 rounded font-semibold flex-1 transition-all"
                style={{
                  background: analysisMode === AnalysisMode.Simple ? '#FFD70022' : 'transparent',
                  border: `2px solid ${analysisMode === AnalysisMode.Simple ? '#FFD700' : 'rgba(68,102,136,0.5)'}`,
                  color: analysisMode === AnalysisMode.Simple ? '#FFD700' : '#888',
                }}>
                Simple
                <p className="text-xs opacity-60 mt-1">Synergies & Counters only</p>
              </button>
              <button onClick={() => handleAnalysisMode(AnalysisMode.Full)}
                className="px-4 py-2 rounded font-semibold flex-1 transition-all"
                style={{
                  background: analysisMode === AnalysisMode.Full ? '#00FFFF22' : 'transparent',
                  border: `2px solid ${analysisMode === AnalysisMode.Full ? '#00FFFF' : 'rgba(68,102,136,0.5)'}`,
                  color: analysisMode === AnalysisMode.Full ? '#00FFFF' : '#888',
                }}>
                Full
                <p className="text-xs opacity-60 mt-1">9-component weighted analysis</p>
              </button>
            </div>
          </div>

          {/* Reset */}
          <button onClick={handleReset}
            className="w-full px-4 py-3 rounded font-semibold transition-all hover:scale-105"
            style={{ background: '#FF666622', border: '2px solid #FF6666', color: '#FF6666' }}>
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
