import icyVeinsRawData from './icy-veins-data.json';

interface IcyVeinsHeroEntry {
  synergies: string[];
  counters: string[];
}

type RoleTierList = Record<string, string[]>;

interface IcyVeinsMapEntry {
  S?: RoleTierList;
  A?: RoleTierList;
  B?: RoleTierList;
  C?: RoleTierList;
  D?: RoleTierList;
}

interface IcyVeinsRaw {
  heroes: Record<string, IcyVeinsHeroEntry>;
  maps: Record<string, IcyVeinsMapEntry>;
  [key: string]: unknown;
}

const data = icyVeinsRawData as unknown as IcyVeinsRaw;

// Build a case-insensitive lookup for map names (JSON keys use "Of"/"The" title case)
const mapKeyLookup: Record<string, string> = {};
for (const key of Object.keys(data.maps)) {
  mapKeyLookup[key.toLowerCase()] = key;
}

function resolveMapKey(mapName: string): string | undefined {
  return data.maps[mapName] ? mapName : mapKeyLookup[mapName.toLowerCase()];
}

function flattenTier(tier: RoleTierList | undefined): string[] {
  if (!tier) return [];
  return Object.values(tier).flat();
}

class IcyVeinsDatabase {
  private static instance: IcyVeinsDatabase;

  static getInstance(): IcyVeinsDatabase {
    if (!IcyVeinsDatabase.instance) {
      IcyVeinsDatabase.instance = new IcyVeinsDatabase();
    }
    return IcyVeinsDatabase.instance;
  }

  getSynergies(heroName: string): string[] {
    return data.heroes[heroName]?.synergies || [];
  }

  getCounters(heroName: string): string[] {
    return data.heroes[heroName]?.counters || [];
  }

  getCountersFor(heroName: string): string[] {
    // Find heroes that this hero counters (i.e., heroName appears in their counters list)
    const result: string[] = [];
    for (const [name, info] of Object.entries(data.heroes)) {
      if ((info as { counters?: string[] }).counters?.includes(heroName)) {
        result.push(name);
      }
    }
    return result;
  }

  hasSynergy(hero1: string, hero2: string): boolean {
    const syn1 = this.getSynergies(hero1);
    const syn2 = this.getSynergies(hero2);
    return syn1.includes(hero2) || syn2.includes(hero1);
  }

  counters(counterHero: string, targetHero: string): boolean {
    const counters = this.getCounters(targetHero);
    return counters.includes(counterHero);
  }

  getHeroTierOnMap(heroName: string, mapName: string): string {
    const key = resolveMapKey(mapName);
    const mapData = key ? data.maps[key] : undefined;
    if (!mapData) return 'B';
    if (flattenTier(mapData.S).includes(heroName)) return 'S';
    if (flattenTier(mapData.A).includes(heroName)) return 'A';
    if (flattenTier(mapData.B).includes(heroName)) return 'B';
    if (flattenTier(mapData.C).includes(heroName)) return 'C';
    if (flattenTier(mapData.D).includes(heroName)) return 'D';
    return 'B';
  }

  getTierScore(heroName: string, mapName: string): number {
    const tier = this.getHeroTierOnMap(heroName, mapName);
    const scores: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    return scores[tier] || 3;
  }

  getSTierHeroes(mapName: string): string[] {
    const key = resolveMapKey(mapName);
    const mapData = key ? data.maps[key] : undefined;
    if (!mapData) return [];
    return flattenTier(mapData.S);
  }
}

export { IcyVeinsDatabase };
