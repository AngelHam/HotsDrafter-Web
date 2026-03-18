import { Specialty } from './Specialty';

export enum EffectiveRange {
  MELEE = 1,
  SHORT_RANGE = 2,
  MEDIUM_RANGE = 3,
  LONG_RANGE = 4,
  EXTREME_RANGE = 5,
}

export interface Hero {
  name: string;
  nicknames: string[];
  role: string;
  specialties: Specialty[];
  effectiveRange: EffectiveRange;
}

export function heroMatchesName(hero: Hero, name: string): boolean {
  const lower = name.toLowerCase();
  return hero.nicknames.some(nick => {
    const lowerNick = nick.toLowerCase();
    return lowerNick.includes(lower) || lower.includes(lowerNick);
  });
}

export function getHeroDisplayName(hero: Hero): string {
  return hero.nicknames[0] || hero.name;
}

export function getHeroPortraitFilename(hero: Hero): string {
  const name = hero.nicknames[0] || hero.name;
  return name
    .replace(/'/g, '')
    .replace(/\./g, '.')
    .replace(/ /g, '-')
    + '.png';
}
