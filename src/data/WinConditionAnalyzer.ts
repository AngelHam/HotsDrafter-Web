import { Specialty } from './Specialty';
import { TeamComposition } from './TeamComposition';
import { WinCondition, winConditionToDescription } from './SuggestionTypes';

export interface WinConditionAnalysis {
  primary: WinCondition;
  description: string;
  keyFocus: string;
  enemyCounterStrategy: string;
  scores: Record<WinCondition, number>;
}

function countSpecialty(team: TeamComposition, spec: Specialty): number {
  return team.heroes.filter(h => h.specialties.includes(spec)).length;
}

function scoreTeamfight(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.AOE_DAMAGE) * 0.3;
  score += countSpecialty(team, Specialty.HARD_CC) * 0.3;
  score += countSpecialty(team, Specialty.ENGAGE) * 0.2;
  score += countSpecialty(team, Specialty.BURST_HEALING) * 0.1;
  score += countSpecialty(team, Specialty.DISENGAGE) * 0.1;
  return Math.min(score, 1);
}

function scorePokeSiege(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.POKE) * 0.3;
  score += countSpecialty(team, Specialty.SIEGE_PUSHING) * 0.25;
  score += countSpecialty(team, Specialty.DISENGAGE) * 0.2;
  score += countSpecialty(team, Specialty.WAVECLEAR) * 0.15;
  score += countSpecialty(team, Specialty.ZONING) * 0.1;
  return Math.min(score, 1);
}

function scoreDive(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.MOBILITY) * 0.3;
  score += countSpecialty(team, Specialty.BURST_DAMAGE) * 0.25;
  score += countSpecialty(team, Specialty.ENGAGE) * 0.2;
  score += countSpecialty(team, Specialty.PICK_POTENTIAL) * 0.15;
  score += countSpecialty(team, Specialty.FINISHER) * 0.1;
  return Math.min(score, 1);
}

function scoreSplitMacro(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.GLOBAL_PRESENCE) * 0.3;
  score += countSpecialty(team, Specialty.SPLIT_PUSHING) * 0.25;
  score += countSpecialty(team, Specialty.DOUBLE_SOAKING) * 0.2;
  score += countSpecialty(team, Specialty.WAVECLEAR) * 0.15;
  score += countSpecialty(team, Specialty.CAMP_TAKING) * 0.1;
  return Math.min(score, 1);
}

function scorePickComp(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.PICK_POTENTIAL) * 0.3;
  score += countSpecialty(team, Specialty.BURST_DAMAGE) * 0.25;
  score += countSpecialty(team, Specialty.HARD_CC) * 0.2;
  score += countSpecialty(team, Specialty.STEALTH) * 0.15;
  score += countSpecialty(team, Specialty.MOBILITY) * 0.1;
  return Math.min(score, 1);
}

function scoreSustainAttrition(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.SUSTAINED_HEALING) * 0.3;
  score += countSpecialty(team, Specialty.SELF_SUSTAIN) * 0.25;
  score += countSpecialty(team, Specialty.HIGH_DURABILITY) * 0.2;
  score += countSpecialty(team, Specialty.SUSTAINED_DAMAGE) * 0.15;
  score += countSpecialty(team, Specialty.DAMAGE_MITIGATION) * 0.1;
  return Math.min(score, 1);
}

function scoreSnowballEarly(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.SNOWBALL) * 0.3;
  score += countSpecialty(team, Specialty.BURST_DAMAGE) * 0.25;
  score += countSpecialty(team, Specialty.PICK_POTENTIAL) * 0.2;
  score += countSpecialty(team, Specialty.ENGAGE) * 0.15;
  score += countSpecialty(team, Specialty.CAMP_TAKING) * 0.1;
  return Math.min(score, 1);
}

function scoreLateGameScale(team: TeamComposition): number {
  let score = 0;
  score += countSpecialty(team, Specialty.LATE_GAME_SCALING) * 0.3;
  score += countSpecialty(team, Specialty.SUSTAINED_DAMAGE) * 0.25;
  score += countSpecialty(team, Specialty.DISENGAGE) * 0.2;
  score += countSpecialty(team, Specialty.WAVECLEAR) * 0.15;
  score += countSpecialty(team, Specialty.SELF_SUSTAIN) * 0.1;
  return Math.min(score, 1);
}

function getKeyFocus(wc: WinCondition): string {
  const map: Record<WinCondition, string> = {
    [WinCondition.TEAMFIGHT]: 'Group for objectives, look for 5v5 fights. Use engage + CC combos.',
    [WinCondition.POKE_SIEGE]: 'Stay at range, chip structures. Avoid hard engages, kite back.',
    [WinCondition.DIVE]: 'Target enemy backline. Coordinate dive timing, burst before healing.',
    [WinCondition.SPLIT_MACRO]: 'Split map pressure. Force rotations, win through macro advantage.',
    [WinCondition.PICK_COMP]: 'Roam together, find isolated enemies. Win 4v5 engagements.',
    [WinCondition.SUSTAIN_ATTRITION]: 'Take long fights. Outheal and outlast enemy resources.',
    [WinCondition.SNOWBALL_EARLY]: 'Win early fights, push tempo advantage. Close game before enemy scales.',
    [WinCondition.LATE_GAME_SCALE]: 'Play safe early, farm stacks. Outscale in late game team fights.',
  };
  return map[wc] || '';
}

function getEnemyCounterStrategy(wc: WinCondition): string {
  const map: Record<WinCondition, string> = {
    [WinCondition.TEAMFIGHT]: 'Avoid clumping. Split fights, use poke to whittle them before engage.',
    [WinCondition.POKE_SIEGE]: 'Hard engage onto their poke heroes. Dive backline, force close combat.',
    [WinCondition.DIVE]: 'Group tight, peel for backline. Anti-dive tools + CC to stop divers.',
    [WinCondition.SPLIT_MACRO]: 'Force grouped fights at objectives. Punish split with picks.',
    [WinCondition.PICK_COMP]: 'Stay grouped, avoid face-checking. Ward aggressively, deny vision.',
    [WinCondition.SUSTAIN_ATTRITION]: 'Burst combos to overwhelm healing. Anti-heal + execute damage.',
    [WinCondition.SNOWBALL_EARLY]: 'Play safe early, give some objectives. Outscale to late game.',
    [WinCondition.LATE_GAME_SCALE]: 'Punish early, take aggressive fights. End game before they scale.',
  };
  return map[wc] || '';
}

export function analyzeWinCondition(
  team: TeamComposition,
  enemyTeam: TeamComposition
): WinConditionAnalysis {
  const scores: Record<WinCondition, number> = {
    [WinCondition.TEAMFIGHT]: scoreTeamfight(team),
    [WinCondition.POKE_SIEGE]: scorePokeSiege(team),
    [WinCondition.DIVE]: scoreDive(team),
    [WinCondition.SPLIT_MACRO]: scoreSplitMacro(team),
    [WinCondition.PICK_COMP]: scorePickComp(team),
    [WinCondition.SUSTAIN_ATTRITION]: scoreSustainAttrition(team),
    [WinCondition.SNOWBALL_EARLY]: scoreSnowballEarly(team),
    [WinCondition.LATE_GAME_SCALE]: scoreLateGameScale(team),
  };

  let best = WinCondition.TEAMFIGHT;
  let bestScore = 0;
  for (const [wc, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = wc as WinCondition;
    }
  }

  return {
    primary: best,
    description: winConditionToDescription(best),
    keyFocus: getKeyFocus(best),
    enemyCounterStrategy: getEnemyCounterStrategy(best),
    scores,
  };
}
