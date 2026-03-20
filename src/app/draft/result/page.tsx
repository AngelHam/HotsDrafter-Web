'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_MAPS } from '@/data/HeroData';
import { decodeHeroList, decodeMapIndex, exportDraftAsText, encodeDraftUrl } from '@/data/DraftExport';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition, type WinConditionAnalysis } from '@/data/WinConditionAnalyzer';
import { winConditionToString } from '@/data/SuggestionTypes';
import HeroPortrait from '@/components/HeroPortrait';
import type { Hero } from '@/data/Hero';

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED',
  Healer: '#90EE90',
  DPS: '#FF6347',
  Mage: '#BA55D3',
  Offlane: '#FFA500',
  Specialist: '#A9A9A9',
};

function DraftResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState<'url' | 'text' | null>(null);

  const mapIdx = decodeMapIndex(searchParams.get('map'));
  const map = ALL_MAPS[mapIdx];

  const team1Picks = useMemo(() => decodeHeroList(searchParams.get('t1p')), [searchParams]);
  const team2Picks = useMemo(() => decodeHeroList(searchParams.get('t2p')), [searchParams]);
  const team1Bans = useMemo(() => decodeHeroList(searchParams.get('t1b')), [searchParams]);
  const team2Bans = useMemo(() => decodeHeroList(searchParams.get('t2b')), [searchParams]);

  const analysis = useMemo(() => {
    if (team1Picks.length === 0 && team2Picks.length === 0) return null;
    const t1 = new TeamComposition(team1Picks);
    const t2 = new TeamComposition(team2Picks);
    return {
      team1: team1Picks.length > 0 ? analyzeWinCondition(t1, t2) : null,
      team2: team2Picks.length > 0 ? analyzeWinCondition(t2, t1) : null,
    };
  }, [team1Picks, team2Picks]);

  const hasDraft = team1Picks.length > 0 || team2Picks.length > 0;

  function handleCopyUrl() {
    const url = window.location.origin + encodeDraftUrl(mapIdx, team1Picks, team2Picks, team1Bans, team2Bans);
    navigator.clipboard.writeText(url);
    setCopied('url');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCopyText() {
    const text = exportDraftAsText(
      map.name,
      team1Picks, team2Picks,
      team1Bans, team2Bans,
      analysis?.team1 ?? undefined,
      analysis?.team2 ?? undefined
    );
    navigator.clipboard.writeText(text);
    setCopied('text');
    setTimeout(() => setCopied(null), 2000);
  }

  if (!hasDraft) {
    return (
      <main className="page-enter min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="p-6 rounded-lg text-center max-w-md"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#FFD700' }}>No Draft Data</h2>
          <p className="text-sm opacity-70 mb-4">
            This link doesn&apos;t contain valid draft data. Start a new draft to create a shareable summary.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
          >
            🏠 Start New Draft
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter min-h-screen flex flex-col p-2 sm:p-4 pb-20"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="max-w-6xl mx-auto w-full space-y-4">

        {/* Header */}
        <div className="p-4 sm:p-6 rounded-lg text-center"
          style={{ background: 'rgba(0, 255, 255, 0.08)', border: '2px solid #00FFFF66' }}>
          <div className="text-2xl sm:text-4xl mb-2">📋</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#00FFFF' }}>
            Draft Summary
          </h2>
          <p className="text-sm opacity-70">Map: {map.name}</p>
        </div>

        {/* Bans Section */}
        {(team1Bans.length > 0 || team2Bans.length > 0) && (
          <div className="p-4 rounded-lg"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-3" style={{ color: '#FF6666' }}>🚫 Bans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BanList label="Team 1" bans={team1Bans} color="#4488FF" />
              <BanList label="Team 2" bans={team2Bans} color="#FF6666" />
            </div>
          </div>
        )}

        {/* Team Picks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TeamPicksCard
            label="🔵 Team 1"
            picks={team1Picks}
            color="#4488FF"
            analysis={analysis?.team1 ?? null}
          />
          <TeamPicksCard
            label="🔴 Team 2"
            picks={team2Picks}
            color="#FF6666"
            analysis={analysis?.team2 ?? null}
          />
        </div>

        {/* Win Condition Analysis */}
        {analysis && (analysis.team1 || analysis.team2) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis.team1 && (
              <AnalysisCard title="🔵 Team 1 Win Condition" analysis={analysis.team1} color="#4488FF" />
            )}
            {analysis.team2 && (
              <AnalysisCard title="🔴 Team 2 Win Condition" analysis={analysis.team2} color="#FF6666" />
            )}
          </div>
        )}

        {/* Role Comparison */}
        {team1Picks.length > 0 && team2Picks.length > 0 && (
          <div className="p-4 rounded-lg"
            style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
            <h3 className="font-bold mb-3" style={{ color: '#FFD700' }}>📊 Role Comparison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane', 'Specialist'].map(role => {
                const t1c = team1Picks.filter(h => h.role === role).length;
                const t2c = team2Picks.filter(h => h.role === role).length;
                if (t1c === 0 && t2c === 0) return null;
                return (
                  <div key={role} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-right font-mono"
                      style={{ color: t1c > t2c ? '#4488FF' : t1c === t2c ? '#888' : '#666' }}>
                      {t1c}
                    </span>
                    <span className="w-20 text-center" style={{ color: ROLE_COLORS[role] || '#888' }}>
                      {role}
                    </span>
                    <span className="w-20 font-mono"
                      style={{ color: t2c > t1c ? '#FF6666' : t2c === t1c ? '#888' : '#666' }}>
                      {t2c}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
          >
            🏠 Start New Draft
          </button>
          <button
            onClick={handleCopyUrl}
            className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#BA55D322', border: '2px solid #BA55D3', color: '#BA55D3' }}
          >
            {copied === 'url' ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
          <button
            onClick={handleCopyText}
            className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
            style={{ background: '#90EE9022', border: '2px solid #90EE90', color: '#90EE90' }}
          >
            {copied === 'text' ? '✅ Copied!' : '📋 Copy Text'}
          </button>
        </div>
      </div>
    </main>
  );
}

function BanList({ label, bans, color }: { label: string; bans: Hero[]; color: string }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
      <div className="flex gap-2 flex-wrap">
        {bans.map((h, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: 'rgba(255,102,102,0.1)', border: '1px solid #FF666644' }}>
            <HeroPortrait hero={h} size="xs" banned />
            <span className="line-through opacity-70">{h.nicknames[0]}</span>
          </div>
        ))}
        {bans.length === 0 && <span className="text-xs opacity-50">None</span>}
      </div>
    </div>
  );
}

