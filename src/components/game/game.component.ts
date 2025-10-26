// Fix: Converting component to standalone with an inline template, resolving property access errors.
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ChatTerminalComponent } from '../chat-terminal/chat-terminal.component';
import { CommonModule } from '@angular/common';
import { WorldStateComponent } from '../world-state/world-state.component';

@Component({
  selector: 'app-game',
  template: `
@if (character() && mechanics()) {
  <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
    <div class="h-[80vh]">
        <app-chat-terminal class="h-full"></app-chat-terminal>
    </div>
    <div class="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-1 xl:pr-3">
        <app-world-state></app-world-state>
        <app-character-sheet [character]="character()!" [mechanics]="mechanics()!"></app-character-sheet>
    </div>
  </div>
} @else {
    <p>Loading game...</p>
}
  `,
  imports: [CommonModule, CharacterSheetComponent, ChatTerminalComponent, WorldStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent {
  characterService = inject(CharacterService);

  character = this.characterService.character;
  mechanics = this.characterService.mechanics;
}
