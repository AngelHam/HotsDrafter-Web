import type { Hero } from './Hero';
import { Specialty } from './Specialty';
import { DraftingTool, matchesRoleFilter } from './DraftingTool';
import type { HotsMap } from './Map';
import { HeroRelationships } from './HeroRelationships';
import { IcyVeinsDatabase } from './IcyVeinsData';
import { HeroesProfileDatabase } from './HeroesProfileData';
import { ALL_HEROES, ALL_MAPS } from './HeroData';
import { WinCondition, type HeroSuggestion, type RangeAnalysis, type TeamNeeds, type HeroCategories } from './SuggestionTypes';
import { DraftSettings, AnalysisMode } from './DraftSettings';

const MAX_HEROES = 100;
const MAX_MAPS = 15;

export class HeroSuggestionEngine {
  private draft: DraftingTool;
  private map: HotsMap | null;
  private relationships: HeroRelationships;
  private icyVeins: IcyVeinsDatabase;
  private heroesProfile: HeroesProfileDatabase;

  private heroIndex: Map<string, number> = new Map();
  private mapIndex: Map<string, number> = new Map();
  private heroCount = 0;

  // Pre-computed matrices
  private ivSynergy: boolean[][] = [];
  private ivCounter: boolean[][] = [];
  private specSynergy: number[][] = [];
  private specCounter: number[][] = [];
  private mapTier: number[][] = [];

  // Weights - Full mode
  static SYNERGY_WEIGHT = 0.20;
  static COUNTER_WEIGHT = 0.22;
  static MAP_WEIGHT = 0.12;
  static ROLE_WEIGHT = 0.18;
  static WINCONDITION_WEIGHT = 0.10;
  static RANGE_WEIGHT = 0.08;
  static DRAFT_POSITION_WEIGHT = 0.04;
  static DAMAGE_BALANCE_WEIGHT = 0.03;
  static COUNTERPICK_RISK_WEIGHT = 0.03;

  // Weights - Simple mode
  static SIMPLE_SYNERGY_WEIGHT = 0.50;
  static SIMPLE_COUNTER_WEIGHT = 0.50;

  // Weights - Ban scoring
  static BAN_MAP_STRENGTH_WEIGHT = 0.25;
  static BAN_COUNTER_WEIGHT = 0.35;
  static BAN_GENERAL_THREAT_WEIGHT = 0.15;
  static BAN_COMP_COUNTER_WEIGHT = 0.15;
  static BAN_ENEMY_SYNERGY_WEIGHT = 0.10;
  static SIMPLE_BAN_COUNTER_WEIGHT = 0.60;
  static SIMPLE_BAN_THREAT_WEIGHT = 0.40;

  constructor(draft: DraftingTool, map: HotsMap | null) {
    this.draft = draft;
    this.map = map;
    this.relationships = HeroRelationships.getInstance();
    this.icyVeins = IcyVeinsDatabase.getInstance();
    this.heroesProfile = HeroesProfileDatabase.getInstance();
    this.heroesProfile.loadSync();
    this.buildLookupMatrix();
  }

  private buildLookupMatrix(): void {
    const heroes = ALL_HEROES;
    const maps = ALL_MAPS;
    this.heroCount = heroes.length;

    this.heroIndex.clear();
    this.mapIndex.clear();
    for (let i = 0; i < heroes.length; i++) this.heroIndex.set(heroes[i].nicknames[0], i);
    for (let i = 0; i < maps.length; i++) this.mapIndex.set(maps[i].name, i);

    // Initialize matrices
    this.ivSynergy = Array.from({ length: this.heroCount }, () => new Array(this.heroCount).fill(false));
    this.ivCounter = Array.from({ length: this.heroCount }, () => new Array(this.heroCount).fill(false));
    this.specSynergy = Array.from({ length: this.heroCount }, () => new Array(this.heroCount).fill(0));
    this.specCounter = Array.from({ length: this.heroCount }, () => new Array(this.heroCount).fill(0));
    this.mapTier = Array.from({ length: this.heroCount }, () => new Array(maps.length).fill(3));

    for (let i = 0; i < this.heroCount; i++) {
      for (let j = 0; j < this.heroCount; j++) {
        if (i === j) continue;
        this.ivSynergy[i][j] = this.icyVeins.hasSynergy(heroes[i].nicknames[0], heroes[j].nicknames[0]);
        this.ivCounter[i][j] = this.icyVeins.counters(heroes[i].nicknames[0], heroes[j].nicknames[0]);
        this.specSynergy[i][j] = this.relationships.getSynergyScore(heroes[i], heroes[j]);
        this.specCounter[i][j] = this.relationships.getCounterScore(heroes[i], heroes[j]);
      }
      for (let m = 0; m < maps.length; m++) {
        this.mapTier[i][m] = this.icyVeins.getTierScore(heroes[i].nicknames[0], maps[m].name);
      }
    }
  }

