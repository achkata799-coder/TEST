// Fix: Implementing the chat terminal component with inline template and styles.
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-chat-terminal',
  template: `
    <div class="flex flex-col h-full bg-slate-900/60 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <div class="px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <h2 class="text-lg font-semibold text-cyan-300">Hawkins Operations Console</h2>
        <p class="text-sm text-slate-400 mt-1">{{ decisionPrompt() }}</p>
      </div>

      @if (errorMessage(); as error) {
        <div class="px-4 py-3 text-sm bg-rose-900/40 border-b border-rose-800/70 text-rose-200 flex items-start justify-between gap-3" role="alert" aria-live="polite">
          <span class="leading-snug">{{ error }}</span>
          <button type="button"
                  (click)="dismissError()"
                  class="shrink-0 px-3 py-1 rounded-md bg-rose-700/60 hover:bg-rose-700 text-rose-50 text-xs font-semibold uppercase tracking-wide">
            Dismiss
          </button>
        </div>
      }

      @if (availableChoices().length) {
        <div class="px-4 py-3 border-b border-slate-800 bg-slate-900/70">
          <p class="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mb-2">Suggested actions</p>
          <div class="flex flex-wrap gap-2">
            @for (choice of availableChoices(); track choice) {
              <button type="button"
                      (click)="chooseOption(choice)"
                      [disabled]="isModelTyping()"
                      class="px-3 py-2 text-sm rounded-full border border-cyan-700/60 bg-cyan-900/40 text-cyan-100 hover:bg-cyan-800/60 hover:border-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {{ choice }}
              </button>
            }
          </div>
        </div>
      }

      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-950/70 to-slate-900">
        @for (message of chatHistory(); track $index) {
          @switch (message.role) {
            @case ('system') {
              <div class="text-center text-xs text-slate-500 italic space-y-2">
                <p>{{ message.content }}</p>
                @if (message.rollResult; as roll) {
                  <div class="font-mono bg-slate-900/70 border border-slate-700 rounded-md p-3 text-slate-300 shadow-inner">
                    <p>Roll: {{ roll.roll }} | Dice: [{{ roll.dice.join(', ') }}] | <span class="font-semibold">Total: {{ roll.total }}</span></p>
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
                <div class="order-2 max-w-xl text-right">
                  <div class="inline-block bg-cyan-800/70 text-cyan-100 rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow">
                    <div [innerHTML]="formatMessage(message.content)" class="text-left leading-relaxed"></div>
                  </div>
                  <p class="text-[0.65rem] text-slate-500 mt-1">{{ message.timestamp | date:'shortTime' }}</p>
                </div>
                <div class="order-1 flex-shrink-0 h-9 w-9 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-300" title="Player">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            }
            @case ('model') {
              <div class="flex justify-start items-end gap-3">
                <div class="flex-shrink-0 h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-300" title="Game Master">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div class="max-w-xl">
                  <div class="inline-block bg-slate-800/70 text-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow">
                    <div [innerHTML]="formatMessage(message.content)" class="leading-relaxed"></div>
                  </div>
                  <p class="text-[0.65rem] text-slate-500 mt-1">{{ message.timestamp | date:'shortTime' }}</p>
                </div>
              </div>
            }
          }
        }
        @if (isModelTyping()) {
          <div class="flex justify-start items-center gap-3">
            <div class="flex-shrink-0 h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-300" title="Game Master">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div class="bg-slate-800/70 text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <app-loading-spinner aria-label="Game Master is responding"></app-loading-spinner>
            </div>
          </div>
        }
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-900/80">
        <form (ngSubmit)="sendMessage()" class="space-y-3" autocomplete="off">
          <div class="flex flex-col gap-2">
            <label for="userInput" class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Custom action</label>
            <textarea [(ngModel)]="userInput" name="userInput" id="userInput" rows="3"
                      class="w-full resize-none bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
                      placeholder="Type your move (e.g., 'Sneak past the guards' or '/roll GRIT')."
                      [disabled]="isModelTyping()"></textarea>
            <p class="text-[0.65rem] text-slate-500">Need inspiration? Select one of the suggested actions above or craft your own command. Use <code class="font-mono bg-slate-800 px-1 rounded">/roll STAT</code> for dice checks.</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button type="submit"
                    [disabled]="!userInput().trim() || isModelTyping()"
                    class="inline-flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg uppercase tracking-wide text-xs transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Send Action
            </button>
          </div>
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
  availableChoices = this.characterService.availableChoices;
  decisionPrompt = this.characterService.decisionPrompt;
  errorMessage = this.characterService.errorMessage;
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

  chooseOption(choice: string) {
    this.userInput.set(choice);
    this.sendMessage();
  }

  dismissError() {
    this.characterService.clearError();
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
    const lines = content.split(/\r?\n/);
    const html: string[] = [];
    let listMode: 'ol' | 'ul' | null = null;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (!trimmed) {
        if (listMode) {
          html.push(`</${listMode}>`);
          listMode = null;
        }
        html.push('<div class="h-2"></div>');
        continue;
      }

      const orderedMatch = rawLine.match(/^\s*\d+[\).\-\s]+(.+)$/);
      if (orderedMatch) {
        if (listMode !== 'ol') {
          if (listMode) {
            html.push(`</${listMode}>`);
          }
          html.push('<ol class="list-decimal pl-5 space-y-1">');
          listMode = 'ol';
        }
        html.push(`<li>${this.applyInlineFormatting(this.escapeHtml(orderedMatch[1].trim()))}</li>`);
        continue;
      }

      const bulletMatch = rawLine.match(/^\s*[-*•]\s+(.+)$/);
      if (bulletMatch) {
        if (listMode !== 'ul') {
          if (listMode) {
            html.push(`</${listMode}>`);
          }
          html.push('<ul class="list-disc pl-5 space-y-1">');
          listMode = 'ul';
        }
        html.push(`<li>${this.applyInlineFormatting(this.escapeHtml(bulletMatch[1].trim()))}</li>`);
        continue;
      }

      if (listMode) {
        html.push(`</${listMode}>`);
        listMode = null;
      }

      html.push(`<p class="leading-relaxed">${this.applyInlineFormatting(this.escapeHtml(trimmed))}</p>`);
    }

    if (listMode) {
      html.push(`</${listMode}>`);
    }

    return html.join('');
  }

  private applyInlineFormatting(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1 bg-slate-900/80 rounded">$1</code>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
