import { Specialty } from './Specialty';
import type { Hero } from './Hero';

export class TeamComposition {
  heroes: Hero[];

  constructor(heroes: Hero[]) {
    this.heroes = heroes;
  }

  hasSpecialty(specialty: Specialty): boolean {
    return this.heroes.some(hero => hero.specialties.includes(specialty));
  }

  hasHardCC(): boolean {
    return this.hasSpecialty(Specialty.HARD_CC);
  }

  hasEngage(): boolean {
    return this.hasSpecialty(Specialty.ENGAGE);
  }

  hasWaveclear(): boolean {
    return this.hasSpecialty(Specialty.WAVECLEAR);
  }
}
