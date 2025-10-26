// Fix: Implementing the PromptBuilderService to construct prompts for the Gemini API.
import { Injectable } from '@angular/core';
import {
  MechanicTemplate,
  CharacterSheet,
  RollResult,
  ChatMessage,
  WorldState,
} from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class PromptBuilderService {

  getMechanicsPrompt(genre: string): string {
    return `
      You are a tabletop RPG designer. Create the core mechanics for a game set in a "${genre}" world.
      Your response MUST be a JSON object that adheres to the provided schema.
      
      The mechanics should include:
      - A list of 6 primary stats (e.g., Strength, Dexterity).
      - A list of 10-12 relevant skills (e.g., Athletics, Stealth).
      - A dice rolling system. It MUST be either 'D20_System' (roll a d20 + modifier) or '2D6_System' (roll 2d6 + modifier).
      - Specify the 'roll_formula' (e.g., "1d20 + stat_modifier", "2d6 + skill_points").
      - Specify the dice type string (e.g., "d20", "2d6").
      - A 'statPointPool' for a point-buy system. It should be a number between 25 and 35.

      Example for a fantasy setting:
      {
        "setting_context": "High Fantasy Adventure",
        "mechanic_template": "D20_System",
        "roll_formula": "1d20 + stat_modifier",
        "diceType": "d20",
        "statPointPool": 27,
        "stats": ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"],
        "skills": ["Acrobatics", "Arcana", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Medicine", "Perception", "Persuasion", "Sleight of Hand", "Stealth", "Survival"]
      }
    `;
  }

  getCharacterPrompt(
    mechanics: MechanicTemplate,
    stats: { [key: string]: number },
    backstory: string
  ): string {
    return `
      You are a creative character creator for a tabletop RPG. Based on the provided game mechanics, stats, and backstory, generate a complete and compelling character sheet.
      Your response MUST be a JSON object that adheres to the provided schema.

      Game Mechanics:
      - Setting: ${mechanics.setting_context}
      - System: ${mechanics.mechanic_template}
      - Stats available: ${mechanics.stats.join(', ')}
      - Skills available: ${mechanics.skills.join(', ')}
      
      Player Input:
      - Assigned Stats: ${JSON.stringify(stats)}
      - Backstory Outline: "${backstory}"

      Your task is to:
      1.  Invent a fitting and evocative name and a creative class/role that feels organic to the backstory (e.g., not just "Fighter", but "Exiled Sentinel" or "Clockwork Tinkerer").
      2.  Expand upon the player's backstory outline, turning it into a richer, more detailed paragraph.
      3.  Determine skill points based on the assigned stats. Distribute them logically, reflecting the character's history and role. For D20, a stat of 12 might give 1 point, 14 gives 2, etc. For 2D6, skills might just equal the related stat. Make it feel balanced.
      4.  Calculate max HP based on the system. For a D20 system, this is typically 10 + Constitution modifier. For 2D6, it might be tied to a stat value directly. Set current HP to max.
      5.  Provide a starting inventory of 3-5 items that are not just generic but are relevant to the character's class and backstory. Include at least one item that has a personal, non-mechanical significance.
      6.  Ensure the final 'stats' and 'skills' in the JSON are objects mapping the name to the final numeric value.
    `;
  }

  getSystemInstruction(
    character: CharacterSheet,
    mechanics: MechanicTemplate,
  ): string {
    return `
      You are the Game Master (GM) for an immersive, narrative-driven tabletop RPG. Your goal is to create a living, breathing world for the player.

      **World & Character Context:**
      - **Setting:** ${mechanics.setting_context}.
      - **Player Character:** You are guiding ${character.name}, a ${character.class}.
      - **Character's Past:** ${character.backstory}. Remember this history and weave it into the narrative.
      - **Character's Stats:** ${JSON.stringify(character.stats)}. A high stat means they are very capable; a low stat is a weakness. Describe outcomes accordingly.

      **Your Core Directives as GM:**
      1.  **Be Proactive & Engaging:** Do not be a passive narrator. End every response by giving the player something to react to. Describe an interesting detail, have an NPC ask a question, or introduce a new sight, sound, or smell that prompts action. Never just say "What do you do?".
      2.  **Paint a Vivid Picture:** Use strong, evocative language and appeal to multiple senses (sight, sound, smell, touch). Make the world feel real and tangible.
      3.  **Maintain Continuity:** Remember previous events, locations, and NPC interactions. Your narrative must be consistent.
      4.  **Embody the World:** Roleplay as all Non-Player Characters (NPCs) with distinct personalities and motivations.
      5.  **Interpret Player Actions & Rolls:** The player will tell you what they do and provide you with the results of any dice rolls. Your job is to narrate the consequences. A success should be described with flair, and a failure should lead to interesting, not just punishing, complications.
      6.  **Pacing & Transparency:** Keep your responses concise and focused, typically 1-3 paragraphs. Keep the story moving forward and always surface the mechanical logic—reference relevant stats, DCs, and consequences.
      7.  **Structured Responses:** Every reply must contain the following sections using bold headings:
         - **Narrative:** 1-3 vivid paragraphs describing what unfolds.
         - **Mechanics:** Bullet list summarising notable rules interactions, rolls, and consequences.
         - **Next Moves:** 2-3 evocative prompts or hooks that invite the player to respond without railroading them.

      You will begin by describing the character's immediate surroundings and the situation they find themselves in. Start the adventure now.
    `;
  }

  buildStorytellerPrompt(options: {
    playerMessage: string;
    character: CharacterSheet;
    mechanics: MechanicTemplate;
    worldState: WorldState | null;
    recentMessages: ChatMessage[];
    rollResult?: RollResult;
  }): string {
    const transcript = this.formatTranscript(options.recentMessages);
    const worldSummary = this.describeWorldState(options.worldState);
    const rollContext = this.describeRoll(options.rollResult);

    return `
You are continuing a single-player tabletop RPG session for ${options.character.name}. Maintain continuity and advance the fiction-first story while respecting the game's mechanics.

Current world state snapshot:
${worldSummary}

Recent table conversation:
${transcript || 'No prior transcript exists. This is the opening beat—establish a compelling first scene.'}

Player intent:
"${options.playerMessage}"

Mechanical context:
${rollContext}

Respond in character as the AI Storyteller. Honour the system instructions you were given and follow the exact response structure (Narrative, Mechanics, Next Moves). Make outcomes feel earned, cite the relevant stats or skills, and surface consequences that keep the world evolving.
`;
  }

  getWorldStateInitializationPrompt(
    character: CharacterSheet,
    mechanics: MechanicTemplate
  ): string {
    return `
You are the narrative archivist for a single-player tabletop RPG inspired by D&D 5e and Powered by the Apocalypse. Using the information below, craft the initial persistent world state. Return ONLY JSON that matches the schema afterwards.

Character sheet:
${JSON.stringify(character, null, 2)}

Game mechanics summary:
${JSON.stringify(mechanics, null, 2)}

Expectations:
- Identify the opening location and immediate scene summary.
- Establish current tension level (e.g., calm, rising, volatile).
- List the character's active personal goals and any looming external threats.
- Introduce 2-4 notable NPCs with roles, disposition, status, and motivation.
- Seed at least one quest hook and one progress clock that can escalate the drama.
- Include world notes that capture lore, factions, or truths discovered so far.
- Begin the recentEvents array with a single entry describing how the adventure is kicking off.

Schema (property order must match and arrays may be empty but must be present):
${this.worldStateSchemaDescription}
`;
  }

  getWorldStateUpdatePrompt(
    currentState: WorldState | null,
    recentMessages: ChatMessage[],
    latestNarrative: string
  ): string {
    return `
You are the living campaign journal for this solo tabletop RPG. Update the persistent world state JSON to reflect the latest events while preserving continuity.

Current stored world state (JSON):
${currentState ? JSON.stringify(currentState, null, 2) : 'null'}

Latest GM narration that must be incorporated:
${latestNarrative}

Recent table conversation summary:
${this.formatTranscript(recentMessages) || 'No prior exchanges recorded.'}

Update guidelines:
- Modify only the fields that changed; retain enduring facts.
- Keep arrays sorted by narrative importance and prune obsolete information.
- Append brand-new happenings to recentEvents (latest event last).
- Ensure quests and clocks accurately reflect the new stakes.
- If an NPC's status or disposition changed, update it explicitly.
- Always reflect the player's active goals and any new opportunities or threats.

Return ONLY JSON that conforms to the schema below and nothing else:
${this.worldStateSchemaDescription}
`;
  }

  private describeRoll(rollResult?: RollResult): string {
    if (!rollResult) {
      return 'No dice result was supplied. Resolve the action fiction-first and introduce a roll only if necessary.';
    }

    const outcomeLabel = rollResult.success === undefined
      ? 'Outcome not predetermined; interpret based on fiction and tone.'
      : rollResult.success
        ? 'Outcome: Success. Show how competence shines.'
        : 'Outcome: Failure. Introduce a meaningful twist or complication.';

    return `Roll formula: ${rollResult.roll}
Dice: [${rollResult.dice.join(', ')}]
Total: ${rollResult.total}
${outcomeLabel}`;
  }

  private describeWorldState(worldState: WorldState | null): string {
    if (!worldState) {
      return 'No persistent world state has been recorded yet. Establish the opening scene, key NPCs, and initial stakes.';
    }

    const npcLines = this.formatCollection(worldState.npcs, npc =>
      `- ${npc.name} (${npc.role}) — disposition: ${npc.disposition}; status: ${npc.status}; motivation: ${npc.motivation}`
    , '- No notable NPCs recorded.');

    const questLines = this.formatCollection(worldState.quests, quest =>
      `- ${quest.title} [${quest.status}] — ${quest.progress} | Next: ${quest.nextStep}`
    , '- No quests are active.');

    const clockLines = this.formatCollection(worldState.clocks, clock =>
      `- ${clock.name}: ${clock.filled}/${clock.total} filled — Stakes: ${clock.stakes}`
    , '- No progress clocks are tracking threats yet.');

    const notes = this.formatList(worldState.worldNotes, '- No world notes captured yet.');
    const goals = this.formatList(worldState.activeGoals, '- No explicit player goals logged.');
    const events = this.formatCollection(worldState.recentEvents?.slice(-3), event =>
      `- ${event.title}: ${event.outcome} (Impact: ${event.impact})`
    , '- No events recorded.');

    return `Location: ${worldState.location}
Scene summary: ${worldState.sceneSummary}
Current tension: ${worldState.tension}
Active goals:
${goals}
World notes:
${notes}
Key NPCs:
${npcLines}
Quest board:
${questLines}
Progress clocks:
${clockLines}
Latest beats:
${events}`;
  }

  private formatTranscript(messages: ChatMessage[]): string {
    if (!messages.length) {
      return '';
    }
    return messages
      .map(message => {
        const role = message.role === 'model' ? 'GM' : message.role === 'user' ? 'Player' : 'System';
        const content = this.truncate(message.content.replace(/\s+/g, ' ').trim(), 360);
        const rollSuffix = message.rollResult
          ? ` (Roll ${message.rollResult.roll} ⇒ ${message.rollResult.total}${message.rollResult.success === undefined ? '' : message.rollResult.success ? ' ✓' : ' ✗'})`
          : '';
        return `- ${role}: ${content}${rollSuffix}`;
      })
      .join('\n');
  }

  private formatCollection<T>(items: T[] | undefined, formatter: (item: T) => string, emptyValue: string): string {
    if (!items || items.length === 0) {
      return emptyValue;
    }
    return items.map(formatter).join('\n');
  }

  private formatList(items: string[] | undefined, emptyValue: string): string {
    if (!items || items.length === 0) {
      return emptyValue;
    }
    return items.map(item => `- ${item}`).join('\n');
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength - 1)}…`;
  }

  private readonly worldStateSchemaDescription = `{
  "location": "string",
  "sceneSummary": "string",
  "tension": "string",
  "activeGoals": ["string"],
  "worldNotes": ["string"],
  "npcs": [
    {"name": "string", "role": "string", "disposition": "string", "status": "string", "motivation": "string"}
  ],
  "quests": [
    {"title": "string", "status": "string", "progress": "string", "nextStep": "string"}
  ],
  "clocks": [
    {"name": "string", "filled": "number", "total": "number", "stakes": "string"}
  ],
  "recentEvents": [
    {"title": "string", "outcome": "string", "impact": "string", "timestamp": "ISO-8601 string (optional)"}
  ]
}`;
}