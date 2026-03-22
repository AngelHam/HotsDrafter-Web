export interface DraftReplayStep {
  phase: 'ban' | 'pick';
  team: number;
  hero: string;
  suggestions: Array<{ hero: string; stars: number; reasons: string[] }>;
}

export interface DraftReplayData {
  map: string;
  firstPick: number;
  steps: DraftReplayStep[];
}

export function encodeDraftReplay(data: DraftReplayData): string {
  const json = JSON.stringify(data);
  return btoa(json);
}

export function decodeDraftReplay(encoded: string): DraftReplayData | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}
