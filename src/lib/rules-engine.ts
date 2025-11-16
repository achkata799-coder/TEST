import { ActionType, DiceResult, SessionMode } from './types';

const abilityMap: Record<string, number> = {
  STR: 2,
  DEX: 3,
  CON: 1,
  INT: 1,
  WIS: 2,
  CHA: 4,
};

function rollDie(size: number): number {
  return Math.floor(Math.random() * size) + 1;
}

export function rollFormula(formula: string): DiceResult {
  const match = /^(\d*)d(\d+)([+\-]\d+)?$/i.exec(formula.trim());
  if (!match) {
    return { formula, total: 0, rolls: [] };
  }
  const count = Number(match[1] || '1');
  const die = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;
  const rolls = Array.from({ length: count }, () => rollDie(die));
  const total = rolls.reduce((sum, v) => sum + v, 0) + modifier;
  return { formula, total, rolls, detail: modifier ? `${modifier >= 0 ? '+' : ''}${modifier}` : undefined };
}

export function resolveAction(actionType: ActionType, mode: SessionMode): { dice?: DiceResult; summary: string } {
  if (actionType === 'attack') {
    const dice = rollFormula('1d20+7');
    const damage = rollFormula('2d6+4');
    return {
      dice,
      summary: `Attack roll ${dice.total} → ${dice.total >= 15 ? 'hit' : 'miss'}. Damage ${damage.total}.`,
    };
  }

  if (actionType === 'skill') {
    const dice = rollFormula('1d20+5');
    return { dice, summary: `Skill check result ${dice.total} vs DC ${mode === 'story' ? 12 : 15}.` };
  }

  if (actionType === 'cast') {
    const dice = rollFormula('1d20+8');
    return { dice, summary: `Spell attack total ${dice.total}; concentrate to maintain effect.` };
  }

  return { summary: 'Narrative move logged. Awaiting AI narration...' };
}

export function generateAiResponse(intent: string, mode: SessionMode): string {
  if (mode === 'story') {
    return `The AI Storyteller leans into the fiction, weaving your intent — ${intent} — into soft-focus narrative beats.`;
  }
  return `GM Franz processes ${intent} with rule transparency: dice resolved, quest states pending review.`;
}

export function recommendTags(actionType: ActionType, mode: SessionMode): string[] {
  const tags: string[] = [];
  if (actionType === 'attack') tags.push('Combat', 'Roll');
  if (actionType === 'skill') tags.push('Skill Check');
  if (actionType === 'cast') tags.push('Spellcasting');
  if (mode === 'story') tags.push('Fiction-First');
  if (mode === 'campaign') tags.push('Rules');
  return tags;
}

export function abilityBonus(label: string): number {
  return abilityMap[label] ?? 0;
}
