import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterSheet, ChatMessage, CreatorWorldBlueprint, GameState, MechanicTemplate, WorldState } from '../models/character.model';
import { GeminiService } from './gemini.service';
import { RulesEngineService } from './rules-engine.service';
import { UiService } from './ui.service';

const STORAGE_KEY = 'worldai-save-v2';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private ai = inject(GeminiService);
  private rules = inject(RulesEngineService);
  private ui = inject(UiService);

  gameState = signal<GameState>('GENRE_SELECT');
  genre = signal('');
  mechanics = signal<MechanicTemplate | null>(null);
  stats = signal<Record<string, number>>({});
  backstory = signal('');
  character = signal<CharacterSheet | null>(null);
  world = signal<WorldState | null>(null);

  chatHistory = signal<ChatMessage[]>([]);
  isModelTyping = signal(false);
  storyLog = signal<string[]>([]);
  suggestedActions = signal<string[]>([]);

  hasCharacter = computed(() => !!this.character());
  currentObjective = computed(() => this.world()?.questLog[0] ?? 'No objective set');

  constructor() {
    this.restore();
    effect(() => this.persist());
  }

  async generateMechanics(genre: string): Promise<void> {
    this.genre.set(genre);
    this.gameState.set('MECHANICS_GENERATION');
    try {
      const mechanics = await this.ai.generateMechanics(genre);
      this.mechanics.set(mechanics);
      this.gameState.set('STAT_ALLOCATION');
    } catch {
      this.gameState.set('ERROR');
    }
  }

  setStats(stats: Record<string, number>): void {
    this.stats.set(stats);
    this.gameState.set('BACKSTORY_INPUT');
  }

  async generateCharacter(backstory: string): Promise<void> {
    const mechanics = this.mechanics();
    if (!mechanics) return;
    this.gameState.set('CHARACTER_GENERATION');

    const character = await this.ai.generateCharacter(backstory, mechanics, this.stats());
    this.character.set(character);
    this.backstory.set(backstory);

    if (!this.world()) {
      this.world.set(
        this.ai.seedWorld({
          title: 'Default Frontier',
          genre: this.genre(),
          tone: 'Grounded and dangerous',
          factions: ['Wardens', 'Free Traders', 'Black Archive'],
          locations: ['Rustgate', 'Mirror Marsh', 'Shattered Keep'],
          starterConflict: 'A stolen relic destabilizes the region',
          ruleModules: ['Tactical combat', 'Inventory friction', 'Hard consequences'],
          introHook: 'A courier collapses at your feet with a blood-marked map.',
        }),
      );
    }

    const opening = this.ai.narrateTurn('arrive in the region', null, this.world()!);
    this.chatHistory.set([
      { role: 'system', content: 'WorldAI session online (singleplayer). No plot armor: choices have permanent consequences.', timestamp: new Date() },
      { role: 'model', content: opening, timestamp: new Date() },
    ]);
    this.storyLog.set([opening]);
    this.suggestedActions.set(this.ai.suggestActions(this.world()!));

    this.gameState.set('GAME_ACTIVE');
    this.ui.setActiveTab('GAME');
  }

  setWorldBlueprint(input: CreatorWorldBlueprint): void {
    const blueprint = this.ai.generateBlueprint(input);
    this.world.set(this.ai.seedWorld(blueprint));
    this.suggestedActions.set(this.ai.suggestActions(this.world()!));
    this.chatHistory.update((history) => [
      ...history,
      {
        role: 'system',
        content: `Creator published "${blueprint.title}" (${blueprint.genre}) with modules: ${blueprint.ruleModules.join(', ') || 'Core Rules'}`,
        timestamp: new Date(),
      },
    ]);
  }

  async sendChatMessage(message: string): Promise<void> {
    if (this.isModelTyping() || !this.world()) return;
    const mechanics = this.mechanics();
    const character = this.character();
    if (!mechanics || !character) return;

    this.addMessage({ role: 'user', content: message });
    this.isModelTyping.set(true);

    const rollCommand = this.rules.parseRollCommand(message);
    let roll = null;
    if (rollCommand) {
      roll = this.rules.executeRoll(rollCommand, mechanics, character);
      this.addMessage({ role: 'system', content: `Rolled ${roll.roll} => ${roll.total}`, rollResult: roll });
      this.applyMechanicalConsequences(roll);
    }

    this.tickWorld(message, roll?.success);
    const next = this.ai.narrateTurn(message, roll, this.world()!);

    setTimeout(() => {
      this.addMessage({ role: 'model', content: next });
      this.storyLog.update((entries) => [...entries.slice(-19), next]);
      this.suggestedActions.set(this.ai.suggestActions(this.world()!));
      this.isModelTyping.set(false);
    }, 200);
  }

  applySuggestedAction(action: string): void {
    void this.sendChatMessage(action);
  }

  private applyMechanicalConsequences(roll: { success?: boolean }): void {
    this.character.update((char) => {
      if (!char) return char;
      const success = roll.success ?? false;
      const hpDelta = success ? 0 : -1;
      const stressDelta = success ? 0 : 1;
      const xpDelta = success ? 2 : 1;
      const nextXp = char.experience + xpDelta;
      const threshold = char.level * 10;
      const leveled = nextXp >= threshold;

      const updated = {
        ...char,
        hp: { ...char.hp, current: Math.max(0, char.hp.current + hpDelta) },
        stress: Math.max(0, char.stress + stressDelta),
        experience: leveled ? nextXp - threshold : nextXp,
        level: leveled ? char.level + 1 : char.level,
      };

      if (updated.hp.current <= 0) {
        this.addMessage({ role: 'system', content: 'Your character has fallen. This campaign timeline is now marked as failed (permadeath enabled).' });
      }
      return updated;
    });
  }

  private tickWorld(action: string, success?: boolean): void {
    this.world.update((world) => {
      if (!world) return world;
      const day = world.day;
      const factions = world.factions.map((faction, i) => ({
        ...faction,
        relationshipToPlayer: faction.relationshipToPlayer + (success ? (i % 2 === 0 ? 1 : -1) : -1),
      }));

      const npcs = world.npcs.map((npc) => ({
        ...npc,
        memory: [...npc.memory.slice(-4), `Day ${day}: Player chose to ${action}`],
        dispositionToPlayer: npc.dispositionToPlayer + (success ? 1 : -1),
      }));

      const questUpdate = success
        ? `Progress made on objective via: ${action}`
        : `Setback encountered after: ${action}`;

      return {
        ...world,
        day: day + 1,
        factions,
        npcs,
        globalFlags: [...world.globalFlags, `Day ${day}: ${action}`].slice(-20),
        questLog: [world.questLog[0], ...world.questLog.slice(1), questUpdate].slice(-6),
      };
    });
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.gameState.set('GENRE_SELECT');
    this.genre.set('');
    this.mechanics.set(null);
    this.stats.set({});
    this.backstory.set('');
    this.character.set(null);
    this.world.set(null);
    this.chatHistory.set([]);
    this.storyLog.set([]);
    this.suggestedActions.set([]);
    this.ui.setActiveTab('CREATION');
  }

  private addMessage(message: Omit<ChatMessage, 'timestamp'>): void {
    this.chatHistory.update((history) => [...history, { ...message, timestamp: new Date() }]);
  }

  private persist(): void {
    const payload = {
      gameState: this.gameState(),
      genre: this.genre(),
      mechanics: this.mechanics(),
      stats: this.stats(),
      backstory: this.backstory(),
      character: this.character(),
      world: this.world(),
      chatHistory: this.chatHistory(),
      storyLog: this.storyLog(),
      suggestedActions: this.suggestedActions(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private restore(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const save = JSON.parse(raw);
      this.gameState.set(save.gameState ?? 'GENRE_SELECT');
      this.genre.set(save.genre ?? '');
      this.mechanics.set(save.mechanics ?? null);
      this.stats.set(save.stats ?? {});
      this.backstory.set(save.backstory ?? '');
      this.character.set(save.character ?? null);
      this.world.set(save.world ?? null);
      this.storyLog.set(save.storyLog ?? []);
      this.suggestedActions.set(save.suggestedActions ?? []);
      this.chatHistory.set((save.chatHistory ?? []).map((item: ChatMessage) => ({ ...item, timestamp: new Date(item.timestamp) })));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
