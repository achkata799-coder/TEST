// Fix: Implementing the character creation component with a multi-step form, state management, and inline template.
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { ValidationService } from '../../services/validation.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-creation',
  template: `
    <div class="p-4 md:p-6 space-y-6">
      @switch (gameState()) {
        @case ('INIT') {
          <h2 class="text-2xl font-bold text-cyan-200">Start Your Adventure</h2>
          <p class="text-slate-400">Let's create your character. First, what kind of world do you want to play in?</p>
        }
        @case ('GENRE_SELECT') {
          <h2 class="text-2xl font-bold text-cyan-200">1. Choose Your Genre</h2>
          <form [formGroup]="genreForm" (ngSubmit)="submitGenre()" class="space-y-4">
            <div>
              <label for="genre" class="block text-sm font-medium text-slate-300 mb-1">Genre</label>
              <input formControlName="genre" id="genre" type="text" placeholder="e.g., Cyberpunk, High Fantasy, Space Opera"
                     class="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
            </div>
            <button type="submit" [disabled]="genreForm.invalid"
                    class="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
              Generate Game Rules
            </button>
          </form>
        }
        @case ('MECHANICS_GENERATION') {
          <div class="flex flex-col items-center justify-center space-y-4 p-8">
            <app-loading-spinner></app-loading-spinner>
            <p class="text-slate-400">Generating a unique ruleset for your adventure...</p>
          </div>
        }
        @case ('STAT_ALLOCATION') {
          <h2 class="text-2xl font-bold text-cyan-200">2. Allocate Your Stats</h2>
          <p class="text-slate-400">Distribute your points to define your character's core strengths and weaknesses.</p>
          @if (mechanics(); as mechs) {
            <form [formGroup]="statsForm" (ngSubmit)="submitStats()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (stat of objectKeys(statsForm.controls); track stat) {
                  <div class="bg-slate-800 p-3 rounded-md">
                    <label [for]="stat" class="flex justify-between items-center text-lg font-semibold text-slate-200 mb-1">
                      <span>{{ stat }}</span>
                      <span class="text-cyan-400">{{ statsForm.get(stat)?.value }}</span>
                    </label>
                    <input [formControlName]="stat" [id]="stat" type="range" min="8" max="18" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                  </div>
                }
              </div>
              <div class="mt-4 p-3 bg-slate-900/50 rounded-md text-center">
                <p class="text-lg font-semibold" [class.text-cyan-400]="remainingPoints() === 0" [class.text-amber-400]="remainingPoints() !== 0">
                  Points Remaining: {{ remainingPoints() }}
                </p>
                <p class="text-sm text-slate-500">You must spend all {{ pointPool() }} points.</p>
              </div>
              <button type="submit" [disabled]="statsForm.invalid"
                      class="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
                Confirm Stats
              </button>
            </form>
          }
        }
        @case ('BACKSTORY_INPUT') {
          <h2 class="text-2xl font-bold text-cyan-200">3. Write Your Backstory</h2>
          <p class="text-slate-400">Describe your character's history. Who are they? Where do they come from? What motivates them?</p>
          <form [formGroup]="backstoryForm" (ngSubmit)="submitBackstory()" class="space-y-4">
            <div>
              <label for="backstory" class="block text-sm font-medium text-slate-300 mb-1">Backstory</label>
              <textarea formControlName="backstory" id="backstory" rows="6"
                        class="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="e.g., A former royal guard, exiled after being framed for a crime they didn't commit..."></textarea>
            </div>
            <button type="submit" [disabled]="backstoryForm.invalid"
                    class="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
              Generate Character Sheet
            </button>
          </form>
        }
        @case ('CHARACTER_GENERATION') {
          <div class="flex flex-col items-center justify-center space-y-4 p-8">
            <app-loading-spinner></app-loading-spinner>
            <p class="text-slate-400">Fleshing out your character based on your story...</p>
          </div>
        }
        @case ('ERROR') {
          <div class="p-4 bg-rose-900/50 border border-rose-700 text-rose-300 rounded-md">
            <h3 class="font-bold">An Error Occurred</h3>
            <p>Something went wrong while generating content. Please try again or start over.</p>
          </div>
        }
      }
    </div>
  `,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationComponent {
    characterService = inject(CharacterService);
    private validationService = inject(ValidationService);
    private fb = inject(FormBuilder);
  
    gameState = this.characterService.gameState;
    mechanics = this.characterService.mechanics;
    pointPool = computed(() => this.characterService.mechanics()?.statPointPool ?? 0);
    
    genreForm: FormGroup;
    statsForm!: FormGroup;
    backstoryForm: FormGroup;
    
    remainingPoints = signal(0);
  
    constructor() {
      // Set the initial state for creation
      if (this.characterService.gameState() === 'INIT') {
        this.characterService.gameState.set('GENRE_SELECT');
      }

      this.genreForm = this.fb.group({
        genre: ['High Fantasy', Validators.required]
      });
      this.backstoryForm = this.fb.group({
        backstory: ['', [Validators.required, Validators.minLength(20)]]
      });
  
      effect(() => {
        const mechs = this.mechanics();
        if (mechs) {
          const controls: { [key: string]: any } = {};
          mechs.stats.forEach(stat => {
              controls[stat] = [8, [Validators.min(8), Validators.max(18)]];
          });
          this.statsForm = this.fb.group(controls, {
              validators: this.validationService.createStatAllocationValidator(this.pointPool())
          });
          this.updateRemainingPoints();
          this.statsForm.valueChanges.subscribe(() => this.updateRemainingPoints());
        }
      });
    }
  
    submitGenre() {
      if (this.genreForm.valid) {
        this.characterService.generateMechanics(this.genreForm.value.genre);
      }
    }
  
    private updateRemainingPoints() {
      if (!this.statsForm) return;
      const totalPointsSpent = Object.keys(this.statsForm.controls).reduce((acc, key) => {
          const statValue = this.statsForm.get(key)?.value || 8;
          return acc + this.getPointCostForStat(statValue);
        }, 0);
      this.remainingPoints.set(this.pointPool() - totalPointsSpent);
    }
  
    private getPointCostForStat(value: number): number {
      let cost = 0;
      for (let i = 9; i <= value; i++) {
        if (i <= 13) { cost += 1; } 
        else if (i <= 15) { cost += 2; } 
        else { cost += 3; }
      }
      return cost;
    }
  
    objectKeys(obj: object | undefined | null): string[] {
      return obj ? Object.keys(obj) : [];
    }
  
    submitStats() {
      if (this.statsForm.valid) {
        this.characterService.setStats(this.statsForm.value);
      }
    }
  
    submitBackstory() {
      if (this.backstoryForm.valid) {
        this.characterService.generateCharacter(this.backstoryForm.value.backstory);
      }
    }
}
