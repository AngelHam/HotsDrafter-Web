import { Specialty } from './Specialty';
import { EffectiveRange, type Hero } from './Hero';
import { HotsMap } from './Map';

export const DATA_LAST_UPDATED = 'March 2026';
export const DATA_SOURCE = 'Icy Veins';

const S = Specialty;
const ER = EffectiveRange;

export const ALL_HEROES: Hero[] = [
  // ==================== TANKS ====================
  { name: "Anub'arak", nicknames: ["Anub'arak", "Anubarak"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.PICK_POTENTIAL, S.DAMAGE_MITIGATION, S.COUNTERPICK], effectiveRange: ER.SHORT_RANGE },
  { name: "Arthas", nicknames: ["Arthas"], role: "Tank", specialties: [S.SOFT_CC, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.ANTI_DIVE], effectiveRange: ER.MELEE },
  { name: "Cho", nicknames: ["Cho"], role: "Tank", specialties: [S.CHEESE, S.HIGH_DURABILITY, S.LATE_GAME_SCALING], effectiveRange: ER.MELEE },
  { name: "Diablo", nicknames: ["Diablo"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.HIGH_DURABILITY, S.PICK_POTENTIAL], effectiveRange: ER.MELEE },
  { name: "E.T.C.", nicknames: ["E.T.C.", "ETC"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.DISENGAGE, S.UTILITY_SUPPORT, S.GLOBAL_PRESENCE], effectiveRange: ER.MELEE },
  { name: "Garrosh", nicknames: ["Garrosh"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.PICK_POTENTIAL, S.HIGH_DURABILITY], effectiveRange: ER.MELEE },
  { name: "Johanna", nicknames: ["Johanna"], role: "Tank", specialties: [S.HIGH_DURABILITY, S.DAMAGE_MITIGATION, S.WAVECLEAR, S.SOFT_CC, S.ANTI_DIVE, S.DISENGAGE, S.HARD_CC], effectiveRange: ER.MELEE },
  { name: "Mal'Ganis", nicknames: ["Mal'Ganis", "MalGanis"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.PICK_POTENTIAL], effectiveRange: ER.MELEE },
  { name: "Mei", nicknames: ["Mei"], role: "Tank", specialties: [S.HARD_CC, S.DISENGAGE, S.WAVECLEAR, S.ENGAGE, S.HIGH_DURABILITY], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Muradin", nicknames: ["Muradin"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.MOBILITY, S.SOFT_CC], effectiveRange: ER.SHORT_RANGE },
  { name: "Stitches", nicknames: ["Stitches"], role: "Tank", specialties: [S.ENGAGE, S.PICK_POTENTIAL, S.HIGH_DURABILITY, S.HARD_CC, S.SELF_SUSTAIN], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Tyrael", nicknames: ["Tyrael"], role: "Tank", specialties: [S.ENGAGE, S.UTILITY_SUPPORT, S.DISENGAGE, S.SHIELDS, S.MOBILITY], effectiveRange: ER.MELEE },
  { name: "Varian", nicknames: ["Varian"], role: "Tank", specialties: [S.ENGAGE, S.HARD_CC, S.FLEX_PICK, S.SUSTAINED_DAMAGE], effectiveRange: ER.MELEE },

  // ==================== HEALERS ====================
  { name: "Alexstrasza", nicknames: ["Alexstrasza"], role: "Healer", specialties: [S.BURST_HEALING, S.SUSTAINED_HEALING], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Ana", nicknames: ["Ana"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.POKE, S.PICK_POTENTIAL, S.ANTI_DIVE, S.COUNTERPICK], effectiveRange: ER.LONG_RANGE },
  { name: "Anduin", nicknames: ["Anduin"], role: "Healer", specialties: [S.BURST_HEALING, S.CLEANSE, S.UTILITY_SUPPORT, S.DISENGAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Auriel", nicknames: ["Auriel"], role: "Healer", specialties: [S.BURST_HEALING, S.SUSTAINED_HEALING, S.SOFT_CC, S.DISENGAGE, S.UTILITY_SUPPORT], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Brightwing", nicknames: ["Brightwing"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.UTILITY_SUPPORT, S.GLOBAL_PRESENCE, S.DISENGAGE, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Deckard", nicknames: ["Deckard", "Deckard Cain"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.UTILITY_SUPPORT, S.ZONING, S.HARD_CC, S.SOFT_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Kharazim", nicknames: ["Kharazim"], role: "Healer", specialties: [S.BURST_HEALING, S.MOBILITY, S.SUSTAINED_DAMAGE, S.ENGAGE, S.SELF_SUSTAIN, S.AUTO_ATTACK, S.CLEANSE, S.PERCENT_DAMAGE], effectiveRange: ER.MELEE },
  { name: "Li Li", nicknames: ["Li Li", "LiLi"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.SOFT_CC, S.UTILITY_SUPPORT, S.COUNTERPICK], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Lt. Morales", nicknames: ["Lt. Morales", "LtMorales", "Morales"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.UTILITY_SUPPORT, S.ANTI_POKE, S.DAMAGE_MITIGATION], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Lucio", nicknames: ["Lucio"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.UTILITY_SUPPORT, S.MOBILITY, S.DISENGAGE, S.DAMAGE_MITIGATION, S.CLEANSE], effectiveRange: ER.SHORT_RANGE },
  { name: "Malfurion", nicknames: ["Malfurion"], role: "Healer", specialties: [S.SUSTAINED_HEALING, S.UTILITY_SUPPORT, S.SOFT_CC, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Rehgar", nicknames: ["Rehgar"], role: "Healer", specialties: [S.BURST_HEALING, S.UTILITY_SUPPORT, S.WAVECLEAR, S.SELF_SUSTAIN, S.CAMP_TAKING], effectiveRange: ER.SHORT_RANGE },
  { name: "Stukov", nicknames: ["Stukov"], role: "Healer", specialties: [S.BURST_HEALING, S.SOFT_CC, S.UTILITY_SUPPORT, S.ZONING, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Tyrande", nicknames: ["Tyrande"], role: "Healer", specialties: [S.UTILITY_SUPPORT, S.PICK_POTENTIAL, S.HARD_CC], effectiveRange: ER.LONG_RANGE },
  { name: "Uther", nicknames: ["Uther"], role: "Healer", specialties: [S.BURST_HEALING, S.ARMOR_APPLICATION, S.HARD_CC, S.ANTI_DIVE, S.UTILITY_SUPPORT], effectiveRange: ER.SHORT_RANGE },
  { name: "Whitemane", nicknames: ["Whitemane"], role: "Healer", specialties: [S.BURST_HEALING, S.SUSTAINED_HEALING, S.SUSTAINED_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },

  // ==================== OFFLANE / BRUISERS ====================
  { name: "Artanis", nicknames: ["Artanis"], role: "Offlane", specialties: [S.HIGH_DURABILITY, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.AUTO_ATTACK, S.PERCENT_DAMAGE, S.PICK_POTENTIAL, S.CAMP_TAKING], effectiveRange: ER.SHORT_RANGE },
  { name: "Blaze", nicknames: ["Blaze"], role: "Offlane", specialties: [S.WAVECLEAR, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.ENGAGE, S.ANTI_DIVE], effectiveRange: ER.SHORT_RANGE },
  { name: "Chen", nicknames: ["Chen"], role: "Offlane", specialties: [S.ENGAGE, S.SUSTAINED_DAMAGE, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.MOBILITY, S.PICK_POTENTIAL, S.SOFT_CC], effectiveRange: ER.MELEE },
  { name: "D.Va", nicknames: ["D.Va", "DVa"], role: "Offlane", specialties: [S.MOBILITY, S.ZONING, S.ANTI_DIVE, S.DISENGAGE, S.DAMAGE_MITIGATION], effectiveRange: ER.SHORT_RANGE },
  { name: "Deathwing", nicknames: ["Deathwing"], role: "Offlane", specialties: [S.AOE_DAMAGE, S.HIGH_DURABILITY, S.SUSTAINED_DAMAGE, S.WAVECLEAR, S.SELF_SUSTAIN], effectiveRange: ER.SHORT_RANGE },
  { name: "Dehaka", nicknames: ["Dehaka"], role: "Offlane", specialties: [S.GLOBAL_PRESENCE, S.WAVECLEAR, S.SELF_SUSTAIN, S.SUSTAINED_DAMAGE, S.HARD_CC, S.DOUBLE_SOAKING], effectiveRange: ER.SHORT_RANGE },
  { name: "Hogger", nicknames: ["Hogger"], role: "Offlane", specialties: [S.ENGAGE, S.HARD_CC, S.SUSTAINED_DAMAGE, S.ZONING, S.SELF_SUSTAIN, S.WAVECLEAR], effectiveRange: ER.SHORT_RANGE },
  { name: "Illidan", nicknames: ["Illidan"], role: "Offlane", specialties: [S.ENGAGE, S.MOBILITY, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.AUTO_ATTACK, S.CAMP_TAKING, S.GLOBAL_PRESENCE, S.LATE_GAME_SCALING, S.SNOWBALL], effectiveRange: ER.MELEE },
  { name: "Imperius", nicknames: ["Imperius"], role: "Offlane", specialties: [S.ENGAGE, S.BURST_DAMAGE, S.HARD_CC, S.SELF_SUSTAIN, S.SUSTAINED_DAMAGE], effectiveRange: ER.SHORT_RANGE },
  { name: "Kerrigan", nicknames: ["Kerrigan"], role: "Offlane", specialties: [S.ENGAGE, S.HARD_CC, S.BURST_DAMAGE, S.PICK_POTENTIAL, S.SELF_SUSTAIN], effectiveRange: ER.SHORT_RANGE },
  { name: "Leoric", nicknames: ["Leoric"], role: "Offlane", specialties: [S.PERCENT_DAMAGE, S.HIGH_DURABILITY, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.WAVECLEAR, S.DOUBLE_SOAKING], effectiveRange: ER.SHORT_RANGE },
  { name: "Ragnaros", nicknames: ["Ragnaros"], role: "Offlane", specialties: [S.WAVECLEAR, S.AOE_DAMAGE, S.SUSTAINED_DAMAGE, S.OBJECTIVE_CONTROL, S.CAMP_TAKING, S.SPLIT_PUSHING], effectiveRange: ER.SHORT_RANGE },
  { name: "Rexxar", nicknames: ["Rexxar"], role: "Offlane", specialties: [S.SUSTAINED_DAMAGE, S.WAVECLEAR, S.CAMP_TAKING, S.OBJECTIVE_CONTROL, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Sonya", nicknames: ["Sonya"], role: "Offlane", specialties: [S.ENGAGE, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.CAMP_TAKING, S.WAVECLEAR, S.AUTO_ATTACK, S.SPLIT_PUSHING], effectiveRange: ER.SHORT_RANGE },
  { name: "Xul", nicknames: ["Xul"], role: "Offlane", specialties: [S.WAVECLEAR, S.AOE_DAMAGE, S.HARD_CC, S.SUSTAINED_DAMAGE, S.DOUBLE_SOAKING, S.SPLIT_PUSHING], effectiveRange: ER.SHORT_RANGE },
  { name: "Yrel", nicknames: ["Yrel"], role: "Offlane", specialties: [S.ENGAGE, S.HIGH_DURABILITY, S.SELF_SUSTAIN, S.HARD_CC, S.WAVECLEAR, S.DOUBLE_SOAKING], effectiveRange: ER.MELEE },

  // ==================== MAGES ====================
  { name: "Alarak", nicknames: ["Alarak"], role: "Mage", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.SNOWBALL, S.HARD_CC, S.SUSTAINED_DAMAGE], effectiveRange: ER.SHORT_RANGE },
  { name: "Azmodan", nicknames: ["Azmodan"], role: "Mage", specialties: [S.POKE, S.WAVECLEAR, S.SIEGE_PUSHING, S.SUSTAINED_DAMAGE, S.LATE_GAME_SCALING, S.SPLIT_PUSHING], effectiveRange: ER.EXTREME_RANGE },
  { name: "Chromie", nicknames: ["Chromie"], role: "Mage", specialties: [S.POKE, S.BURST_DAMAGE, S.ZONING, S.PICK_POTENTIAL], effectiveRange: ER.EXTREME_RANGE },
  { name: "Gul'dan", nicknames: ["Gul'dan", "Guldan"], role: "Mage", specialties: [S.SPELL_DAMAGE, S.SUSTAINED_DAMAGE, S.POKE, S.WAVECLEAR, S.AOE_DAMAGE, S.SELF_SUSTAIN, S.LATE_GAME_SCALING, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Jaina", nicknames: ["Jaina"], role: "Mage", specialties: [S.BURST_DAMAGE, S.AOE_DAMAGE, S.SOFT_CC, S.WAVECLEAR, S.SPELL_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Kael'thas", nicknames: ["Kael'thas", "Kaelthas"], role: "Mage", specialties: [S.BURST_DAMAGE, S.AOE_DAMAGE, S.SPELL_DAMAGE, S.WAVECLEAR, S.HARD_CC], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Kel'Thuzad", nicknames: ["Kel'Thuzad", "KelThuzad"], role: "Mage", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.SPELL_DAMAGE, S.AOE_DAMAGE, S.HARD_CC, S.LATE_GAME_SCALING, S.SNOWBALL], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Li-Ming", nicknames: ["Li-Ming", "LiMing"], role: "Mage", specialties: [S.BURST_DAMAGE, S.POKE, S.SPELL_DAMAGE, S.MOBILITY, S.SNOWBALL], effectiveRange: ER.LONG_RANGE },
  { name: "Mephisto", nicknames: ["Mephisto"], role: "Mage", specialties: [S.AOE_DAMAGE, S.SPELL_DAMAGE, S.SUSTAINED_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Nazeebo", nicknames: ["Nazeebo"], role: "Mage", specialties: [S.AOE_DAMAGE, S.SPELL_DAMAGE, S.WAVECLEAR, S.SUSTAINED_DAMAGE, S.LATE_GAME_SCALING, S.ZONING], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Orphea", nicknames: ["Orphea"], role: "Mage", specialties: [S.BURST_DAMAGE, S.SPELL_DAMAGE, S.MOBILITY, S.SELF_SUSTAIN, S.SUSTAINED_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Tassadar", nicknames: ["Tassadar"], role: "Mage", specialties: [S.SPELL_DAMAGE, S.SUSTAINED_DAMAGE, S.WAVECLEAR, S.POKE, S.ZONING], effectiveRange: ER.EXTREME_RANGE },

  // ==================== DPS / ASSASSINS ====================
  { name: "Maiev", nicknames: ["Maiev"], role: "DPS", specialties: [S.ENGAGE, S.MOBILITY, S.PICK_POTENTIAL, S.AOE_DAMAGE, S.COUNTERPICK], effectiveRange: ER.SHORT_RANGE },
  { name: "The Butcher", nicknames: ["The Butcher", "TheButcher", "Butcher"], role: "DPS", specialties: [S.PICK_POTENTIAL, S.BURST_DAMAGE, S.SNOWBALL, S.AUTO_ATTACK, S.SELF_SUSTAIN, S.LATE_GAME_SCALING], effectiveRange: ER.MELEE },
  { name: "Cassia", nicknames: ["Cassia"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SUSTAINED_DAMAGE, S.DAMAGE_MITIGATION, S.POKE, S.COUNTERPICK], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Falstad", nicknames: ["Falstad"], role: "DPS", specialties: [S.GLOBAL_PRESENCE, S.SUSTAINED_DAMAGE, S.MOBILITY, S.WAVECLEAR, S.POKE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Fenix", nicknames: ["Fenix"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.WAVECLEAR], effectiveRange: ER.LONG_RANGE },
  { name: "Gall", nicknames: ["Gall"], role: "DPS", specialties: [S.CHEESE, S.SUSTAINED_DAMAGE, S.LATE_GAME_SCALING], effectiveRange: ER.LONG_RANGE },
  { name: "Genji", nicknames: ["Genji"], role: "DPS", specialties: [S.MOBILITY, S.BURST_DAMAGE, S.PICK_POTENTIAL, S.FINISHER, S.COUNTERPICK], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Greymane", nicknames: ["Greymane"], role: "DPS", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.SUSTAINED_DAMAGE, S.AUTO_ATTACK, S.CAMP_TAKING, S.PERCENT_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Hanzo", nicknames: ["Hanzo"], role: "DPS", specialties: [S.BURST_DAMAGE, S.POKE, S.WAVECLEAR, S.ZONING, S.HARD_CC], effectiveRange: ER.LONG_RANGE },
  { name: "Junkrat", nicknames: ["Junkrat"], role: "DPS", specialties: [S.AOE_DAMAGE, S.WAVECLEAR, S.POKE, S.SIEGE_PUSHING, S.ZONING, S.DISENGAGE, S.SUSTAINED_DAMAGE], effectiveRange: ER.EXTREME_RANGE },
  { name: "Lunara", nicknames: ["Lunara"], role: "DPS", specialties: [S.SUSTAINED_DAMAGE, S.POKE, S.SOFT_CC, S.MOBILITY, S.WAVECLEAR], effectiveRange: ER.LONG_RANGE },
  { name: "Malthael", nicknames: ["Malthael"], role: "DPS", specialties: [S.PERCENT_DAMAGE, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.WAVECLEAR, S.CAMP_TAKING], effectiveRange: ER.MELEE },
  { name: "Nova", nicknames: ["Nova"], role: "DPS", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.STEALTH, S.POKE, S.COUNTERPICK, S.CHEESE], effectiveRange: ER.LONG_RANGE },
  { name: "Qhira", nicknames: ["Qhira"], role: "DPS", specialties: [S.ENGAGE, S.BURST_DAMAGE, S.MOBILITY, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.FINISHER], effectiveRange: ER.SHORT_RANGE },
  { name: "Raynor", nicknames: ["Raynor"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.DISENGAGE, S.WAVECLEAR, S.CAMP_TAKING], effectiveRange: ER.LONG_RANGE },
  { name: "Samuro", nicknames: ["Samuro"], role: "DPS", specialties: [S.SPLIT_PUSHING, S.STEALTH, S.MOBILITY, S.CAMP_TAKING, S.DOUBLE_SOAKING], effectiveRange: ER.MELEE },
  { name: "Sgt. Hammer", nicknames: ["Sgt. Hammer", "SgtHammer", "Hammer"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SIEGE_PUSHING, S.SUSTAINED_DAMAGE, S.WAVECLEAR, S.ZONING, S.CHEESE], effectiveRange: ER.EXTREME_RANGE },
  { name: "Sylvanas", nicknames: ["Sylvanas"], role: "DPS", specialties: [S.SPLIT_PUSHING, S.WAVECLEAR, S.SUSTAINED_DAMAGE, S.OBJECTIVE_CONTROL, S.SIEGE_PUSHING, S.MOBILITY], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Thrall", nicknames: ["Thrall"], role: "DPS", specialties: [S.ENGAGE, S.HARD_CC, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN], effectiveRange: ER.SHORT_RANGE },
  { name: "Tracer", nicknames: ["Tracer"], role: "DPS", specialties: [S.MOBILITY, S.SUSTAINED_DAMAGE, S.PICK_POTENTIAL, S.FINISHER, S.AUTO_ATTACK, S.COUNTERPICK], effectiveRange: ER.SHORT_RANGE },
  { name: "Tychus", nicknames: ["Tychus"], role: "DPS", specialties: [S.AUTO_ATTACK, S.PERCENT_DAMAGE, S.SUSTAINED_DAMAGE, S.COUNTERPICK], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Valeera", nicknames: ["Valeera"], role: "DPS", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.STEALTH, S.HARD_CC, S.ANTI_DIVE, S.COUNTERPICK, S.CHEESE], effectiveRange: ER.MELEE },
  { name: "Valla", nicknames: ["Valla"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SUSTAINED_DAMAGE, S.BURST_DAMAGE, S.PERCENT_DAMAGE, S.MOBILITY, S.LATE_GAME_SCALING], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Zagara", nicknames: ["Zagara"], role: "DPS", specialties: [S.WAVECLEAR, S.SUSTAINED_DAMAGE, S.SPLIT_PUSHING, S.ZONING, S.SIEGE_PUSHING], effectiveRange: ER.LONG_RANGE },
  { name: "Zarya", nicknames: ["Zarya"], role: "DPS", specialties: [S.UTILITY_SUPPORT, S.SUSTAINED_DAMAGE, S.DAMAGE_MITIGATION, S.SHIELDS, S.ANTI_DIVE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Zeratul", nicknames: ["Zeratul"], role: "DPS", specialties: [S.BURST_DAMAGE, S.PICK_POTENTIAL, S.STEALTH, S.MOBILITY, S.LATE_GAME_SCALING, S.COUNTERPICK], effectiveRange: ER.MELEE },
  { name: "Zul'jin", nicknames: ["Zul'jin", "Zuljin"], role: "DPS", specialties: [S.AUTO_ATTACK, S.SUSTAINED_DAMAGE, S.SELF_SUSTAIN, S.LATE_GAME_SCALING, S.PERCENT_DAMAGE], effectiveRange: ER.LONG_RANGE },

  // ==================== SPECIALISTS ====================
  { name: "Abathur", nicknames: ["Abathur"], role: "Specialist", specialties: [S.DOUBLE_SOAKING, S.GLOBAL_PRESENCE, S.SPLIT_PUSHING, S.MACRO_SHOTCALLING, S.SIEGE_PUSHING], effectiveRange: ER.EXTREME_RANGE },
  { name: "Gazlowe", nicknames: ["Gazlowe"], role: "Specialist", specialties: [S.WAVECLEAR, S.SIEGE_PUSHING, S.ZONING, S.OBJECTIVE_CONTROL, S.CAMP_TAKING, S.HARD_CC, S.SUSTAINED_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "The Lost Vikings", nicknames: ["The Lost Vikings", "TLV", "Lost Vikings"], role: "Specialist", specialties: [S.DOUBLE_SOAKING, S.SPLIT_PUSHING, S.WAVECLEAR, S.CHEESE, S.MACRO_SHOTCALLING], effectiveRange: ER.MELEE },
  { name: "Medivh", nicknames: ["Medivh"], role: "Specialist", specialties: [S.UTILITY_SUPPORT, S.ZONING, S.MACRO_SHOTCALLING, S.DAMAGE_MITIGATION, S.MOBILITY, S.SUSTAINED_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
  { name: "Murky", nicknames: ["Murky"], role: "Specialist", specialties: [S.SPLIT_PUSHING, S.CHEESE, S.WAVECLEAR, S.SIEGE_PUSHING, S.DOUBLE_SOAKING], effectiveRange: ER.SHORT_RANGE },
  { name: "Probius", nicknames: ["Probius"], role: "Specialist", specialties: [S.ZONING, S.AOE_DAMAGE, S.WAVECLEAR, S.SIEGE_PUSHING, S.CHEESE, S.BURST_DAMAGE], effectiveRange: ER.MEDIUM_RANGE },
];

export const ALL_MAPS: HotsMap[] = [
  //                                    global, obj, wave, pick, team, split, siege
  new HotsMap("Alterac Pass",              1,    2,    2,    1,    2,    3,     1),
  new HotsMap("Battlefield of Eternity",   1,    2,    1,    2,    3,    1,     1),
  new HotsMap("Braxis Holdout",            1,    3,    3,    1,    2,    1,     1),
  new HotsMap("Cursed Hollow",             3,    2,    2,    2,    2,    2,     1),
  new HotsMap("Dragon Shire",              3,    3,    2,    1,    2,    2,     1),
  new HotsMap("Garden of Terror",          1,    3,    2,    1,    2,    2,     1),
  new HotsMap("Infernal Shrines",          1,    2,    3,    2,    3,    1,     1),
  new HotsMap("Sky Temple",               3,    3,    2,    2,    2,    1,     1),
  new HotsMap("Tomb of the Spider Queen", 1,    2,    3,    2,    2,    1,     1),
  new HotsMap("Towers of Doom",           2,    2,    1,    3,    2,    2,     2),
  new HotsMap("Volskaya Foundry",         1,    3,    2,    2,    3,    1,     2),
];

export function findHeroByName(name: string): Hero | undefined {
  const lower = name.toLowerCase();
  return ALL_HEROES.find(h =>
    h.nicknames.some(n => n.toLowerCase() === lower) ||
    h.name.toLowerCase() === lower
  );
}

export function getHeroesByRole(role: string): Hero[] {
  if (role === 'All') return ALL_HEROES;
  if (role === 'DPS') {
    return ALL_HEROES.filter(h => h.role === 'DPS' || h.role === 'Ranged Assassin' || h.role === 'Melee Assassin');
  }
  return ALL_HEROES.filter(h => h.role === role);
}
