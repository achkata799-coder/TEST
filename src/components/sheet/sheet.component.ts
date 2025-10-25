// Fix: Converting component to standalone with an inline template, resolving property access errors.
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sheet',
  template: `
@if (character() && mechanics()) {
  <app-character-sheet [character]="character()!" [mechanics]="mechanics()!"></app-character-sheet>
} @else {
  <p class="text-center p-8 text-slate-400">Character sheet not available.</p>
}
  `,
  imports: [CommonModule, CharacterSheetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetComponent {
  characterService = inject(CharacterService);

  character = this.characterService.character;
  mechanics = this.characterService.mechanics;
}
