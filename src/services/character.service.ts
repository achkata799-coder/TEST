// Fix: Implementing the CharacterService to manage all application state.
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { GameState, MechanicTemplate, CharacterSheet, ChatMessage } from '../models/character.model';
import { GeminiService } from './gemini.service';
import { PromptBuilderService } from './prompt-builder.service';
import { RulesEngineService } from './rules-engine.service';
import { UiService } from './ui.service';
import { ValidationService } from './validation.service';

const MAX_SUGGESTED_CHOICES = 5;

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private geminiService = inject(GeminiService);
  private promptBuilder = inject(PromptBuilderService);
  private rulesEngine = inject(RulesEngineService);
  private uiService = inject(UiService);
  private validationService = inject(ValidationService);

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
  availableChoices = signal<string[]>(this.getDefaultChoices());
  decisionPrompt = signal<string>('Choose how your Hawkins adventure begins.');
  errorMessage = signal<string | null>(null);

  constructor() {
    // When character is created, set up the game
    effect(() => {
      const char = this.character();
      const mechs = this.mechanics();
      if (char && mechs) {
        this.gameState.set('GAME_ACTIVE');
        const systemInstruction = this.promptBuilder.getSystemInstruction(char, mechs);
        this.geminiService.startChat(systemInstruction);
        this.uiService.setActiveTab('GAME');
        this.addMessageToChat({ role: 'system', content: `The adventure for ${char.name} begins...`, timestamp: new Date()});
      }
    });

    // React to chat updates to keep choices in sync with the latest narration.
    effect(() => {
      const history = this.chatHistory();
      const currentState = this.gameState();

      if (!history.length) {
        this.updateAvailableChoices(this.getDefaultChoices(currentState));
        this.updateDecisionPrompt(currentState, false);
        return;
      }

      const lastModelMessage = [...history]
        .reverse()
        .find(message => message.role === 'model' && message.content.trim().length);

      if (!lastModelMessage) {
        this.updateAvailableChoices(this.getDefaultChoices(currentState));
        this.updateDecisionPrompt(currentState, false);
        return;
      }

      const extracted = this.extractChoices(lastModelMessage.content);
      if (extracted.length) {
        this.updateAvailableChoices(extracted);
        this.updateDecisionPrompt(currentState, true);
      } else {
        this.updateAvailableChoices(this.getDefaultChoices(currentState));
        this.updateDecisionPrompt(currentState, false);
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
    this.availableChoices.set(this.getDefaultChoices('INIT'));
    this.decisionPrompt.set('Choose how your Hawkins adventure begins.');
    this.errorMessage.set(null);
    this.gameState.set('GENRE_SELECT'); // Go back to the beginning
  }

  async generateMechanics(genre: string) {
    this.gameState.set('MECHANICS_GENERATION');
    this.genre.set(genre);
    this.errorMessage.set(null);
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
      this.errorMessage.set('We could not prepare the rules reference. Please try selecting a genre again.');
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
    this.errorMessage.set(null);
    const mechs = this.mechanics();
    const stats = this.stats();
    if (!mechs) {
      console.error('Cannot generate character without mechanics.');
      this.errorMessage.set('Character creation is missing mechanics. Restart the flow to try again.');
      this.gameState.set('ERROR');
      return;
    }
    try {
      const prompt = this.promptBuilder.getCharacterPrompt(mechs, stats, backstory);
      const result = await this.geminiService.generateCharacter(prompt, mechs);
      this.character.set(result);
    } catch (error) {
      console.error('Error generating character:', error);
      this.errorMessage.set('Generating your hero failed. Give it another shot or tweak the backstory.');
      this.gameState.set('ERROR');
    }
  }

  async sendChatMessage(message: string) {
    if (this.isModelTyping()) return;

    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    this.errorMessage.set(null);
    this.addMessageToChat({ role: 'user', content: trimmed, timestamp: new Date() });
    this.isModelTyping.set(true);

    // Check for roll commands
    const rollCommand = this.rulesEngine.parseRollCommand(trimmed);
    if (rollCommand && this.mechanics() && this.character()) {
      const result = this.rulesEngine.executeRoll(rollCommand, this.mechanics()!, this.character()!);
      this.addMessageToChat({
        role: 'system',
        content: `Rolling ${result.roll}...`,
        rollResult: result,
        timestamp: new Date()
      });

      const gameMasterPrompt = this.promptBuilder.getGameMasterPromptWithRoll(trimmed, result);
      this.streamResponse(gameMasterPrompt);
    } else {
      this.streamResponse(trimmed);
    }
  }

  clearError() {
    this.errorMessage.set(null);
  }

  private streamResponse(prompt: string) {
    this.addMessageToChat({ role: 'model', content: '', timestamp: new Date() }); // Add empty message bubble
    this.geminiService.sendMessageStream(
      prompt,
      (chunk) => {
        this.chatHistory.update(history => {
            const lastMessage = history[history.length-1];
            if(lastMessage.role === 'model') {
                lastMessage.content += chunk;
            }
            return [...history];
        });
      },
      () => {
        this.isModelTyping.set(false);
      },
      (err) => {
        console.error('Error during chat stream:', err);
        this.addMessageToChat({ role: 'system', content: 'Sorry, an error occurred.', timestamp: new Date()});
        this.errorMessage.set('The connection to the Hawkins Harbinger faltered. Check your network and try again.');
      }
    );
  }

  private addMessageToChat(message: Omit<ChatMessage, 'timestamp'> & { timestamp?: Date }) {
    const messageWithTimestamp: ChatMessage = {
      ...message,
      timestamp: message.timestamp || new Date(),
    };
    this.chatHistory.update(history => [...history, messageWithTimestamp]);
  }

  private updateAvailableChoices(choices: string[]) {
    const deduplicated = Array.from(new Set(choices.map(choice => choice.trim()))).filter(Boolean).slice(0, MAX_SUGGESTED_CHOICES);
    const current = this.availableChoices();

    if (
      deduplicated.length !== current.length ||
      deduplicated.some((choice, index) => choice !== current[index])
    ) {
      this.availableChoices.set(deduplicated);
    }
  }

  private updateDecisionPrompt(state: GameState, hasExtractedOptions: boolean) {
    if (state === 'GAME_ACTIVE') {
      this.decisionPrompt.set(
        hasExtractedOptions
          ? 'Select a move or type your own instructions to steer the scene.'
          : 'Describe your next move or choose a suggestion to guide the encounter.'
      );
      return;
    }

    if (state === 'GENRE_SELECT' || state === 'STAT_ALLOCATION' || state === 'BACKSTORY_INPUT') {
      this.decisionPrompt.set('Work through the creation steps to ready your character for play.');
      return;
    }

    this.decisionPrompt.set('Choose how your Hawkins adventure begins.');
  }

  private extractChoices(content: string): string[] {
    const lines = content.split(/\r?\n/);
    const extracted: string[] = [];

    for (const line of lines) {
      const orderedMatch = line.match(/^\s*\d+[\).\-\s]+(.+)$/);
      if (orderedMatch) {
        extracted.push(this.cleanChoiceText(orderedMatch[1]));
        continue;
      }

      const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);
      if (bulletMatch) {
        extracted.push(this.cleanChoiceText(bulletMatch[1]));
        continue;
      }
    }

    return extracted.filter(Boolean).slice(0, MAX_SUGGESTED_CHOICES);
  }

  private cleanChoiceText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`/g, '')
      .replace(/[_~]/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .trim();
  }

  private getDefaultChoices(state: GameState = this.gameState()): string[] {
    if (state === 'GAME_ACTIVE') {
      return [
        'Survey the environment for hidden dangers.',
        'Check in with an ally to coordinate a plan.',
        'Use a signature ability or item.',
        'Investigate the strange phenomenon nearby.'
      ];
    }

    if (state === 'BACKSTORY_INPUT') {
      return [
        'Describe a defining childhood memory.',
        'Explain why the Upside Down still haunts you.',
        'Share how you met the other party members.'
      ];
    }

    if (state === 'STAT_ALLOCATION') {
      return [
        'Focus on agility and speed.',
        'Balance stats for a versatile build.',
        'Emphasize grit and resilience.'
      ];
    }

    return [
      'Introduce your character to the scene.',
      'Ask the GM for more details about the surroundings.',
      'Review your current objectives.',
      'Take a cautious moment to plan your approach.'
    ];
  }
}
