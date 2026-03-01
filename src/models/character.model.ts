export type GameState =
  | 'INIT'
  | 'GENRE_SELECT'
  | 'MECHANICS_GENERATION'
  | 'STAT_ALLOCATION'
  | 'BACKSTORY_INPUT'
  | 'CHARACTER_GENERATION'
  | 'GAME_ACTIVE'
  | 'ERROR';

export type ActiveTab = 'CREATION' | 'GAME' | 'SHEET' | 'WORLD' | 'CREATOR';

export interface MechanicTemplate {
  setting_context: string;
  mechanic_template: 'D20_System' | '2D6_System';
  roll_formula: string;
  diceType: string;
  statPointPool: number;
  stats: string[];
  skills: string[];
  stressResource: string;
}

export interface Faction {
  id: string;
  name: string;
  agenda: string;
  relationshipToPlayer: number;
}

export interface Npc {
  id: string;
  name: string;
  role: string;
  goal: string;
  memory: string[];
  dispositionToPlayer: number;
  locationId: string;
}

export interface WorldLocation {
  id: string;
  name: string;
  description: string;
  danger: number;
  connectedTo: string[];
}

export interface WorldState {
  day: number;
  activeLocationId: string;
  locations: WorldLocation[];
  factions: Faction[];
  npcs: Npc[];
  globalFlags: string[];
  questLog: string[];
}

export interface CharacterSheet {
  name: string;
  backstory: string;
  class: string;
  hp: {
    current: number;
    max: number;
  };
  stats: Record<string, number>;
  skills: Record<string, number>;
  inventory: string[];
  experience: number;
  level: number;
  stress: number;
}

export interface CreatorWorldBlueprint {
  title: string;
  genre: string;
  tone: string;
  factions: string[];
  locations: string[];
  starterConflict: string;
  ruleModules: string[];
  introHook: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  rollResult?: RollResult;
}

export interface RollResult {
  roll: string;
  dice: number[];
  total: number;
  success?: boolean;
}
