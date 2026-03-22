'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { findHeroByName } from '@/data/HeroData';
import { DRAFT_IS_BAN, DRAFT_TEAM_ORDER } from '@/data/DraftingTool';
import { decodeDraftReplay, encodeDraftReplay } from '@/data/DraftReplay';
import type { DraftReplayData, DraftReplayStep } from '@/data/DraftReplay';
import HeroPortrait from '@/components/HeroPortrait';
import DraftProgressBar from '@/components/DraftProgressBar';
import type { Hero } from '@/data/Hero';

/* ── localStorage shape (saved by draft/page.tsx) ─────────────── */
interface SuggestionHistoryEntry {
  step: number;
  phase: 'ban' | 'pick';
  team: number;
  heroChosen: string;
  topSuggestions: Array<{ heroName: string; stars: number; reasons: string[] }>;
}

interface StoredReplayData {
  map?: string;
  firstPick?: number;
  steps: SuggestionHistoryEntry[];
}

/* ── helpers ──────────────────────────────────────────────────── */

function normalizeReplay(raw: StoredReplayData | SuggestionHistoryEntry[]): DraftReplayData {
  const arr = Array.isArray(raw) ? raw : raw.steps ?? [];
  return {
    map: Array.isArray(raw) ? 'Unknown Map' : (raw.map ?? 'Unknown Map'),
    firstPick: Array.isArray(raw) ? 1 : (raw.firstPick ?? 1),
    steps: arr.map(s => ({
      phase: s.phase,
      team: s.team,
      hero: s.heroChosen,
      suggestions: s.topSuggestions.map(sg => ({
        hero: sg.heroName,
        stars: sg.stars,
        reasons: sg.reasons,
      })),
    })),
  };
}

