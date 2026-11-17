import { useState } from "react";
import type { FormEvent } from "react";
import { completeChat, streamChat } from "../lib/api";
import type { ChatMessage } from "../lib/api";
import { isLikelyNetworkFailure, streamDemoReply } from "../lib/demo";
import { loadSettings } from "../lib/storage";

const SYSTEM: ChatMessage = {
  role: "system",
  content:
    "You are Ghost IDE, the coding assistant inside GhostGPT. Prefer concise, production-ready code with brief explanations. Use fenced code blocks with language tags.",
};

export function Code() {
  const [prompt, setPrompt] = useState(
    "Build a FastAPI endpoint with Pydantic validation and structured error responses.",
  );
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    setDemo(false);
    setOutput("");

    const settings = loadSettings();
    const messages: ChatMessage[] = [SYSTEM, { role: "user", content: text }];
    const write = (chunk: string) => setOutput((prev) => prev + chunk);

    try {
      if (!settings.apiKey.trim()) {
        setDemo(true);
        await streamDemoReply(messages, write);
      } else {
        try {
          await streamChat(settings, messages, {
            onToken: write,
            onDone: () => undefined,
            onError: (err) => {
              throw err;
            },
          });
        } catch (streamErr) {
          if (isLikelyNetworkFailure(streamErr)) throw streamErr;
          const full = await completeChat(settings, messages);
          write(full);
        }
      }
    } catch (err) {
      if (isLikelyNetworkFailure(err)) {
        setDemo(true);
        setOutput("");
        await streamDemoReply(messages, write);
      } else {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace ide-workspace">
      <div className="workspace-toolbar">
        <div>
          <h1>Ghost IDE</h1>
          <p className="muted">Focused code generation against your GhostGPT model</p>
        </div>
      </div>

      <form className="ide-grid" onSubmit={onSubmit}>
        <label className="ide-panel">
          <span className="panel-label">Prompt</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={14}
            spellCheck={false}
            disabled={busy}
          />
          <div className="composer-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || !prompt.trim()}>
              {busy ? "Generating…" : "Generate"}
            </button>
          </div>
        </label>

        <div className="ide-panel">
          <span className="panel-label">
            Output {demo ? <span className="chip">demo</span> : null}
          </span>
          <pre className="ide-output">{output || (busy ? "Streaming…" : "Output appears here.")}</pre>
          {error && (
            <p className="error-line" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
