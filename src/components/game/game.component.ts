// Fix: Converting component to standalone with an inline template, resolving property access errors.
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ChatTerminalComponent } from '../chat-terminal/chat-terminal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  template: `
@if (character() && mechanics()) {
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 h-[80vh]">
        <app-chat-terminal></app-chat-terminal>
    </div>
    <div class="lg:col-span-1">
        <app-character-sheet [character]="character()!" [mechanics]="mechanics()!"></app-character-sheet>
    </div>
  </div>
} @else {
    <p>Loading game...</p>
}
  `,
  imports: [CommonModule, CharacterSheetComponent, ChatTerminalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent {
  characterService = inject(CharacterService);

  character = this.characterService.character;
  mechanics = this.characterService.mechanics;
}
