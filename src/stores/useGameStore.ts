'use client';

import { create } from 'zustand';
import { initialMessages, modeConfigs, quickActions, sampleCharacter, sampleQuests, sampleWorld, defaultSession, partySummary } from '@/lib/sampleData';
import { ActionTemplate, ActionType, SessionMode, StoryMessage } from '@/lib/types';
import { generateAiResponse, recommendTags, resolveAction } from '@/lib/rules-engine';

interface GameState {
  mode: SessionMode;
  modeBias: number;
  session: typeof defaultSession;
  modes: typeof modeConfigs;
  messages: StoryMessage[];
  character: typeof sampleCharacter;
  quests: typeof sampleQuests;
  world: typeof sampleWorld;
  party: typeof partySummary;
  quickActions: ActionTemplate[];
  sendAction: (intent: string, actionType: ActionType) => void;
  setMode: (mode: SessionMode) => void;
  setModeBias: (value: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'campaign',
  modeBias: 0.65,
  session: defaultSession,
  modes: modeConfigs,
  messages: initialMessages,
  character: sampleCharacter,
  quests: sampleQuests,
  world: sampleWorld,
  party: partySummary,
  quickActions,
  setMode: (mode) => set({ mode }),
  setModeBias: (value) => set({ modeBias: value }),
  sendAction: (intent, actionType) => {
    const timestamp = new Date().toISOString();
    const mode = get().mode;
    const playerMessage: StoryMessage = {
      id: `msg-${Date.now()}-player`,
      speaker: 'player',
      title: 'Player Action',
      content: intent,
      tags: [actionType === 'speak' ? 'Dialogue' : 'Intent'],
      timestamp,
    };

    const resolution = resolveAction(actionType, mode);
    const rulesMessage: StoryMessage | null = resolution.summary
      ? {
          id: `msg-${Date.now()}-rules`,
          speaker: 'rules',
          content: resolution.summary,
          dice: resolution.dice,
          tags: recommendTags(actionType, mode),
          timestamp,
        }
      : null;

    const aiMessage: StoryMessage = {
      id: `msg-${Date.now()}-ai`,
      speaker: 'ai',
      title: mode === 'story' ? 'AI Storyteller' : 'GM Franz',
      content: generateAiResponse(intent, mode),
      tags: mode === 'story' ? ['Narration'] : ['Adjudication'],
      timestamp,
    };

    set((state) => ({
      messages: [...state.messages, playerMessage, ...(rulesMessage ? [rulesMessage] : []), aiMessage],
    }));
  },
}));
