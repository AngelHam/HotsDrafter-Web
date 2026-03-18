export enum Specialty {
  // Core Macro Specialties
  WAVECLEAR = 'WAVECLEAR',
  DOUBLE_SOAKING = 'DOUBLE_SOAKING',
  SPLIT_PUSHING = 'SPLIT_PUSHING',
  SIEGE_PUSHING = 'SIEGE_PUSHING',
  CAMP_TAKING = 'CAMP_TAKING',
  GLOBAL_PRESENCE = 'GLOBAL_PRESENCE',
  MACRO_SHOTCALLING = 'MACRO_SHOTCALLING',

  // Teamfight Specialties
  ENGAGE = 'ENGAGE',
  RE_ENGAGE = 'RE_ENGAGE',
  DISENGAGE = 'DISENGAGE',
  HARD_CC = 'HARD_CC',
  SOFT_CC = 'SOFT_CC',
  BURST_DAMAGE = 'BURST_DAMAGE',
  SUSTAINED_DAMAGE = 'SUSTAINED_DAMAGE',
  AOE_DAMAGE = 'AOE_DAMAGE',
  ANTI_DIVE = 'ANTI_DIVE',
  ANTI_POKE = 'ANTI_POKE',
  POKE = 'POKE',
  FINISHER = 'FINISHER',

  // Survivability & Durability
  SELF_SUSTAIN = 'SELF_SUSTAIN',
  HIGH_DURABILITY = 'HIGH_DURABILITY',
  LOW_DURABILITY = 'LOW_DURABILITY',
  MOBILITY = 'MOBILITY',
  DAMAGE_MITIGATION = 'DAMAGE_MITIGATION',

  // Healing & Support
  BURST_HEALING = 'BURST_HEALING',
  SUSTAINED_HEALING = 'SUSTAINED_HEALING',
  CLEANSE = 'CLEANSE',
  ARMOR_APPLICATION = 'ARMOR_APPLICATION',
  SHIELDS = 'SHIELDS',
  UTILITY_SUPPORT = 'UTILITY_SUPPORT',

  // Pick & Control
  PICK_POTENTIAL = 'PICK_POTENTIAL',
  ZONING = 'ZONING',
  OBJECTIVE_CONTROL = 'OBJECTIVE_CONTROL',
  BOSS_CONTROL = 'BOSS_CONTROL',

  // Damage Profile
  SPELL_DAMAGE = 'SPELL_DAMAGE',
  AUTO_ATTACK = 'AUTO_ATTACK',
  PERCENT_DAMAGE = 'PERCENT_DAMAGE',
  EXECUTE_DAMAGE = 'EXECUTE_DAMAGE',

  // Drafting Niche
  FLEX_PICK = 'FLEX_PICK',
  COUNTERPICK = 'COUNTERPICK',
  SNOWBALL = 'SNOWBALL',
  LATE_GAME_SCALING = 'LATE_GAME_SCALING',
  CHEESE = 'CHEESE',
  STEALTH = 'STEALTH',
}

export function specialtyToString(spec: Specialty): string {
  const map: Record<Specialty, string> = {
    [Specialty.WAVECLEAR]: 'Waveclear',
    [Specialty.DOUBLE_SOAKING]: 'Double Soaking',
    [Specialty.SPLIT_PUSHING]: 'Split Pushing',
    [Specialty.SIEGE_PUSHING]: 'Siege Pushing',
    [Specialty.CAMP_TAKING]: 'Camp Taking / Merc Control',
    [Specialty.GLOBAL_PRESENCE]: 'Global Presence',
    [Specialty.MACRO_SHOTCALLING]: 'Macro Shotcalling Tools',
    [Specialty.ENGAGE]: 'Engage',
    [Specialty.RE_ENGAGE]: 'Re-engage',
    [Specialty.DISENGAGE]: 'Disengage / Peel',
    [Specialty.HARD_CC]: 'Crowd Control (Hard CC)',
    [Specialty.SOFT_CC]: 'Soft CC / Disruption',
    [Specialty.BURST_DAMAGE]: 'Burst Damage',
    [Specialty.SUSTAINED_DAMAGE]: 'Sustained Damage',
    [Specialty.AOE_DAMAGE]: 'AoE Damage',
    [Specialty.ANTI_DIVE]: 'Anti-Dive',
    [Specialty.ANTI_POKE]: 'Anti-Poke',
    [Specialty.POKE]: 'Poke',
    [Specialty.FINISHER]: 'Finisher',
    [Specialty.SELF_SUSTAIN]: 'Self-Sustain',
    [Specialty.HIGH_DURABILITY]: 'High Durability / Frontline Anchor',
    [Specialty.LOW_DURABILITY]: 'Low Durability / Squishy',
    [Specialty.MOBILITY]: 'Mobility / Escape Tools',
    [Specialty.DAMAGE_MITIGATION]: 'Damage Mitigation',
    [Specialty.BURST_HEALING]: 'Burst Healing',
    [Specialty.SUSTAINED_HEALING]: 'Sustained Healing',
    [Specialty.CLEANSE]: 'Cleanse / Debuff Removal',
    [Specialty.ARMOR_APPLICATION]: 'Armor Application',
    [Specialty.SHIELDS]: 'Shields',
    [Specialty.UTILITY_SUPPORT]: 'Utility Support',
    [Specialty.PICK_POTENTIAL]: 'Pick Potential',
    [Specialty.ZONING]: 'Zoning',
    [Specialty.OBJECTIVE_CONTROL]: 'Objective Control',
    [Specialty.BOSS_CONTROL]: 'Boss Control',
    [Specialty.SPELL_DAMAGE]: 'Spell Damage Focus',
    [Specialty.AUTO_ATTACK]: 'Auto-Attack Damage Focus',
    [Specialty.PERCENT_DAMAGE]: 'Percent Damage',
    [Specialty.EXECUTE_DAMAGE]: 'Execute Damage',
    [Specialty.FLEX_PICK]: 'Flex Pick',
    [Specialty.COUNTERPICK]: 'Counterpick',
    [Specialty.SNOWBALL]: 'Snowball Potential',
    [Specialty.LATE_GAME_SCALING]: 'Late-Game Scaling',
    [Specialty.CHEESE]: 'Cheese / Off-Meta Win Condition',
    [Specialty.STEALTH]: 'Stealth / Ambush',
  };
  return map[spec] || 'Unknown';
}