function starsString(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ── inner page (needs Suspense wrapper for useSearchParams) ─── */

function ReplayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── load data ─────────────────────────────────────────────── */
  const [replayData, setReplayData] = useState<DraftReplayData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Try URL param first
    const encoded = searchParams.get('data');
    if (encoded) {
      const decoded = decodeDraftReplay(encoded);
      if (decoded && decoded.steps?.length) {
        setReplayData(decoded);
        return;
      }
    }
    // Fall back to localStorage
    try {
      const stored = localStorage.getItem('hotsDrafter-lastDraftSuggestions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (Array.isArray(parsed) ? parsed.length : parsed.steps?.length)) {
          setReplayData(normalizeReplay(parsed));
          return;
        }
      }
    } catch { /* ignore parse errors */ }
    setLoadError(true);
  }, [searchParams]);

  /* ── navigation state ──────────────────────────────────────── */
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  const totalSteps = replayData?.steps.length ?? 0;

  // Auto-play interval
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalSteps - 1) {
          setAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(id);
  }, [autoPlay, totalSteps]);

  /* ── derived data at current step ──────────────────────────── */
  const step = replayData?.steps[currentStep] ?? null;

  const { team1Bans, team2Bans, team1Picks, team2Picks } = useMemo(() => {
    const t1b: string[] = [], t2b: string[] = [], t1p: string[] = [], t2p: string[] = [];
    if (!replayData) return { team1Bans: t1b, team2Bans: t2b, team1Picks: t1p, team2Picks: t2p };
    for (let i = 0; i <= currentStep && i < replayData.steps.length; i++) {
      const s = replayData.steps[i];
      if (s.phase === 'ban') {
        (s.team === 1 ? t1b : t2b).push(s.hero);
      } else {
        (s.team === 1 ? t1p : t2p).push(s.hero);
      }
    }
    return { team1Bans: t1b, team2Bans: t2b, team1Picks: t1p, team2Picks: t2p };
  }, [replayData, currentStep]);

  const chosenRank = useMemo(() => {
    if (!step) return null;
    const idx = step.suggestions.findIndex(
      s => s.hero.toLowerCase() === step.hero.toLowerCase()
    );
    return idx === -1 ? null : idx + 1;
  }, [step]);

  const resolvedHero = useMemo(() => {
    if (!step) return null;
    return findHeroByName(step.hero) ?? null;
  }, [step]);

  /* ── share ─────────────────────────────────────────────────── */
  const handleCopyLink = useCallback(() => {
    if (!replayData) return;
    const encoded = encodeDraftReplay(replayData);
    const url = `${window.location.origin}/draft/replay?data=${encoded}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [replayData]);

  /* ── keyboard navigation ───────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setCurrentStep(p => Math.max(0, p - 1));
        setAutoPlay(false);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setCurrentStep(p => Math.min(totalSteps - 1, p + 1));
        setAutoPlay(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setAutoPlay(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalSteps]);

  /* ── empty state ───────────────────────────────────────────── */
  if (loadError) {
    return (
      <main
        className="page-enter min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div
          className="p-6 rounded-lg text-center max-w-md"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}
        >
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#FFD700' }}>
            No Replay Data
          </h2>
          <p className="text-sm opacity-70 mb-4">
            Complete a draft to generate a replay, or open a shared replay link.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
              style={{ background: '#FFD70022', border: '2px solid #FFD700', color: '#FFD700' }}
            >
              ← Back to Home
            </button>
            <button
              onClick={() => router.push('/draft')}
              className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
              style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
            >
              Start a Draft →
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!replayData) {
    // Still loading
    return null;
  }

  /* ── main render ───────────────────────────────────────────── */
  return (
    <main
      className="page-enter min-h-screen flex flex-col items-center p-4 pb-24"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* ── header ───────────────────────────────────────── */}
        <div
          className="p-4 rounded-lg"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h1 className="text-lg font-bold" style={{ color: '#FFD700' }}>
              🎬 Draft Replay — {replayData?.map}
            </h1>
            <span className="text-xs opacity-60">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>

          {/* clickable progress bar */}
          <div className="flex items-center gap-0.5">
            {replayData?.steps.map((s, i) => {
              const isCurrent = i === currentStep;
              const isDone = i < currentStep;
              const banColor = '#9966CC';
              const t1Color = '#4488FF';
              const t2Color = '#FF4444';
              const stepColor = s.phase === 'ban' ? banColor : s.team === 1 ? t1Color : t2Color;

              let bg: string;
              if (isCurrent) bg = stepColor;
              else if (isDone) bg = stepColor + '99';
              else bg = stepColor + '18';

              return (
                <button
                  key={i}
                  onClick={() => { setCurrentStep(i); setAutoPlay(false); }}
                  className={`rounded-sm transition-all flex items-center justify-center ${isCurrent ? 'progress-pulse' : ''}`}
                  title={`Step ${i + 1}: Team ${s.team} ${s.phase.toUpperCase()} — ${s.hero}`}
                  style={{
                    width: isCurrent ? 24 : 16,
                    height: isCurrent ? 18 : 14,
                    background: bg,
                    border: isCurrent
                      ? '1.5px solid #FFD700'
                      : `1px solid ${isDone ? stepColor + '44' : stepColor + '10'}`,
                    boxShadow: isCurrent ? '0 0 8px rgba(255,215,0,0.4)' : 'none',
                    fontSize: isCurrent ? 9 : 7,
                    color: isDone ? '#fff' : isCurrent ? '#fff' : stepColor,
                    fontWeight: isCurrent ? 'bold' : 'normal',
                    opacity: i > currentStep ? 0.4 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {isDone ? '✓' : isCurrent ? (s.phase === 'ban' ? 'B' : s.team === 1 ? '1' : '2') : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── team state ───────────────────────────────────── */}
        <div
          className="p-4 rounded-lg"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <TeamColumn label="TEAM 1" color="#4488FF" bans={team1Bans} picks={team1Picks} />
            <TeamColumn label="TEAM 2" color="#FF4444" bans={team2Bans} picks={team2Picks} />
          </div>
        </div>

        {/* ── current step card ────────────────────────────── */}
        {step && (
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(30, 40, 70, 0.7)',
              border: chosenRank === 1
                ? '2px solid #FFD700'
                : '1px solid rgba(68,102,136,0.5)',
              boxShadow: chosenRank === 1 ? '0 0 16px rgba(255,215,0,0.15)' : undefined,
            }}
          >
            {/* step headline */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  background: step.phase === 'ban' ? '#9966CC33' : (step.team === 1 ? '#4488FF33' : '#FF444433'),
                  color: step.phase === 'ban' ? '#CC99FF' : (step.team === 1 ? '#88BBFF' : '#FF8888'),
                }}
              >
                Step {currentStep + 1}: Team {step.team} {step.phase.toUpperCase()}
              </span>
            </div>

            {/* chosen hero */}
            <div className="flex items-center gap-3 mb-4">
              {resolvedHero && (
                <HeroPortrait
                  hero={resolvedHero}
                  size="lg"
                  selected={step.phase === 'pick'}
                  banned={step.phase === 'ban'}
                />
              )}
              <div>
                <div className="text-base font-bold" style={{ color: step.phase === 'ban' ? '#FF6666' : '#FFD700' }}>
                  {step.phase === 'ban' ? 'Banned' : 'Chose'}: {step.hero}
                </div>
                {resolvedHero && (
                  <div className="text-xs opacity-60">{resolvedHero.role}</div>
                )}
                {step.phase === 'pick' && chosenRank === null && (
                  <div className="text-xs mt-1 px-2 py-0.5 rounded inline-block"
                    style={{ background: '#FF8C0022', color: '#FF8C00', border: '1px solid #FF8C0044' }}>
                    Not in top suggestions
                  </div>
                )}
                {step.phase === 'pick' && chosenRank !== null && chosenRank > 3 && (
                  <div className="text-xs mt-1 opacity-50">
                    Ranked #{chosenRank} in suggestions
                  </div>
                )}
              </div>
            </div>

            {/* suggestion list */}
            {step.suggestions.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-2 opacity-60">
                  What was suggested:
                </div>
                <div className="flex flex-col gap-1.5">
                  {step.suggestions.map((sg, i) => {
                    const isChosen = sg.hero.toLowerCase() === step.hero.toLowerCase();
                    const sgHero = findHeroByName(sg.hero);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded transition-all"
                        style={{
                          background: isChosen ? '#FFD70015' : 'rgba(255,255,255,0.03)',
                          border: isChosen ? '1px solid #FFD70066' : '1px solid transparent',
                          boxShadow: isChosen ? '0 0 8px rgba(255,215,0,0.1)' : undefined,
                        }}
                      >
                        {/* rank */}
                        <span
                          className="text-xs font-bold w-5 text-center flex-shrink-0"
                          style={{ color: i === 0 ? '#FFD700' : '#888' }}
                        >
                          {i + 1}.
                        </span>

                        {/* portrait */}
                        {sgHero && (
                          <HeroPortrait hero={sgHero} size="xs" />
                        )}

                        {/* name + stars */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate" style={{ color: isChosen ? '#FFD700' : '#ddd' }}>
                              {sg.hero}
                            </span>
                            <span className="text-[11px] flex-shrink-0" style={{ color: '#FFD700', letterSpacing: '-1px' }}>
                              {starsString(sg.stars)}
                            </span>
                            {isChosen && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ background: '#FFD70033', color: '#FFD700', border: '1px solid #FFD70066' }}
                              >
                                ← CHOSEN
                              </span>
                            )}
                          </div>
                          {sg.reasons.length > 0 && (
                            <div className="text-[10px] opacity-50 truncate mt-0.5">
                              {sg.reasons.join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* note if chosen wasn't in suggestions */}
                {step.phase === 'pick' && chosenRank === null && (
                  <div className="mt-2 text-xs px-3 py-2 rounded" style={{ background: '#FF8C0011', color: '#FF8C00' }}>
                    ⚠ {step.hero} was not among the top {step.suggestions.length} suggestions for this step.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── controls ─────────────────────────────────────── */}
        <div
          className="p-4 rounded-lg flex items-center justify-center gap-3 flex-wrap"
          style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}
        >
          <button
            onClick={() => { setCurrentStep(p => Math.max(0, p - 1)); setAutoPlay(false); }}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            style={{ background: '#ffffff11', border: '1px solid #ffffff33', color: '#ddd' }}
          >
            ◀ Prev
          </button>
          <button
            onClick={() => { setCurrentStep(p => Math.min(totalSteps - 1, p + 1)); setAutoPlay(false); }}
            disabled={currentStep >= totalSteps - 1}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            style={{ background: '#ffffff11', border: '1px solid #ffffff33', color: '#ddd' }}
          >
            Next ▶
          </button>
          <button
            onClick={() => {
              if (autoPlay) {
                setAutoPlay(false);
              } else {
                if (currentStep >= totalSteps - 1) setCurrentStep(0);
                setAutoPlay(true);
              }
            }}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: autoPlay ? '#FF444433' : '#00FFFF22',
              border: `2px solid ${autoPlay ? '#FF4444' : '#00FFFF'}`,
              color: autoPlay ? '#FF4444' : '#00FFFF',
            }}
          >
            {autoPlay ? '⏸ Pause' : '▶▶ Auto-play'}
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
            style={{ background: '#90EE9022', border: '2px solid #90EE90', color: '#90EE90' }}
          >
            {linkCopied ? '✅ Copied!' : '🔗 Copy Replay Link'}
          </button>
        </div>

        {/* ── keyboard hint ────────────────────────────────── */}
        <div className="text-center text-[10px] opacity-30">
          ← → or A/D to navigate · Space to auto-play
        </div>
      </div>
    </main>
  );
}

/* ── team column sub-component ─────────────────────────────── */

function TeamColumn({ label, color, bans, picks }: {
  label: string;
  color: string;
  bans: string[];
  picks: string[];
}) {
  return (
    <div>
      <div className="text-xs font-bold mb-2" style={{ color }}>{label}</div>
      {/* bans */}
      {bans.length > 0 && (
        <div className="text-[10px] opacity-50 mb-1.5">
          Bans: {bans.map((b, i) => {
            const h = findHeroByName(b);
            return (
              <span key={i}>
                {i > 0 && ', '}
                <span style={{ color: '#FF6666' }}>{b}</span>
              </span>
            );
          })}
        </div>
      )}
      {/* picks */}
      <div className="flex flex-col gap-1">
        {picks.map((p, i) => {
          const hero = findHeroByName(p);
          return (
            <div key={i} className="flex items-center gap-2">
              {hero ? (
                <HeroPortrait hero={hero} size="xs" />
              ) : (
                <div className="w-[30px] h-[30px] rounded bg-white/5 border border-white/10" />
              )}
              <span className="text-xs">{p}</span>
            </div>
          );
        })}
        {picks.length === 0 && (
          <div className="text-[10px] opacity-30 italic">No picks yet</div>
        )}
      </div>
    </div>
  );
}

/* ── page export (with Suspense for useSearchParams) ─────── */

export default function ReplayPage() {
  return (
    <Suspense fallback={
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="text-sm opacity-50">Loading replay…</div>
      </main>
    }>
      <ReplayPageInner />
    </Suspense>
  );
}
