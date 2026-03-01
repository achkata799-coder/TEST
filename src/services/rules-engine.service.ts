import { Injectable } from '@angular/core';
import { CharacterSheet, MechanicTemplate, RollResult } from '../models/character.model';

@Injectable({ providedIn: 'root' })
export class RulesEngineService {
  parseRollCommand(input: string): { skillOrStat: string; dc?: number } | null {
    const match = input.match(/^\/roll\s+([a-zA-Z]+)(?:\s+dc\s*(\d+))?\s*$/i);
    if (!match) return null;
    return { skillOrStat: match[1], dc: match[2] ? Number(match[2]) : undefined };
  }

  executeRoll(command: { skillOrStat: string; dc?: number }, mechanics: MechanicTemplate, character: CharacterSheet): RollResult {
    const key = command.skillOrStat.toLowerCase();
    const statEntry = Object.entries(character.stats).find(([name]) => name.toLowerCase() === key);
    const skillEntry = Object.entries(character.skills).find(([name]) => name.toLowerCase() === key);

    const modifier = skillEntry?.[1] ?? (statEntry ? Math.floor((statEntry[1] - 10) / 2) : 0);

    if (mechanics.mechanic_template === 'D20_System') {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + modifier;
      return { roll: `1d20 + ${modifier}`, dice: [d20], total, success: command.dc ? total >= command.dc : undefined };
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2 + modifier;
    return { roll: `2d6 + ${modifier}`, dice: [d1, d2], total, success: command.dc ? total >= command.dc : undefined };
  }
}
