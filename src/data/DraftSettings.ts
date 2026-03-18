export enum AnalysisMode {
  Simple = 'Simple',
  Full = 'Full',
}

const STORAGE_KEY = 'hotsDrafter-settings';

export class DraftSettings {
  static useRandomMap = true;
  static selectedMapIndex = -1;
  static currentAnalysisMode: AnalysisMode = AnalysisMode.Full;
  static suggestionCount = 5;
  static firstPickTeam = 1;

  static save(): void {
    if (typeof window === 'undefined') return;
    const data = {
      useRandomMap: this.useRandomMap,
      selectedMapIndex: this.selectedMapIndex,
      currentAnalysisMode: this.currentAnalysisMode,
      suggestionCount: this.suggestionCount,
      firstPickTeam: this.firstPickTeam,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static load(): void {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.useRandomMap !== undefined) this.useRandomMap = data.useRandomMap;
      if (data.selectedMapIndex !== undefined) this.selectedMapIndex = data.selectedMapIndex;
      if (data.currentAnalysisMode !== undefined) this.currentAnalysisMode = data.currentAnalysisMode;
      if (data.suggestionCount !== undefined) this.suggestionCount = data.suggestionCount;
      if (data.firstPickTeam !== undefined) this.firstPickTeam = data.firstPickTeam;
    } catch { /* ignore parse errors */ }
  }

  static reset(): void {
    this.useRandomMap = true;
    this.selectedMapIndex = -1;
    this.currentAnalysisMode = AnalysisMode.Full;
    this.suggestionCount = 5;
    this.firstPickTeam = 1;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
