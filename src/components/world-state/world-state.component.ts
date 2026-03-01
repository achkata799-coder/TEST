import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-world-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (world(); as w) {
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-cyan-300">Persistent World State</h2>
      <p>Day {{w.day}} · Active location: {{locationName(w.activeLocationId)}}</p>

      <section class="bg-slate-800 rounded border border-slate-700 p-4">
        <h3 class="font-semibold mb-2">Quest Log</h3>
        <ul class="list-disc list-inside text-sm space-y-1">
          @for (quest of w.questLog; track quest) { <li>{{quest}}</li> }
        </ul>
      </section>

      <section class="bg-slate-800 rounded border border-slate-700 p-4">
        <h3 class="font-semibold mb-2">Location Graph</h3>
        <div class="grid md:grid-cols-2 gap-2 text-sm">
          @for (loc of w.locations; track loc.id) {
            <div class="bg-slate-900 rounded p-2">
              <div class="font-semibold">{{loc.name}} <span class="text-xs text-amber-400">Danger {{loc.danger}}</span></div>
              <div class="text-slate-400">Links: {{linkedNames(loc.connectedTo)}}</div>
            </div>
          }
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-4">
        <section class="bg-slate-800 rounded border border-slate-700 p-4">
          <h3 class="font-semibold mb-2">Factions</h3>
          @for (f of w.factions; track f.id) {
            <div class="text-sm mb-2">{{f.name}} (relation {{f.relationshipToPlayer}}): {{f.agenda}}</div>
          }
        </section>

        <section class="bg-slate-800 rounded border border-slate-700 p-4">
          <h3 class="font-semibold mb-2">NPC Memory</h3>
          @for (n of w.npcs; track n.id) {
            <div class="text-sm mb-2"><strong>{{n.name}}</strong> · {{n.goal}}<br/>Last memory: {{n.memory[n.memory.length-1]}}</div>
          }
        </section>
      </div>

      <section class="bg-slate-800 rounded border border-slate-700 p-4">
        <h3 class="font-semibold mb-2">World Flags</h3>
        <ul class="list-disc list-inside text-sm">
          @for (flag of w.globalFlags; track flag) { <li>{{flag}}</li> }
        </ul>
      </section>
    </div>
  } @else {
    <p class="text-slate-400">No world loaded yet. Configure one in Creator Studio.</p>
  }
  `,
})
export class WorldStateComponent {
  private service = inject(CharacterService);
  world = this.service.world;

  locationName(id: string): string {
    return this.world()?.locations.find((loc) => loc.id === id)?.name ?? id;
  }

  linkedNames(ids: string[]): string {
    if (!ids.length) return 'None';
    return ids.map((id) => this.locationName(id)).join(', ');
  }
}
