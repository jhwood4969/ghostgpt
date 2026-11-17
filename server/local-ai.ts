type Msg = { role?: string; content?: string };

const SYSTEM_FLAVOR = `You are GhostGPT — a sharp, developer-grade AI assistant.
Be direct, technical when useful, and keep answers structured.
You route across Nano, Pro, and Ultra tiers on ghostgpt.live.`;

export function buildLocalReply(messages: Msg[], model: string): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const prompt = lastUser || "Hello";
  const lower = prompt.toLowerCase();

  if (/^(hi|hello|hey)\b/.test(lower)) {
    return `GhostGPT (${model}) online.

Ask for code, architecture, API design, or debugging help — or open **Ghost IDE** for a focused generation workspace.

Upstream LLM keys are not configured on this host yet, so this reply is from the onboard GhostGPT brain. Add \`FIREWORKS_API_KEY\` (or \`UPSTREAM_API_KEY\`) to unlock full model routing.`;
  }

  if (lower.includes("model") || lower.includes("nano") || lower.includes("ultra")) {
    return `## GhostGPT model routing

| Tier | ID | Role |
|------|----|------|
| Nano | \`ghost-nano\` | Fast drafts & volume |
| Pro | \`ghost-pro\` | Balanced engineering |
| Ultra | \`ghost-ultra\` | Hard problems & deep code |

Same OpenAI-compatible contract:

\`POST /api/v1/chat/completions\`
\`Authorization: Bearer ghost_…\` (optional on this host)

Your prompt:
> ${clip(prompt)}`;
  }

  if (looksLikeCodeRequest(lower)) {
    return codeScaffold(prompt, model);
  }

  return `${SYSTEM_FLAVOR}

### Response (${model})
${heuristicAnswer(prompt)}

---
_Local GhostGPT AI · connect an upstream key for full Nano/Pro/Ultra inference._`;
}

function looksLikeCodeRequest(lower: string): boolean {
  return (
    lower.includes("code") ||
    lower.includes("typescript") ||
    lower.includes("python") ||
    lower.includes("fastapi") ||
    lower.includes("nginx") ||
    lower.includes("function") ||
    lower.includes("api") ||
    lower.includes("retry") ||
    lower.includes("wrapper")
  );
}

function codeScaffold(prompt: string, model: string): string {
  if (prompt.toLowerCase().includes("retry")) {
    return `### GhostGPT (${model}) — retry wrapper

\`\`\`ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 4, baseMs = 250, factor = 2, jitter = true } = {},
): Promise<T> {
  let attempt = 0;
  let delay = baseMs;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt++ >= retries) throw err;
      const wait = jitter ? delay * (0.5 + Math.random()) : delay;
      await new Promise((r) => setTimeout(r, wait));
      delay *= factor;
    }
  }
}
\`\`\`

Use this around GhostGPT or other HTTP clients. Backoff + jitter keeps 429s from amplifying.`;
  }

  if (prompt.toLowerCase().includes("nginx") || prompt.toLowerCase().includes("sse")) {
    return `### GhostGPT (${model}) — nginx SSE proxy sketch

\`\`\`nginx
location /v1/ {
  proxy_pass https://api.ghostgpt.live/v1/;
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_cache off;
  chunked_transfer_encoding on;
  proxy_read_timeout 3600s;
}
\`\`\`

Disable buffering so streamed chat tokens reach the browser immediately.`;
  }

  if (prompt.toLowerCase().includes("fastapi")) {
    return `### GhostGPT (${model}) — FastAPI + Pydantic

\`\`\`python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="GhostGPT sample")

class ChatIn(BaseModel):
    model: str = Field(default="ghost-nano")
    prompt: str = Field(min_length=1, max_length=8000)

@app.post("/generate")
def generate(body: ChatIn):
    if not body.prompt.strip():
        raise HTTPException(status_code=422, detail="prompt required")
    return {"model": body.model, "output": f"echo: {body.prompt[:200]}"}
\`\`\`

Wire this to \`POST /v1/chat/completions\` when you want a thin app layer over GhostGPT.`;
  }

  return `### GhostGPT (${model})

Here is a focused take on your request:

> ${clip(prompt)}

**Approach**
1. Clarify inputs/outputs and failure modes.
2. Prefer a small, testable module over a monolith.
3. Stream results when latency matters (SSE / OpenAI chunk protocol).

Ask me to expand any section into production-ready code.`;
}

function heuristicAnswer(prompt: string): string {
  const sentences = prompt
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/);
  const focus = sentences[0] ?? prompt;
  return `Reading your ask as: **${clip(focus, 180)}**

- Lead with the smallest working slice, then harden edges (auth, retries, observability).
- Prefer explicit types and clear error contracts.
- If this is for GhostGPT itself, keep the public surface OpenAI-compatible so existing SDKs keep working.

Tell me the language/runtime and constraints and I’ll generate the implementation next.`;
}

function clip(text: string, n = 280): string {
  const t = text.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export async function streamLocalReply(
  text: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  for (const ch of text) {
    onChunk(ch);
    await new Promise((r) => setTimeout(r, ch === "\n" ? 6 : 3));
  }
}
