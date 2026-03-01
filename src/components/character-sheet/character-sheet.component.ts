import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSheet, MechanicTemplate } from '../../models/character.model';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (character(); as c) {
  <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
    <h3 class="text-2xl font-bold text-cyan-300">{{c.name}}</h3>
    <p class="text-slate-300">{{c.class}} · Level {{c.level}} · XP {{c.experience}}</p>
    <p class="text-slate-400">HP {{c.hp.current}}/{{c.hp.max}} · Stress {{c.stress}}</p>

    <div>
      <h4 class="font-semibold mb-2">Stats</h4>
      <div class="grid grid-cols-2 gap-2">
        @for (s of objectKeys(c.stats); track s) {
          <div class="bg-slate-900 rounded px-2 py-1 text-sm flex justify-between"><span>{{s}}</span><span>{{c.stats[s]}}</span></div>
        }
      </div>
    </div>

    <div>
      <h4 class="font-semibold mb-2">Inventory</h4>
      <ul class="text-sm text-slate-300 list-disc list-inside">
        @for (item of c.inventory; track item) { <li>{{item}}</li> }
      </ul>
    </div>
  </div>
  }
  `,
})
export class CharacterSheetComponent {
  character = input.required<CharacterSheet>();
  mechanics = input.required<MechanicTemplate>();
  objectKeys = Object.keys;
}
