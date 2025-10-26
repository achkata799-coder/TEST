// Fix: Implementing the chat terminal component with inline template and styles.
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-chat-terminal',
  template: `
    <div class="flex flex-col h-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-6">
        @for (message of chatHistory(); track $index) {
          @switch (message.role) {
            @case ('system') {
              <div class="text-center text-sm text-slate-500 italic py-2">
                {{ message.content }}
                @if (message.rollResult; as roll) {
                  <div class="font-mono bg-slate-800/50 rounded-md p-2 mt-1 text-slate-300">
                    <p>Roll: {{ roll.roll }} | Dice: [{{ roll.dice.join(', ') }}] | <span class="font-bold">Total: {{ roll.total }}</span></p>
                    @if (roll.success !== undefined) {
                      <p [class.text-emerald-400]="roll.success" [class.text-rose-400]="!roll.success">
                        Outcome: {{ roll.success ? 'Success' : 'Failure' }}
                      </p>
                    }
                  </div>
                }
              </div>
            }
            @case ('user') {
              <div class="flex justify-end items-end gap-3">
                <div class="order-2">
                    <div class="bg-cyan-800/60 text-cyan-100 rounded-lg p-3 max-w-lg rounded-br-none">
                      <p [innerHTML]="formatMessage(message.content)"></p>
                    </div>
                    <p class="text-xs text-slate-500 text-right mt-1">{{ message.timestamp | date:'shortTime' }}</p>
                </div>
                <div class="order-1 flex-shrink-0 h-10 w-10 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-cyan-300" title="Player">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            }
            @case ('model') {
              <div class="flex justify-start items-end gap-3">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-300" title="Game Master">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <div class="bg-slate-700/50 text-slate-200 rounded-lg p-3 max-w-lg prose prose-invert prose-p:my-2 rounded-bl-none">
                      <p [innerHTML]="formatMessage(message.content)"></p>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">{{ message.timestamp | date:'shortTime' }}</p>
                  </div>
              </div>
            }
          }
        }
        @if (isModelTyping()) {
          <div class="flex justify-start items-center gap-3">
            <div class="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-300" title="Game Master">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <div class="bg-slate-700/50 text-slate-200 rounded-lg p-3 max-w-lg rounded-bl-none">
                <app-loading-spinner></app-loading-spinner>
            </div>
          </div>
        }
      </div>
      <div class="p-4 border-t border-slate-700">
        <form (ngSubmit)="sendMessage()" class="flex items-center space-x-2">
          <input [(ngModel)]="userInput" name="userInput"
                 class="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                 placeholder="Type your action or /roll [stat/skill]..."
                 [disabled]="isModelTyping()">
          <button type="submit" [disabled]="!userInput().trim() || isModelTyping()"
                  class="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTerminalComponent {
  characterService = inject(CharacterService);
  
  chatHistory = this.characterService.chatHistory;
  isModelTyping = this.characterService.isModelTyping;
  userInput = signal('');
  
  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
        // Triggered whenever chat history changes
        this.chatHistory();
        this.scrollToBottom();
    });
  }

  sendMessage() {
    const message = this.userInput().trim();
    if (message) {
      this.characterService.sendChatMessage(message);
      this.userInput.set('');
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
        const container = this.scrollContainer()?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
    }, 0);
  }

  formatMessage(content: string): string {
    // Basic markdown for bold and italics.
    // NOTE: In a production app, use a sanitizer or a trusted library
    // to prevent XSS vulnerabilities when using [innerHTML].
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
  }
}