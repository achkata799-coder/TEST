import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PromptBuilderService {
  getMechanicsPrompt(genre: string): string {
    return `Generate mechanics for ${genre}`;
  }
}
