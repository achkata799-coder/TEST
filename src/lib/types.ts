export type SessionMode = 'story' | 'campaign';

export type ActionType = 'narrate' | 'speak' | 'command' | 'system' | 'attack' | 'skill' | 'cast';

export interface DiceResult {
  formula: string;
  total: number;
  rolls: number[];
  detail?: string;
}

export interface StoryMessage {
  id: string;
  speaker: 'player' | 'ai' | 'rules' | 'system';
  title?: string;
  content: string;
  tags?: string[];
  dice?: DiceResult;
  timestamp: string;
}

export interface ResourceTrack {
  id: string;
  label: string;
  current: number;
  max: number;
  type: 'hp' | 'mp' | 'xp' | 'custom';
}

export interface Character {
  id: string;
  name: string;
  ancestry: string;
  class: string;
  level: number;
  portrait: string;
  stats: Record<string, number>;
  resources: ResourceTrack[];
  conditions: string[];
  notes: string;
}

export interface PartySummary {
  initiative: { name: string; value: number }[];
  members: Array<Pick<Character, 'id' | 'name'> & { hp: ResourceTrack }>;
}

export interface QuestStage {
  id: string;
  description: string;
  status: 'locked' | 'active' | 'complete' | 'failed';
}

export interface Quest {
  id: string;
  title: string;
  summary: string;
  urgency: 'story' | 'faction' | 'ticking';
  stages: QuestStage[];
}

export interface ClockTrack {
  id: string;
  label: string;
  value: number;
  max: number;
  threat: 'none' | 'brewing' | 'dire';
}

export interface WorldState {
  location: string;
  timeOfDay: string;
  sceneTag: string;
  fronts: ClockTrack[];
  rumors: string[];
}

export interface SessionInfo {
  campaignName: string;
  world: string;
  gmPersona: string;
  tags: string[];
  connectedPlayers: number;
  maxPlayers: number;
}

export interface ModeConfig {
  id: SessionMode;
  label: string;
  description: string;
  prompts: string[];
  highlights: string[];
}

export interface ActionTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  actionType: ActionType;
  preferredMode: SessionMode;
}
