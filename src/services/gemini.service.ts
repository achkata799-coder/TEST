// Fix: Implementing the GeminiService to handle all interactions with the Google GenAI API.
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';
import { MechanicTemplate, CharacterSheet, WorldState } from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chat!: Chat;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateMechanics(prompt: string): Promise<MechanicTemplate> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            setting_context: { type: Type.STRING },
            mechanic_template: { type: Type.STRING, enum: ['D20_System', '2D6_System'] },
            roll_formula: { type: Type.STRING },
            diceType: { type: Type.STRING },
            statPointPool: { type: Type.INTEGER },
            stats: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['setting_context', 'mechanic_template', 'roll_formula', 'diceType', 'statPointPool', 'stats', 'skills']
        },
      },
    });
    return this.parseResponse<MechanicTemplate>(response);
  }

  async generateCharacter(prompt: string, mechanics: MechanicTemplate): Promise<CharacterSheet> {
    const statProperties: { [key: string]: { type: Type } } = {};
    mechanics.stats.forEach(stat => {
      statProperties[stat] = { type: Type.INTEGER };
    });

    const skillProperties: { [key: string]: { type: Type } } = {};
    mechanics.skills.forEach(skill => {
      skillProperties[skill] = { type: Type.INTEGER };
    });

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            backstory: { type: Type.STRING },
            class: { type: Type.STRING },
            hp: {
              type: Type.OBJECT,
              properties: {
                current: { type: Type.INTEGER },
                max: { type: Type.INTEGER },
              },
              required: ['current', 'max']
            },
            stats: { 
              type: Type.OBJECT,
              properties: statProperties,
              required: mechanics.stats
            },
            skills: { 
              type: Type.OBJECT,
              properties: skillProperties,
              required: mechanics.skills
            },
            inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['name', 'backstory', 'class', 'hp', 'stats', 'skills', 'inventory']
        },
      },
    });
    return this.parseResponse<CharacterSheet>(response);
  }

  startChat(systemInstruction: string) {
    this.chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        }
    });
  }

  async sendMessageStream(
    message: string,
    handlers: {
      onChunk: (chunk: string) => void;
      onComplete?: () => void;
      onError?: (err: unknown) => void;
    }
  ) {
    if (!this.chat) {
      throw new Error('Chat not initialized. Call startChat first.');
    }
    try {
      const stream = await this.chat.sendMessageStream({ message });
      for await (const chunk of stream) {
        if (!chunk?.text) continue;
        handlers.onChunk(chunk.text);
      }
      handlers.onComplete?.();
    } catch (error) {
      handlers.onError?.(error);
    }
  }

  async initializeWorldState(prompt: string): Promise<WorldState> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.worldStateSchema,
      },
    });
    return this.parseResponse<WorldState>(response);
  }

  async updateWorldState(prompt: string): Promise<WorldState> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.worldStateSchema,
      },
    });
    return this.parseResponse<WorldState>(response);
  }

  private parseResponse<T>(response: any): T {
    const text = typeof response.text === 'function' ? response.text() : response.text;
    if (!text || typeof text !== 'string') {
      throw new Error('The model did not return a JSON payload.');
    }
    return JSON.parse(text) as T;
  }

  private worldStateSchema = {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      sceneSummary: { type: Type.STRING },
      tension: { type: Type.STRING },
      activeGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
      worldNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
      npcs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            disposition: { type: Type.STRING },
            status: { type: Type.STRING },
            motivation: { type: Type.STRING },
          },
          required: ['name', 'role', 'disposition', 'status', 'motivation'],
        },
      },
      quests: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            status: { type: Type.STRING },
            progress: { type: Type.STRING },
            nextStep: { type: Type.STRING },
          },
          required: ['title', 'status', 'progress', 'nextStep'],
        },
      },
      clocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            filled: { type: Type.INTEGER },
            total: { type: Type.INTEGER },
            stakes: { type: Type.STRING },
          },
          required: ['name', 'filled', 'total', 'stakes'],
        },
      },
      recentEvents: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            outcome: { type: Type.STRING },
            impact: { type: Type.STRING },
            timestamp: { type: Type.STRING },
          },
          required: ['title', 'outcome', 'impact'],
        },
      },
    },
    required: [
      'location',
      'sceneSummary',
      'tension',
      'activeGoals',
      'worldNotes',
      'npcs',
      'quests',
      'clocks',
      'recentEvents',
    ],
  } as const;
}