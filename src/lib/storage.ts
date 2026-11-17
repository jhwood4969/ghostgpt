const KEY = "ghostgpt.settings.v1";

export type GhostSettings = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

export const DEFAULT_SETTINGS: GhostSettings = {
  // Same-origin GhostGPT AI gateway (Vite proxies /api → server in dev).
  apiBaseUrl: "/api/v1",
  apiKey: "",
  model: "ghost-nano",
  maxTokens: 1024,
  temperature: 0.4,
};

/** Hosted GhostGPT AI does not require a browser key. */
export function requiresBrowserKey(apiBaseUrl: string): boolean {
  const base = apiBaseUrl.trim();
  if (!base || base.startsWith("/")) return false;
  if (base.includes("localhost") || base.includes("127.0.0.1")) return false;
  return true;
}

export function loadSettings(): GhostSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as GhostSettings;
    // Migrate earlier default that pointed at the (often unreachable) public gateway.
    if (parsed.apiBaseUrl === "https://api.ghostgpt.live/v1" && !parsed.apiKey.trim()) {
      parsed.apiBaseUrl = DEFAULT_SETTINGS.apiBaseUrl;
    }
    return parsed;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next: GhostSettings): void {
  localStorage.setItem(KEY, JSON.stringify(next));
}
