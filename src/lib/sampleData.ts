import { ActionTemplate, Character, ModeConfig, PartySummary, Quest, SessionInfo, StoryMessage, WorldState } from './types';

export const defaultSession: SessionInfo = {
  campaignName: 'Echoes of the Azure Verge',
  world: 'Veridian Reach',
  gmPersona: 'Franz, a patient but challenging AI GM',
  tags: ['Story Mode', '5e-compatible', 'PbTA clocks'],
  connectedPlayers: 1,
  maxPlayers: 4,
};

export const modeConfigs: ModeConfig[] = [
  {
    id: 'story',
    label: 'Story Mode',
    description: 'Fiction-first, rules-light improv for solo adventures and quick sessions.',
    prompts: ['Lean into descriptive intent', 'Offer surprising twists', 'Surface soft stats like mood/danger'],
    highlights: ['Freeform input', 'Soft safety rails', 'AI-curated pacing'],
  },
  {
    id: 'campaign',
    label: 'Campaign Mode',
    description: 'Transparent mechanics, 5e-style math, party coordination, and persistent clocks.',
    prompts: ['Call for rolls when stakes matter', 'Reference character sheets', 'Project impending threats'],
    highlights: ['HUD-first', 'Dice results inline', 'Quest + clock automation'],
  },
];

export const sampleCharacter: Character = {
  id: 'pc-ember',
  name: 'Lyra Emberfall',
  ancestry: 'Half-Elf',
  class: 'Lore Bard',
  level: 5,
  portrait: '/portraits/lyra.svg',
  stats: {
    STR: 10,
    DEX: 14,
    CON: 12,
    INT: 13,
    WIS: 15,
    CHA: 18,
  },
  resources: [
    { id: 'hp', label: 'HP', current: 32, max: 38, type: 'hp' },
    { id: 'insp', label: 'Inspiration', current: 1, max: 1, type: 'custom' },
    { id: 'xp', label: 'XP', current: 6500, max: 7000, type: 'xp' },
  ],
  conditions: ['Arcane Resonance (+1 spell damage until rest)'],
  notes:
    'Lyra carries a sentient lute named Cadenza, sworn to reveal the truth behind the Azure Verge incursion.',
};

export const partySummary: PartySummary = {
  initiative: [
    { name: 'Lyra', value: 19 },
    { name: 'Bram', value: 14 },
    { name: 'AI Envoy', value: 12 },
  ],
  members: [
    { id: 'pc-ember', name: 'Lyra Emberfall', hp: { id: 'hp', label: 'HP', current: 32, max: 38, type: 'hp' } },
    { id: 'pc-bram', name: 'Bram the Steadfast', hp: { id: 'hp', label: 'HP', current: 41, max: 41, type: 'hp' } },
  ],
};

export const sampleQuests: Quest[] = [
  {
    id: 'quest-azure',
    title: 'Mend the Azure Verge',
    summary: 'Seal the planar tear seeping emotional magic into the capital.',
    urgency: 'ticking',
    stages: [
      { id: 'stage-1', description: 'Track the Verge back to its anchor point.', status: 'complete' },
      { id: 'stage-2', description: 'Stabilize the empathic lattice beneath the opera house.', status: 'active' },
      { id: 'stage-3', description: 'Negotiate with the Chorus of Echoes for access to the heart shard.', status: 'locked' },
    ],
  },
  {
    id: 'quest-caper',
    title: 'Friends & Fables Pilot Season',
    summary: 'Run a four-session pilot for the co-op campaign experience.',
    urgency: 'story',
    stages: [
      { id: 'stage-1', description: 'Recruit diverse players with different playstyles.', status: 'active' },
      { id: 'stage-2', description: 'Ship AI safety tools and GM dashboards.', status: 'locked' },
    ],
  },
];

export const sampleWorld: WorldState = {
  location: 'Atrium of Echoes, Luminant Spire',
  timeOfDay: 'Third Bell, Blue Hour',
  sceneTag: 'Social Intrigue + Arcane Mystery',
  fronts: [
    { id: 'clock-rift', label: 'Verge Pressure', value: 3, max: 6, threat: 'brewing' },
    { id: 'clock-rival', label: 'Rival Guild Favor', value: 1, max: 4, threat: 'none' },
  ],
  rumors: [
    'The Chorus only responds to music performed with genuine emotion.',
    'Friends & Fables archivists can rewind scenes for Rule of Cool moments.',
  ],
};

export const initialMessages: StoryMessage[] = [
  {
    id: 'msg-1',
    speaker: 'ai',
    title: 'Previously on Echoes of the Azure Verge',
    content:
      'The empathic resonance swirling through the opera house settles as Lyra stands amid floating motes of sound. The AI GM surfaces NPC intents and a faint warning: the Verge pulses with impatience.',
    tags: ['Recap', 'Scene Framing'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    speaker: 'rules',
    content: 'System: Active quest updated → Stage 2 unlocked. Verge Pressure clock advanced to 3/6.',
    tags: ['Quest Updated', 'Clock'],
    timestamp: new Date().toISOString(),
  },
];

export const quickActions: ActionTemplate[] = [
  {
    id: 'look-around',
    label: 'Survey Scene',
    icon: '👁️',
    description: 'Ask the GM for details, clues, or soft moves.',
    actionType: 'narrate',
    preferredMode: 'story',
  },
  {
    id: 'attack',
    label: 'Strike',
    icon: '⚔️',
    description: 'Trigger a weapon attack with auto-calculated rolls.',
    actionType: 'attack',
    preferredMode: 'campaign',
  },
  {
    id: 'skill',
    label: 'Skill Check',
    icon: '🎲',
    description: 'Roll ability + proficiency with context-specific stakes.',
    actionType: 'skill',
    preferredMode: 'campaign',
  },
  {
    id: 'speak',
    label: 'Speak',
    icon: '💬',
    description: 'Deliver dialogue or negotiate with NPCs.',
    actionType: 'speak',
    preferredMode: 'story',
  },
];
