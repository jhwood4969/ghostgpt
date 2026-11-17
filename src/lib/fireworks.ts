export const FIREWORKS_MODEL = "accounts/fireworks/models/gpt-oss-120b";
export const FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1";
export const MAX_OUTPUT_TOKENS = 4096;
export const DEFAULT_MAX_TOKENS = 2048;

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
};

/** Default persona for GhostGPT AI (web chat). */
export const GHOSTGPT_SYSTEM = [
  "You are GhostGPT AI, the assistant for ghostgpt.live.",
  "You are fast, direct, and practical — strong at coding, research, writing, and problem-solving.",
  "Keep answers clear. Prefer concrete steps and working examples over fluff.",
  "If a request is ambiguous, make a reasonable assumption and state it briefly.",
  "Do not claim access to private systems you do not have. Be honest about limits.",
].join(" ");

export function withGhostSystem(messages: ChatMessage[]): ChatMessage[] {
  const hasSystem = messages.some((m) => m.role === "system");
  if (hasSystem) return messages;
  return [{ role: "system", content: GHOSTGPT_SYSTEM }, ...messages];
}

export type ChatCompletionBody = {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
};

export function getFireworksApiKey(): string | null {
  const key = process.env.FIREWORKS_API_KEY?.trim();
  return key ? key : null;
}

export function clampMaxTokens(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MAX_TOKENS;
  return Math.min(Math.floor(n), MAX_OUTPUT_TOKENS);
}

export function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  if (input.length > 64) return null;

  const out: ChatMessage[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (
      role !== "system" &&
      role !== "user" &&
      role !== "assistant" &&
      role !== "tool"
    ) {
      return null;
    }
    if (typeof content !== "string") return null;
    if (content.length > 32_000) return null;
    out.push({ role, content });
  }
  return out;
}

export async function createFireworksCompletion(
  body: ChatCompletionBody,
  apiKey: string,
): Promise<Response> {
  const payload = {
    model: FIREWORKS_MODEL,
    messages: body.messages,
    stream: Boolean(body.stream),
    temperature:
      typeof body.temperature === "number" ? body.temperature : 0.7,
    top_p: typeof body.top_p === "number" ? body.top_p : 1,
    max_tokens: clampMaxTokens(body.max_tokens),
    presence_penalty:
      typeof body.presence_penalty === "number" ? body.presence_penalty : 0,
    frequency_penalty:
      typeof body.frequency_penalty === "number" ? body.frequency_penalty : 0,
  };

  return fetch(`${FIREWORKS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/** Demo stream when FIREWORKS_API_KEY is not set on this machine. */
export function createSampleStream(prompt: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reply =
    `I’m GhostGPT AI — sample mode is on because FIREWORKS_API_KEY isn’t set on this host yet.\n\n` +
    `You said: “${prompt.slice(0, 280)}${prompt.length > 280 ? "…" : ""}”\n\n` +
    `Once the Fireworks key is added, I’ll answer live on ${FIREWORKS_MODEL}.`;

  return new ReadableStream({
    start(controller) {
      const id = `chatcmpl-sample-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);
      const chunks: string[] = [];
      for (let i = 0; i < reply.length; i += 24) {
        chunks.push(reply.slice(i, i + 24));
      }

      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };

      send({
        id,
        object: "chat.completion.chunk",
        created,
        model: FIREWORKS_MODEL,
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: "" },
            finish_reason: null,
          },
        ],
      });

      for (const part of chunks) {
        send({
          id,
          object: "chat.completion.chunk",
          created,
          model: FIREWORKS_MODEL,
          choices: [
            { index: 0, delta: { content: part }, finish_reason: null },
          ],
        });
      }

      send({
        id,
        object: "chat.completion.chunk",
        created,
        model: FIREWORKS_MODEL,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

export function createSampleJson(prompt: string) {
  return {
    id: `chatcmpl-sample-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: FIREWORKS_MODEL,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content:
            `GhostGPT sample mode. Prompt received (${prompt.length} chars). ` +
            `Wire FIREWORKS_API_KEY to call ${FIREWORKS_MODEL}.`,
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}
