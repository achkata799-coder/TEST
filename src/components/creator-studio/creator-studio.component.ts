import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-creator-studio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-4 p-4 bg-slate-800/50 rounded border border-slate-700">
    <h2 class="text-2xl font-bold text-cyan-300">Creator Studio</h2>
    <p class="text-slate-400">Inspired by campaign builders like Friends & Fables: package factions, locations, hooks, and optional rule modules into reusable world drops.</p>

    <form [formGroup]="form" (ngSubmit)="publish()" class="grid md:grid-cols-2 gap-3">
      <input formControlName="title" placeholder="World title" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"/>
      <input formControlName="genre" placeholder="Genre" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"/>
      <input formControlName="tone" placeholder="Tone" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"/>
      <input formControlName="starterConflict" placeholder="Starter conflict" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"/>
      <input formControlName="introHook" placeholder="Opening hook scene" class="md:col-span-2 rounded bg-slate-900 border border-slate-700 px-3 py-2"/>
      <textarea formControlName="factions" rows="4" placeholder="Factions (one per line)" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"></textarea>
      <textarea formControlName="locations" rows="4" placeholder="Locations (one per line)" class="rounded bg-slate-900 border border-slate-700 px-3 py-2"></textarea>
      <textarea formControlName="ruleModules" rows="3" placeholder="Rule modules (one per line) e.g. Social clocks" class="md:col-span-2 rounded bg-slate-900 border border-slate-700 px-3 py-2"></textarea>
      <button class="md:col-span-2 bg-cyan-600 px-4 py-2 rounded font-semibold" [disabled]="form.invalid">Publish to WorldAI</button>
    </form>
  </div>
  `,
})
export class CreatorStudioComponent {
  private fb = inject(FormBuilder);
  private service = inject(CharacterService);

  form = this.fb.group({
    title: this.fb.nonNullable.control('Echo Frontier', Validators.required),
    genre: this.fb.nonNullable.control('Science Fantasy', Validators.required),
    tone: this.fb.nonNullable.control('High-stakes and morally gray', Validators.required),
    starterConflict: this.fb.nonNullable.control('A truce collapses after an assassination', Validators.required),
    introHook: this.fb.nonNullable.control('A coded distress signal names you as the only trusted courier.', Validators.required),
    factions: this.fb.nonNullable.control('The Oathbound\nThe Circuit Nomads\nThe Hollow Choir', Validators.required),
    locations: this.fb.nonNullable.control('Cinder Port\nThe Prism Wastes\nVault Nine', Validators.required),
    ruleModules: this.fb.nonNullable.control('Tactical combat\nFaction reputation\nInventory attrition'),
  });

  publish(): void {
    const v = this.form.getRawValue();
    this.service.setWorldBlueprint({
      title: v.title,
      genre: v.genre,
      tone: v.tone,
      starterConflict: v.starterConflict,
      introHook: v.introHook,
      factions: v.factions.split('\n').map((x) => x.trim()),
      locations: v.locations.split('\n').map((x) => x.trim()),
      ruleModules: v.ruleModules.split('\n').map((x) => x.trim()),
    });
  }
}
