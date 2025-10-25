// Fix: Defining the core data models for the application.
export type GameState =
  | 'INIT'
  | 'GENRE_SELECT'
  | 'MECHANICS_GENERATION'
  | 'STAT_ALLOCATION'
  | 'BACKSTORY_INPUT'
  | 'CHARACTER_GENERATION'
  | 'GAME_ACTIVE'
  | 'ERROR';

export type ActiveTab = 'CREATION' | 'GAME' | 'SHEET';

export interface MechanicTemplate {
  setting_context: string;
  mechanic_template: 'D20_System' | '2D6_System';
  roll_formula: string;
  diceType: string;
  statPointPool: number;
  stats: string[];
  skills: string[];
}

export interface CharacterSheet {
  name: string;
  backstory: string;
  class: string;
  hp: {
    current: number;
    max: number;
  };
  stats: { [key: string]: number };
  skills: { [key: string]: number };
  inventory: string[];
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