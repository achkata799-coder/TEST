// Fix: Implementing the GeminiService to handle all interactions with the Google GenAI API.
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';
import { MechanicTemplate, CharacterSheet } from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chat!: Chat;

  constructor() {
    // Fix: Using process.env.API_KEY as per the requirements.
    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    return JSON.parse(response.text) as MechanicTemplate;
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
    return JSON.parse(response.text) as CharacterSheet;
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
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: any) => void
  ) {
    if (!this.chat) {
      throw new Error('Chat not initialized. Call startChat first.');
    }
    try {
        const stream = await this.chat.sendMessageStream({ message });
        for await (const chunk of stream) {
          onChunk(chunk.text);
        }
    } catch(e) {
        onError(e);
    } finally {
        onComplete();
    }
  }
}