  private idx(hero: Hero): number {
    return this.heroIndex.get(hero.nicknames[0]) ?? -1;
  }

  generateSuggestions(team: number, roleFilter = 'All', topN = 5): HeroSuggestion[] {
    const available = this.draft.getAvailableHeroes();
    const isSimple = DraftSettings.currentAnalysisMode === AnalysisMode.Simple;
    const suggestions: HeroSuggestion[] = [];

    for (const hero of available) {
      if (!matchesRoleFilter(hero, roleFilter)) continue;

      const hi = this.idx(hero);
      const teamPicks = this.draft.getTeamPicks(team);
      const enemyPicks = this.draft.getEnemyPicks(team);
      const categories = this.getHeroCategories(hero);

      // Count synergies/counters
      let synCount = 0, cntCount = 0, cntByCount = 0;
      for (const ally of teamPicks) {
        const ai = this.idx(ally);
        if (ai >= 0 && hi >= 0) {
          if (this.ivSynergy[hi][ai] || this.ivSynergy[ai][hi] || this.specSynergy[hi][ai] >= 2) synCount++;
        }
      }
      for (const enemy of enemyPicks) {
        const ei = this.idx(enemy);
        if (ei >= 0 && hi >= 0) {
          if (this.ivCounter[hi][ei] || this.specCounter[hi][ei] >= 2) cntCount++;
          if (this.ivCounter[ei][hi] || this.specCounter[ei][hi] >= 2) cntByCount++;
        }
      }

      let suggestion: HeroSuggestion;

      if (isSimple) {
        let synergyPoints = 0, counterPoints = 0, counteredPenalty = 0;

        for (const ally of teamPicks) {
          const ai = this.idx(ally);
          if (ai < 0 || hi < 0) continue;
          const specScore = this.specSynergy[hi][ai];
          const ivSyn = this.ivSynergy[hi][ai] || this.ivSynergy[ai][hi];
          if (ivSyn && specScore >= 2) synergyPoints += 20;
          else if (ivSyn || specScore >= 2) synergyPoints += 12;
          else if (specScore >= 1) synergyPoints += 5;
        }

        for (const enemy of enemyPicks) {
          const ei = this.idx(enemy);
          if (ei < 0 || hi < 0) continue;
          const specScore = this.specCounter[hi][ei];
          const ivCnt = this.ivCounter[hi][ei];
          if (ivCnt && specScore >= 2) counterPoints += 18;
          else if (ivCnt || specScore >= 2) counterPoints += 10;
          else if (specScore >= 1) counterPoints += 4;

          const revSpec = this.specCounter[ei][hi];
          const ivRev = this.ivCounter[ei][hi];
          if (ivRev && revSpec >= 2) counteredPenalty += 15;
          else if (ivRev || revSpec >= 2) counteredPenalty += 8;
          else if (revSpec >= 1) counteredPenalty += 3;
        }

        // Map tier bonus
        let mapBonus = 0;
        if (this.map && hi >= 0) {
          const mi = this.mapIndex.get(this.map.name);
          const tier = mi !== undefined ? this.mapTier[hi][mi] : 3;
          if (tier === 5) mapBonus = 10;
          else if (tier === 4) mapBonus = 5;
          else if (tier === 2) mapBonus = -3;
          else if (tier === 1) mapBonus = -8;
        }

        // Role need bonus
        let roleBonus = 0;
        let tankCount = 0, healerCount = 0;
        for (const pick of teamPicks) {
          if (pick.role === 'Tank') tankCount++;
          else if (pick.role === 'Healer') healerCount++;
        }
        if (teamPicks.length >= 3) {
          if (hero.role === 'Tank' && tankCount === 0) roleBonus = 15;
          if (hero.role === 'Healer' && healerCount === 0) roleBonus = 15;
        }

        const total = Math.max(synergyPoints + counterPoints - counteredPenalty + mapBonus + roleBonus, 0);

        const synergyWith = teamPicks.filter(a => this.icyVeins.hasSynergy(hero.nicknames[0], a.nicknames[0])).map(a => a.nicknames[0]);
        const countersAgainst = enemyPicks.filter(e => this.icyVeins.counters(hero.nicknames[0], e.nicknames[0])).map(e => e.nicknames[0]);

        suggestion = {
          hero, totalScore: total,
          explanation: this.generateSimpleExplanation(synCount, cntCount, cntByCount, teamPicks, enemyPicks),
          synergyScore: 0, counterScore: 0, mapFitnessScore: 0, roleNeedScore: 0,
          winConditionScore: 0, rangeScore: 0, draftPositionScore: 0,
          damageBalanceScore: 0, counterpickRiskScore: 0,
          categories, synergyCount: synCount, counterCount: cntCount, counteredByCount: cntByCount,
          synergyWith, countersAgainst,
        };
      } else {
        const synScore = this.scoreSynergy(hero, team);
        const ctrScore = this.scoreCounters(hero, team);
        const mapScore = this.scoreMapFitness(hero);
        const roleScore = this.scoreRoleNeeds(hero, team);
        const wcScore = this.scoreWinConditionFit(hero, team);
        const rngScore = this.scoreRangeFit(hero, team);
        const draftPosScore = this.scoreDraftPosition(hero, team);
        const dmgBalScore = this.scoreDamageBalance(hero, team);
        const cpRiskScore = this.scoreCounterpickRisk(hero, team);

        const total = (
          synScore * HeroSuggestionEngine.SYNERGY_WEIGHT +
          ctrScore * HeroSuggestionEngine.COUNTER_WEIGHT +
          mapScore * HeroSuggestionEngine.MAP_WEIGHT +
          roleScore * HeroSuggestionEngine.ROLE_WEIGHT +
          wcScore * HeroSuggestionEngine.WINCONDITION_WEIGHT +
          rngScore * HeroSuggestionEngine.RANGE_WEIGHT +
          draftPosScore * HeroSuggestionEngine.DRAFT_POSITION_WEIGHT +
          dmgBalScore * HeroSuggestionEngine.DAMAGE_BALANCE_WEIGHT +
          cpRiskScore * HeroSuggestionEngine.COUNTERPICK_RISK_WEIGHT
        ) * 100;

        const synWith = teamPicks.filter(a => this.icyVeins.hasSynergy(hero.nicknames[0], a.nicknames[0])).map(a => a.nicknames[0]);
        const ctrAgainst = enemyPicks.filter(e => this.icyVeins.counters(hero.nicknames[0], e.nicknames[0])).map(e => e.nicknames[0]);

        suggestion = {
          hero, totalScore: total,
          explanation: this.generateExplanation(synScore, ctrScore, mapScore, roleScore, rngScore, wcScore, hero, team),
          synergyScore: synScore, counterScore: ctrScore, mapFitnessScore: mapScore,
          roleNeedScore: roleScore, winConditionScore: wcScore, rangeScore: rngScore,
          draftPositionScore: draftPosScore, damageBalanceScore: dmgBalScore,
          counterpickRiskScore: cpRiskScore,
          categories, synergyCount: synCount, counterCount: cntCount, counteredByCount: cntByCount,
          synergyWith: synWith, countersAgainst: ctrAgainst,
        };
      }

      // Small winrate bonus as tiebreaker: (winrate - 50) * 0.1
      const wr = this.heroesProfile.getWinrate(hero.nicknames[0]);
      if (wr !== null) {
        suggestion.totalScore += (wr - 50) * 0.1;
      }

      suggestions.push(suggestion);
    }

    suggestions.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      // Tiebreaker: prefer higher winrate
      const wrA = this.heroesProfile.getWinrate(a.hero.nicknames[0]) ?? 50;
      const wrB = this.heroesProfile.getWinrate(b.hero.nicknames[0]) ?? 50;
      return wrB - wrA;
    });
    return suggestions.slice(0, topN);
  }

  generateBanSuggestions(team: number, roleFilter = 'All', topN = 5): HeroSuggestion[] {
    const available = this.draft.getAvailableHeroes();
    const suggestions: HeroSuggestion[] = [];

    for (const hero of available) {
      if (!matchesRoleFilter(hero, roleFilter)) continue;

      const hi = this.idx(hero);
      const categories = this.getHeroCategories(hero);
      const ourPicks = this.draft.getTeamPicks(team);

      // Count how many of our heroes this would counter
      let countersUsCount = 0;
      for (const ourHero of ourPicks) {
        const oi = this.idx(ourHero);
        if (hi >= 0 && oi >= 0) {
          if (this.ivCounter[hi][oi] || this.specCounter[hi][oi] >= 2) countersUsCount++;
        }
      }

      const generalThreat = this.scoreBanGeneralThreat(hero);
      const mapStrength = this.map ? this.scoreMapFitness(hero) : 0.5;

      const total = countersUsCount * 18 + generalThreat * 25 + mapStrength * 10;

      let explanation = 'High impact hero';
      if (countersUsCount > 0) explanation = `Counters ${countersUsCount} of yours`;
      else if (hero.specialties.includes(Specialty.GLOBAL_PRESENCE)) explanation = 'Global threat - high impact';
      else if (hero.specialties.includes(Specialty.ENGAGE)) explanation = 'Strong engage threat';
      else if (hero.specialties.includes(Specialty.PICK_POTENTIAL)) explanation = 'Pick potential threat';

      suggestions.push({
        hero, totalScore: total, explanation,
        synergyScore: generalThreat, counterScore: 0, mapFitnessScore: mapStrength,
        roleNeedScore: 0, winConditionScore: 0, rangeScore: 0,
        draftPositionScore: 0, damageBalanceScore: 0, counterpickRiskScore: 0,
        categories, synergyCount: 0, counterCount: countersUsCount, counteredByCount: 0,
        synergyWith: [], countersAgainst: [],
      });
    }

    suggestions.sort((a, b) => b.totalScore - a.totalScore);
    return suggestions.slice(0, topN);
  }

  analyzeTeamRange(team: number): RangeAnalysis {
    const picks = this.draft.getTeamPicks(team);
    if (picks.length === 0) {
      return { averageRange: 3, meleeCount: 0, rangedCount: 0, extremeRangeCount: 0,
        hasRangeMismatch: false, isPokeComp: false, isDiveComp: false, description: 'No picks yet' };
    }

    let total = 0, meleeCount = 0, rangedCount = 0, extremeCount = 0;
    let hasPureMelee = false, hasExtreme = false, hasMid = false;

    for (const hero of picks) {
      const r = hero.effectiveRange;
      total += r;
      if (r <= 2) meleeCount++;
      else rangedCount++;
      if (r === 5) { extremeCount++; hasExtreme = true; }
      if (r === 1) hasPureMelee = true;
      if (r === 3) hasMid = true;
    }

    const avg = total / picks.length;
    const mismatch = hasPureMelee && hasExtreme && !hasMid;
    const isPoke = avg >= 4;
    const isDive = avg <= 2;

    let desc = `BALANCED (Avg Range: ${avg.toFixed(1)}) - Flexible engagement options`;
    if (isDive) desc = `DIVE COMP (Avg Range: ${avg.toFixed(1)}) - Must close distance to deal damage`;
    else if (isPoke) desc = `POKE COMP (Avg Range: ${avg.toFixed(1)}) - Strong at range, avoid close fights`;
    else if (mismatch) desc = `RANGE MISMATCH (Avg: ${avg.toFixed(1)}) - Team has conflicting effective ranges`;

    return { averageRange: avg, meleeCount, rangedCount, extremeRangeCount: extremeCount,
      hasRangeMismatch: mismatch, isPokeComp: isPoke, isDiveComp: isDive, description: desc };
  }

  analyzeTeamNeeds(team: number): TeamNeeds {
    const picks = this.draft.getTeamPicks(team);
    const needs: TeamNeeds = {
      hasTank: false, hasHealer: false, hasEngage: false, hasHardCC: false,
      hasDamage: false, hasOfflane: false, hasWaveclear: false, hasCampClear: false,
    };
    for (const hero of picks) {
      const cats = this.getHeroCategories(hero);
      if (cats.isTank) needs.hasTank = true;
      if (cats.isHealer) needs.hasHealer = true;
      if (cats.hasEngage) needs.hasEngage = true;
      if (cats.hasHardCC) needs.hasHardCC = true;
      if (cats.hasDamage) needs.hasDamage = true;
      if (cats.hasOfflane) needs.hasOfflane = true;
      if (cats.hasWaveclear) needs.hasWaveclear = true;
      if (cats.hasCampClear) needs.hasCampClear = true;
    }
    return needs;
  }

  getHeroCategories(hero: Hero): HeroCategories {
    const specs = hero.specialties;
    return {
      isTank: hero.role === 'Tank',
      isHealer: hero.role === 'Healer',
      hasEngage: specs.includes(Specialty.ENGAGE),
      hasHardCC: specs.includes(Specialty.HARD_CC),
      hasDamage: specs.includes(Specialty.BURST_DAMAGE) || specs.includes(Specialty.SUSTAINED_DAMAGE),
      hasOfflane: hero.role === 'Offlane' || specs.includes(Specialty.GLOBAL_PRESENCE) || specs.includes(Specialty.DOUBLE_SOAKING),
      hasWaveclear: specs.includes(Specialty.WAVECLEAR),
      hasCampClear: specs.includes(Specialty.CAMP_TAKING),
    };
  }

  // --- Private scoring methods ---

  private scoreSynergy(hero: Hero, team: number): number {
    const teamPicks = this.draft.getTeamPicks(team);
    if (teamPicks.length === 0) return 0.5;
    const hi = this.idx(hero);
    let best = 0, totalW = 0, totalWeight = 0;

    for (let i = 0; i < teamPicks.length; i++) {
      const ai = this.idx(teamPicks[i]);
      if (ai < 0 || hi < 0) continue;
      const specScore = this.specSynergy[hi][ai];
      const ivSyn = this.ivSynergy[hi][ai] || this.ivSynergy[ai][hi];

      let score: number;
      if (ivSyn && specScore >= 2) score = 1.0;
      else if (ivSyn && specScore >= 1) score = 0.85;
      else if (ivSyn) score = 0.75;
      else if (specScore >= 3) score = 0.85;
      else if (specScore >= 2) score = 0.65;
      else if (specScore >= 1) score = 0.45;
      else score = 0.3;

      const weight = (i === teamPicks.length - 1) ? 1.3 : 1.0;
      if (score > best) best = score;
      totalW += score * weight;
      totalWeight += weight;
    }

    const avg = totalWeight > 0 ? totalW / totalWeight : 0.3;
    return Math.min(best * 0.4 + avg * 0.6, 1);
  }

  private scoreCounters(hero: Hero, team: number): number {
    const enemyPicks = this.draft.getEnemyPicks(team);
    if (enemyPicks.length === 0) return 0.5;
    const hi = this.idx(hero);
    let bestFwd = 0, totalFwd = 0, totalRev = 0;

    for (const enemy of enemyPicks) {
      const ei = this.idx(enemy);
      if (ei < 0 || hi < 0) continue;

      const fSpec = this.specCounter[hi][ei];
      const fIV = this.ivCounter[hi][ei];
      let fScore: number;
      if (fIV && fSpec >= 3) fScore = 1.0;
      else if (fIV && fSpec >= 2) fScore = 0.85;
      else if (fIV) fScore = 0.75;
      else if (fSpec >= 3) fScore = 0.80;
      else if (fSpec >= 2) fScore = 0.55;
      else if (fSpec >= 1) fScore = 0.35;
      else fScore = 0.15;

      if (fScore > bestFwd) bestFwd = fScore;
      totalFwd += fScore;

      const rSpec = this.specCounter[ei][hi];
      const rIV = this.ivCounter[ei][hi];
      let rPen = 0;
      if (rIV && rSpec >= 3) rPen = 0.35;
      else if (rIV && rSpec >= 2) rPen = 0.25;
      else if (rIV) rPen = 0.18;
      else if (rSpec >= 2) rPen = 0.15;
      else if (rSpec >= 1) rPen = 0.08;
      totalRev += rPen;
    }

    const n = enemyPicks.length;
    const avgFwd = totalFwd / n;
    const avgRev = totalRev / n;
    return Math.min(Math.max(bestFwd * 0.5 + avgFwd * 0.5 - avgRev, 0), 1);
  }

  private scoreMapFitness(hero: Hero): number {
    if (!this.map) return 0.5;
    const hi = this.idx(hero);
    const mapScore = Math.min(this.map.scoreHero(hero) / 3.0, 1);
    const mi = this.mapIndex.get(this.map.name);
    const tierScore = (hi >= 0 && mi !== undefined) ? this.mapTier[hi][mi] : 3;
    const tierValues: Record<number, number> = { 5: 1.0, 4: 0.80, 3: 0.55, 2: 0.35, 1: 0.15 };
    const tierValue = tierValues[tierScore] ?? 0.40;

    const diff = Math.abs(mapScore - tierValue);
    if (diff < 0.25) return Math.min(mapScore * 0.35 + tierValue * 0.65, 1);
    return Math.min(mapScore * 0.30 + tierValue * 0.50 + 0.10, 1);
  }

  private scoreRoleNeeds(hero: Hero, team: number): number {
    const teamPicks = this.draft.getTeamPicks(team);
    let tankCount = 0, healerCount = 0, dpsCount = 0, mageCount = 0, offlaneCount = 0, specialistCount = 0;
    let physDmg = 0, spellDmg = 0;

    for (const pick of teamPicks) {
      if (pick.role === 'Tank') tankCount++;
      else if (pick.role === 'Healer') healerCount++;
      else if (pick.role === 'DPS') dpsCount++;
      else if (pick.role === 'Mage') mageCount++;
      else if (pick.role === 'Offlane') offlaneCount++;
      else if (pick.role === 'Specialist') specialistCount++;

      if (pick.specialties.includes(Specialty.AUTO_ATTACK) || pick.specialties.includes(Specialty.SUSTAINED_DAMAGE)) physDmg++;
      if (pick.specialties.includes(Specialty.SPELL_DAMAGE) || pick.specialties.includes(Specialty.AOE_DAMAGE)) spellDmg++;
    }

    const total = teamPicks.length;
    let score = 0.5;

    if (hero.role === 'Tank') {
      if (tankCount === 0) {
        if (total >= 3) score = 1.0; else if (total >= 2) score = 0.95; else if (total >= 1) score = 0.88; else score = 0.75;
      } else score = tankCount === 1 ? 0.35 : 0.1;
    } else if (hero.role === 'Healer') {
      if (healerCount === 0) {
        if (total >= 3) score = 1.0; else if (total >= 2) score = 0.95; else if (total >= 1) score = 0.85; else score = 0.70;
      } else score = healerCount === 1 ? 0.25 : 0.1;
    } else if (hero.role === 'DPS') {
      if (dpsCount === 0) score = 0.80; else if (dpsCount === 1) score = 0.70; else if (dpsCount === 2) score = 0.45; else score = 0.25;
      if (hero.specialties.includes(Specialty.AUTO_ATTACK) && spellDmg >= 2 && physDmg === 0) score += 0.10;
      if (hero.specialties.includes(Specialty.SPELL_DAMAGE) && physDmg >= 2 && spellDmg === 0) score += 0.10;
    } else if (hero.role === 'Mage') {
      if (mageCount === 0 && spellDmg < 2) score = 0.78; else if (mageCount === 0) score = 0.60; else if (mageCount === 1) score = 0.35; else score = 0.12;
    } else if (hero.role === 'Offlane') {
      if (offlaneCount === 0 && tankCount >= 1) score = 0.72; else if (offlaneCount === 0) score = 0.60; else if (offlaneCount === 1) score = 0.30; else score = 0.15;
    } else if (hero.role === 'Specialist') {
      score = specialistCount === 0 ? 0.48 : 0.25;
    }

    return Math.min(score, 1);
  }

  private scoreWinConditionFit(hero: Hero, team: number): number {
    const teamPicks = this.draft.getTeamPicks(team);
    if (teamPicks.length < 2) return 0.5;

    const winCon = this.detectEmergingWinCondition(team);
    const specs = hero.specialties;

    const desiredMap: Record<string, Specialty[]> = {
      [WinCondition.DIVE]: [Specialty.MOBILITY, Specialty.BURST_DAMAGE, Specialty.ENGAGE, Specialty.PICK_POTENTIAL],
      [WinCondition.TEAMFIGHT]: [Specialty.AOE_DAMAGE, Specialty.HARD_CC, Specialty.ENGAGE, Specialty.BURST_DAMAGE, Specialty.SUSTAINED_HEALING],
      [WinCondition.POKE_SIEGE]: [Specialty.POKE, Specialty.SIEGE_PUSHING, Specialty.DISENGAGE, Specialty.WAVECLEAR],
      [WinCondition.SPLIT_MACRO]: [Specialty.GLOBAL_PRESENCE, Specialty.SPLIT_PUSHING, Specialty.DOUBLE_SOAKING, Specialty.WAVECLEAR],
      [WinCondition.PICK_COMP]: [Specialty.PICK_POTENTIAL, Specialty.BURST_DAMAGE, Specialty.STEALTH, Specialty.HARD_CC],
      [WinCondition.SUSTAIN_ATTRITION]: [Specialty.SUSTAINED_HEALING, Specialty.SELF_SUSTAIN, Specialty.HIGH_DURABILITY, Specialty.SUSTAINED_DAMAGE],
      [WinCondition.SNOWBALL_EARLY]: [Specialty.SNOWBALL, Specialty.BURST_DAMAGE, Specialty.PICK_POTENTIAL, Specialty.ENGAGE],
      [WinCondition.LATE_GAME_SCALE]: [Specialty.LATE_GAME_SCALING, Specialty.SUSTAINED_DAMAGE, Specialty.DISENGAGE],
    };

    const desired = desiredMap[winCon] || [];
    const matches = desired.filter(s => specs.includes(s)).length;

    let fitScore: number;
    if (matches >= 3) fitScore = 0.95;
    else if (matches >= 2) fitScore = 0.78;
    else if (matches >= 1) fitScore = 0.58;
    else fitScore = 0.32;

    // Anti-synergy specialties by win condition (from C++)
    const antiSpecialties: Record<string, Specialty[]> = {
      [WinCondition.DIVE]: [Specialty.SIEGE_PUSHING, Specialty.POKE],
      [WinCondition.TEAMFIGHT]: [],
      [WinCondition.POKE_SIEGE]: [Specialty.ENGAGE],
      [WinCondition.SPLIT_MACRO]: [],
      [WinCondition.PICK_COMP]: [Specialty.SIEGE_PUSHING],
      [WinCondition.SUSTAIN_ATTRITION]: [],
      [WinCondition.SNOWBALL_EARLY]: [Specialty.LATE_GAME_SCALING],
      [WinCondition.LATE_GAME_SCALE]: [Specialty.SNOWBALL],
    };

    const antiSpecs = antiSpecialties[winCon] || [];
    let antiMatches = 0;
    for (const spec of antiSpecs) {
      if (specs.includes(spec)) antiMatches++;
    }
    if (antiMatches > 0) {
      fitScore -= 0.12 * antiMatches;
    }

    return Math.max(0, Math.min(1, fitScore));
  }

  private scoreRangeFit(hero: Hero, team: number): number {
    const teamPicks = this.draft.getTeamPicks(team);
    if (teamPicks.length === 0) return 0.5;

    const range = this.analyzeTeamRange(team);
    const heroRange = hero.effectiveRange;
    let score = 0.5;

    if (range.isDiveComp) {
      score = heroRange <= 2 ? 0.8 : heroRange === 3 ? 0.5 : 0.3;
    } else if (range.isPokeComp) {
      score = heroRange >= 4 ? 0.8 : heroRange === 3 ? 0.5 : 0.3;
    } else {
      score = heroRange === 3 ? 0.6 : (heroRange === 2 || heroRange === 4) ? 0.55 : 0.45;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private scoreDraftPosition(hero: Hero, team: number): number {
    const pickNumber = this.draft.getTeamPicks(team).length;
    const specs = hero.specialties;
    let score = 0.5;

    const isFlex = specs.includes(Specialty.FLEX_PICK);
    const isCounterpick = specs.includes(Specialty.COUNTERPICK);
    const isCheese = specs.includes(Specialty.CHEESE);

    if (pickNumber <= 1) {
      if (isFlex) score += 0.20;
      if (isCounterpick) score -= 0.10;
      if (isCheese) score -= 0.15;
    } else if (pickNumber <= 3) {
      if (isFlex) score += 0.10;
      if (isCounterpick) score += 0.10;
    } else {
      if (isCounterpick) score += 0.20;
      if (isCheese) score += 0.10;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private scoreDamageBalance(hero: Hero, team: number): number {
    const teamPicks = this.draft.getTeamPicks(team);
    if (teamPicks.length === 0) return 0.5;

    let phys = 0, spell = 0;
    for (const p of teamPicks) {
      if (p.specialties.includes(Specialty.AUTO_ATTACK)) phys++;
      if (p.specialties.includes(Specialty.SPELL_DAMAGE)) spell++;
    }

    const addsPhys = hero.specialties.includes(Specialty.AUTO_ATTACK);
    const addsSpell = hero.specialties.includes(Specialty.SPELL_DAMAGE);
    const addsPct = hero.specialties.includes(Specialty.PERCENT_DAMAGE);

    let score = 0.5;
    if (addsPct) score = 0.65;
    if (addsPhys && phys === 0 && spell >= 2) score = 0.80;
    if (addsSpell && spell === 0 && phys >= 2) score = 0.80;
    if (addsPhys && phys >= 3) score = 0.25;
    if (addsSpell && spell >= 3) score = 0.25;

    return Math.min(score, 1);
  }

  private scoreCounterpickRisk(hero: Hero, team: number): number {
    const hi = this.idx(hero);
    if (hi < 0) return 0.5;

    let counterCount = 0;
    const available = this.draft.getAvailableHeroes();
    for (const avail of available) {
      if (avail === hero) continue;
      const ai = this.idx(avail);
      if (ai >= 0 && (this.specCounter[ai][hi] >= 2 || this.ivCounter[ai][hi])) counterCount++;
    }

    let risk: number;
    if (counterCount >= 6) risk = 0.20;
    else if (counterCount >= 4) risk = 0.35;
    else if (counterCount >= 2) risk = 0.55;
    else if (counterCount >= 1) risk = 0.70;
    else risk = 0.90;

    const pickNumber = this.draft.getTeamPicks(team).length;
    if (pickNumber >= 4) risk = risk * 0.5 + 0.25;
    else if (pickNumber >= 3) risk = risk * 0.7 + 0.15;

    return Math.min(risk, 1);
  }

  private scoreBanGeneralThreat(hero: Hero): number {
    const specs = hero.specialties;
    let score = 0.5;
    if (specs.includes(Specialty.GLOBAL_PRESENCE)) score += 0.15;
    if (specs.includes(Specialty.ENGAGE)) score += 0.10;
    if (specs.includes(Specialty.HARD_CC)) score += 0.10;
    if (specs.includes(Specialty.PICK_POTENTIAL)) score += 0.10;
    if (specs.includes(Specialty.BURST_DAMAGE)) score += 0.05;
    return Math.min(score, 1);
  }

  private detectEmergingWinCondition(team: number): WinCondition {
    const picks = this.draft.getTeamPicks(team);
    if (picks.length < 2) return WinCondition.TEAMFIGHT;

    let mobile = 0, burst = 0, poke = 0, split = 0, global = 0, aoe = 0, cc = 0;
    for (const h of picks) {
      if (h.specialties.includes(Specialty.MOBILITY)) mobile++;
      if (h.specialties.includes(Specialty.BURST_DAMAGE)) burst++;
      if (h.specialties.includes(Specialty.POKE)) poke++;
      if (h.specialties.includes(Specialty.SPLIT_PUSHING)) split++;
      if (h.specialties.includes(Specialty.GLOBAL_PRESENCE)) global++;
      if (h.specialties.includes(Specialty.AOE_DAMAGE)) aoe++;
      if (h.specialties.includes(Specialty.HARD_CC)) cc++;
    }

    if (mobile >= 2 && burst >= 2) return WinCondition.DIVE;
    if (split >= 2 || global >= 2) return WinCondition.SPLIT_MACRO;
    if (poke >= 2) return WinCondition.POKE_SIEGE;
    if (aoe >= 2 && cc >= 2) return WinCondition.TEAMFIGHT;
    return WinCondition.TEAMFIGHT;
  }

  private generateSimpleExplanation(synCount: number, cntCount: number, cntByCount: number, teamPicks: Hero[], enemyPicks: Hero[]): string {
    const parts: string[] = [];
    if (synCount > 0) parts.push(`${synCount} Synerg${synCount > 1 ? 'ies' : 'y'}`);
    if (cntCount > 0) parts.push(`${cntCount} Counter${cntCount > 1 ? 's' : ''}`);
    if (cntByCount > 0) parts.push(`[!] ${cntByCount} counter${cntByCount > 1 ? 's' : ''} you`);
    if (parts.length === 0) {
      if (teamPicks.length === 0 && enemyPicks.length === 0) return 'Flexible first pick';
      return 'No synergies or counters';
    }
    return parts.join(' | ');
  }

  private generateExplanation(synScore: number, ctrScore: number, mapScore: number, roleScore: number, rngScore: number, wcScore: number, hero: Hero, team: number): string {
    const reasons: string[] = [];
    const teamPicks = this.draft.getTeamPicks(team);
    const enemyPicks = this.draft.getEnemyPicks(team);

    let tankCount = 0, healerCount = 0;
    for (const p of teamPicks) {
      if (p.role === 'Tank') tankCount++;
      if (p.role === 'Healer') healerCount++;
    }

    if (roleScore >= 0.9) {
      if (hero.role === 'Tank' && tankCount === 0) reasons.push('FILLS TANK');
      else if (hero.role === 'Healer' && healerCount === 0) reasons.push('FILLS HEALER');
      else reasons.push('Critical role');
    }

    if (ctrScore >= 0.7 && enemyPicks.length > 0 && reasons.length < 2) {
      reasons.push('Strong vs enemy');
    }

    if (synScore >= 0.7 && teamPicks.length > 0 && reasons.length < 2) {
      reasons.push('Team synergy');
    }

    if (mapScore >= 0.7 && this.map && reasons.length < 2) {
      reasons.push('Good on map');
    }

    if (wcScore >= 0.7 && reasons.length < 2) {
      reasons.push('Fits strategy');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Solid pick';
  }
}
