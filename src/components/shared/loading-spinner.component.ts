
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="flex items-center justify-center space-x-2">
      <div class="h-3 w-3 animate-pulse rounded-full bg-cyan-400"></div>
      <div class="h-3 w-3 animate-pulse rounded-full bg-cyan-400 [animation-delay:0.2s]"></div>
      <div class="h-3 w-3 animate-pulse rounded-full bg-cyan-400 [animation-delay:0.4s]"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {}
