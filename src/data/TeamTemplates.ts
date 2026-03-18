export interface TeamTemplate {
  name: string;
  heroes: string[];
  description: string;
  winCondition: string;
  recommendedMaps: string[];
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
  {
    name: 'Dive',
    heroes: ["Anub'arak", 'Uther', 'Greymane', 'Genji', 'Dehaka'],
    description: 'Aggressive dive composition that targets the enemy backline',
    winCondition: 'Dive the enemy backline, burst carries before healing kicks in',
    recommendedMaps: ['Tomb of the Spider Queen', 'Infernal Shrines', 'Dragon Shire'],
  },
  {
    name: 'Poke/Siege',
    heroes: ['Johanna', 'Anduin', 'Hanzo', 'Li-Ming', 'Sylvanas'],
    description: 'Long range poke with structure pressure',
    winCondition: 'Poke from range, take structures, avoid hard engages',
    recommendedMaps: ['Towers of Doom', 'Sky Temple', 'Battlefield of Eternity'],
  },
  {
    name: 'Macro/Split',
    heroes: ['Muradin', 'Rehgar', 'Falstad', 'Ragnaros', 'Abathur'],
    description: 'Global presence and split push pressure',
    winCondition: 'Split the map, apply global pressure, force bad rotations',
    recommendedMaps: ['Garden of Terror', 'Dragon Shire'],
  },
  {
    name: 'Teamfight',
    heroes: ['E.T.C.', 'Anduin', 'Jaina', "Kael'thas", 'Sonya'],
    description: 'Strong 5v5 teamfight composition with CC and AoE',
    winCondition: 'Group for objectives, use CC + AoE combos to win fights',
    recommendedMaps: ['Infernal Shrines', 'Volskaya Foundry', 'Cursed Hollow'],
  },
  {
    name: 'Pick Comp',
    heroes: ['Diablo', 'Uther', 'Zeratul', 'Hanzo', 'Thrall'],
    description: 'Find and burst isolated enemies for 4v5 advantages',
    winCondition: 'Roam together, find isolated targets, force number advantages',
    recommendedMaps: ['Cursed Hollow', 'Sky Temple', 'Towers of Doom'],
  },
  {
    name: 'Sustain',
    heroes: ['Johanna', 'Alexstrasza', 'Fenix', 'Lunara', 'Dehaka'],
    description: 'Outlast through superior healing and self-sustain',
    winCondition: 'Take long fights, outheal and outlast enemy resources',
    recommendedMaps: ['Braxis Holdout', 'Battlefield of Eternity', 'Dragon Shire'],
  },
  {
    name: 'Late Game',
    heroes: ['Muradin', 'Anduin', 'Valla', 'Nazeebo', 'Azmodan'],
    description: 'Scale to late game where your heroes outvalue',
    winCondition: 'Play safe early, farm stacks, outscale in late game',
    recommendedMaps: ['Garden of Terror', 'Towers of Doom', 'Cursed Hollow'],
  },
  {
    name: 'Snowball',
    heroes: ['Garrosh', 'Kharazim', 'Kerrigan', 'Jaina', 'Falstad'],
    description: 'Dominate early game and push the advantage',
    winCondition: 'Win early fights, push tempo, end before enemy scales',
    recommendedMaps: ['Braxis Holdout', 'Tomb of the Spider Queen', 'Infernal Shrines'],
  },
];
