// Fix: Implementing the RulesEngineService to handle game logic like dice rolls.
import { Injectable } from '@angular/core';
import { MechanicTemplate, CharacterSheet, RollResult } from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class RulesEngineService {

  parseRollCommand(input: string): { skillOrStat: string; dc?: number } | null {
    const rollRegex = /^\/roll\s+([a-zA-Z]+)(?:\s+dc(\d+))?\s*$/i;
    const match = input.match(rollRegex);
    if (!match) {
      return null;
    }
    return {
      skillOrStat: match[1],
      dc: match[2] ? parseInt(match[2], 10) : undefined,
    };
  }

  executeRoll(
    command: { skillOrStat: string; dc?: number },
    mechanics: MechanicTemplate,
    character: CharacterSheet
  ): RollResult {
    const { skillOrStat, dc } = command;
    let modifier = 0;

    const lowerCaseSkillOrStat = skillOrStat.toLowerCase();
    const isSkill = mechanics.skills.some(s => s.toLowerCase() === lowerCaseSkillOrStat);

    if (isSkill) {
      modifier = Object.entries(character.skills).find(([key]) => key.toLowerCase() === lowerCaseSkillOrStat)?.[1] || 0;
    } else { // Assume it's a stat roll
       const statValue = Object.entries(character.stats).find(([key]) => key.toLowerCase() === lowerCaseSkillOrStat)?.[1];
       if (statValue !== undefined) {
          if (mechanics.mechanic_template === 'D20_System') {
            modifier = Math.floor((statValue - 10) / 2);
          } else {
            modifier = 0; // In 2D6, you often roll against the stat, no modifier
          }
       }
    }

    if (mechanics.mechanic_template === 'D20_System') {
      const d20Roll = Math.floor(Math.random() * 20) + 1;
      const total = d20Roll + modifier;
      return {
        roll: `1d20 + ${modifier}`,
        dice: [d20Roll],
        total: total,
        success: dc !== undefined ? total >= dc : undefined,
      };
    } else { // 2D6_System
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2 + modifier;
       return {
        roll: `2d6 + ${modifier}`,
        dice: [die1, die2],
        total: total,
        success: dc !== undefined ? total >= dc : undefined,
      };
    }
  }
}
