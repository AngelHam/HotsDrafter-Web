import { Specialty } from './Specialty';
import type { Hero } from './Hero';

export class HotsMap {
  name: string;
  private importance: Partial<Record<Specialty, number>>;

  constructor(
    name: string,
    globalPresence = 1,
    objectiveControl = 1,
    waveclear = 1,
    pickPotential = 1,
    teamfight = 1,
    splitPush = 1,
    siege = 1
  ) {
    this.name = name;
    this.importance = {
      [Specialty.GLOBAL_PRESENCE]: globalPresence,
      [Specialty.OBJECTIVE_CONTROL]: objectiveControl,
      [Specialty.WAVECLEAR]: waveclear,
      [Specialty.PICK_POTENTIAL]: pickPotential,
      [Specialty.ENGAGE]: teamfight,
      [Specialty.SPLIT_PUSHING]: splitPush,
      [Specialty.SIEGE_PUSHING]: siege,
    };
  }

  scoreHero(hero: Hero): number {
    const specialties = hero.specialties;
    if (specialties.length === 0) return 0;
    let score = 0;
    for (const spec of specialties) {
      const imp = this.importance[spec];
      if (imp !== undefined) {
        score += imp;
      }
    }
    return score / specialties.length;
  }

  scoreTeam(heroes: Hero[]): number {
    if (heroes.length === 0) return 0;
    let total = 0;
    for (const hero of heroes) {
      total += this.scoreHero(hero);
    }
    return total / heroes.length;
  }
}
