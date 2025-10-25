// Fix: Converting component to standalone with an inline template and adding CommonModule for bindings.
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSheet, MechanicTemplate } from '../../models/character.model';

@Component({
  selector: 'app-character-sheet',
  template: `
@if (character(); as char) {
  <div class="bg-slate-800/50 rounded-lg border border-slate-700 p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-700">
      <div>
        <h2 class="text-3xl font-bold text-cyan-300">{{ char.name }}</h2>
        <p class="text-slate-400 text-lg">{{ char.class }}</p>
      </div>
      <!-- HP Bar -->
      <div class="w-full sm:w-64">
        <span class="text-sm font-semibold text-slate-300">Health Points</span>
        <div class="w-full bg-slate-700 rounded-full h-5 mt-1 relative overflow-hidden">
          <div class="bg-rose-500 h-5 rounded-full transition-all duration-500" [style.width.%]="getHealthPercentage()"></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {{ char.hp.current }} / {{ char.hp.max }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Left Column: Stats & Skills -->
      <div class="md:col-span-1 space-y-6">
        <!-- Stats -->
        <div>
          <h3 class="text-xl font-semibold text-cyan-400 mb-3">Statistics</h3>
          <div class="grid grid-cols-2 gap-3">
            @for (stat of objectKeys(char.stats); track stat) {
              <div class="bg-slate-900/50 p-3 rounded-lg text-center">
                <div class="text-sm text-slate-400">{{ stat }}</div>
                <div class="text-2xl font-bold text-white">{{ char.stats[stat] }}</div>
                <div class="text-lg font-bold text-cyan-400">{{ getModifier(char.stats[stat]) }}</div>
              </div>
            }
          </div>
        </div>
        <!-- Skills -->
        <div>
          <h3 class="text-xl font-semibold text-cyan-400 mb-3">Skills</h3>
          <ul class="space-y-2">
            @for (skill of objectKeys(char.skills); track skill) {
              <li class="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md">
                <span class="text-slate-300">{{ skill }}</span>
                <span class="font-bold text-white">{{ char.skills[skill] }}</span>
              </li>
            }
          </ul>
        </div>
      </div>

      <!-- Right Column: Backstory & Inventory -->
      <div class="md:col-span-2 space-y-6">
        <!-- Backstory -->
        <div>
          <h3 class="text-xl font-semibold text-cyan-400 mb-3">Backstory</h3>
          <p class="text-slate-300 bg-slate-900/50 p-4 rounded-lg leading-relaxed">
            {{ char.backstory }}
          </p>
        </div>
        <!-- Inventory -->
        <div>
          <h3 class="text-xl font-semibold text-cyan-400 mb-3">Inventory</h3>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (item of char.inventory; track item) {
              <li class="bg-slate-900/50 px-3 py-2 rounded-md text-slate-300">
                {{ item }}
              </li>
            } @empty {
                <li class="bg-slate-900/50 px-3 py-2 rounded-md text-slate-500 italic">Inventory is empty.</li>
            }
          </ul>
        </div>
      </div>
    </div>
  </div>
} @else {
  <div class="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
    <p class="text-slate-400">No character data available. Go to the creation tab to start.</p>
  </div>
}
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterSheetComponent {
  character = input.required<CharacterSheet>();
  mechanics = input.required<MechanicTemplate>();

  objectKeys(obj: object): string[] {
    return Object.keys(obj);
  }

  getModifier(statValue: number): string {
    const template = this.mechanics().mechanic_template;
    if (template === 'D20_System') {
      const modifier = Math.floor((statValue - 10) / 2);
      return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }
    return `${statValue}`; // For 2D6, the stat value itself is often used directly
  }

  getHealthPercentage() {
    const char = this.character();
    if (!char || char.hp.max === 0) return 0;
    return (char.hp.current / char.hp.max) * 100;
  }
}
