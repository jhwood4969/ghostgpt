import type { GhostSettings } from "./storage";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelInfo = {
  id: string;
  owned_by?: string;
};

type StreamHandlers = {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
};

function authHeaders(settings: GhostSettings): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (settings.apiKey.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  }
  return headers;
}

export async function listModels(settings: GhostSettings): Promise<ModelInfo[]> {
  const res = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/models`, {
    headers: authHeaders(settings),
  });
  if (!res.ok) {
    throw new Error(`Models request failed (${res.status})`);
  }
  const data = await res.json();
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return items.map((m: { id?: string; owned_by?: string }) => ({
    id: String(m.id ?? "unknown"),
    owned_by: m.owned_by,
  }));
}

export async function streamChat(
  settings: GhostSettings,
  messages: ChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: authHeaders(settings),
    signal,
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: true,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  if (!res.body) {
    throw new Error("Streaming is not supported by this browser response.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        handlers.onDone();
        return;
      }
      try {
        const json = JSON.parse(payload);
        const token =
          json?.choices?.[0]?.delta?.content ??
          json?.choices?.[0]?.message?.content ??
          "";
        if (token) handlers.onToken(String(token));
      } catch {
        /* skip malformed chunk */
      }
    }
  }

  handlers.onDone();
}

export async function completeChat(
  settings: GhostSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: authHeaders(settings),
    signal,
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: false,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}
