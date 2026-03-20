'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense, useDeferredValue } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ALL_HEROES, ALL_MAPS, findHeroByName } from '@/data/HeroData';
import { DraftingTool, DRAFT_TEAM_ORDER, DRAFT_IS_BAN, matchesRoleFilter } from '@/data/DraftingTool';
import { HeroSuggestionEngine } from '@/data/HeroSuggestionEngine';
import { DraftSettings } from '@/data/DraftSettings';
import { TeamComposition } from '@/data/TeamComposition';
import { analyzeWinCondition, WinConditionAnalysis } from '@/data/WinConditionAnalyzer';
import { Specialty, specialtyToString } from '@/data/Specialty';
import { saveDraft } from '@/data/DraftHistory';
import { winConditionToString } from '@/data/SuggestionTypes';
import { exportDraftAsText, encodeDraftUrl } from '@/data/DraftExport';
import HeroPortrait from '@/components/HeroPortrait';
import RoleFilterBar, { ROLE_COLORS } from '@/components/RoleFilterBar';
import HeroSuggestionPanel from '@/components/HeroSuggestionPanel';
import TeamPanel from '@/components/TeamPanel';
import DraftProgressBar from '@/components/DraftProgressBar';
const HeroDetailPopup = dynamic(() => import('@/components/HeroDetailPopup'), { ssr: false });
const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay').then(mod => ({ default: mod.default })), { ssr: false });
import { DRAFT_TUTORIAL_STEPS, DRAFT_STORAGE_KEY, shouldShowDraftTutorial } from '@/components/TutorialOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';
import { IcyVeinsDatabase } from '@/data/IcyVeinsData';
import { HeroRelationships } from '@/data/HeroRelationships';
import type { Hero } from '@/data/Hero';
import type { HeroSuggestion } from '@/data/SuggestionTypes';
import type { HotsMap } from '@/data/Map';

function getCoachingTip(step: number, realStep: number, isBan: boolean, isYourTurn: boolean, team1Picks: Hero[], team2Picks: Hero[], map: HotsMap): string {
  // Ban phase tips
  if (isBan) {
    if (realStep < 4) return "Ban heroes that are strong on " + map.name + " or that counter your planned composition.";
    return "Second ban phase: target heroes that would complete the enemy's composition.";
  }

  const myPicks = team1Picks;
  const enemyPicks = team2Picks;

  // Composition warnings — urgent, shown regardless of pick count
  if (myPicks.length >= 3 && !myPicks.some(h => h.role === 'Healer'))
    return "⚠ You still don't have a Healer. Pick one soon!";
  if (myPicks.length >= 4 && !myPicks.some(h => h.role === 'Tank'))
    return "⚠ No Tank yet — your team will struggle in teamfights.";

  // Pick phase tips based on progression
  if (myPicks.length === 0)
    return "First pick: secure a high-value flex pick that doesn't reveal your strategy.";
  if (myPicks.length === 1 && !myPicks.some(h => h.role === 'Tank'))
    return "Consider picking your Tank early to establish frontline.";
  if (myPicks.length === 2 && !myPicks.some(h => h.role === 'Healer'))
    return "You may want to secure a Healer before they're countered.";
  if (myPicks.length === 4)
    return "Last pick: fill any missing roles and consider countering the enemy.";

  // Mid-draft synergy/counter tips
  if (myPicks.length >= 2 && enemyPicks.length >= 2) {
    const enemyHasHealer = enemyPicks.some(h => h.role === 'Healer');
    if (!enemyHasHealer) return "Enemy has no Healer yet — burst damage can punish this.";
  }
  if (myPicks.length >= 2 && !myPicks.some(h => h.specialties?.includes(Specialty.WAVECLEAR)))
    return "Your team lacks waveclear — consider a hero with strong lane push.";

  // Damage balance
  const rangedDPS = myPicks.filter(h => h.effectiveRange && h.effectiveRange >= 3).length;
  const meleeDPS = myPicks.filter(h => h.effectiveRange && h.effectiveRange <= 2 && h.role !== 'Tank').length;
  if (myPicks.length >= 3 && rangedDPS === 0)
    return "All melee so far — add a ranged damage dealer for balance.";
  if (myPicks.length >= 3 && meleeDPS === 0 && !myPicks.some(h => h.role === 'Tank'))
    return "All ranged — you'll need a frontline hero.";

  return "Check suggestions for optimal synergy picks.";
}

const MAP_TIPS: Record<string, string> = {
  'Alterac Pass': 'Push with cavalry after winning objectives. Sustain and waveclear matter.',
  'Battlefield of Eternity': 'Race to kill the Immortal. Sustained damage dealers are key.',
  'Braxis Holdout': 'Hold both beacons for maximum zerg wave. Solo laners are critical.',
  'Cursed Hollow': 'Contest tributes with strong teamfight. Global heroes can soak and rotate.',
  'Dragon Shire': 'Control both shrines simultaneously. Split push and global presence help.',
  'Garden of Terror': 'Collect seeds and use the Terror to push. Waveclear helps defend.',
  'Hanamura Temple': 'Push payloads for damage. Camp control and waveclear are essential.',
  'Infernal Shrines': 'Kill 40 minions to summon Punisher. AOE damage dominates.',
  'Sky Temple': 'Control temples for structure damage. Rotation speed matters.',
  'Tomb of the Spider Queen': 'Turn in gems for webweavers. Sustain in lane is crucial.',
  'Towers of Doom': 'Capture altars for direct core damage. No traditional pushing — teamfight wins.',
  'Volskaya Foundry': 'Capture control points for a Protector mech. Teamfight and objective control are key.',
};

const SPECIALTY_BAR_COLORS: Record<string, string> = {
  [Specialty.GLOBAL_PRESENCE]: '#00BFFF',
  [Specialty.OBJECTIVE_CONTROL]: '#FFD700',
  [Specialty.WAVECLEAR]: '#90EE90',
  [Specialty.PICK_POTENTIAL]: '#FF6347',
  [Specialty.ENGAGE]: '#BA55D3',
  [Specialty.SPLIT_PUSHING]: '#FFA500',
  [Specialty.SIEGE_PUSHING]: '#A9A9A9',
};

function computeCompScore(picks: Hero[]): number {
  let score = 20;
  if (picks.some(h => h.role === 'Tank')) score += 15;
  if (picks.some(h => h.role === 'Healer')) score += 15;
  if (picks.some(h => h.role === 'DPS' || h.role === 'Mage')) score += 10;
  if (picks.some(h => h.role === 'Offlane')) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.WAVECLEAR))) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.ENGAGE))) score += 10;
  if (picks.some(h => h.specialties.includes(Specialty.HARD_CC))) score += 10;
  if (picks.filter(h => h.role === 'Tank').length >= 2) score -= 10;
  if (picks.filter(h => h.role === 'Healer').length >= 2) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function highlightMatch(name: string, query: string) {
  if (!query) return name;
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span style={{ color: '#00FFFF', fontWeight: 'bold' }}>{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  );
}

function DraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapIdx = parseInt(searchParams.get('map') || '0', 10);
  const map = ALL_MAPS[mapIdx] || ALL_MAPS[0];

  const [draft] = useState(() => new DraftingTool(ALL_HEROES));
  const [step, setStep] = useState(0);
  // Snapshot picks/bans as state so React detects changes
  const [team1Picks, setTeam1Picks] = useState<Hero[]>([]);
  const [team2Picks, setTeam2Picks] = useState<Hero[]>([]);
  const [team1Bans, setTeam1Bans] = useState<Hero[]>([]);
  const [team2Bans, setTeam2Bans] = useState<Hero[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [heroView, setHeroView] = useState<'grid' | 'roles'>('grid');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);
  const [lastAction, setLastAction] = useState<{ heroName: string; type: 'pick' | 'ban' } | null>(null);
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25);
  const hasSavedDraft = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const heroGridRef = useRef<HTMLDivElement>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [heroGridReady, setHeroGridReady] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [showMapInfo, setShowMapInfo] = useState(false);
  const [coachingTipsVisible, setCoachingTipsVisible] = useState(() => DraftSettings.showCoachingTips);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [showDraftTutorial, setShowDraftTutorial] = useState(false);

  useEffect(() => {
    DraftSettings.load();
    setSettingsVersion(v => v + 1);
    const unsub = DraftSettings.onChange(() => setSettingsVersion(v => v + 1));
    // Brief delay for skeleton to show, then reveal grid
    const timer = setTimeout(() => setHeroGridReady(true), 150);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  // Show draft tutorial on first visit (1s delay)
  useEffect(() => {
    const tutTimer = setTimeout(() => {
      if (shouldShowDraftTutorial()) setShowDraftTutorial(true);
    }, 1000);
    return () => clearTimeout(tutTimer);
  }, []);

  const isQuickDraft = DraftSettings.quickDraft;
  const firstPick = DraftSettings.firstPickTeam;

  // Swap team order if Team 2 has first pick
  const teamOrder = useMemo(() => {
    if (firstPick === 2) return DRAFT_TEAM_ORDER.map(t => t === 1 ? 2 : 1);
    return DRAFT_TEAM_ORDER;
  }, [firstPick]);

  // In quick draft mode, compute which steps to use (only non-ban steps)
  const activeSteps = useMemo(() => {
    if (!isQuickDraft) return teamOrder.map((_, i) => i);
    return teamOrder.map((_, i) => i).filter(i => !DRAFT_IS_BAN[i]);
  }, [isQuickDraft, teamOrder]);

  const totalSteps = activeSteps.length;
  const realStep = step < totalSteps ? activeSteps[step] : 16;

  const engine = useMemo(() => new HeroSuggestionEngine(draft, map), [draft, map]);
  const icyVeins = useMemo(() => IcyVeinsDatabase.getInstance(), []);
  const rels = useMemo(() => HeroRelationships.getInstance(), []);

  const currentTeam = realStep < 16 ? teamOrder[realStep] : 0;
  const isBan = realStep < 16 ? DRAFT_IS_BAN[realStep] : false;
  const isComplete = step >= totalSteps;

  // Counter threat warnings: enemy picks that counter your heroes
  const threats = useMemo(() => {
    const myPicks = team1Picks;
    const enemyPicks = team2Picks;
    const warnings: { threat: string; target: string; score: number; reason: string }[] = [];
    for (const enemy of enemyPicks) {
      for (const ally of myPicks) {
        const score = rels.getCounterScore(enemy, ally);
        if (score >= 2 || icyVeins.counters(enemy.nicknames[0], ally.nicknames[0])) {
          const reason = rels.getCounterReason(enemy, ally);
          warnings.push({ threat: enemy.nicknames[0], target: ally.nicknames[0], score: Math.max(score, 2), reason });
        }
      }
    }
    return warnings.sort((a, b) => b.score - a.score);
  }, [team1Picks, team2Picks, rels, icyVeins]);

  // Synergy notifications: your picks that synergize with each other
  const synergies = useMemo(() => {
    const myPicks = team1Picks;
    const pairs: { hero1: string; hero2: string; score: number; reason: string }[] = [];
    for (let i = 0; i < myPicks.length; i++) {
      for (let j = i + 1; j < myPicks.length; j++) {
        const score = rels.getSynergyScore(myPicks[i], myPicks[j]);
        if (score >= 2) {
          const reason = rels.getSynergyReason(myPicks[i], myPicks[j]);
          pairs.push({ hero1: myPicks[i].nicknames[0], hero2: myPicks[j].nicknames[0], score, reason });
        }
      }
    }
    return pairs.sort((a, b) => b.score - a.score);
  }, [team1Picks, rels]);

  // Role composition warnings
  const roleWarnings = useMemo(() => {
    if (isBan) return [];
    const picks = team1Picks;
    const warnings: string[] = [];
    const hasTank = picks.some(h => h.role === 'Tank');
    const hasHealer = picks.some(h => h.role === 'Healer');
    const hasDPS = picks.some(h => h.role === 'DPS' || h.role === 'Mage' || h.role === 'Ranged Assassin' || h.role === 'Melee Assassin');
    if (picks.length >= 3 && !hasTank) warnings.push('⚠ No Tank drafted yet');
    if (picks.length >= 4 && !hasHealer) warnings.push('⚠ No Healer drafted yet — consider picking one');
    if (picks.length >= 5 && !hasDPS) warnings.push('⚠ Missing DPS — team may lack damage');
    return warnings;
  }, [team1Picks, isBan]);

  // Reset dismissed warnings when picks change
  useEffect(() => {
    setDismissedWarnings(new Set());
  }, [team1Picks.length, team2Picks.length]);

  const dismissWarning = useCallback((key: string) => {
    setDismissedWarnings(prev => new Set(prev).add(key));
  }, []);

  // Show ALL heroes, mark unavailable as dimmed
  const [heroSort, setHeroSort] = useState<'name' | 'role' | 'tier'>('name');

  const allHeroesSorted = useMemo(() => {
    const sorted = [...ALL_HEROES];
    if (heroSort === 'name') sorted.sort((a, b) => a.nicknames[0].localeCompare(b.nicknames[0]));
    else if (heroSort === 'role') sorted.sort((a, b) => a.role.localeCompare(b.role) || a.nicknames[0].localeCompare(b.nicknames[0]));
    else if (heroSort === 'tier') sorted.sort((a, b) => icyVeins.getTierScore(b.nicknames[0], map.name) - icyVeins.getTierScore(a.nicknames[0], map.name));
    return sorted;
  }, [heroSort, icyVeins, map.name]);
  const filtered = useMemo(() => allHeroesSorted.filter(h => {
    if (!matchesRoleFilter(h, roleFilter)) return false;
    if (deferredSearchQuery) {
      const q = deferredSearchQuery.toLowerCase();
      if (h.nicknames.some(n => n.toLowerCase().includes(q)) || h.name.toLowerCase().includes(q)) return true;
      if (h.role.toLowerCase().includes(q)) return true;
      if (h.specialties.some(s => specialtyToString(s).toLowerCase().includes(q))) return true;
      return false;
    }
    return true;
  }), [allHeroesSorted, roleFilter, deferredSearchQuery]);

  const groupedByRole = useMemo(() => {
    const order = ['Tank', 'Healer', 'Offlane', 'DPS', 'Mage', 'Specialist'];
    return order
      .map(role => ({ role, heroes: filtered.filter(hero => hero.role === role) }))
      .filter(group => group.heroes.length > 0);
  }, [filtered]);

  const suggestions = useMemo(() => {
    if (isComplete || step >= totalSteps) return [];
    return isBan
      ? engine.generateBanSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount)
      : engine.generateSuggestions(currentTeam, roleFilter, DraftSettings.suggestionCount);
  }, [engine, currentTeam, isBan, roleFilter, isComplete, step, settingsVersion, totalSteps]);

  // Map specialty priorities sorted by weight
  const mapSpecialties = useMemo(() => {
    const weights = map.specialtyWeights;
    return Object.entries(weights)
      .map(([spec, weight]) => ({ specialty: spec as Specialty, weight: weight as number }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [map]);

  // Top available heroes for this map
  const mapTopHeroes = useMemo(() => {
    const topEntries = icyVeins.getTopHeroesForMap(map.name, 20);
    return topEntries
      .filter(e => {
        const hero = findHeroByName(e.name);
        return hero && draft.isAvailable(hero);
      })
      .slice(0, 5)
      .map(e => ({ hero: findHeroByName(e.name)!, tier: e.tier }));
  }, [icyVeins, map.name, team1Picks, team2Picks, team1Bans, team2Bans]);

  useEffect(() => {
    if (!timerEnabled || isComplete) {
      return;
    }

    setTimeLeft(timerDuration);
  }, [step, timerDuration, timerEnabled, isComplete]);

  // Auto-disable timer when draft completes
  useEffect(() => {
    if (isComplete && timerEnabled) setTimerEnabled(false);
  }, [isComplete, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled || isComplete || timeLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timerEnabled, isComplete, timeLeft]);

  const syncDraftState = () => {
    setTeam1Picks([...draft.team1Picks]);
    setTeam2Picks([...draft.team2Picks]);
    setTeam1Bans([...draft.team1Bans]);
    setTeam2Bans([...draft.team2Bans]);
  };

  // Clear flash animation after it plays
  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => setLastAction(null), 400);
    return () => clearTimeout(timer);
  }, [lastAction]);

  // Sets for hero grid status indicators
  const bannedNames = useMemo(() => new Set([...team1Bans, ...team2Bans].map(h => h.name)), [team1Bans, team2Bans]);
  const team1PickNames = useMemo(() => new Set(team1Picks.map(h => h.name)), [team1Picks]);
  const team2PickNames = useMemo(() => new Set(team2Picks.map(h => h.name)), [team2Picks]);

  const roleFilteredCount = useMemo(() =>
    allHeroesSorted.filter(h => matchesRoleFilter(h, roleFilter)).length,
    [allHeroesSorted, roleFilter]
  );

  const searchMatches = useMemo(() => {
    if (!deferredSearchQuery || deferredSearchQuery.length < 2) return [];
    return filtered.filter(h => !bannedNames.has(h.name) && !team1PickNames.has(h.name) && !team2PickNames.has(h.name)).slice(0, 5);
  }, [deferredSearchQuery, filtered, bannedNames, team1PickNames, team2PickNames]);

  const handleHeroClick = useCallback((hero: Hero) => {
    if (isComplete) return;
    if (isBan) {
      draft.banHero(currentTeam, hero);
      setLastAction({ heroName: hero.name, type: 'ban' });
    } else {
      draft.pickHero(currentTeam, hero);
      setLastAction({ heroName: hero.name, type: 'pick' });
    }
    setSearchQuery('');
    setTeam1Picks([...draft.team1Picks]);
    setTeam2Picks([...draft.team2Picks]);
    setTeam1Bans([...draft.team1Bans]);
    setTeam2Bans([...draft.team2Bans]);
    setStep(s => s + 1);
  }, [draft, isComplete, isBan, currentTeam]);

  const handleUndo = () => {
    if (step === 0) return;
    setLastAction(null);
    const prevStep = step - 1;
    const prevRealStep = activeSteps[prevStep];
    const prevTeam = teamOrder[prevRealStep];
    const wasBan = DRAFT_IS_BAN[prevRealStep];
    draft.undoBanOrPick(prevTeam, wasBan);
    syncDraftState();
    setStep(prevStep);
  };

  const handleReset = () => {
    if (step > 0 && !window.confirm('Reset the entire draft? All picks and bans will be cleared.')) return;
    draft.reset(ALL_HEROES);
    syncDraftState();
    setStep(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Ctrl+Z undo (works everywhere)
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); return; }

      // Escape: close shortcut help → close detail popup → clear/blur search → go home
      if (e.key === 'Escape') {
        if (showShortcutHelp) { setShowShortcutHelp(false); return; }
        if (detailHero) { setDetailHero(null); return; }
        if (isInput && searchQuery) { setSearchQuery(''); searchInputRef.current?.blur(); heroGridRef.current?.focus(); return; }
        if (isInput) { searchInputRef.current?.blur(); return; }
        router.push('/');
        return;
      }

      // Toggle shortcut help with '?'
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutHelp(prev => !prev);
        return;
      }

      // Everything below only fires when not typing in an input
      if (isInput) return;

      // Number keys 1-7 for quick-picking suggestions
      if (e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key) - 1;
        if (suggestions[idx]) {
          e.preventDefault();
          handleHeroClick(suggestions[idx].hero);
        }
        return;
      }

      // Focus search with '/' or 'f'
      if (e.key === '/' || e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // View toggle: 'g' for grid, 'r' for role
      if (e.key === 'g') { setHeroView('grid'); return; }
      if (e.key === 'r') { setHeroView('roles'); return; }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Win condition analysis when draft is complete
  const analysis = useMemo(() => {
    if (!isComplete) return null;
    const t1 = new TeamComposition(team1Picks);
    const t2 = new TeamComposition(team2Picks);
    const a1 = analyzeWinCondition(t1, t2);
    const a2 = analyzeWinCondition(t2, t1);

    return { team1: a1, team2: a2 };
  }, [isComplete, draft, map]);

  // Auto-save to history once when draft completes
  useEffect(() => {
    if (!isComplete || !analysis || hasSavedDraft.current) return;
    hasSavedDraft.current = true;
    const t1 = new TeamComposition(team1Picks);
    const t2 = new TeamComposition(team2Picks);
    const a1 = analyzeWinCondition(t1, t2);
    const a2 = analyzeWinCondition(t2, t1);
    saveDraft({
      timestamp: new Date().toISOString(),
      mapName: map.name,
      firstPickTeam: firstPick,
      team1Picks: team1Picks.map(h => h.nicknames[0]),
      team2Picks: team2Picks.map(h => h.nicknames[0]),
      team1Bans: team1Bans.map(h => h.nicknames[0]),
      team2Bans: team2Bans.map(h => h.nicknames[0]),
      team1Score: computeCompScore(team1Picks), team2Score: computeCompScore(team2Picks),
      team1WinCondition: winConditionToString(a1.primary),
      team2WinCondition: winConditionToString(a2.primary),
      verdict: `Team 1: ${winConditionToString(a1.primary)} vs Team 2: ${winConditionToString(a2.primary)}`,
    });
  }, [isComplete, analysis]);

  // Replay: reconstruct the pick/ban timeline from draft order
  const replayTimeline = useMemo(() => {
    if (!isComplete) return [];
    const t1b = [...team1Bans], t2b = [...team2Bans];
    const t1p = [...team1Picks], t2p = [...team2Picks];
    const steps: { team: number; isBan: boolean; hero: Hero | null }[] = [];
    for (let i = 0; i < teamOrder.length; i++) {
      const team = teamOrder[i];
      const ban = DRAFT_IS_BAN[i];
      const arr = ban ? (team === 1 ? t1b : t2b) : (team === 1 ? t1p : t2p);
      steps.push({ team, isBan: ban, hero: arr.shift() ?? null });
    }
    return steps;
  }, [isComplete, team1Picks, team2Picks, team1Bans, team2Bans, teamOrder]);

  // Partial picks/bans visible at the current replay step
  const replayPartials = useMemo(() => {
    if (!isReplaying) return null;
    const t1p: Hero[] = [], t2p: Hero[] = [], t1b: Hero[] = [], t2b: Hero[] = [];
    for (let i = 0; i <= replayStep && i < replayTimeline.length; i++) {
      const s = replayTimeline[i];
      if (!s.hero) continue;
      if (s.isBan) {
        if (s.team === 1) t1b.push(s.hero);
        else t2b.push(s.hero);
      } else {
        if (s.team === 1) t1p.push(s.hero);
        else t2p.push(s.hero);
      }
    }
    return { team1Picks: t1p, team2Picks: t2p, team1Bans: t1b, team2Bans: t2b };
  }, [isReplaying, replayStep, replayTimeline]);

  // Flash animation for the hero appearing at the current replay step
  const replayFlashHero = useMemo(() => {
    if (!isReplaying || replayStep >= replayTimeline.length) return null;
    const current = replayTimeline[replayStep];
    if (!current?.hero) return null;
    return { heroName: current.hero.name, type: current.isBan ? 'ban' as const : 'pick' as const };
  }, [isReplaying, replayStep, replayTimeline]);

  // Auto-advance replay step every 800ms
  useEffect(() => {
    if (!isReplaying) return;
    if (replayStep >= 15) {
      const timer = setTimeout(() => setIsReplaying(false), 1200);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setReplayStep(prev => prev + 1), 800);
    return () => clearTimeout(timer);
  }, [isReplaying, replayStep]);

  const yourTeam = firstPick === 2 ? 2 : 1;
  const isYourTurn = currentTeam === yourTeam;

  // Determine draft phase name
  const phaseName = isComplete ? '' : realStep <= 3 ? 'Ban Phase 1' : realStep <= 8 ? 'Pick Phase 1' : realStep <= 10 ? 'Ban Phase 2' : 'Pick Phase 2';

  const statusText = isComplete
    ? '✅ Draft Complete!'
    : `${isYourTurn ? 'Your Turn' : 'Enemy Turn'} — ${isBan ? 'Ban Phase' : 'Pick Phase'}`;

  return (
    <main id="main-content" className="h-screen flex flex-col overflow-hidden page-enter pb-16">
      {showDraftTutorial && <TutorialOverlay steps={DRAFT_TUTORIAL_STEPS} storageKey={DRAFT_STORAGE_KEY} onClose={() => setShowDraftTutorial(false)} />}
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-wrap gap-2" style={{ background: 'rgba(20, 25, 45, 0.9)', borderBottom: '1px solid rgba(68,102,136,0.5)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm px-3 py-1 rounded hover:bg-white/10 smooth-transition" style={{ color: '#00FFFF', border: '1px solid #00FFFF33' }} title="Return to main menu">
            ← Back
          </button>
          <button onClick={handleReset} className="text-sm px-3 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666', border: '1px solid #FF666633' }} title="Reset entire draft">
            Reset
          </button>
          <button onClick={handleUndo} disabled={step === 0} className="text-sm px-3 py-1 rounded disabled:opacity-30 hover:bg-white/10" style={{ color: '#FFD700', border: '1px solid #FFD70033' }} title="Undo last pick/ban (Ctrl+Z)">
            Undo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold cursor-help" style={{ color: '#FFD700' }}
            title={`${map.name}\nS-tier: ${icyVeins.getSTierHeroes(map.name).slice(0, 5).join(', ') || 'None listed'}`}>
            📍 {map.name}
          </span>
          <button
            onClick={() => setShowMapInfo(v => !v)}
            className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            style={{
              color: showMapInfo ? '#00FFFF' : '#A9A9A9',
              border: `1px solid ${showMapInfo ? '#00FFFF55' : '#A9A9A933'}`,
              background: showMapInfo ? 'rgba(0,255,255,0.08)' : 'transparent',
            }}
            title="Toggle map info panel"
          >
            ℹ Map Info
          </button>
          {isQuickDraft && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(144,238,144,0.15)', color: '#90EE90', border: '1px solid #90EE9033' }}>
              ⚡ Quick
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RoleFilterBar activeFilter={roleFilter} onFilterChange={(f) => { setRoleFilter(f); document.querySelector('[data-hero-grid]')?.scrollTo(0, 0); }} />
          <div className="relative">
            <button onClick={() => setShowHeaderMenu(v => !v)} className="text-sm px-2 py-1 rounded hover:bg-white/10" style={{ color: '#A9A9A9', border: '1px solid #A9A9A933' }} title="More options">
              ⋯
            </button>
            {showHeaderMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 rounded shadow-lg py-1 min-w-[140px]" style={{ background: 'rgba(15,20,40,0.97)', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <button onClick={() => { setShowShortcutHelp(true); setShowHeaderMenu(false); }} className="w-full text-left text-xs px-3 py-1.5 hover:bg-white/10 flex items-center gap-2" style={{ color: '#A9A9A9' }}>
                    <span>?</span> Keyboard Shortcuts
                  </button>
                  <button onClick={() => { router.push('/settings'); setShowHeaderMenu(false); }} className="w-full text-left text-xs px-3 py-1.5 hover:bg-white/10 flex items-center gap-2" style={{ color: '#A9A9A9' }}>
                    <span>⚙️</span> Settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {MAP_TIPS[map.name] && (
        <div className="px-4 py-1 text-center" style={{ background: 'rgba(255,215,0,0.04)', borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
          <span className="text-[10px]" style={{ color: '#FFD700', opacity: 0.7 }}>
            🗺️ {MAP_TIPS[map.name]}
          </span>
        </div>
      )}

      {/* Status + Progress */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-2" style={{ background: 'rgba(20, 25, 45, 0.5)' }}>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center text-center">
          <span className="text-sm font-semibold opacity-90" aria-live="polite" style={{ color: isReplaying ? '#FF8C00' : (isYourTurn ? '#00FFFF' : '#FF6666') }}>
            {isReplaying ? `🎬 Replaying — Step ${replayStep + 1}/16` : statusText}
          </span>
          {team1Picks.length > 0 && (
            <span className="text-[10px] flex gap-0.5">
              {['Tank', 'Healer', 'DPS', 'Mage', 'Offlane'].map(r => {
                const c: Record<string, string> = { Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500' };
                const has = team1Picks.some(h => h.role === r);
                return <span key={r} className="w-2 h-2 rounded-full" style={{ background: has ? c[r] : 'rgba(255,255,255,0.1)' }} title={`${r}: ${has ? '✓' : '✗'}`} />;
              })}
            </span>
          )}
        </div>
        <div data-tutorial-target="progressBar">
        <DraftProgressBar currentStep={isReplaying ? replayStep + 1 : step} teamOrder={teamOrder} />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => {
              setTimerEnabled(prev => {
                const next = !prev;
                if (next) {
                  setTimeLeft(timerDuration);
                }
                return next;
              });
            }}
            className="text-xs px-2 py-1 rounded hover:bg-white/10"
            style={{
              color: timerEnabled ? '#90EE90' : '#A9A9A9',
              border: `1px solid ${timerEnabled ? '#90EE9055' : '#A9A9A955'}`,
            }}
            title={timerEnabled ? 'Disable draft timer' : 'Enable draft timer'}
          >
            ⏱️ Timer {timerEnabled ? 'On' : 'Off'}
          </button>
          {timerEnabled && (
            <>
              <button
                onClick={() => setTimerDuration(v => Math.max(10, v - 5))}
                className="text-xs px-2 py-1 rounded hover:bg-white/10"
                style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
                title="Decrease timer duration"
              >
                -5s
              </button>
              <button
                onClick={() => setTimerDuration(v => Math.min(90, v + 5))}
                className="text-xs px-2 py-1 rounded hover:bg-white/10"
                style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
                title="Increase timer duration"
              >
                +5s
              </button>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
                style={{
                  color: timeLeft <= 5 ? '#FF6666' : timeLeft <= 10 ? '#FFA500' : '#00FFFF',
                  border: `1px solid ${timeLeft <= 5 ? '#FF666655' : timeLeft <= 10 ? '#FFA50055' : '#00FFFF55'}`,
                  background: timeLeft <= 5 ? 'rgba(255,102,102,0.1)' : 'rgba(255,255,255,0.04)',
                }}
                title="Per-step draft countdown"
              >
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                    <circle cx="7" cy="7" r="5.5" fill="none"
                      stroke={timeLeft <= 5 ? '#FF6666' : timeLeft <= 10 ? '#FFA500' : '#00FFFF'}
                      strokeWidth="1.5" strokeLinecap="round"
                      strokeDasharray={`${(timeLeft / timerDuration) * 34.56} 34.56`}
                      transform="rotate(-90 7 7)" />
                  </svg>
                  {timeLeft}s
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Banned Heroes Strip */}
      {(() => {
        const dispT1Bans = isReplaying && replayPartials ? replayPartials.team1Bans : team1Bans;
        const dispT2Bans = isReplaying && replayPartials ? replayPartials.team2Bans : team2Bans;
        return (dispT1Bans.length > 0 || dispT2Bans.length > 0) ? (
        <div className="flex items-center justify-center gap-3 px-4 py-1" style={{ background: 'rgba(255,102,102,0.04)' }}>
          {dispT1Bans.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] opacity-40">T1 bans:</span>
              {dispT1Bans.map(h => (
                <span key={h.name} className={`text-[9px] px-1 rounded ${isReplaying && replayFlashHero?.heroName === h.name ? 'hero-ban-flash' : ''}`} style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666' }}>{h.nicknames[0]}</span>
              ))}
            </div>
          )}
          {dispT2Bans.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] opacity-40">T2 bans:</span>
              {dispT2Bans.map(h => (
                <span key={h.name} className={`text-[9px] px-1 rounded ${isReplaying && replayFlashHero?.heroName === h.name ? 'hero-ban-flash' : ''}`} style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666' }}>{h.nicknames[0]}</span>
              ))}
            </div>
          )}
        </div>
        ) : null;
      })()}

      {/* Coaching Tip */}
      {!isComplete && coachingTipsVisible && (team1Picks.length + team1Bans.length > 0 || step > 0) && (
        <div className="px-4 py-1 flex items-center justify-center gap-2" style={{ background: 'rgba(0,255,255,0.03)' }}>
          <span className="text-[10px] opacity-70 flex-1 text-center">
            💡 {(() => {
              if (isBan && !isYourTurn) {
                const sTier = icyVeins.getSTierHeroes(map.name).filter(name => {
                  return allHeroesSorted.some(h => h.nicknames[0] === name && draft.isAvailable(h));
                });
                if (sTier.length > 0) return `Enemy may ban: ${sTier.slice(0, 3).join(', ')}`;
                return 'Enemy is banning — watch for targeted bans';
              }
              return getCoachingTip(step, realStep, isBan, isYourTurn, team1Picks, team2Picks, map);
            })()}
          </span>
          <button
            onClick={() => {
              setCoachingTipsVisible(false);
              DraftSettings.showCoachingTips = false;
              DraftSettings.save();
            }}
            className="text-[9px] opacity-30 hover:opacity-60 shrink-0"
            title="Hide coaching tips (re-enable in Settings)"
          >✕</button>
        </div>
      )}
      {!isComplete && !coachingTipsVisible && (
        <div className="px-4 py-0.5 text-center">
          <button
            onClick={() => {
              setCoachingTipsVisible(true);
              DraftSettings.showCoachingTips = true;
              DraftSettings.save();
            }}
            className="text-[9px] opacity-25 hover:opacity-50"
            title="Show coaching tips"
          >💡 Tips</button>
        </div>
      )}

      {/* Counter Threat Warnings */}
      {!isComplete && !isBan && threats.length > 0 && (() => {
        const visible = threats.filter(t => !dismissedWarnings.has(`threat-${t.threat}-${t.target}`)).slice(0, 3);
        if (visible.length === 0) return null;
        return (
          <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap justify-center warning-fade-in" role="alert" aria-live="assertive" style={{ background: 'rgba(255,99,71,0.1)', borderBottom: '1px solid #FF634733' }}>
            <span className="text-[10px] font-bold" style={{ color: '#FF6347' }}>⚠️ THREATS:</span>
            {visible.map(t => (
              <span key={`${t.threat}-${t.target}`} className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: 'rgba(255,99,71,0.15)', color: '#FF6347', border: '1px solid #FF634722' }}>
                ⚠ {t.threat} counters your {t.target}{t.score >= 3 ? ' (strong)' : ''}
                <button onClick={() => dismissWarning(`threat-${t.threat}-${t.target}`)} className="ml-0.5 opacity-70 hover:opacity-100" aria-label={`Dismiss threat: ${t.threat} counters ${t.target}`} style={{ lineHeight: 1 }}>✕</button>
              </span>
            ))}
            {threats.length > 3 && <span className="text-[10px] opacity-70">+{threats.length - 3} more</span>}
          </div>
        );
      })()}

      {/* Synergy Notifications */}
      {!isComplete && !isBan && synergies.length > 0 && (() => {
        const visible = synergies.filter(s => !dismissedWarnings.has(`syn-${s.hero1}-${s.hero2}`)).slice(0, 2);
        if (visible.length === 0) return null;
        return (
          <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap justify-center warning-fade-in" style={{ background: 'rgba(0,200,100,0.08)', borderBottom: '1px solid rgba(0,200,100,0.2)' }}>
            <span className="text-[10px] font-bold" style={{ color: '#00C864' }}>⚡ SYNERGY:</span>
            {visible.map(s => (
              <span key={`${s.hero1}-${s.hero2}`} className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: 'rgba(0,200,100,0.12)', color: '#00C864', border: '1px solid rgba(0,200,100,0.15)' }}>
                ⚡ {s.hero1} + {s.hero2} synergy!{s.reason ? ` — ${s.reason}` : ''}
                <button onClick={() => dismissWarning(`syn-${s.hero1}-${s.hero2}`)} className="ml-0.5 opacity-70 hover:opacity-100" aria-label={`Dismiss synergy: ${s.hero1} and ${s.hero2}`} style={{ lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
        );
      })()}

      {/* Role Composition Warnings */}
      {!isComplete && !isBan && roleWarnings.length > 0 && (
        <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap justify-center warning-fade-in" style={{ background: 'rgba(255,191,0,0.08)', borderBottom: '1px solid rgba(255,191,0,0.2)' }}>
          {roleWarnings.map(w => (
            <span key={w} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,191,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,191,0,0.15)' }}>
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Mobile Team Panels */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 py-2" style={{ background: 'rgba(20, 25, 45, 0.35)' }}>
        <TeamPanel teamNumber={1} picks={isReplaying && replayPartials ? [...replayPartials.team1Picks] : [...team1Picks]} bans={isReplaying && replayPartials ? [...replayPartials.team1Bans] : [...team1Bans]} isActive={isReplaying ? replayTimeline[replayStep]?.team === 1 : !isComplete && currentTeam === 1} enemyPicks={isReplaying && replayPartials ? [...replayPartials.team2Picks] : [...team2Picks]} onHeroClick={h => setDetailHero(h)} flashHero={isReplaying ? replayFlashHero : lastAction} />
        <TeamPanel teamNumber={2} picks={isReplaying && replayPartials ? [...replayPartials.team2Picks] : [...team2Picks]} bans={isReplaying && replayPartials ? [...replayPartials.team2Bans] : [...team2Bans]} isActive={isReplaying ? replayTimeline[replayStep]?.team === 2 : !isComplete && currentTeam === 2} enemyPicks={isReplaying && replayPartials ? [...replayPartials.team1Picks] : [...team1Picks]} onHeroClick={h => setDetailHero(h)} flashHero={isReplaying ? replayFlashHero : lastAction} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden">
        {/* Team 1 Panel - hidden on mobile */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <TeamPanel teamNumber={1} picks={isReplaying && replayPartials ? [...replayPartials.team1Picks] : [...team1Picks]} bans={isReplaying && replayPartials ? [...replayPartials.team1Bans] : [...team1Bans]} isActive={isReplaying ? replayTimeline[replayStep]?.team === 1 : !isComplete && currentTeam === 1} enemyPicks={isReplaying && replayPartials ? [...replayPartials.team2Picks] : [...team2Picks]} onHeroClick={h => setDetailHero(h)} flashHero={isReplaying ? replayFlashHero : lastAction} />
        </div>

        {/* Center: Hero Grid + Suggestions */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Map Info Panel (toggleable) */}
          {showMapInfo && !isComplete && (
            <div className="flex-shrink-0 rounded overflow-hidden" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
              <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(68,102,136,0.3)' }}>
                <span className="text-xs font-semibold" style={{ color: '#00FFFF' }}>🗺️ Map Info — {map.name}</span>
                <button onClick={() => setShowMapInfo(false)} className="text-xs px-1.5 rounded hover:bg-white/10" style={{ color: '#A9A9A9' }} title="Close map info">✕</button>
              </div>
              <div className="px-3 py-2 flex flex-col sm:flex-row gap-3">
                {/* Specialty Priorities */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#FFD700' }}>Specialty Priorities</h4>
                  <div className="space-y-1">
                    {mapSpecialties.map(({ specialty, weight }) => {
                      const maxWeight = mapSpecialties[0]?.weight || 3;
                      const pct = (weight / maxWeight) * 100;
                      return (
                        <div key={specialty} className="flex items-center gap-2">
                          <span className="text-[10px] w-24 truncate" style={{ color: SPECIALTY_BAR_COLORS[specialty] || '#87CEEB' }}>
                            {specialtyToString(specialty)}
                          </span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SPECIALTY_BAR_COLORS[specialty] || '#87CEEB' }} />
                          </div>
                          <span className="text-[10px] w-5 text-right opacity-60">{weight}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Top Available Heroes */}
                <div className="flex-shrink-0">
                  <h4 className="text-[10px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#FFD700' }}>Top Available Heroes</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {mapTopHeroes.length === 0 ? (
                      <span className="text-[10px] opacity-40">No top heroes available</span>
                    ) : mapTopHeroes.map(({ hero, tier }) => (
                      <div key={hero.name} className="flex flex-col items-center cursor-pointer" onClick={() => handleHeroClick(hero)} title={`${hero.nicknames[0]} (${tier}-tier)`}>
                        <HeroPortrait hero={hero} size="xs" tierBadge={tier} />
                        <span className="text-[8px] mt-0.5 opacity-70 max-w-[34px] text-center truncate">{hero.nicknames[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions (hidden when draft complete) */}
          {!isComplete && (
          <div className="flex-shrink-0" data-tutorial-target="suggestions">
            <button
              onClick={() => setSuggestionsCollapsed(c => !c)}
              className="w-full text-left text-xs font-semibold px-3 py-1.5 rounded-t flex items-center justify-between lg:hidden"
              style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)', borderBottom: suggestionsCollapsed ? '1px solid rgba(68,102,136,0.5)' : 'none', color: '#00FFFF' }}
            >
              <span>{isBan ? 'Ban Suggestions' : 'Pick Suggestions'} ({suggestions.length})</span>
              <span>{suggestionsCollapsed ? '▶' : '▼'}</span>
            </button>
            <div className={`${suggestionsCollapsed ? 'hidden lg:block' : ''} max-h-[340px] overflow-y-auto`}>
              {suggestions.length === 0 ? (
                <div className="p-4 rounded text-center" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No heroes match current filters</p>
                </div>
              ) : (
                <HeroSuggestionPanel
                  suggestions={suggestions}
                  onSelect={(s) => handleHeroClick(s.hero)}
                  title={isBan ? 'Ban Suggestions' : 'Pick Suggestions'}
                  mapName={map.name}
                />
              )}
            </div>
          </div>
          )}

          {/* Hero Search + Grid */}
          {!isComplete && (
            <div ref={heroGridRef} tabIndex={-1} data-hero-grid data-tutorial-target="heroGrid" className="flex-1 min-h-[220px] overflow-auto p-2 rounded" style={{ background: 'rgba(20, 25, 45, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }} role="region" aria-label="Hero selection grid">
              {!heroGridReady ? (
                /* Loading skeleton */
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="skeleton-pulse" style={{ height: 72, animationDelay: `${i * 30}ms` }} />
                  ))}
                </div>
              ) : (
              <>
              {/* Hero Pool Stats */}
              {(() => {
                const roleData = [
                  { role: 'Tank', color: '#6495ED' }, { role: 'Healer', color: '#90EE90' },
                  { role: 'DPS', color: '#FF6347' }, { role: 'Mage', color: '#BA55D3' },
                  { role: 'Offlane', color: '#FFA500' }, { role: 'Specialist', color: '#A9A9A9' },
                ];
                const totalAvail = ALL_HEROES.filter(h => draft.isAvailable(h)).length;
                const totalAll = ALL_HEROES.length;
                return (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {roleData.map(({ role, color }) => {
                        const count = ALL_HEROES.filter(h => h.role === role).length;
                        return (
                          <div
                            key={role}
                            style={{ flex: count, background: color + '88', borderRight: '1px solid rgba(0,0,0,0.3)' }}
                            title={`${role}: ${ALL_HEROES.filter(h => h.role === role && draft.isAvailable(h)).length}/${count}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] flex-shrink-0 opacity-60" style={{ color: roleFilter !== 'All' ? ROLE_COLORS[roleFilter] || '#87CEEB' : '#87CEEB' }}>
                      {totalAvail}/{totalAll}{roleFilter !== 'All' ? ` · ${roleFilter}` : ''}
                    </span>
                  </div>
                );
              })()}
              <div className="relative mb-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="🔍 Search heroes, roles, specialties... (/ to focus)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchMatches.length > 0) {
                      e.preventDefault();
                      handleHeroClick(searchMatches[0]);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded text-sm focus:outline-none"
                  style={{ background: 'rgba(30, 40, 70, 0.8)', border: '1px solid rgba(68,102,136,0.5)', color: '#fff' }}
                  aria-label="Search heroes by name, role, or specialty"
                />
                {searchQuery && (
                  <span className="absolute right-8 top-2 text-[10px]" style={{ color: '#87CEEB' }}>
                    {filtered.length}/{roleFilteredCount}
                  </span>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                    style={{ color: '#FF6666' }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
                {searchQuery && searchQuery.length >= 2 && searchMatches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 rounded-b shadow-lg overflow-hidden"
                    style={{ background: 'rgba(15, 20, 40, 0.97)', border: '1px solid rgba(0,255,255,0.3)', borderTop: '1px solid rgba(0,255,255,0.15)' }}>
                    {searchMatches.map((hero, i) => (
                      <button key={hero.name}
                        onClick={() => handleHeroClick(hero)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/10 transition-colors"
                        style={i === 0 ? { background: 'rgba(0,255,255,0.08)' } : undefined}>
                        <HeroPortrait hero={hero} size="xs" />
                        <span className="text-xs flex-1 truncate">{highlightMatch(hero.nicknames[0], searchQuery)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (ROLE_COLORS[hero.role] || '#888') + '22', color: ROLE_COLORS[hero.role] || '#888' }}>
                          {hero.role}
                        </span>
                      </button>
                    ))}
                    <div className="px-3 py-1 text-[9px] opacity-40" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      ↵ Enter to {isBan ? 'ban' : 'pick'} first · Esc to close
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setHeroView('grid')}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: heroView === 'grid' ? '#00FFFF' : '#A9A9A9',
                    border: `1px solid ${heroView === 'grid' ? '#00FFFF66' : '#A9A9A933'}`,
                    background: heroView === 'grid' ? 'rgba(0,255,255,0.12)' : 'transparent',
                  }}
                  title="Show all heroes in one grid"
                >
                  Grid View
                </button>
                <button
                  onClick={() => setHeroView('roles')}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: heroView === 'roles' ? '#00FFFF' : '#A9A9A9',
                    border: `1px solid ${heroView === 'roles' ? '#00FFFF66' : '#A9A9A933'}`,
                    background: heroView === 'roles' ? 'rgba(0,255,255,0.12)' : 'transparent',
                  }}
                  title="Group heroes by role"
                >
                  Role View
                </button>
                <select value={heroSort} onChange={e => setHeroSort(e.target.value as 'name' | 'role' | 'tier')}
                  className="text-[10px] px-1 py-0.5 rounded ml-1" style={{ background: 'rgba(30, 40, 70, 0.8)', color: '#00FFFF', border: '1px solid rgba(68,102,136,0.5)' }}>
                  <option value="name">A-Z</option>
                  <option value="role">Role</option>
                  <option value="tier">Tier ↓</option>
                </select>
                <span className="text-[10px] ml-auto opacity-70">
                  {filtered.filter(h => draft.isAvailable(h)).length}/{filtered.length}
                </span>
              </div>

              {heroView === 'grid' ? (
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', willChange: 'transform' }}>
                  {filtered.map(hero => {
                    const isAvail = draft.isAvailable(hero);
                    const isBanned = bannedNames.has(hero.name);
                    const pickedByTeam = team1PickNames.has(hero.name) ? 1 : team2PickNames.has(hero.name) ? 2 : 0;
                    const tier = icyVeins.getHeroTierOnMap(hero.nicknames[0], map.name);
                    return (
                      <div key={hero.name} onContextMenu={e => { e.preventDefault(); setDetailHero(hero); }}
                        className="rounded" style={{
                          contain: 'layout style paint',
                          ...(tier === 'S' && isAvail ? { boxShadow: '0 0 6px rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.05)' } : {}),
                          ...(isBanned ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                          ...(pickedByTeam ? { opacity: 0.7, border: `2px solid ${pickedByTeam === 1 ? '#00FFFF' : '#FF6666'}`, borderRadius: '6px' } : {}),
                        }}>
                        <HeroPortrait
                          hero={hero}
                          size="md"
                          dimmed={!isAvail && !isBanned && !pickedByTeam}
                          banned={isBanned}
                          showName
                          tierBadge={tier !== 'B' ? tier : undefined}
                          highlightQuery={deferredSearchQuery || undefined}
                          onClick={isAvail ? () => handleHeroClick(hero) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedByRole.map(group => (
                    <div key={group.role}>
                      <h4 className="text-xs font-bold mb-1 flex items-center gap-2" style={{ color: ROLE_COLORS[group.role] || '#FFD700' }}>
                        {group.role}
                        <span className="opacity-70 font-normal">({group.heroes.filter(h => draft.isAvailable(h)).length}/{group.heroes.length})</span>
                        {group.heroes.filter(h => draft.isAvailable(h) && icyVeins.getHeroTierOnMap(h.nicknames[0], map.name) === 'S').length > 0 && (
                          <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
                            ★{group.heroes.filter(h => draft.isAvailable(h) && icyVeins.getHeroTierOnMap(h.nicknames[0], map.name) === 'S').length}
                          </span>
                        )}
                      </h4>
                      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', willChange: 'transform' }}>
                        {group.heroes.map(hero => {
                          const isAvail = draft.isAvailable(hero);
                          const isBanned = bannedNames.has(hero.name);
                          const pickedByTeam = team1PickNames.has(hero.name) ? 1 : team2PickNames.has(hero.name) ? 2 : 0;
                          const tier = icyVeins.getHeroTierOnMap(hero.nicknames[0], map.name);
                          return (
                            <div key={hero.name} onContextMenu={e => { e.preventDefault(); setDetailHero(hero); }}
                              style={{
                                contain: 'layout style paint',
                                ...(isBanned ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                                ...(pickedByTeam ? { opacity: 0.7, border: `2px solid ${pickedByTeam === 1 ? '#00FFFF' : '#FF6666'}`, borderRadius: '6px' } : {}),
                              }}>
                              <HeroPortrait
                                hero={hero}
                                size="md"
                                dimmed={!isAvail && !isBanned && !pickedByTeam}
                                banned={isBanned}
                                showName
                                tierBadge={tier !== 'B' ? tier : undefined}
                                highlightQuery={deferredSearchQuery || undefined}
                                onClick={isAvail ? () => handleHeroClick(hero) : undefined}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* ═══════ Replay Overlay ═══════ */}
          {isComplete && isReplaying && (() => {
            const current = replayTimeline[replayStep];
            return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1" style={{ color: '#FFD700' }}>🎬 Replaying Draft...</h2>
                <p className="text-sm font-semibold" style={{ color: current?.isBan ? '#FF6666' : '#00FFFF' }}>
                  Step {replayStep + 1}/16 — Team {current?.team} {current?.isBan ? '🚫 BAN' : '✅ PICK'}
                </p>
              </div>
              {current?.hero && (
                <div className={`flex items-center gap-4 p-4 rounded-lg ${current.isBan ? 'hero-ban-flash' : 'hero-pick-flash'}`}
                  style={{ background: `rgba(${current.isBan ? '255,102,102' : '0,255,255'},0.08)`, border: `2px solid ${current.isBan ? '#FF666666' : '#00FFFF66'}` }}
                  key={`replay-${replayStep}`}>
                  <HeroPortrait hero={current.hero} size="lg" banned={current.isBan} selected={!current.isBan} />
                  <div>
                    <p className="text-lg font-bold">{current.hero.nicknames[0]}</p>
                    <p className="text-sm opacity-60">{current.hero.role}</p>
                    <p className="text-xs mt-1" style={{ color: current.isBan ? '#FF6666' : '#00FFFF' }}>
                      {current.isBan ? `Banned by Team ${current.team}` : `Picked by Team ${current.team}`}
                    </p>
                  </div>
                </div>
              )}
              {/* Replay timeline dots */}
              <div className="flex gap-1 flex-wrap justify-center">
                {replayTimeline.map((s, i) => {
                  const teamColor = s.team === 1 ? '#4488FF' : '#FF4444';
                  return (
                    <div key={i} className="rounded-sm flex items-center justify-center transition-all duration-200"
                      style={{
                        width: i === replayStep ? 28 : 20,
                        height: i === replayStep ? 22 : 16,
                        background: i <= replayStep ? (s.isBan ? '#FF666699' : teamColor + '99') : (s.isBan ? '#FF666622' : teamColor + '22'),
                        border: i === replayStep ? '2px solid #FFD700' : '1px solid transparent',
                        fontSize: 9, color: '#fff', fontWeight: i === replayStep ? 'bold' : 'normal',
                      }}
                      title={`Step ${i + 1}: Team ${s.team} ${s.isBan ? 'BAN' : 'PICK'} ${s.hero?.nicknames[0] || '?'}`}>
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => { setIsReplaying(false); setReplayStep(0); }}
                className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                style={{ background: '#FF666622', border: '2px solid #FF6666', color: '#FF6666' }}
              >
                ⏹ Stop Replay
              </button>
            </div>
            );
          })()}

          {/* ═══════ Draft Complete Summary ═══════ */}
          {isComplete && analysis && !isReplaying && (() => {
            const s1 = computeCompScore(team1Picks);
            const s2 = computeCompScore(team2Picks);
            const diff = s1 - s2;
            const verdictLabel = diff > 10 ? 'Team 1 Advantage' : diff < -10 ? 'Team 2 Advantage' : 'Even Match';
            const verdictColor = diff > 10 ? '#4488FF' : diff < -10 ? '#FF6666' : '#FFD700';
            const roleChecklist = (picks: Hero[]) => {
              const checks: { label: string; color: string; met: boolean }[] = [
                { label: 'Tank', color: '#6495ED', met: picks.some(h => h.role === 'Tank') },
                { label: 'Healer', color: '#90EE90', met: picks.some(h => h.role === 'Healer') },
                { label: 'DPS', color: '#FF6347', met: picks.some(h => h.role === 'DPS' || h.role === 'Mage') },
                { label: 'Offlane', color: '#FFA500', met: picks.some(h => h.role === 'Offlane') },
                { label: 'Waveclear', color: '#00FFFF', met: picks.some(h => h.specialties.includes(Specialty.WAVECLEAR)) },
              ];
              return checks;
            };
            const verdictExplanation = (() => {
              if (Math.abs(diff) <= 10) return 'Both teams have well-rounded compositions with comparable strengths.';
              const stronger = diff > 0 ? 'Team 1' : 'Team 2';
              const weaker = diff > 0 ? 'Team 2' : 'Team 1';
              const sP = diff > 0 ? team1Picks : team2Picks;
              const wP = diff > 0 ? team2Picks : team1Picks;
              const gaps: string[] = [];
              if (!wP.some(h => h.role === 'Tank')) gaps.push('no Tank');
              if (!wP.some(h => h.role === 'Healer')) gaps.push('no Healer');
              if (!wP.some(h => h.specialties.includes(Specialty.WAVECLEAR))) gaps.push('lacks waveclear');
              if (gaps.length > 0) return `${stronger} has a more complete composition. ${weaker} ${gaps.join(', ')}.`;
              return `${stronger} has better overall role coverage and specialty synergy.`;
            })();

            return (
            <div className="space-y-4 overflow-y-auto summary-enter" style={{ animation: 'summarySlideIn 0.5s ease-out' }}>
              <style>{`
                @keyframes summarySlideIn {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .summary-enter > * {
                  animation: summarySlideIn 0.5s ease-out both;
                }
                .summary-enter > *:nth-child(2) { animation-delay: 0.05s; }
                .summary-enter > *:nth-child(3) { animation-delay: 0.1s; }
                .summary-enter > *:nth-child(4) { animation-delay: 0.15s; }
                .summary-enter > *:nth-child(5) { animation-delay: 0.2s; }
                .summary-enter > *:nth-child(6) { animation-delay: 0.25s; }
                .summary-enter > *:nth-child(7) { animation-delay: 0.3s; }
              `}</style>

              {/* Header */}
              <div className="text-center py-3 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(0,255,255,0.08) 100%)', border: '1px solid #FFD70044' }}>
                <h2 className="text-2xl font-bold" style={{ color: '#FFD700' }}>🏆 Draft Complete!</h2>
                <p className="text-xs mt-1 opacity-60">📍 {map.name} — {isQuickDraft ? 'Quick Draft' : 'Standard Draft'}</p>
              </div>

              {/* ── Section 1: Team Composition Overview ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Team 1', picks: team1Picks, color: '#4488FF', score: s1 },
                  { label: 'Team 2', picks: team2Picks, color: '#FF6666', score: s2 },
                ].map(({ label, picks, color, score }) => (
                  <div key={label} className="p-4 rounded-lg" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${color}55` }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold" style={{ color }}>{label}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: '#FFD700' }}>{score}</span>
                        <span className="text-[9px] opacity-50">/ 100</span>
                      </div>
                    </div>
                    {/* Hero portraits with roles and tiers */}
                    <div className="space-y-2 mb-3">
                      {picks.map(h => {
                        const tier = icyVeins.getHeroTierOnMap(h.nicknames[0], map.name);
                        const roleColor: Record<string, string> = { Tank: '#6495ED', Healer: '#90EE90', DPS: '#FF6347', Mage: '#BA55D3', Offlane: '#FFA500', Specialist: '#A9A9A9' };
                        return (
                          <div key={h.name} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded p-1 -m-1" onClick={() => setDetailHero(h)}>
                            <HeroPortrait hero={h} size="lg" selected />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{h.nicknames[0]}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (roleColor[h.role] || '#888') + '22', color: roleColor[h.role] || '#888', border: `1px solid ${(roleColor[h.role] || '#888')}33` }}>{h.role}</span>
                                {tier !== 'B' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{
                                    background: tier === 'S' ? 'rgba(255,215,0,0.15)' : tier === 'A' ? 'rgba(144,238,144,0.15)' : 'rgba(169,169,169,0.15)',
                                    color: tier === 'S' ? '#FFD700' : tier === 'A' ? '#90EE90' : '#A9A9A9',
                                    border: `1px solid ${tier === 'S' ? '#FFD70033' : tier === 'A' ? '#90EE9033' : '#A9A9A933'}`,
                                  }}>{tier}-Tier</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Role checklist */}
                    <div className="flex flex-wrap gap-1.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      {roleChecklist(picks).map(({ label: rl, color: rc, met }) => (
                        <span key={rl} className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          background: met ? rc + '22' : 'rgba(255,255,255,0.04)',
                          color: met ? rc : 'rgba(255,255,255,0.25)',
                          border: `1px solid ${met ? rc + '44' : 'rgba(255,255,255,0.08)'}`,
                        }}>{met ? '✓' : '✗'} {rl}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Section 2: Win Condition Analysis ── */}
              <div className="p-4 rounded-lg" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="text-sm font-bold mb-3 text-center" style={{ color: '#00FFFF' }}>⚔️ WIN CONDITION ANALYSIS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Team 1', a: analysis.team1, color: '#4488FF' },
                    { label: 'Team 2', a: analysis.team2, color: '#FF6666' },
                  ].map(({ label, a, color }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color }}>{label}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: color + '22', color: '#FFD700', border: `1px solid ${color}44` }}>{winConditionToString(a.primary)}</span>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed">{a.description}</p>
                      <div className="space-y-1">
                        <p className="text-[11px]"><span style={{ color: '#00FFFF' }}>🎯 Key Focus:</span> <span className="opacity-80">{a.keyFocus}</span></p>
                        <p className="text-[11px]"><span style={{ color: '#FF6666' }}>🛡️ Counter:</span> <span className="opacity-80">{a.enemyCounterStrategy}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Win condition strength comparison bar */}
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] opacity-70 text-center mb-2">Win Condition Strength</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-20 text-right" style={{ color: '#4488FF' }}>{winConditionToString(analysis.team1.primary)}</span>
                    <div className="flex-1 flex h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="transition-all duration-700" style={{
                        width: `${Math.max(15, Math.min(85, 50 + diff))}%`,
                        background: 'linear-gradient(90deg, #4488FF99, #4488FFCC)',
                        borderRadius: '9999px 0 0 9999px',
                      }} />
                      <div className="transition-all duration-700" style={{
                        flex: 1,
                        background: 'linear-gradient(90deg, #FF6666CC, #FF666699)',
                        borderRadius: '0 9999px 9999px 0',
                      }} />
                    </div>
                    <span className="text-[10px] w-20" style={{ color: '#FF6666' }}>{winConditionToString(analysis.team2.primary)}</span>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Matchup Verdict ── */}
              <div className="p-4 rounded-lg text-center" style={{ background: `linear-gradient(135deg, ${verdictColor}11, ${verdictColor}08)`, border: `1px solid ${verdictColor}44` }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: '#00FFFF' }}>📊 MATCHUP VERDICT</h3>
                <p className="text-xl font-bold mb-2" style={{ color: verdictColor }}>{verdictLabel}</p>
                {/* Score comparison bar */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-sm font-bold" style={{ color: '#4488FF' }}>{s1}</span>
                  <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full transition-all duration-700" style={{
                      width: `${Math.max(10, Math.min(90, 50 + diff))}%`,
                      background: `linear-gradient(90deg, #4488FF, ${verdictColor})`,
                    }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#FF6666' }}>{s2}</span>
                </div>
                <p className="text-xs opacity-70 max-w-lg mx-auto">{verdictExplanation}</p>
              </div>

              {/* ── Section 4: Specialty Coverage ── */}
              <div className="p-3 rounded-lg" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
                <h3 className="text-xs font-bold mb-2 text-center" style={{ color: '#00FFFF' }}>COVERAGE COMPARISON</h3>
                <div className="space-y-1">
                  {[
                    { label: 'Waveclear', spec: Specialty.WAVECLEAR },
                    { label: 'Engage', spec: Specialty.ENGAGE },
                    { label: 'Hard CC', spec: Specialty.HARD_CC },
                    { label: 'Burst', spec: Specialty.BURST_DAMAGE },
                    { label: 'Poke', spec: Specialty.POKE },
                    { label: 'Sustain', spec: Specialty.SUSTAINED_DAMAGE },
                  ].map(({ label, spec }) => {
                    const t1c = team1Picks.filter(h => h.specialties.includes(spec)).length;
                    const t2c = team2Picks.filter(h => h.specialties.includes(spec)).length;
                    return (
                      <div key={label} className="flex items-center gap-1 text-[10px]">
                        <div className="w-8 text-right" style={{ color: t1c > t2c ? '#4488FF' : t1c === t2c ? '#888' : '#666' }}>{t1c}</div>
                        <div className="flex-1 flex h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${(t1c / 5) * 50}%`, background: '#4488FF99' }} />
                          <div className="flex-1" />
                          <div style={{ width: `${(t2c / 5) * 50}%`, background: '#FF666699' }} />
                        </div>
                        <div className="w-8" style={{ color: t2c > t1c ? '#FF6666' : t2c === t1c ? '#888' : '#666' }}>{t2c}</div>
                        <span className="w-16 opacity-70">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 5: Bans Summary ── */}
              {(team1Bans.length > 0 || team2Bans.length > 0) && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid #FF666644' }}>
                <h3 className="text-sm font-bold mb-3 text-center" style={{ color: '#FF6666' }}>🚫 BANS SUMMARY</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Team 1 Bans', bans: team1Bans, color: '#4488FF' },
                    { label: 'Team 2 Bans', bans: team2Bans, color: '#FF6666' },
                  ].map(({ label, bans, color }) => (
                    <div key={label}>
                      <p className="text-xs font-semibold mb-2" style={{ color }}>{label}</p>
                      <div className="flex gap-2 flex-wrap">
                        {bans.map(h => (
                          <div key={h.name} className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: 'rgba(255,102,102,0.08)', border: '1px solid #FF666633' }}>
                            <HeroPortrait hero={h} size="sm" banned />
                            <div>
                              <p className="text-xs font-semibold opacity-60 line-through">{h.nicknames[0]}</p>
                              <p className="text-[9px] opacity-40">{h.role}</p>
                            </div>
                          </div>
                        ))}
                        {bans.length === 0 && <span className="text-xs opacity-30">No bans</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* ── Section 6: Action Buttons ── */}
              <div className="flex gap-3 justify-center flex-wrap p-3 rounded-lg" style={{ background: 'rgba(30, 40, 70, 0.5)', border: '1px solid rgba(68,102,136,0.3)' }}>
                <button
                  onClick={() => {
                    const t1P = team1Picks.map(h => `${h.nicknames[0]} (${h.role})`).join(', ');
                    const t2P = team2Picks.map(h => `${h.nicknames[0]} (${h.role})`).join(', ');
                    const t1B = team1Bans.map(h => h.nicknames[0]).join(', ');
                    const t2B = team2Bans.map(h => h.nicknames[0]).join(', ');
                    const wc1 = winConditionToString(analysis.team1.primary);
                    const wc2 = winConditionToString(analysis.team2.primary);
                    const rc = (picks: Hero[]) => roleChecklist(picks).map(r => `${r.met ? '✓' : '✗'} ${r.label}`).join(', ');
                    const text = [
                      `⚔️ HotsDrafter — ${map.name}`,
                      `━━━━━━━━━━━━━━━━━━━━`,
                      ``,
                      `🔵 TEAM 1 (Score: ${s1}/100)`,
                      `  Bans: ${t1B || 'None'}`,
                      `  Picks: ${t1P}`,
                      `  Roles: ${rc(team1Picks)}`,
                      `  Strategy: ${wc1}`,
                      `  Focus: ${analysis.team1.keyFocus}`,
                      ``,
                      `🔴 TEAM 2 (Score: ${s2}/100)`,
                      `  Bans: ${t2B || 'None'}`,
                      `  Picks: ${t2P}`,
                      `  Roles: ${rc(team2Picks)}`,
                      `  Strategy: ${wc2}`,
                      `  Focus: ${analysis.team2.keyFocus}`,
                      ``,
                      `📊 Verdict: ${verdictLabel}`,
                      `   ${verdictExplanation}`,
                    ].join('\n');
                    navigator.clipboard.writeText(text);
                    setExportCopied(true);
                    setTimeout(() => setExportCopied(false), 2000);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#90EE9022', border: '2px solid #90EE90', color: '#90EE90' }}
                  title="Copy draft summary to clipboard"
                >
                  {exportCopied ? '✅ Copied!' : '📋 Copy Summary'}
                </button>
                <button
                  onClick={() => {
                    const url = window.location.origin + encodeDraftUrl(mapIdx, team1Picks, team2Picks, team1Bans, team2Bans);
                    navigator.clipboard.writeText(url);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#00FF0022', border: '2px solid #00FF00', color: '#00FF00' }}
                  title="Copy shareable link to clipboard"
                >
                  {shareCopied ? '✅ Copied!' : '🔗 Share Link'}
                </button>
                <button
                  onClick={() => {
                    hasSavedDraft.current = false;
                    handleReset();
                  }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#00FFFF22', border: '2px solid #00FFFF', color: '#00FFFF' }}
                  title="Start a new draft"
                >
                  🔄 New Draft
                </button>
                <button
                  onClick={() => {
                    if (!showSaveConfirm) {
                      const t1 = new TeamComposition(team1Picks);
                      const t2 = new TeamComposition(team2Picks);
                      const a1 = analyzeWinCondition(t1, t2);
                      const a2 = analyzeWinCondition(t2, t1);
                      saveDraft({
                        timestamp: new Date().toISOString(),
                        mapName: map.name,
                        firstPickTeam: firstPick,
                        team1Picks: team1Picks.map(h => h.nicknames[0]),
                        team2Picks: team2Picks.map(h => h.nicknames[0]),
                        team1Bans: team1Bans.map(h => h.nicknames[0]),
                        team2Bans: team2Bans.map(h => h.nicknames[0]),
                        team1Score: s1, team2Score: s2,
                        team1WinCondition: winConditionToString(a1.primary),
                        team2WinCondition: winConditionToString(a2.primary),
                        verdict: `${verdictLabel}: ${verdictExplanation}`,
                      });
                      setShowSaveConfirm(true);
                      setTimeout(() => setShowSaveConfirm(false), 2500);
                    }
                  }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#BA55D322', border: '2px solid #BA55D3', color: '#BA55D3' }}
                  title="Save this draft to history"
                >
                  {showSaveConfirm ? '✅ Saved!' : '💾 Save to History'}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#FFD70022', border: '2px solid #FFD700', color: '#FFD700' }}
                  title="Return to home page"
                >
                  🏠 Return Home
                </button>
                <button
                  onClick={() => { setReplayStep(0); setIsReplaying(true); }}
                  className="px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                  style={{ background: '#FF8C0022', border: '2px solid #FF8C00', color: '#FF8C00' }}
                  title="Replay the draft step by step"
                >
                  ▶ Replay Draft
                </button>
              </div>
            </div>
            );
          })()}
        </div>

        {/* Team 2 Panel - hidden on mobile */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <TeamPanel teamNumber={2} picks={isReplaying && replayPartials ? [...replayPartials.team2Picks] : [...team2Picks]} bans={isReplaying && replayPartials ? [...replayPartials.team2Bans] : [...team2Bans]} isActive={isReplaying ? replayTimeline[replayStep]?.team === 2 : !isComplete && currentTeam === 2} enemyPicks={isReplaying && replayPartials ? [...replayPartials.team1Picks] : [...team1Picks]} onHeroClick={h => setDetailHero(h)} flashHero={isReplaying ? replayFlashHero : lastAction} />
        </div>
      </div>
      {/* Hero Detail Popup */}
      {/* Keyboard Shortcut Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" style={{ background: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setShowShortcutHelp(false)}>
          <div className="rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" style={{ background: 'rgba(15, 20, 40, 0.95)', border: '1px solid #00FFFF44' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#00FFFF' }}>⌨️ Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcutHelp(false)} className="text-sm px-2 py-1 rounded hover:bg-white/10" style={{ color: '#FF6666' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['1 – 7', 'Quick-pick suggestion'],
                ['/ or F', 'Focus search'],
                ['Enter', 'Pick/ban first search match'],
                ['Esc', 'Clear search / Go back'],
                ['G', 'Grid view'],
                ['R', 'Role view'],
                ['Ctrl+Z', 'Undo last action'],
                ['?', 'Toggle this help'],
              ].map(([key, desc]) => (
                <div key={key} className="contents">
                  <kbd className="px-1.5 py-0.5 rounded text-xs font-mono text-right" style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid #00FFFF33' }}>{key}</kbd>
                  <span className="text-xs" style={{ color: '#C0C0C0' }}>{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-4 opacity-40 text-center">Press ? or Esc to close</p>
          </div>
        </div>
      )}

      {detailHero && <HeroDetailPopup hero={detailHero} onClose={() => setDetailHero(null)} />}
    </main>
  );
}

function AnalysisCard({ title, analysis, color }: { title: string; analysis: WinConditionAnalysis; color: string }) {
  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: `1px solid ${color}55` }}>
      <h3 className="font-bold mb-2" style={{ color }}>{title}</h3>
      <p className="text-sm mb-1"><span style={{ color: '#FFD700' }}>Win Condition:</span> {winConditionToString(analysis.primary)}</p>
      <p className="text-xs opacity-80 mb-2">{analysis.description}</p>
      <p className="text-xs"><span style={{ color: '#00FFFF' }}>Key Focus:</span> {analysis.keyFocus}</p>
      <p className="text-xs mt-1"><span style={{ color: '#FF6666' }}>Counter Strategy:</span> {analysis.enemyCounterStrategy}</p>
    </div>
  );
}

export default function DraftPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading draft...</p></div>}>
        <DraftPageInner />
      </Suspense>
    </ErrorBoundary>
  );
}

function DraftReplay({ team1Picks, team2Picks, team1Bans, team2Bans }: {
  team1Picks: Hero[]; team2Picks: Hero[]; team1Bans: Hero[]; team2Bans: Hero[];
}) {
  const [replayStep, setReplayStep] = useState(0);

  // Reconstruct the timeline from draft order
  const timeline = useMemo(() => {
    const t1b = [...team1Bans], t2b = [...team2Bans];
    const t1p = [...team1Picks], t2p = [...team2Picks];
    const steps: { team: number; isBan: boolean; hero: Hero | null }[] = [];

    for (let i = 0; i < DRAFT_TEAM_ORDER.length; i++) {
      const team = DRAFT_TEAM_ORDER[i];
      const isBan = DRAFT_IS_BAN[i];
      const arr = isBan
        ? (team === 1 ? t1b : t2b)
        : (team === 1 ? t1p : t2p);
      steps.push({ team, isBan, hero: arr.shift() ?? null });
    }
    return steps;
  }, [team1Picks, team2Picks, team1Bans, team2Bans]);

  const current = timeline[replayStep];

  return (
    <div className="p-4 rounded" style={{ background: 'rgba(30, 40, 70, 0.7)', border: '1px solid rgba(68,102,136,0.5)' }}>
      <h3 className="font-bold mb-3" style={{ color: '#00FFFF' }}>Draft Replay</h3>

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setReplayStep(s => Math.max(0, s - 1))}
          disabled={replayStep === 0}
          className="text-sm px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30"
          style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
          title="Previous step"
        >
          ← Prev
        </button>
        <span className="text-sm font-semibold" style={{ color: current?.isBan ? '#FF6666' : '#00FFFF' }}>
          Step {replayStep + 1}/16 — Team {current?.team} {current?.isBan ? 'BAN' : 'PICK'}
        </span>
        {current?.hero && (
          <div className="flex items-center gap-1">
            <HeroPortrait hero={current.hero} size="sm" banned={current.isBan} selected={!current.isBan} />
            <span className="text-xs font-semibold">{current.hero.nicknames[0]}</span>
          </div>
        )}
        <button
          onClick={() => setReplayStep(s => Math.min(15, s + 1))}
          disabled={replayStep >= 15}
          className="text-sm px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30"
          style={{ color: '#FFD700', border: '1px solid #FFD70055' }}
          title="Next step"
        >
          Next →
        </button>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {timeline.map((s, i) => {
          const teamColor = s.team === 1 ? '#4488FF' : '#FF4444';
          return (
            <button
              key={i}
              onClick={() => setReplayStep(i)}
              className="rounded-sm flex items-center justify-center"
              style={{
                width: i === replayStep ? 28 : 20,
                height: i === replayStep ? 22 : 16,
                background: i <= replayStep ? (s.isBan ? '#FF666699' : teamColor + '99') : (s.isBan ? '#FF666633' : teamColor + '33'),
                border: i === replayStep ? '2px solid #FFD700' : '1px solid transparent',
                fontSize: 9,
                color: '#fff',
                fontWeight: i === replayStep ? 'bold' : 'normal',
              }}
              title={`Step ${i + 1}: Team ${s.team} ${s.isBan ? 'BAN' : 'PICK'} ${s.hero?.nicknames[0] || '?'}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {current?.hero && (
        <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'rgba(20, 25, 45, 0.5)', border: `1px solid ${current.isBan ? '#FF666644' : '#FFD70044'}` }}>
          <HeroPortrait hero={current.hero} size="lg" banned={current.isBan} selected={!current.isBan} />
          <div>
            <span className="text-lg font-bold">{current.hero.nicknames[0]}</span>
            <span className="text-sm ml-2 opacity-60">{current.hero.role}</span>
            <p className="text-xs mt-1 opacity-70">
              {current.isBan ? `Banned by Team ${current.team}` : `Picked by Team ${current.team}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


