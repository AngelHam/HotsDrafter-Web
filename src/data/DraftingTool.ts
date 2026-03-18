import type { Hero } from './Hero';
import { Specialty } from './Specialty';

export class DraftingTool {
  private availableHeroes: Set<Hero>;
  team1Picks: Hero[] = [];
  team2Picks: Hero[] = [];
  team1Bans: Hero[] = [];
  team2Bans: Hero[] = [];

  constructor(heroPool: Hero[]) {
    this.availableHeroes = new Set(heroPool);
  }

  banHero(team: number, hero: Hero): boolean {
    if (!this.availableHeroes.has(hero)) return false;
    this.availableHeroes.delete(hero);
    if (team === 1) this.team1Bans.push(hero);
    else this.team2Bans.push(hero);
    return true;
  }

  pickHero(team: number, hero: Hero): boolean {
    if (!this.availableHeroes.has(hero)) return false;
    this.availableHeroes.delete(hero);
    if (team === 1) this.team1Picks.push(hero);
    else this.team2Picks.push(hero);
    return true;
  }

  getAvailableHeroes(): Hero[] {
    return [...this.availableHeroes].sort((a, b) =>
      a.nicknames[0].localeCompare(b.nicknames[0])
    );
  }

  getTeamPicks(team: number): Hero[] {
    return team === 1 ? this.team1Picks : this.team2Picks;
  }

  getTeamBans(team: number): Hero[] {
    return team === 1 ? this.team1Bans : this.team2Bans;
  }

  getEnemyPicks(team: number): Hero[] {
    return team === 1 ? this.team2Picks : this.team1Picks;
  }

  isAvailable(hero: Hero): boolean {
    return this.availableHeroes.has(hero);
  }

  undoBanOrPick(team: number, wasBan: boolean): Hero | null {
    const arr = wasBan
      ? (team === 1 ? this.team1Bans : this.team2Bans)
      : (team === 1 ? this.team1Picks : this.team2Picks);
    if (arr.length === 0) return null;
    const hero = arr.pop()!;
    this.availableHeroes.add(hero);
    return hero;
  }

  reset(heroPool: Hero[]): void {
    this.availableHeroes = new Set(heroPool);
    this.team1Picks = [];
    this.team2Picks = [];
    this.team1Bans = [];
    this.team2Bans = [];
  }
}

// Standard HotS draft order (16 steps)
export const DRAFT_TEAM_ORDER = [1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 1, 1, 2];
export const DRAFT_IS_BAN = [true, true, true, true, false, false, false, false, false, true, true, false, false, false, false, false];

export function matchesRoleFilter(hero: Hero, roleFilter: string): boolean {
  if (roleFilter === 'All') return true;
  if (hero.role === roleFilter) return true;
  if (roleFilter === 'DPS') {
    return hero.role === 'DPS' || hero.role === 'Ranged Assassin' || hero.role === 'Melee Assassin';
  }
  if (roleFilter === 'Offlane') {
    if (hero.role === 'Offlane' || hero.role === 'Bruiser') return true;
    return hero.specialties.includes(Specialty.SELF_SUSTAIN) && hero.specialties.includes(Specialty.SUSTAINED_DAMAGE);
  }
  return false;
}
