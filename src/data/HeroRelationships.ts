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

  private static readonly SYNERGY_RULES: { spec1: Specialty; spec2: Specialty; bonus: number }[] = [
    { spec1: Specialty.ENGAGE, spec2: Specialty.BURST_DAMAGE, bonus: 2 },
    { spec1: Specialty.ENGAGE, spec2: Specialty.AOE_DAMAGE, bonus: 1 },
    { spec1: Specialty.HARD_CC, spec2: Specialty.BURST_DAMAGE, bonus: 2 },
    { spec1: Specialty.HARD_CC, spec2: Specialty.AOE_DAMAGE, bonus: 1 },
    { spec1: Specialty.BURST_HEALING, spec2: Specialty.MOBILITY, bonus: 1 },
    { spec1: Specialty.SHIELDS, spec2: Specialty.MOBILITY, bonus: 1 },
    { spec1: Specialty.ARMOR_APPLICATION, spec2: Specialty.ENGAGE, bonus: 1 },
    { spec1: Specialty.GLOBAL_PRESENCE, spec2: Specialty.SPLIT_PUSHING, bonus: 1 },
    { spec1: Specialty.WAVECLEAR, spec2: Specialty.SIEGE_PUSHING, bonus: 1 },
    { spec1: Specialty.DOUBLE_SOAKING, spec2: Specialty.GLOBAL_PRESENCE, bonus: 2 },
    { spec1: Specialty.POKE, spec2: Specialty.DISENGAGE, bonus: 1 },
    { spec1: Specialty.SUSTAINED_DAMAGE, spec2: Specialty.SUSTAINED_HEALING, bonus: 1 },
    { spec1: Specialty.PICK_POTENTIAL, spec2: Specialty.BURST_DAMAGE, bonus: 1 },
    { spec1: Specialty.ENGAGE, spec2: Specialty.BURST_HEALING, bonus: 1 },
    { spec1: Specialty.HIGH_DURABILITY, spec2: Specialty.SUSTAINED_HEALING, bonus: 1 },
    { spec1: Specialty.OBJECTIVE_CONTROL, spec2: Specialty.ENGAGE, bonus: 1 },
    { spec1: Specialty.ZONING, spec2: Specialty.OBJECTIVE_CONTROL, bonus: 1 },
    { spec1: Specialty.BURST_DAMAGE, spec2: Specialty.HARD_CC, bonus: 2 },
    { spec1: Specialty.ENGAGE, spec2: Specialty.DISENGAGE, bonus: 1 },
    { spec1: Specialty.MOBILITY, spec2: Specialty.BURST_DAMAGE, bonus: 2 },
    { spec1: Specialty.GLOBAL_PRESENCE, spec2: Specialty.GLOBAL_PRESENCE, bonus: 2 },
    { spec1: Specialty.SHIELDS, spec2: Specialty.ENGAGE, bonus: 1 },
    { spec1: Specialty.SUSTAINED_HEALING, spec2: Specialty.HIGH_DURABILITY, bonus: 1 },
    { spec1: Specialty.PERCENT_DAMAGE, spec2: Specialty.HARD_CC, bonus: 1 },
    { spec1: Specialty.PICK_POTENTIAL, spec2: Specialty.HARD_CC, bonus: 2 },
  ];

  private computeSpecialtySynergy(hero1: Hero, hero2: Hero): number {
    const specs1 = hero1.specialties;
    const specs2 = hero2.specialties;

    let totalScore = 0;
    let matchCount = 0;

    for (const rule of HeroRelationships.SYNERGY_RULES) {
      const forwardMatch =
        specs1.includes(rule.spec1) && specs2.includes(rule.spec2);
      const reverseMatch =
        specs1.includes(rule.spec2) && specs2.includes(rule.spec1);

      if (forwardMatch || reverseMatch) {
        let contribution = rule.bonus;
        if (matchCount > 0) contribution *= 0.5;
        totalScore += contribution;
        matchCount++;
      }
    }

    return Math.min(Math.floor(totalScore), 3);
  }

  private static readonly COUNTER_RULES: { counterSpec: Specialty; targetSpec: Specialty; bonus: number }[] = [
    { counterSpec: Specialty.PERCENT_DAMAGE, targetSpec: Specialty.HIGH_DURABILITY, bonus: 2 },
    { counterSpec: Specialty.EXECUTE_DAMAGE, targetSpec: Specialty.BURST_HEALING, bonus: 1 },
    { counterSpec: Specialty.HARD_CC, targetSpec: Specialty.MOBILITY, bonus: 1 },
    { counterSpec: Specialty.CLEANSE, targetSpec: Specialty.HARD_CC, bonus: 1 },
    { counterSpec: Specialty.MOBILITY, targetSpec: Specialty.POKE, bonus: 1 },
    { counterSpec: Specialty.ANTI_DIVE, targetSpec: Specialty.MOBILITY, bonus: 1 },
    { counterSpec: Specialty.BURST_DAMAGE, targetSpec: Specialty.SUSTAINED_HEALING, bonus: 1 },
    { counterSpec: Specialty.EXECUTE_DAMAGE, targetSpec: Specialty.SELF_SUSTAIN, bonus: 1 },
    { counterSpec: Specialty.GLOBAL_PRESENCE, targetSpec: Specialty.STEALTH, bonus: 1 },
    { counterSpec: Specialty.DISENGAGE, targetSpec: Specialty.ENGAGE, bonus: 1 },
    { counterSpec: Specialty.ANTI_DIVE, targetSpec: Specialty.ENGAGE, bonus: 1 },
    { counterSpec: Specialty.ANTI_POKE, targetSpec: Specialty.POKE, bonus: 1 },
    { counterSpec: Specialty.SHIELDS, targetSpec: Specialty.POKE, bonus: 1 },
    { counterSpec: Specialty.BURST_DAMAGE, targetSpec: Specialty.LOW_DURABILITY, bonus: 1 },
    { counterSpec: Specialty.PICK_POTENTIAL, targetSpec: Specialty.SPLIT_PUSHING, bonus: 1 },
    { counterSpec: Specialty.HARD_CC, targetSpec: Specialty.STEALTH, bonus: 1 },
    { counterSpec: Specialty.SHIELDS, targetSpec: Specialty.BURST_DAMAGE, bonus: 1 },
    { counterSpec: Specialty.DAMAGE_MITIGATION, targetSpec: Specialty.BURST_DAMAGE, bonus: 1 },
    { counterSpec: Specialty.SUSTAINED_DAMAGE, targetSpec: Specialty.HIGH_DURABILITY, bonus: 1 },
    { counterSpec: Specialty.AOE_DAMAGE, targetSpec: Specialty.SPLIT_PUSHING, bonus: 1 },
    { counterSpec: Specialty.PICK_POTENTIAL, targetSpec: Specialty.LOW_DURABILITY, bonus: 2 },
    { counterSpec: Specialty.MOBILITY, targetSpec: Specialty.SIEGE_PUSHING, bonus: 1 },
    { counterSpec: Specialty.ENGAGE, targetSpec: Specialty.POKE, bonus: 1 },
    { counterSpec: Specialty.BURST_DAMAGE, targetSpec: Specialty.SELF_SUSTAIN, bonus: 1 },
  ];

  private computeSpecialtyCounter(counter: Hero, target: Hero): number {
    const cSpecs = counter.specialties;
    const tSpecs = target.specialties;

    let totalScore = 0;
    let matchCount = 0;

    for (const rule of HeroRelationships.COUNTER_RULES) {
      if (cSpecs.includes(rule.counterSpec) && tSpecs.includes(rule.targetSpec)) {
        let contribution = rule.bonus;
        if (matchCount > 0) contribution *= 0.5;
        totalScore += contribution;
        matchCount++;
      }
    }

    return Math.min(Math.floor(totalScore), 3);
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

    // === Ported from C++ app ===
    // Dive enablers
    s("Zarya", "Genji", 2, "Shields enable dive resets");
    s("Medivh", "Illidan", 2, "Portal enables aggressive plays");
    s("Tyrael", "Greymane", 2, "Sanctification protects dive");
    s("Kharazim", "Illidan", 2, "Divine Palm saves diver");
    s("Ana", "Sonya", 2, "Nano Boost + Wrath spin");
    s("Ana", "Greymane", 2, "Nano Boost worgen burst");

    // Wombo combo setups
    s("E.T.C.", "Tassadar", 2, "Mosh Pit enables Wall combo");
    s("E.T.C.", "Malfurion", 2, "Mosh Pit guarantees Twilight Dream");
    s("E.T.C.", "Gul'dan", 2, "Mosh Pit enables Rain of Destruction");
    s("E.T.C.", "Rehgar", 2, "Ancestral during Mosh setup");
    s("Garrosh", "Kael'thas", 2, "Throw enables burst combo");
    s("Garrosh", "Kerrigan", 2, "Throw into combo follow-up");
    s("Garrosh", "Uther", 2, "Throw + Divine Shield aggression");
    s("Stitches", "Kael'thas", 2, "Hook isolates targets for burst");
    s("Kerrigan", "Jaina", 2, "Combo enables follow-up burst");
    s("Maiev", "Zeratul", 2, "Tether enables Void Prison combo");
    s("Maiev", "Jaina", 2, "Cage enables Ring of Frost");
    s("Maiev", "Kael'thas", 2, "Cage enables Flamestrike");
    s("Diablo", "Jaina", 2, "Apocalypse into Ring of Frost");
    s("Diablo", "Kael'thas", 2, "Flip into Living Bomb spread");
    s("Diablo", "Uther", 2, "Stun chain + burst healing");
    s("Zeratul", "E.T.C.", 3, "Void Prison into Mosh Pit");
    s("Zeratul", "Jaina", 2, "VP into Ring of Frost");
    s("Anub'arak", "Jaina", 2, "Burrow into Ring of Frost");
    s("Thrall", "Jaina", 2, "Sundering into follow-up burst");

    // Clone/hat synergies
    s("Abathur", "Sonya", 2, "Hat enhances spin-to-win");
    s("Abathur", "Greymane", 2, "Clone doubles dive threat");
    s("Abathur", "Tracer", 2, "Hat enables aggressive Tracer");
    s("Abathur", "Zeratul", 2, "Clone doubles VP threat");
    s("Abathur", "Falstad", 2, "Double global pressure");

    // Energy battery
    s("Auriel", "Lunara", 2, "Energy battery for healing");
    s("Auriel", "Cho", 3, "Massive energy generation");
    s("Auriel", "Fenix", 2, "Sustained energy battery");

    // Follow-up synergies
    s("Anub'arak", "Zeratul", 2, "Cocoon enables VP setup");
    s("Thrall", "Greymane", 2, "Sundering enables dive");
    s("Anduin", "Genji", 2, "Leap of Faith saves diver");

    // Global pressure
    s("Dehaka", "Falstad", 2, "Map control through globals");
    s("Brightwing", "Falstad", 2, "Global presence synergy");
    s("Dehaka", "Brightwing", 2, "Double global presence");
    s("Falstad", "Brightwing", 2, "Paired global rotations");
    s("The Lost Vikings", "Falstad", 2, "Soak + global map coverage");

    // Healer + DPS combos
    s("Whitemane", "Valla", 2, "High damage fuels Whitemane healing");

    // Specialist combos
    s("Medivh", "Zeratul", 2, "Portal + VP combo potential");

    // Protect the carry
    s("Zarya", "Valla", 2, "Shields enable aggressive Valla");
    s("Tyrael", "Valla", 2, "Sanctification protects backline");
    s("Medivh", "Cho", 2, "Portal + Force of Will protects Cho'gall");
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

    // === Ported from C++ app ===
    // Tychus vs tanks
    c("Tychus", "Stitches", 3, "Percent damage vs tank");
    c("Tychus", "Garrosh", 2, "Percent damage vs tank");
    c("Tychus", "Muradin", 2, "Percent damage vs tank");
    c("Tychus", "Johanna", 2, "Percent damage vs tank");
    c("Tychus", "Arthas", 2, "Percent damage vs slow tank");
    c("Tychus", "Mal'Ganis", 2, "Percent damage vs tank");

    // Malthael vs tanks
    c("Malthael", "Diablo", 2, "Percent damage vs tank");
    c("Malthael", "Stitches", 2, "Percent damage vs tank");
    c("Malthael", "Garrosh", 2, "Percent damage vs tank");
    c("Malthael", "Johanna", 2, "Percent damage vs tank");
    c("Malthael", "Arthas", 2, "Percent damage vs high HP");

    // Leoric vs tanks
    c("Leoric", "Diablo", 2, "Drain Hope vs high HP");
    c("Leoric", "Stitches", 2, "Drain Hope vs high HP");

    // Cassia vs AA heroes
    c("Cassia", "Raynor", 2, "Blind negates auto-attacks");
    c("Cassia", "Valla", 2, "Blind negates auto-attacks");
    c("Cassia", "Fenix", 2, "Blind negates auto-attacks");
    c("Cassia", "Zul'jin", 2, "Blind negates auto-attacks");
    c("Cassia", "Tychus", 2, "Blind negates auto-attacks");
    c("Cassia", "Greymane", 2, "Blind negates worgen");
    c("Cassia", "The Butcher", 2, "Blind negates meat stacks");

    // Anti-mage
    c("Anub'arak", "Jaina", 2, "Spell armor + Cocoon");
    c("Anub'arak", "Gul'dan", 2, "Spell armor + dive on drain");
    c("Anub'arak", "Kel'Thuzad", 2, "Spell armor + cocoon interrupt");
    c("Anub'arak", "Mephisto", 2, "Spell armor + dive interrupt");
    c("Varian", "Li-Ming", 2, "Charge + spell block shuts mage");
    c("Varian", "Kael'thas", 2, "Protected + charge on mage");
    c("Varian", "E.T.C.", 2, "Taunt cancels Mosh Pit");
    c("Medivh", "Jaina", 2, "Protected negates burst");
    c("Medivh", "Kael'thas", 2, "Protected negates burst");

    // Genji vs low mobility
    c("Genji", "Jaina", 2, "Dive and reset potential");
    c("Genji", "Ana", 2, "Dive and reset potential");
    c("Genji", "Li-Ming", 2, "Deflect + dash punishes poke");

    // Dive counters
    c("Uther", "Greymane", 2, "Divine Shield saves dive target");
    c("Uther", "Kerrigan", 2, "Divine Shield saves combo target");
    c("Uther", "Genji", 2, "Stun + Divine Shield saves target");
    c("Johanna", "Illidan", 2, "Peel and durability");
    c("Johanna", "Genji", 2, "Peel + blind stops diver");
    c("Arthas", "Tracer", 2, "Root locks down mobility");
    c("Arthas", "Genji", 2, "Root locks down mobility");
    c("Arthas", "Kerrigan", 2, "Root locks combo hero");
    c("Arthas", "Zeratul", 2, "Root grounds stealth diver");
    c("Xul", "Tracer", 2, "Bone Prison locks mobility");
    c("Thrall", "Illidan", 2, "Sundering + root locks diver");

    // Hard engage counters
    c("Brightwing", "E.T.C.", 2, "Polymorph cancels Mosh Pit");
    c("Stukov", "E.T.C.", 1, "Silence cancels Mosh Pit");
    c("Dehaka", "E.T.C.", 2, "Drag cancels Mosh Pit");
    c("Diablo", "E.T.C.", 2, "Charge interrupts Mosh Pit");
    c("Maiev", "E.T.C.", 2, "Cage blocks Mosh slide");
    c("Zeratul", "E.T.C.", 2, "VP counters Mosh timing");
    c("Anub'arak", "E.T.C.", 2, "Burrow stun cancels Mosh");
    c("Garrosh", "Muradin", 1, "Throw punishes jump");
    c("Garrosh", "E.T.C.", 1, "Throw punishes slide");

    // Stealth counters
    c("Brightwing", "Zeratul", 2, "Global reveals stealth");
    c("Brightwing", "Nova", 2, "Global reveals stealth");
    c("Tassadar", "Zeratul", 2, "Oracle reveals stealth");
    c("Tassadar", "Nova", 2, "Oracle reveals stealth");
    c("Hanzo", "Zeratul", 2, "Sonic Arrow reveals stealth");
    c("Hanzo", "Nova", 2, "Sonic Arrow reveals stealth");
    c("Maiev", "Nova", 2, "Tether catches stealth");
    c("Maiev", "Valeera", 2, "Tether catches stealth");

    // Poke counters (dive into poke)
    c("Illidan", "Chromie", 2, "Dive negates poke safety");
    c("Illidan", "Li-Ming", 2, "Evasion + dive pressure");
    c("Zeratul", "Chromie", 2, "Dive dismantles poke safety");
    c("Tracer", "Chromie", 2, "Blink dodges skillshots");
    c("Tracer", "Li-Ming", 2, "Blink dodges skillshots");

    // Anti-split/macro
    c("Falstad", "Zagara", 1, "Global answers split pressure");
    c("Dehaka", "Zagara", 1, "Global counters split push");

    // Anti-sustain
    c("Ana", "Whitemane", 2, "Anti-heal grenade cuts sustain");

    // Summon counters
    c("Jaina", "Samuro", 2, "AOE clears clones");
    c("Kael'thas", "Samuro", 2, "AOE clears clones");
    c("Kael'thas", "Rexxar", 2, "AOE clears bear");

    // Burst counters
    c("Alexstrasza", "Nova", 2, "Sustain outlasts burst");
    c("Alexstrasza", "Zeratul", 2, "Circle heals dive target");

    // Special matchups
    c("Greymane", "Murky", 2, "Burst through bubble");
    c("Valeera", "Ana", 2, "Silence prevents sleep");
    c("Sonya", "Cho", 2, "Sustained damage vs large target");
  }
}

export { HeroRelationships };
