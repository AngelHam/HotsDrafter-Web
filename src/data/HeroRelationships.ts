import type { Hero } from './Hero';
import { Specialty } from './Specialty';
import { IcyVeinsDatabase } from './IcyVeinsData';

interface SynergyEntry { hero1: string; hero2: string; score: number; reason: string; }
interface CounterEntry { counter: string; target: string; score: number; reason: string; }

class HeroRelationships {
  private static instance: HeroRelationships;
  private synergies: SynergyEntry[] = [];
  private counters: CounterEntry[] = [];

  static getInstance(): HeroRelationships {
    if (!HeroRelationships.instance) {
      HeroRelationships.instance = new HeroRelationships();
    }
    return HeroRelationships.instance;
  }

  private constructor() {
    this.initSynergies();
    this.initCounters();
  }

  getSynergyScore(hero1: Hero, hero2: Hero): number {
    const name1 = hero1.nicknames[0];
    const name2 = hero2.nicknames[0];

    // Check hardcoded synergies
    const entry = this.synergies.find(
      s => (s.hero1 === name1 && s.hero2 === name2) || (s.hero1 === name2 && s.hero2 === name1)
    );
    if (entry) return entry.score;

    // Specialty-based dynamic scoring
    return this.computeSpecialtySynergy(hero1, hero2);
  }

  getCounterScore(counter: Hero, target: Hero): number {
    const cName = counter.nicknames[0];
    const tName = target.nicknames[0];

    const entry = this.counters.find(
      c => c.counter === cName && c.target === tName
    );
    if (entry) return entry.score;

    return this.computeSpecialtyCounter(counter, target);
  }

  getSynergyReason(hero1: Hero, hero2: Hero): string {
    const name1 = hero1.nicknames[0];
    const name2 = hero2.nicknames[0];
    const entry = this.synergies.find(
      s => (s.hero1 === name1 && s.hero2 === name2) || (s.hero1 === name2 && s.hero2 === name1)
    );
    return entry?.reason || '';
  }

  getCounterReason(counter: Hero, target: Hero): string {
    const cName = counter.nicknames[0];
    const tName = target.nicknames[0];
    const entry = this.counters.find(c => c.counter === cName && c.target === tName);
    return entry?.reason || '';
  }

  private computeSpecialtySynergy(hero1: Hero, hero2: Hero): number {
    let score = 0;
    const specs1 = hero1.specialties;
    const specs2 = hero2.specialties;

    // Engage + AOE combo
    if (specs1.includes(Specialty.ENGAGE) && specs2.includes(Specialty.AOE_DAMAGE)) score++;
    if (specs2.includes(Specialty.ENGAGE) && specs1.includes(Specialty.AOE_DAMAGE)) score++;

    // Engage + Hard CC combo
    if (specs1.includes(Specialty.ENGAGE) && specs2.includes(Specialty.HARD_CC)) score++;
    if (specs2.includes(Specialty.ENGAGE) && specs1.includes(Specialty.HARD_CC)) score++;

    // Tank + Healer basics
    if (hero1.role === 'Tank' && hero2.role === 'Healer') score++;
    if (hero2.role === 'Tank' && hero1.role === 'Healer') score++;

    // Global presence synergy
    if (specs1.includes(Specialty.GLOBAL_PRESENCE) && specs2.includes(Specialty.GLOBAL_PRESENCE)) score++;

    // Dive synergy
    if (specs1.includes(Specialty.MOBILITY) && specs2.includes(Specialty.BURST_DAMAGE) &&
        specs1.includes(Specialty.ENGAGE)) score++;
    if (specs2.includes(Specialty.MOBILITY) && specs1.includes(Specialty.BURST_DAMAGE) &&
        specs2.includes(Specialty.ENGAGE)) score++;

    return Math.min(score, 3);
  }

  private computeSpecialtyCounter(counter: Hero, target: Hero): number {
    let score = 0;
    const cSpecs = counter.specialties;
    const tSpecs = target.specialties;

    // Anti-dive counters dive
    if (cSpecs.includes(Specialty.ANTI_DIVE) && tSpecs.includes(Specialty.MOBILITY) && tSpecs.includes(Specialty.ENGAGE)) score++;

    // Hard CC counters low durability
    if (cSpecs.includes(Specialty.HARD_CC) && tSpecs.includes(Specialty.LOW_DURABILITY)) score++;

    // Percent damage counters high durability
    if (cSpecs.includes(Specialty.PERCENT_DAMAGE) && tSpecs.includes(Specialty.HIGH_DURABILITY)) score++;

    // Stealth counters squishy poke
    if (cSpecs.includes(Specialty.STEALTH) && tSpecs.includes(Specialty.POKE) && !tSpecs.includes(Specialty.MOBILITY)) score++;

    // Cleanse counters hard CC
    if (cSpecs.includes(Specialty.CLEANSE) && tSpecs.includes(Specialty.HARD_CC)) score++;

    return Math.min(score, 3);
  }

