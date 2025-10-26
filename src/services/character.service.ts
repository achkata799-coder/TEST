// Fix: Implementing the CharacterService to manage all application state.
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  GameState,
  MechanicTemplate,
  CharacterSheet,
  ChatMessage,
  WorldState,
  WorldEvent,
  RollResult,
} from '../models/character.model';
import { GeminiService } from './gemini.service';
import { PromptBuilderService } from './prompt-builder.service';
import { RulesEngineService } from './rules-engine.service';
import { UiService } from './ui.service';
import { ValidationService } from './validation.service';

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private geminiService = inject(GeminiService);
  private promptBuilder = inject(PromptBuilderService);
  private rulesEngine = inject(RulesEngineService);
  private uiService = inject(UiService);
  private validationService = inject(ValidationService);
  private sessionInitialized = false;

  // Game State
  gameState = signal<GameState>('INIT');
  
  // Character Creation State
  genre = signal<string>('');
  mechanics = signal<MechanicTemplate | null>(null);
  stats = signal<{ [key: string]: number }>({});
  backstory = signal<string>('');
  
  // Character Sheet
  character = signal<CharacterSheet | null>(null);
  hasCharacter = computed(() => this.character() !== null);
  
  // Chat State
  chatHistory = signal<ChatMessage[]>([]);
  isModelTyping = signal(false);

  // Persistent World State
  worldState = signal<WorldState | null>(null);
  worldTimeline = signal<WorldEvent[]>([]);
  isWorldStateLoading = signal(false);

  constructor() {
    // When character is created, set up the game
    effect(() => {
      const char = this.character();
      const mechs = this.mechanics();
      if (char && mechs) {
        if (!this.sessionInitialized) {
          this.sessionInitialized = true;
          this.gameState.set('GAME_ACTIVE');
          const systemInstruction = this.promptBuilder.getSystemInstruction(char, mechs);
          this.geminiService.startChat(systemInstruction);
          this.uiService.setActiveTab('GAME');
          this.addMessageToChat({ role: 'system', content: `The adventure for ${char.name} begins...`, timestamp: new Date() });
          this.initializeWorldState(char, mechs);
        } else if (!this.worldState()) {
          this.initializeWorldState(char, mechs);
        }
      }
    });
  }

  reset() {
    this.gameState.set('INIT');
    this.genre.set('');
    this.mechanics.set(null);
    this.stats.set({});
    this.backstory.set('');
    this.character.set(null);
    this.chatHistory.set([]);
    this.worldState.set(null);
    this.worldTimeline.set([]);
    this.isWorldStateLoading.set(false);
    this.sessionInitialized = false;
    this.gameState.set('GENRE_SELECT'); // Go back to the beginning
  }

  async generateMechanics(genre: string) {
    this.gameState.set('MECHANICS_GENERATION');
    this.genre.set(genre);
    try {
      const prompt = this.promptBuilder.getMechanicsPrompt(genre);
      const result = await this.geminiService.generateMechanics(prompt);
      if (this.validationService.validateMechanicTemplate(result)) {
        this.mechanics.set(result);
        this.gameState.set('STAT_ALLOCATION');
      } else {
        throw new Error('Received invalid mechanic template from API.');
      }
    } catch (error) {
      console.error('Error generating mechanics:', error);
      this.gameState.set('ERROR');
    }
  }

  setStats(stats: { [key: string]: number }) {
    this.stats.set(stats);
    this.gameState.set('BACKSTORY_INPUT');
  }

  async generateCharacter(backstory: string) {
    this.gameState.set('CHARACTER_GENERATION');
    this.backstory.set(backstory);
    const mechs = this.mechanics();
    const stats = this.stats();
    if (!mechs) {
      console.error('Cannot generate character without mechanics.');
      this.gameState.set('ERROR');
      return;
    }
    try {
      const prompt = this.promptBuilder.getCharacterPrompt(mechs, stats, backstory);
      const result = await this.geminiService.generateCharacter(prompt, mechs);
      this.character.set(result);
    } catch (error) {
      console.error('Error generating character:', error);
      this.gameState.set('ERROR');
    }
  }

  sendChatMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || this.isModelTyping()) {
      return;
    }

    const character = this.character();
    const mechanics = this.mechanics();
    if (!character || !mechanics) {
      console.warn('Cannot progress the story without character and mechanics.');
      return;
    }

    this.addMessageToChat({ role: 'user', content: trimmed, timestamp: new Date() });
    this.isModelTyping.set(true);

    let rollResult: RollResult | undefined;
    const rollCommand = this.rulesEngine.parseRollCommand(trimmed);
    if (rollCommand) {
      rollResult = this.rulesEngine.executeRoll(rollCommand, mechanics, character);
      const outcomeLabel =
        rollResult.success === undefined
          ? ''
          : rollResult.success
            ? ' (success)'
            : ' (failure)';
      this.addMessageToChat({
        role: 'system',
        content: `Rolling ${rollResult.roll} → ${rollResult.total}${outcomeLabel}`,
        rollResult,
        timestamp: new Date(),
      });
    }

    const prompt = this.promptBuilder.buildStorytellerPrompt({
      playerMessage: trimmed,
      character,
      mechanics,
      worldState: this.worldState(),
      recentMessages: this.getRecentMessages(8),
      rollResult,
    });

    this.streamResponse(prompt);
  }

  private streamResponse(prompt: string) {
    const createdAt = new Date();
    this.addMessageToChat({ role: 'model', content: '', timestamp: createdAt });
    let aggregated = '';

    this.geminiService.sendMessageStream(prompt, {
      onChunk: (chunk) => {
        aggregated += chunk;
        this.chatHistory.update(history => {
          const updated = [...history];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.role === 'model') {
            lastMessage.content += chunk;
          }
          return updated;
        });
      },
      onComplete: () => {
        this.isModelTyping.set(false);
        if (aggregated.trim()) {
          this.finalizeTurn(aggregated).catch(error => {
            console.error('Error updating world state:', error);
          });
        }
      },
      onError: (err) => {
        console.error('Error during chat stream:', err);
        this.isModelTyping.set(false);
        this.chatHistory.update(history => {
          const updated = [...history];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.role === 'model') {
            lastMessage.content = 'The storyteller falters as arcane interference cuts the scene short. Please try again.';
          }
          return updated;
        });
        this.addMessageToChat({ role: 'system', content: 'Sorry, an error occurred while narrating the story.', timestamp: new Date() });
      },
    });
  }

  private async initializeWorldState(character: CharacterSheet, mechanics: MechanicTemplate) {
    if (this.isWorldStateLoading()) {
      return;
    }
    this.isWorldStateLoading.set(true);
    try {
      const prompt = this.promptBuilder.getWorldStateInitializationPrompt(character, mechanics);
      const state = await this.geminiService.initializeWorldState(prompt);
      this.worldState.set(state);
      this.worldTimeline.set([]);
      this.appendWorldEvents(state.recentEvents);
    } catch (error) {
      console.error('Error initialising world state:', error);
    } finally {
      this.isWorldStateLoading.set(false);
    }
  }

  private async finalizeTurn(modelNarrative: string) {
    if (!modelNarrative.trim()) {
      return;
    }
    try {
      this.isWorldStateLoading.set(true);
      const prompt = this.promptBuilder.getWorldStateUpdatePrompt(
        this.worldState(),
        this.getRecentMessages(8),
        modelNarrative
      );
      const updatedState = await this.geminiService.updateWorldState(prompt);
      this.worldState.set(updatedState);
      this.appendWorldEvents(updatedState.recentEvents);
    } catch (error) {
      console.error('Error updating world state:', error);
    } finally {
      this.isWorldStateLoading.set(false);
    }
  }

  private appendWorldEvents(events: WorldEvent[] | undefined) {
    if (!events || events.length === 0) {
      return;
    }
    this.worldTimeline.update(history => {
      const existing = [...history];
      const seen = new Set(existing.map(event => `${event.title}|${event.outcome}|${event.impact}`));
      const additions = events
        .filter(event => event.title && event.outcome && !seen.has(`${event.title}|${event.outcome}|${event.impact}`))
        .map(event => ({
          ...event,
          timestamp: event.timestamp || new Date().toISOString(),
        }));
      if (!additions.length) {
        return existing;
      }
      return [...existing, ...additions];
    });
  }

  private getRecentMessages(limit = 8): ChatMessage[] {
    const history = this.chatHistory();
    return history.slice(Math.max(0, history.length - limit));
  }

  private addMessageToChat(message: Omit<ChatMessage, 'timestamp'> & { timestamp?: Date }) {
    const messageWithTimestamp: ChatMessage = {
      ...message,
      timestamp: message.timestamp || new Date(),
    };
    this.chatHistory.update(history => [...history, messageWithTimestamp]);
  }
}