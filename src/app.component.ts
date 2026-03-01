import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from './services/character.service';
import { UiService } from './services/ui.service';
import { CreationComponent } from './components/creation/creation.component';
import { GameComponent } from './components/game/game.component';
import { SheetComponent } from './components/sheet/sheet.component';
import { WorldStateComponent } from './components/world-state/world-state.component';
import { CreatorStudioComponent } from './components/creator-studio/creator-studio.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CreationComponent, GameComponent, SheetComponent, WorldStateComponent, CreatorStudioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6">
    <header class="mb-6 border-b border-slate-700 pb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-cyan-400">WorldAI</h1>
        <p class="text-slate-400">AI storytelling + tabletop mechanics. Singleplayer live, multiplayer infrastructure staged.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded" [class]="statusInfo().class">{{statusInfo().text}}</span>
        <button class="px-3 py-2 bg-rose-600 rounded" (click)="reset()">Reset</button>
      </div>
    </header>

    <nav class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      @for (tab of tabs; track tab) {
        <button class="rounded px-3 py-2 border border-slate-700" [class.bg-cyan-700]="activeTab()===tab" (click)="ui.setActiveTab(tab)">{{tab}}</button>
      }
    </nav>

    @switch (activeTab()) {
      @case ('CREATION') { <app-creation /> }
      @case ('GAME') { <app-game /> }
      @case ('SHEET') { <app-sheet /> }
      @case ('WORLD') { <app-world-state /> }
      @case ('CREATOR') { <app-creator-studio /> }
    }
  </div>
  `,
})
export class AppComponent {
  service = inject(CharacterService);
  ui = inject(UiService);

  activeTab = this.ui.activeTab;
  gameState = this.service.gameState;
  tabs = ['CREATION', 'GAME', 'SHEET', 'WORLD', 'CREATOR'] as const;

  statusInfo = computed(() => {
    const state = this.gameState();
    if (state === 'GAME_ACTIVE') return { text: 'ADVENTURE ACTIVE', class: 'bg-emerald-700' };
    if (state === 'ERROR') return { text: 'ERROR', class: 'bg-rose-700' };
    return { text: `SETUP: ${state}`, class: 'bg-amber-700' };
  });

  reset(): void {
    this.service.reset();
  }
}
