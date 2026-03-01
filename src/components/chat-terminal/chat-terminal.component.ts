import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-chat-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="bg-slate-800 border border-slate-700 rounded-lg h-full flex flex-col">
    <div class="px-4 py-3 border-b border-slate-700 bg-slate-900/40">
      <p class="text-xs text-slate-300">AI Dungeon style freeform input + quick actions. Try narrative commands or explicit dice rolls.</p>
      <p class="text-xs text-cyan-300">Examples: "Sneak through the market", "/roll Stealth dc14", "Talk down the gang leader"</p>
    </div>

    <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-3">
      @for (msg of chatHistory(); track msg.timestamp) {
        <div class="rounded p-3" [class]="msg.role === 'user' ? 'bg-cyan-900/50 ml-8' : msg.role === 'model' ? 'bg-slate-700 mr-8' : 'bg-amber-900/40'">
          <p class="text-sm whitespace-pre-wrap">{{msg.content}}</p>
          <small class="text-slate-400">{{msg.timestamp | date:'shortTime'}}</small>
        </div>
      }
      @if (isModelTyping()) {<p class="text-slate-400 italic">WorldAI is simulating consequences...</p>}
    </div>

    @if (suggestedActions().length) {
      <div class="p-3 border-t border-slate-700 bg-slate-900/40">
        <p class="text-xs text-slate-300 mb-2">Suggested actions</p>
        <div class="flex flex-wrap gap-2">
          @for (action of suggestedActions(); track action) {
            <button type="button" (click)="runSuggested(action)" class="text-xs px-2 py-1 rounded border border-cyan-700 text-cyan-200 hover:bg-cyan-900/40">{{action}}</button>
          }
        </div>
      </div>
    }

    <form (ngSubmit)="sendMessage()" class="p-3 border-t border-slate-700 flex gap-2">
      <input [(ngModel)]="input" name="input" class="flex-1 rounded bg-slate-900 border border-slate-600 px-3 py-2" placeholder="Describe an action..."/>
      <button class="bg-cyan-600 rounded px-3">Send</button>
    </form>
  </div>
  `,
})
export class ChatTerminalComponent {
  private service = inject(CharacterService);
  chatHistory = this.service.chatHistory;
  isModelTyping = this.service.isModelTyping;
  suggestedActions = this.service.suggestedActions;
  input = '';
  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      this.chatHistory();
      setTimeout(() => {
        const el = this.scrollContainer()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  sendMessage(): void {
    const msg = this.input.trim();
    if (!msg) return;
    void this.service.sendChatMessage(msg);
    this.input = '';
  }

  runSuggested(action: string): void {
    void this.service.applySuggestedAction(action);
  }
}
