import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { ProgressClock, WorldEvent } from '../../models/character.model';

@Component({
  selector: 'app-world-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-800/50 rounded-lg border border-slate-700 p-4 md:p-6 space-y-5">
      <div class="flex items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <h3 class="text-xl font-semibold text-cyan-400">World State</h3>
          <p class="text-xs text-slate-400">Persistent fiction tracked by the AI Storyteller.</p>
        </div>
        @if (isLoading()) {
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span class="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Updating
          </div>
        }
      </div>

      @if (worldState(); as state) {
        <div class="space-y-5">
          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">Current Scene</h4>
            <p class="text-sm text-slate-300 leading-relaxed">{{ state.sceneSummary }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div class="bg-slate-900/50 rounded-md p-3">
                <p class="text-xs uppercase tracking-wide text-slate-500">Location</p>
                <p class="font-semibold text-cyan-300">{{ state.location }}</p>
              </div>
              <div class="bg-slate-900/50 rounded-md p-3">
                <p class="text-xs uppercase tracking-wide text-slate-500">Tension</p>
                <p class="font-semibold text-amber-300">{{ state.tension }}</p>
              </div>
            </div>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">Active Goals</h4>
            <ul class="space-y-1 text-sm text-slate-300">
              @for (goal of state.activeGoals; track goal) {
                <li class="flex items-start gap-2">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
                  <span>{{ goal }}</span>
                </li>
              } @empty {
                <li class="text-slate-500 italic">No explicit goals logged yet.</li>
              }
            </ul>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">Key NPCs</h4>
            <ul class="space-y-2">
              @for (npc of state.npcs; track npc.name) {
                <li class="bg-slate-900/40 rounded-md p-3 text-sm text-slate-300 space-y-1">
                  <div class="flex justify-between items-baseline gap-2">
                    <span class="font-semibold text-cyan-200">{{ npc.name }}</span>
                    <span class="text-xs uppercase tracking-wide text-slate-500">{{ npc.role }}</span>
                  </div>
                  <p class="text-xs text-slate-400">Disposition: <span class="text-slate-200">{{ npc.disposition }}</span></p>
                  <p class="text-xs text-slate-400">Status: <span class="text-slate-200">{{ npc.status }}</span></p>
                  <p class="text-xs text-slate-400">Motivation: {{ npc.motivation }}</p>
                </li>
              } @empty {
                <li class="text-sm text-slate-500 italic">No notable NPCs recorded.</li>
              }
            </ul>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">Quest Board</h4>
            <ul class="space-y-2">
              @for (quest of state.quests; track quest.title) {
                <li class="bg-slate-900/40 rounded-md p-3 text-sm space-y-1">
                  <div class="flex justify-between items-baseline gap-3">
                    <span class="font-semibold text-cyan-200">{{ quest.title }}</span>
                    <span class="text-xs uppercase tracking-wide bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">{{ quest.status }}</span>
                  </div>
                  <p class="text-slate-300">Progress: {{ quest.progress }}</p>
                  <p class="text-xs text-slate-400">Next: {{ quest.nextStep }}</p>
                </li>
              } @empty {
                <li class="text-sm text-slate-500 italic">No quests are active.</li>
              }
            </ul>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">Progress Clocks</h4>
            <ul class="space-y-2">
              @for (clock of state.clocks; track clock.name) {
                <li class="bg-slate-900/40 rounded-md p-3 text-sm text-slate-300 space-y-1">
                  <div class="flex justify-between items-center gap-2">
                    <span class="font-semibold text-cyan-200">{{ clock.name }}</span>
                    <span class="text-xs font-mono">{{ clock.filled }} / {{ clock.total }}</span>
                  </div>
                  <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-2 bg-rose-500" [style.width.%]="getClockProgress(clock)"></div>
                  </div>
                  <p class="text-xs text-slate-400">Stakes: {{ clock.stakes }}</p>
                </li>
              } @empty {
                <li class="text-sm text-slate-500 italic">No clocks are ticking.</li>
              }
            </ul>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold text-slate-200">World Notes</h4>
            <ul class="space-y-1 text-sm text-slate-300">
              @for (note of state.worldNotes; track note) {
                <li class="flex items-start gap-2">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                  <span>{{ note }}</span>
                </li>
              } @empty {
                <li class="text-slate-500 italic">No lore has been catalogued yet.</li>
              }
            </ul>
          </section>
        </div>
      } @else {
        <div class="text-sm text-slate-400">
          Complete character creation to allow the storyteller to establish the world.
        </div>
      }

      <section class="space-y-2">
        <h4 class="text-lg font-semibold text-slate-200">Recent Events</h4>
        <ul class="space-y-2 text-sm text-slate-300">
          @for (event of worldTimeline(); track trackEvent(event)) {
            <li class="bg-slate-900/40 rounded-md p-3 space-y-1">
              <div class="flex justify-between items-center gap-2">
                <span class="font-semibold text-cyan-200">{{ event.title }}</span>
                @if (event.timestamp) {
                  <span class="text-xs text-slate-500">{{ formatTimestamp(event.timestamp) }}</span>
                }
              </div>
              <p class="text-slate-300">{{ event.outcome }}</p>
              <p class="text-xs text-slate-400">Impact: {{ event.impact }}</p>
            </li>
          } @empty {
            <li class="text-slate-500 italic">No events have been logged yet.</li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class WorldStateComponent {
  private readonly characterService = inject(CharacterService);

  worldState = this.characterService.worldState;
  worldTimeline = this.characterService.worldTimeline;
  isLoading = this.characterService.isWorldStateLoading;

  getClockProgress(clock: ProgressClock): number {
    if (!clock.total) {
      return 0;
    }
    return Math.min(100, Math.max(0, (clock.filled / clock.total) * 100));
  }

  formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }

  trackEvent(event: WorldEvent): string {
    return `${event.title}-${event.outcome}-${event.impact}-${event.timestamp ?? 'na'}`;
  }
}
