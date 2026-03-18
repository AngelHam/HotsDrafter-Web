const STORAGE_KEY = 'hotsDrafter-history';

export interface DraftRecord {
  timestamp: string;
  mapName: string;
  firstPickTeam: number;
  team1Picks: string[];
  team2Picks: string[];
  team1Bans: string[];
  team2Bans: string[];
  team1Score: number;
  team2Score: number;
  team1WinCondition: string;
  team2WinCondition: string;
  verdict: string;
}

export function saveDraft(record: DraftRecord): void {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function loadHistory(): DraftRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DraftRecord[];
  } catch {
    return [];
  }
}

export function deleteDraft(index: number): void {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  if (index >= 0 && index < history.length) {
    history.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
