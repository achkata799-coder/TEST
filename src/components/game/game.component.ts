import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { ChatTerminalComponent } from '../chat-terminal/chat-terminal.component';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, ChatTerminalComponent, CharacterSheetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (character() && mechanics() && world()) {
    <div class="space-y-3">
      <div class="grid md:grid-cols-3 gap-3">
        <div class="md:col-span-2 bg-slate-800/70 rounded border border-slate-700 p-3">
          <p class="text-xs uppercase tracking-wide text-cyan-300">Current Objective</p>
          <p class="text-slate-200">{{currentObjective()}}</p>
        </div>
        <div class="bg-rose-900/30 rounded border border-rose-700 p-3">
          <p class="text-xs uppercase tracking-wide text-rose-300">Campaign Stakes</p>
          <p class="text-slate-200">Permadeath and persistent consequences are enabled.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[72vh]">
        <div class="lg:col-span-2"><app-chat-terminal /></div>
        <div><app-character-sheet [character]="character()!" [mechanics]="mechanics()!" /></div>
      </div>
    </div>
  } @else {
    <div class="p-6 bg-slate-800 rounded border border-slate-700">Create a character to start gameplay.</div>
  }
  `,
})
export class GameComponent {
  private service = inject(CharacterService);
  character = this.service.character;
  mechanics = this.service.mechanics;
  world = this.service.world;
  currentObjective = this.service.currentObjective;
}