  private initSynergies(): void {
    const s = (h1: string, h2: string, score: number, reason: string) =>
      this.synergies.push({ hero1: h1, hero2: h2, score, reason });

    // Iconic combos
    s("E.T.C.", "Jaina", 3, "Mosh Pit enables Ring of Frost combo");
    s("E.T.C.", "Kael'thas", 3, "Mosh Pit enables Living Bomb spread");
    s("Uther", "Illidan", 3, "Divine Shield enables aggressive dives");
    s("Abathur", "Illidan", 3, "Clone + ultimate combo");
    s("Ana", "Genji", 2, "Nano Boost dive enabler");
    s("Malfurion", "Valla", 2, "Roots + Rain of Vengeance combo");
    s("Tyrael", "Illidan", 3, "Sanctification + dive protection");
    s("Dehaka", "Abathur", 3, "Global presence + clone value");
    s("Garrosh", "Jaina", 2, "Throw + Ring of Frost combo");
    s("Arthas", "Jaina", 2, "Double slow for easy roots");
    s("Stitches", "Jaina", 2, "Hook + Ring of Frost combo");
    s("Diablo", "Tyrande", 3, "Apoc + Lunar Flare chain CC");
    s("Maiev", "E.T.C.", 2, "Cage + Mosh combo");
    s("Auriel", "Gul'dan", 3, "Hope battery synergy");
    s("Auriel", "Valla", 2, "High damage = high hope generation");
    s("Rehgar", "Illidan", 2, "Bloodlust + dive synergy");
    s("Lucio", "Illidan", 2, "Speed boost enables dive");
    s("Brightwing", "Illidan", 2, "Global teleport follow + Polymorph");
    s("Zarya", "Tracer", 2, "Shield enables aggressive plays");
    s("Tassadar", "Tracer", 2, "Wall + mobility combo control");
    s("Anduin", "Diablo", 2, "Leap of Faith saves overextended engager");
    s("Medivh", "Genji", 2, "Portal + dive mobility");
    s("Kel'Thuzad", "E.T.C.", 3, "Mosh + chain combo");
    s("Kerrigan", "E.T.C.", 2, "Mosh + Maelstrom combo");
    s("Tyrande", "Zeratul", 2, "Stun + VP combo");
    s("Uther", "Genji", 2, "Divine Shield aggressive dive");
    s("Rehgar", "Thrall", 2, "Bloodlust + Sundering combo");
    s("Anub'arak", "Li-Ming", 2, "Cocoon isolate + burst");
    s("Stitches", "Anduin", 2, "Gorge + Leap of Faith combo");
    s("Johanna", "Li-Ming", 2, "Blind + burst damage setup");
    s("Kharazim", "Zeratul", 2, "Seven-Sided Strike + VP combo");
    s("Lt. Morales", "Raynor", 2, "Sustained healing + sustained DPS");
    s("Varian", "Uther", 2, "Taunt engage + armor");
    s("Tyrael", "Genji", 2, "Sanctification + Dragonblade");
    s("Stukov", "Arthas", 2, "Slow area + root setup");
    s("Mal'Ganis", "Kael'thas", 2, "Sleep + Living Bomb spread");
  }

  private initCounters(): void {
    const c = (counter: string, target: string, score: number, reason: string) =>
      this.counters.push({ counter, target, score, reason });

    // Classic counters
    c("Anub'arak", "Li-Ming", 3, "Spell armor + Cocoon shuts down burst mage");
    c("Anub'arak", "Kael'thas", 3, "Spell armor + dive nullifies mage");
    c("Anub'arak", "Chromie", 2, "Dive + spell armor vs long range mage");
    c("Tychus", "Cho", 3, "Percent damage shreds high HP");
    c("Tychus", "Deathwing", 3, "Percent damage + Minigun vs massive HP pool");
    c("Tychus", "Diablo", 2, "Percent damage vs high HP tank");
    c("Brightwing", "Illidan", 2, "Polymorph shuts down dive");
    c("Uther", "Illidan", 2, "Stun + armor counters dive");
    c("Li Li", "Tracer", 2, "Blind counters auto-attacker");
    c("Li Li", "Illidan", 2, "Blind counters auto-attacker");
    c("Johanna", "Tracer", 2, "Blind + unstoppable counters dive");
    c("Arthas", "Illidan", 2, "Slow aura shuts down melee dive");
    c("Valeera", "Li-Ming", 2, "Stealth + silence shuts down mage");
    c("Zeratul", "Li-Ming", 2, "Void Prison isolate + burst");
    c("Genji", "Kael'thas", 2, "Deflect + mobility vs mage");
    c("Genji", "Chromie", 2, "Mobility counters skillshot mage");
    c("Maiev", "Genji", 2, "Cage + tether counters mobility");
    c("Cassia", "Tracer", 2, "Avoidance + blind counters AA");
    c("Cassia", "Illidan", 2, "Avoidance + blind counters melee AA");
    c("Garrosh", "Tracer", 2, "Throw disrupts mobile assassin");
    c("Dehaka", "Abathur", 2, "Global matches global + picks off split pushers");
    c("Falstad", "Abathur", 2, "Global matches global presence");
    c("Zeratul", "Abathur", 2, "VP on core / picks off hat target");
    c("Malthael", "Cho", 3, "Percent damage + high sustain vs large hitbox");
    c("Leoric", "Cho", 2, "Percent damage vs high HP");
    c("Varian", "Zeratul", 2, "Taunt locks down stealth assassin");
    c("Ana", "Deathwing", 2, "Anti-heal grenade reduces sustain");
    c("Ana", "Alexstrasza", 2, "Anti-heal reduces healing output");
    c("Lunara", "Alexstrasza", 2, "Poison undermines healing");
    c("Tracer", "Sgt. Hammer", 2, "Mobility + harass vs static target");
    c("Genji", "Sgt. Hammer", 2, "Dive vs immobile ranged");
    c("Zeratul", "Sgt. Hammer", 2, "VP on siege position");
    c("Nova", "Li-Ming", 2, "Snipe picks off squishy mage");
    c("Diablo", "Li-Ming", 2, "Wall slam + burst kills squishy");
    c("Garrosh", "Li-Ming", 2, "Throw into team kills squishy");
  }
}

export { HeroRelationships };
