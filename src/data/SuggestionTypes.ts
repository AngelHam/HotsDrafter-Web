export enum WinCondition {
  TEAMFIGHT = 'TEAMFIGHT',
  POKE_SIEGE = 'POKE_SIEGE',
  DIVE = 'DIVE',
  SPLIT_MACRO = 'SPLIT_MACRO',
  PICK_COMP = 'PICK_COMP',
  SUSTAIN_ATTRITION = 'SUSTAIN_ATTRITION',
  SNOWBALL_EARLY = 'SNOWBALL_EARLY',
  LATE_GAME_SCALE = 'LATE_GAME_SCALE',
}

export function winConditionToString(wc: WinCondition): string {
  const map: Record<WinCondition, string> = {
    [WinCondition.TEAMFIGHT]: 'Teamfight',
    [WinCondition.POKE_SIEGE]: 'Poke & Siege',
    [WinCondition.DIVE]: 'Dive Composition',
    [WinCondition.SPLIT_MACRO]: 'Split Push / Macro',
    [WinCondition.PICK_COMP]: 'Pick Composition',
    [WinCondition.SUSTAIN_ATTRITION]: 'Sustain & Attrition',
    [WinCondition.SNOWBALL_EARLY]: 'Early Game Snowball',
    [WinCondition.LATE_GAME_SCALE]: 'Late Game Scaling',
  };
  return map[wc] || 'Unknown';
}

export function winConditionToDescription(wc: WinCondition): string {
  const map: Record<WinCondition, string> = {
    [WinCondition.TEAMFIGHT]: 'Group as 5 and fight at objectives. Use your engage and CC to win fights decisively.',
    [WinCondition.POKE_SIEGE]: 'Poke enemies from range, avoid hard engages. Slowly chip away at structures and health.',
    [WinCondition.DIVE]: 'Dive the enemy backline and assassinate their carries. Burst them before they can react.',
    [WinCondition.SPLIT_MACRO]: 'Split the map, apply global pressure. Force the enemy to make difficult rotations.',
    [WinCondition.PICK_COMP]: 'Find isolated enemies and burst them down. Force 4v5 fights through superior pick potential.',
    [WinCondition.SUSTAIN_ATTRITION]: 'Outlast the enemy through superior healing and sustain. Win long, drawn-out fights.',
    [WinCondition.SNOWBALL_EARLY]: 'Dominate the early game, build a lead, and close before the enemy can scale.',
    [WinCondition.LATE_GAME_SCALE]: 'Survive to late game where your heroes outscale. Avoid risky fights early.',
  };
  return map[wc] || '';
}

export interface HeroCategories {
  isTank: boolean;
  isHealer: boolean;
  hasEngage: boolean;
  hasHardCC: boolean;
  hasDamage: boolean;
  hasOfflane: boolean;
  hasWaveclear: boolean;
  hasCampClear: boolean;
}

export interface RangeAnalysis {
  averageRange: number;
  meleeCount: number;
  rangedCount: number;
  extremeRangeCount: number;
  hasRangeMismatch: boolean;
  isPokeComp: boolean;
  isDiveComp: boolean;
  description: string;
}

export interface TeamNeeds {
  hasTank: boolean;
  hasHealer: boolean;
  hasEngage: boolean;
  hasHardCC: boolean;
  hasDamage: boolean;
  hasOfflane: boolean;
  hasWaveclear: boolean;
  hasCampClear: boolean;
}

export interface HeroSuggestion {
  hero: Hero;
  totalScore: number;
  explanation: string;
  synergyScore: number;
  counterScore: number;
  mapFitnessScore: number;
  roleNeedScore: number;
  winConditionScore: number;
  rangeScore: number;
  draftPositionScore: number;
  damageBalanceScore: number;
  counterpickRiskScore: number;
  categories: HeroCategories;
  synergyCount: number;
  counterCount: number;
  counteredByCount: number;
}

import type { Hero } from './Hero';
