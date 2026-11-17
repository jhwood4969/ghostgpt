import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { completeChat, streamChat } from "../lib/api";
import type { ChatMessage } from "../lib/api";
import { isLikelyNetworkFailure, streamDemoReply } from "../lib/demo";
import { loadSettings, saveSettings } from "../lib/storage";
import type { GhostSettings } from "../lib/storage";

type UiMessage = ChatMessage & { id: string; demo?: boolean };

const STARTERS = [
  "Explain multi-model routing like I'm shipping an API gateway.",
  "Write a TypeScript retry wrapper with exponential backoff.",
  "Draft a secure nginx config for SSE proxying.",
];

export function Chat() {
  const [settings, setSettings] = useState<GhostSettings>(() => loadSettings());
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoBanner, setDemoBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function updateSettings(patch: Partial<GhostSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  async function sendPrompt(prompt: string) {
    const text = prompt.trim();
    if (!text || busy) return;

    setError(null);
    setDemoBanner(false);
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMsg];
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages: ChatMessage[] = history.map(({ role, content }) => ({ role, content }));

    const write = (chunk: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
      );
    };

    try {
      if (!settings.apiKey.trim()) {
        setDemoBanner(true);
        await streamDemoReply(apiMessages, write, controller.signal);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, demo: true } : m)),
        );
      } else {
        try {
          await streamChat(
            settings,
            apiMessages,
            {
              onToken: write,
              onDone: () => undefined,
              onError: (err) => {
                throw err;
              },
            },
            controller.signal,
          );
        } catch (streamErr) {
          if (controller.signal.aborted) throw streamErr;
          // Fallback to non-stream if the gateway rejects SSE
          const full = await completeChat(settings, apiMessages, controller.signal);
          write(full);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (isLikelyNetworkFailure(err) || (err instanceof Error && /failed \(\d+\)/.test(err.message))) {
        setDemoBanner(true);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: "", demo: true } : m)),
        );
        try {
          await streamDemoReply(apiMessages, write, controller.signal);
        } catch {
          setError(err instanceof Error ? err.message : "Request failed");
        }
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendPrompt(input);
  }

  return (
    <div className="workspace chat-workspace">
      <div className="workspace-toolbar">
        <div>
          <h1>Chat</h1>
          <p className="muted">Stream replies from GhostGPT · local history only</p>
        </div>
        <div className="toolbar-actions">
          <label className="model-select">
            <span className="sr-only">Model</span>
            <select
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
              disabled={busy}
            >
              <option value="ghost-nano">ghost-nano</option>
              <option value="ghost-pro">ghost-pro</option>
              <option value="ghost-ultra">ghost-ultra</option>
            </select>
          </label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setMessages([]);
              setError(null);
              setDemoBanner(false);
            }}
            disabled={busy || messages.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {demoBanner && (
        <div className="banner-note" role="status">
          Demo mode — add a <code>ghost_</code> key in Settings or wait for the API gateway to come
          online. Replies below are simulated locally.
        </div>
      )}

      <div className="message-scroll" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Ask anything. Start with a prompt or pick one below.</p>
            <div className="starter-row">
              {STARTERS.map((s) => (
                <button key={s} type="button" className="starter" onClick={() => void sendPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <article key={m.id} className={`bubble ${m.role}`}>
              <header>
                {m.role === "user" ? "You" : "GhostGPT"}
                {m.demo ? <span className="chip">demo</span> : null}
              </header>
              <pre className="bubble-body">{m.content || (busy ? "…" : "")}</pre>
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message GhostGPT…"
          rows={2}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendPrompt(input);
            }
          }}
        />
        <div className="composer-actions">
          {busy ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => abortRef.current?.abort()}
            >
              Stop
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
            Send
          </button>
        </div>
      </form>

      {showSettings && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowSettings(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="settings-title">API settings</h2>
            <p className="muted">Keys stay in this browser. Nothing is uploaded to GhostGPT.live hosting.</p>
            <label className="field">
              <span>API base URL</span>
              <input
                value={settings.apiBaseUrl}
                onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span>API key</span>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                placeholder="ghost_…"
                spellCheck={false}
                autoComplete="off"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Max tokens</span>
                <input
                  type="number"
                  min={64}
                  max={8192}
                  value={settings.maxTokens}
                  onChange={(e) => updateSettings({ maxTokens: Number(e.target.value) || 1024 })}
                />
              </label>
              <label className="field">
                <span>Temperature</span>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