function TeamPicksCard({ label, picks, color, analysis }: {
  label: string;
  picks: Hero[];
  color: string;
  analysis: WinConditionAnalysis | null;
}) {
  return (
    <div className="p-4 rounded-lg"
      style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${color}55` }}>
      <h3 className="font-bold mb-3" style={{ color }}>{label}</h3>
      {picks.length === 0 ? (
        <p className="text-xs opacity-50">No picks</p>
      ) : (
        <div className="space-y-2">
          {picks.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono opacity-50 w-4">{i + 1}.</span>
              <HeroPortrait hero={h} size="sm" />
              <span className="text-sm font-semibold">{h.nicknames[0]}</span>
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: `${ROLE_COLORS[h.role] || '#888'}33`,
                  color: ROLE_COLORS[h.role] || '#888'
                }}>
                {h.role}
              </span>
            </div>
          ))}
        </div>
      )}
      {analysis && (
        <div className="mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${color}33` }}>
          <span style={{ color: '#FFD700' }}>Win Condition: </span>
          <span>{winConditionToString(analysis.primary)}</span>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ title, analysis, color }: {
  title: string;
  analysis: WinConditionAnalysis;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg"
      style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${color}55` }}>
      <h3 className="font-bold mb-2" style={{ color }}>{title}</h3>
      <p className="text-sm mb-1">
        <span style={{ color: '#FFD700' }}>Win Condition:</span>{' '}
        {winConditionToString(analysis.primary)}
      </p>
      <p className="text-xs opacity-80 mb-2">{analysis.description}</p>
      <p className="text-xs">
        <span style={{ color: '#00FFFF' }}>Key Focus:</span> {analysis.keyFocus}
      </p>
      <p className="text-xs mt-1">
        <span style={{ color: '#FF6666' }}>Counter Strategy:</span>{' '}
        {analysis.enemyCounterStrategy}
      </p>
    </div>
  );
}

export default function DraftResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <p style={{ color: '#00FFFF' }}>Loading draft...</p>
      </main>
    }>
      <DraftResultContent />
    </Suspense>
  );
}
