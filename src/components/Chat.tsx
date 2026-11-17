"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readSseStream(
  response: Response,
  onDelta: (text: string) => void,
) {
  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const piece = json.choices?.[0]?.delta?.content;
        if (piece) onDelta(piece);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"unknown" | "sample" | "live">("unknown");
  const bottomRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    setInput("");
    const userMsg: Message = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const modeHeader = res.headers.get("X-GhostGPT-Mode");
      if (modeHeader === "live" || modeHeader === "sample") setMode(modeHeader);

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
        } | null;
        throw new Error(
          payload?.message || payload?.error || `Request failed (${res.status})`,
        );
      }

      await readSseStream(res, (piece) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + piece } : m,
          ),
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      setError(message);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
      areaRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="chat-stage">
      <div className="messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty">
            <h2>GhostGPT AI</h2>
            <p>
              Your assistant on Fireworks{" "}
              <strong>gpt-oss-120b</strong>. Ask for code, research, writing, or
              anything you need done.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="who">
                {m.role === "user" ? "You" : "GhostGPT AI"}
              </div>
              <div className="bubble">
                {m.content || (busy ? "" : "…")}
                {busy &&
                  m.role === "assistant" &&
                  m.id === messages[messages.length - 1]?.id && (
                    <span className="cursor">▍</span>
                  )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        {error ? <div className="error">{error}</div> : null}
        <textarea
          ref={areaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message GhostGPT AI…"
          disabled={busy}
          rows={3}
        />
        <div className="composer-row">
          <div className="hint">
            Model <strong>accounts/fireworks/models/gpt-oss-120b</strong>
            {" · "}
            Enter to send, Shift+Enter for newline
          </div>
          <div className="actions">
            <button
              type="button"
              disabled={busy || messages.length === 0}
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
            >
              {busy ? "Thinking…" : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div className="foot">
        <span>
          {mode === "live" ? (
            <span className="status-ok">Live · Fireworks</span>
          ) : mode === "sample" ? (
            <span className="status-sample">Sample mode · awaiting API key</span>
          ) : (
            "Ready"
          )}
        </span>
        <span>
          API · <code>/api/v1/chat/completions</code>
        </span>
      </div>
    </div>
  );
}
