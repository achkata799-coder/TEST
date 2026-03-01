import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [CommonModule, CharacterSheetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (character() && mechanics()) {
    <app-character-sheet [character]="character()!" [mechanics]="mechanics()!" />
  } @else {
    <p class="text-slate-400">No character loaded.</p>
  }
  `,
})
export class SheetComponent {
  private service = inject(CharacterService);
  character = this.service.character;
  mechanics = this.service.mechanics;
}
