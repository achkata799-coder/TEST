import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold text-cyan-300">WorldAI Playbook Setup</h2>

    @if (state() === 'GENRE_SELECT' || state() === 'MECHANICS_GENERATION') {
      <form [formGroup]="genreForm" (ngSubmit)="submitGenre()" class="space-y-3">
        <label class="block text-sm text-slate-300">Genre</label>
        <input formControlName="genre" class="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2" placeholder="Fantasy, cyberpunk, horror..."/>
        <button class="bg-cyan-600 px-3 py-2 rounded font-semibold" [disabled]="genreForm.invalid || state()==='MECHANICS_GENERATION'">Generate Mechanics</button>
      </form>
    }

    @if (state() === 'STAT_ALLOCATION' && mechanics(); as m) {
      <form [formGroup]="statsForm" (ngSubmit)="submitStats()" class="space-y-3">
        <p class="text-slate-400">Assign each core attribute (8-16).</p>
        @for (stat of m.stats; track stat) {
          <label class="block text-sm">{{stat}} <input type="number" min="8" max="16" [formControlName]="stat" class="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 mt-1"/></label>
        }
        <button class="bg-cyan-600 px-3 py-2 rounded font-semibold">Lock In Stats</button>
      </form>
    }

    @if (state() === 'BACKSTORY_INPUT') {
      <form [formGroup]="backstoryForm" (ngSubmit)="submitBackstory()" class="space-y-3">
        <label class="block text-sm text-slate-300">Backstory</label>
        <textarea formControlName="backstory" rows="6" class="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2"></textarea>
        <button class="bg-cyan-600 px-3 py-2 rounded font-semibold" [disabled]="backstoryForm.invalid">Launch Adventure</button>
      </form>
    }

    @if (state() === 'CHARACTER_GENERATION') {
      <p class="text-slate-400">Compiling your character, world hooks, and opening situation...</p>
    }
  </div>
  `,
})
export class CreationComponent {
  private fb = inject(FormBuilder);
  private service = inject(CharacterService);

  state = this.service.gameState;
  mechanics = this.service.mechanics;

  genreForm = this.fb.group({ genre: this.fb.nonNullable.control('', Validators.required) });
  backstoryForm = this.fb.group({ backstory: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(30)]) });
  statsForm = this.fb.group({});

  constructor() {
    this.syncStatsForm();
  }

  private syncStatsForm() {
    effect(() => {
      const m = this.mechanics();
      if (!m) return;
      const group: Record<string, any> = {};
      m.stats.forEach((stat) => group[stat] = this.fb.nonNullable.control(10, [Validators.required, Validators.min(8), Validators.max(16)]));
      this.statsForm = this.fb.group(group);
    });
  }

  submitGenre(): void { this.service.generateMechanics(this.genreForm.value.genre || 'Fantasy'); }
  submitStats(): void { this.service.setStats(this.statsForm.getRawValue()); }
  submitBackstory(): void { this.service.generateCharacter(this.backstoryForm.value.backstory || ''); }
}
