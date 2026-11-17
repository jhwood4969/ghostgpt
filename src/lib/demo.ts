import type { ChatMessage } from "./api";

const DEMO_REPLIES = [
  `GhostGPT demo mode is online.

Your live API at \`api.ghostgpt.live\` is not reachable from this session, so this reply is generated locally.

**What you can do next**
1. Open Settings and paste a \`ghost_\` API key.
2. Confirm the base URL is \`https://api.ghostgpt.live/v1\`.
3. Retry with Nano, Pro, or Ultra once the gateway is up.

Until then, explore the chat UI, Ghost IDE layout, and API docs freely.`,
  `Demo response ready.

GhostGPT routes across Nano · Pro · Ultra. In live mode, messages stream from your OpenAI-compatible endpoint:

\`POST /v1/chat/completions\`
\`Authorization: Bearer ghost_...\`

This sandbox keeps history in your browser only.`,
];

export function isLikelyNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cors") ||
    msg.includes("timed out") ||
    msg.includes("network request failed")
  );
}

export async function streamDemoReply(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const pick =
    DEMO_REPLIES[Math.abs(hash(lastUser)) % DEMO_REPLIES.length] +
    (lastUser
      ? `\n\nYou asked:\n> ${lastUser.slice(0, 280)}${lastUser.length > 280 ? "…" : ""}`
      : "");

  for (const ch of pick) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onToken(ch);
    await sleep(8 + (ch === "\n" ? 18 : 0));
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return h;
}
