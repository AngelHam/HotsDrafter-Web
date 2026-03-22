import heroWinrateJson from './hero-winrates.json';

export interface HeroWinrateData {
  overall: number;
  pickrate: number;
  banrate: number;
}

export class HeroesProfileDatabase {
  private static instance: HeroesProfileDatabase;
  private data: Map<string, HeroWinrateData> = new Map();
  private loaded = false;

  static getInstance(): HeroesProfileDatabase {
    if (!this.instance) this.instance = new HeroesProfileDatabase();
    return this.instance;
  }

  async loadData(): Promise<void> {
    if (this.loaded) return;

    // Check localStorage cache (24h)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('heroesprofile-data');
      const cacheTime = localStorage.getItem('heroesprofile-cache-time');
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 24 * 60 * 60 * 1000) {
        try {
          const parsed: [string, HeroWinrateData][] = JSON.parse(cached);
          this.data = new Map(parsed);
          this.loaded = true;
          return;
        } catch {
          // Cache corrupted, fall through to static data
        }
      }
    }

    // Load from static JSON (API requires auth, so we use bundled data)
    this.loadStaticData();

    // Cache in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('heroesprofile-data', JSON.stringify(Array.from(this.data.entries())));
        localStorage.setItem('heroesprofile-cache-time', String(Date.now()));
      } catch {
        // localStorage full or unavailable
      }
    }
  }

  /** Synchronous load from bundled JSON — safe to call during render */
  loadSync(): void {
    if (this.loaded) return;
    this.loadStaticData();
  }

  private loadStaticData(): void {
    const raw = heroWinrateJson as Record<string, { overall: number; pickrate: number; banrate: number }>;
    for (const [name, stats] of Object.entries(raw)) {
      this.data.set(name, {
        overall: stats.overall,
        pickrate: stats.pickrate,
        banrate: stats.banrate,
      });
    }
    this.loaded = true;
  }

  getWinrate(heroName: string): number | null {
    if (!this.loaded) this.loadSync();
    return this.data.get(heroName)?.overall ?? null;
  }

  getPickrate(heroName: string): number | null {
    if (!this.loaded) this.loadSync();
    return this.data.get(heroName)?.pickrate ?? null;
  }

  getBanrate(heroName: string): number | null {
    if (!this.loaded) this.loadSync();
    return this.data.get(heroName)?.banrate ?? null;
  }

  getData(heroName: string): HeroWinrateData | null {
    if (!this.loaded) this.loadSync();
    return this.data.get(heroName) ?? null;
  }

  /** Label based on pickrate thresholds */
  getPopularityLabel(heroName: string): string | null {
    const pickrate = this.getPickrate(heroName);
    if (pickrate === null) return null;
    if (pickrate >= 8) return 'Popular hero';
    if (pickrate >= 5) return 'Common pick';
    if (pickrate >= 2) return 'Niche pick';
    return 'Rare pick';
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
