import { requireIdentity } from "../../../../cursor/identity.js";
import {
  createFireworksCompletion,
  createSampleStream,
  getFireworksApiKey,
  sanitizeMessages,
  type ChatMessage,
} from "../../../lib/fireworks";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const limited = rateLimit(`chat:${identity.sub}`);
  if (!limited.ok) {
    return Response.json(
      { error: "rate_limited", message: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = sanitizeMessages(
    (body as { messages?: unknown })?.messages,
  );
  if (!messages) {
    return Response.json(
      { error: "invalid_messages", message: "Provide a messages array." },
      { status: 400 },
    );
  }

  const lastUser = [...messages]
    .reverse()
    .find((m: ChatMessage) => m.role === "user");
  const prompt = lastUser?.content ?? "";

  const apiKey = getFireworksApiKey();
  if (!apiKey) {
    return new Response(createSampleStream(prompt), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-GhostGPT-Mode": "sample",
      },
    });
  }

  const upstream = await createFireworksCompletion(
    { messages, stream: true, max_tokens: 2048 },
    apiKey,
  );

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      {
        error: "upstream_error",
        status: upstream.status,
        detail: detail.slice(0, 500),
      },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-GhostGPT-Mode": "live",
      "X-GhostGPT-Model": "accounts/fireworks/models/gpt-oss-120b",
    },
  });
}
