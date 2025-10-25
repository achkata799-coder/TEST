// Fix: Converting AppComponent to standalone with inline template and styles. This also fixes property access errors on services.
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from './services/character.service';
import { UiService } from './services/ui.service';
import { CreationComponent } from './components/creation/creation.component';
import { GameComponent } from './components/game/game.component';
import { SheetComponent } from './components/sheet/sheet.component';

@Component({
  selector: 'app-root',
  template: `
<div class="min-h-screen bg-slate-900 text-slate-100 font-sans">
  <div class="container mx-auto max-w-7xl p-4">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-700">
      <div>
        <h1 class="text-3xl font-bold text-cyan-400">Gen-RPG</h1>
        <p class="text-slate-400">Your AI-Powered Tabletop Adventure</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-sm">
          <span class="font-semibold text-slate-300">Status:</span>
          <span class="px-2 py-1 rounded-full font-bold text-xs" [class]="statusInfo().class">
            {{ statusInfo().text }}
          </span>
        </div>
        @if (hasCharacter()) {
          <button (click)="resetGame()" class="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-md transition-colors">
            Start Over
          </button>
        }
      </div>
    </header>

    <main>
      @if (hasCharacter()) {
        <div class="mb-4">
          <nav class="flex space-x-1 rounded-lg bg-slate-800 p-1">
            <button (click)="uiService.setActiveTab('GAME')"
                    [class]="activeTab() === 'GAME' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'"
                    class="w-full rounded-md py-2 text-sm font-medium transition-colors">
              Game
            </button>
            <button (click)="uiService.setActiveTab('SHEET')"
                    [class]="activeTab() === 'SHEET' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'"
                    class="w-full rounded-md py-2 text-sm font-medium transition-colors">
              Character Sheet
            </button>
          </nav>
        </div>

        <div [class.hidden]="activeTab() !== 'GAME'">
            <app-game></app-game>
        </div>
        <div [class.hidden]="activeTab() !== 'SHEET'">
            <app-sheet></app-sheet>
        </div>

      } @else {
        <div class="bg-slate-800/50 rounded-lg border border-slate-700">
            <app-creation></app-creation>
        </div>
      }
    </main>

  </div>
</div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CreationComponent,
    GameComponent,
    SheetComponent,
  ]
})
export class AppComponent {
  characterService = inject(CharacterService);
  uiService = inject(UiService);

  // Expose signals to the template
  gameState = this.characterService.gameState;
  activeTab = this.uiService.activeTab;
  hasCharacter = this.characterService.hasCharacter;

  statusInfo = computed(() => {
    const state = this.gameState();
    switch (state) {
      case 'INIT':
      case 'GENRE_SELECT':
      case 'STAT_ALLOCATION':
      case 'BACKSTORY_INPUT':
        return { text: 'IN PROGRESS', class: 'bg-amber-500 text-amber-900' };
      case 'GAME_ACTIVE':
        return { text: 'ACTIVE', class: 'bg-emerald-500 text-emerald-900' };
      default:
        return { text: 'IDLE', class: 'bg-gray-500 text-gray-900' };
    }
  });

  resetGame() {
    if (confirm('Are you sure you want to start over? All progress will be lost.')) {
      this.characterService.reset();
      this.uiService.setActiveTab('CREATION');
    }
  }
}
