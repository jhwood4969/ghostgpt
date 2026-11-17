const KEY = "ghostgpt.settings.v1";

export type GhostSettings = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

export const DEFAULT_SETTINGS: GhostSettings = {
  apiBaseUrl: "https://api.ghostgpt.live/v1",
  apiKey: "",
  model: "ghost-nano",
  maxTokens: 1024,
  temperature: 0.4,
};

export function loadSettings(): GhostSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next: GhostSettings): void {
  localStorage.setItem(KEY, JSON.stringify(next));
}
