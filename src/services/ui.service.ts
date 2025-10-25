import { Injectable, signal } from '@angular/core';
import { ActiveTab } from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  activeTab = signal<ActiveTab>('CREATION');

  setActiveTab(tab: ActiveTab) {
    this.activeTab.set(tab);
  }
}