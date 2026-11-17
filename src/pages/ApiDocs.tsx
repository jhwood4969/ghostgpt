import { useState } from "react";
import { Link } from "react-router-dom";

const CURL = `curl https://api.ghostgpt.live/v1/chat/completions \\
  -H "Authorization: Bearer ghost_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "ghost-nano",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false,
    "max_tokens": 1024,
    "temperature": 0.2
  }'`;

const MODELS = `curl https://api.ghostgpt.live/v1/models \\
  -H "Authorization: Bearer ghost_YOUR_KEY"`;

export function ApiDocs() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="workspace docs-workspace">
      <div className="workspace-toolbar">
        <div>
          <h1>API</h1>
          <p className="muted">OpenAI-compatible gateway at api.ghostgpt.live</p>
        </div>
        <Link className="btn btn-primary btn-sm" to="/chat">
          Try in chat
        </Link>
      </div>

      <div className="docs-body">
        <section>
          <h2>Base URL</h2>
          <p>
            Onboard gateway: <code>/api/v1</code>
          </p>
          <p>
            Public gateway: <code>https://api.ghostgpt.live/v1</code>
          </p>
          <p>
            The web app talks to the onboard GhostGPT AI by default. External clients can use the
            public host with a Bearer token that starts with <code>ghost_</code>.
          </p>
        </section>

        <section>
          <h2>List models</h2>
          <p>
            <code>GET /v1/models</code>
          </p>
          <div className="code-block">
            <button type="button" className="copy-btn" onClick={() => void copy("models", MODELS)}>
              {copied === "models" ? "Copied" : "Copy"}
            </button>
            <pre>{MODELS}</pre>
          </div>
          <p>Typical IDs: <code>ghost-nano</code>, <code>ghost-pro</code>, <code>ghost-ultra</code>.</p>
        </section>

        <section>
          <h2>Chat completions</h2>
          <p>
            <code>POST /v1/chat/completions</code>
          </p>
          <div className="code-block">
            <button type="button" className="copy-btn" onClick={() => void copy("curl", CURL)}>
              {copied === "curl" ? "Copied" : "Copy"}
            </button>
            <pre>{CURL}</pre>
          </div>
        </section>

        <section>
          <h2>CLI</h2>
          <p>
            Operators can use{" "}
            <a href="https://github.com/GHOST-GPT/ghost-forge-cli" target="_blank" rel="noreferrer">
              ghost-forge-cli
            </a>{" "}
            for one-shot generation, interactive chat, and model discovery against the same contract.
          </p>
        </section>

        <section>
          <h2>Common errors</h2>
          <ul className="error-table">
            <li>
              <code>401</code> — missing or inactive key
            </li>
            <li>
              <code>403</code> — model not entitled for this plan
            </li>
            <li>
              <code>429</code> — daily or rate limit reached
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
