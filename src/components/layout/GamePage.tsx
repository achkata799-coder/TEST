'use client';

import SessionNavigator from '@/components/navigation/SessionNavigator';
import StoryLog from '@/components/story/StoryLog';
import ActionComposer from '@/components/story/ActionComposer';
import CharacterPanel from '@/components/hud/CharacterPanel';
import QuestJournal from '@/components/hud/QuestJournal';
import WorldStatePanel from '@/components/hud/WorldStatePanel';
import PartyPanel from '@/components/hud/PartyPanel';
import { useGameStore } from '@/stores/useGameStore';

export default function GamePage() {
  const { mode } = useGameStore();
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <div className="w-full space-y-6 lg:w-64">
        <SessionNavigator />
      </div>
      <div className="flex-1 space-y-6">
        <StoryLog />
        <ActionComposer />
      </div>
      <aside className="w-full space-y-6 lg:w-80">
        <CharacterPanel />
        {mode === 'campaign' && <PartyPanel />}
        <QuestJournal />
        <WorldStatePanel />
      </aside>
    </main>
  );
}
