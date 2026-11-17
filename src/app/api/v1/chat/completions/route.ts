import { requireIdentity } from "../../../../../../cursor/identity.js";
import {
  FIREWORKS_MODEL,
  createFireworksCompletion,
  createSampleJson,
  createSampleStream,
  getFireworksApiKey,
  sanitizeMessages,
  type ChatMessage,
} from "../../../../../lib/fireworks";
import { rateLimit } from "../../../../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const limited = rateLimit(`api:${identity.sub}`);
  if (!limited.ok) {
    return Response.json(
      { error: { message: "Rate limit exceeded", type: "rate_limit_error" } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON", type: "invalid_request_error" } },
      { status: 400 },
    );
  }

  const record = body as {
    messages?: unknown;
    stream?: unknown;
    temperature?: unknown;
    top_p?: unknown;
    max_tokens?: unknown;
  };

  const messages = sanitizeMessages(record.messages);
  if (!messages) {
    return Response.json(
      {
        error: {
          message: "messages is required",
          type: "invalid_request_error",
        },
      },
      { status: 400 },
    );
  }

  const stream = Boolean(record.stream);
  const lastUser = [...messages]
    .reverse()
    .find((m: ChatMessage) => m.role === "user");
  const prompt = lastUser?.content ?? "";

  const apiKey = getFireworksApiKey();
  if (!apiKey) {
    if (stream) {
      return new Response(createSampleStream(prompt), {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-GhostGPT-Mode": "sample",
        },
      });
    }
    return Response.json(createSampleJson(prompt), {
      headers: { "X-GhostGPT-Mode": "sample" },
    });
  }

  const upstream = await createFireworksCompletion(
    {
      messages,
      stream,
      temperature:
        typeof record.temperature === "number" ? record.temperature : undefined,
      top_p: typeof record.top_p === "number" ? record.top_p : undefined,
      max_tokens:
        typeof record.max_tokens === "number" ? record.max_tokens : undefined,
    },
    apiKey,
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      {
        error: {
          message: "Fireworks upstream error",
          type: "api_error",
          detail: detail.slice(0, 500),
        },
      },
      { status: 502 },
    );
  }

  if (stream) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-GhostGPT-Mode": "live",
        "X-GhostGPT-Model": FIREWORKS_MODEL,
      },
    });
  }

  const json = await upstream.json();
  return Response.json(json, {
    headers: {
      "X-GhostGPT-Mode": "live",
      "X-GhostGPT-Model": FIREWORKS_MODEL,
    },
  });
}
