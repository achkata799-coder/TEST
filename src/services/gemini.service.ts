import { Injectable } from '@angular/core';
import { CharacterSheet, CreatorWorldBlueprint, MechanicTemplate, RollResult, WorldState } from '../models/character.model';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  async generateMechanics(genre: string): Promise<MechanicTemplate> {
    const lower = genre.toLowerCase();
    const isNarrativeHeavy = /horror|mystery|slice|drama/.test(lower);

    return {
      setting_context: `${genre} frontier shaped by fragile alliances and old secrets`,
      mechanic_template: isNarrativeHeavy ? '2D6_System' : 'D20_System',
      roll_formula: isNarrativeHeavy ? '2d6 + skill' : '1d20 + modifier',
      diceType: isNarrativeHeavy ? '2d6' : 'd20',
      statPointPool: 27,
      stats: ['Might', 'Finesse', 'Insight', 'Resolve', 'Presence', 'Craft'],
      skills: ['Athletics', 'Stealth', 'Lore', 'Persuasion', 'Survival', 'Medicine', 'Engineering', 'Perception', 'Deception', 'Tactics'],
      stressResource: isNarrativeHeavy ? 'Composure' : 'Focus',
    };
  }

  async generateCharacter(backstory: string, mechanics: MechanicTemplate, stats: Record<string, number>): Promise<CharacterSheet> {
    const coreClass = mechanics.setting_context.toLowerCase().includes('cyber') ? 'Operator' : 'Warden';
    const resolve = stats.Resolve ?? 10;
    const hp = mechanics.mechanic_template === 'D20_System' ? 10 + Math.floor((resolve - 10) / 2) : 8 + Math.floor(resolve / 3);

    const skills = mechanics.skills.reduce<Record<string, number>>((acc, skill, i) => {
      const values = Object.values(stats);
      const base = values[i % values.length] ?? 10;
      acc[skill] = mechanics.mechanic_template === 'D20_System' ? Math.max(-1, Math.floor((base - 10) / 2)) : Math.max(0, Math.floor(base / 3));
      return acc;
    }, {});

    return {
      name: 'Rook Vale',
      class: coreClass,
      backstory,
      hp: { current: hp, max: hp },
      stats,
      skills,
      inventory: ['Field kit', 'Rations x3', 'Faction insignia', 'Keepsake token'],
      level: 1,
      experience: 0,
      stress: 0,
    };
  }

  generateBlueprint(input: CreatorWorldBlueprint): CreatorWorldBlueprint {
    return {
      ...input,
      factions: input.factions.filter(Boolean),
      locations: input.locations.filter(Boolean),
      ruleModules: input.ruleModules.filter(Boolean),
    };
  }

  narrateTurn(action: string, rollResult: RollResult | null, world: WorldState): string {
    const location = world.locations.find((loc) => loc.id === world.activeLocationId);
    const leadNpc = world.npcs.find((npc) => npc.locationId === world.activeLocationId);
    const opener = `Day ${world.day} · ${location?.name ?? 'Unknown Frontier'}`;

    if (rollResult) {
      const outcome = rollResult.success ? 'Success' : 'Complication';
      return `${opener}\n${outcome}: You attempt "${action}" and roll ${rollResult.total}. ${leadNpc?.name ?? 'A nearby witness'} reacts in real time, and the world records this permanently.`;
    }

    return `${opener}\nYou choose to "${action}". The room shifts as alliances update around your decision and NPCs quietly revise their trust in you.`;
  }

  suggestActions(world: WorldState): string[] {
    const location = world.locations.find((loc) => loc.id === world.activeLocationId)?.name ?? 'this area';
    const quest = world.questLog[0] ?? 'stabilize the region';
    return [
      `Investigate ${location} for clues about: ${quest}`,
      `Negotiate with the dominant faction at ${location}`,
      `Scout an exit route and prep a fallback plan`,
      `/roll Perception dc14`,
    ];
  }

  seedWorld(blueprint: CreatorWorldBlueprint): WorldState {
    const locations = blueprint.locations.map((name, idx) => ({
      id: `loc-${idx + 1}`,
      name,
      description: `${name} is a ${blueprint.tone.toLowerCase()} hotspot where tension is always rising.`,
      danger: Math.min(10, 3 + idx),
      connectedTo: idx === 0 ? [] : [`loc-${idx}`],
    }));

    const factions = blueprint.factions.map((name, idx) => ({
      id: `fac-${idx + 1}`,
      name,
      agenda: `${name} wants control over ${blueprint.starterConflict.toLowerCase()}.`,
      relationshipToPlayer: 0,
    }));

    return {
      day: 1,
      activeLocationId: locations[0]?.id ?? 'loc-1',
      locations,
      factions,
      npcs: [
        {
          id: 'npc-1',
          name: 'Marshal Ilya',
          role: 'Fixer',
          goal: 'Keep fragile peace while exploiting rivals',
          memory: [`Campaign opens: ${blueprint.introHook}`],
          dispositionToPlayer: 0,
          locationId: locations[0]?.id ?? 'loc-1',
        },
      ],
      globalFlags: [blueprint.starterConflict, `Modules: ${blueprint.ruleModules.join(', ') || 'Core'}`],
      questLog: [`Primary Objective: ${blueprint.starterConflict}`, `Story Hook: ${blueprint.introHook}`],
    };
  }
}
