import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { streamText } from "hono/streaming";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLocalReply, streamLocalReply } from "./local-ai.ts";
import { listPublicModels, resolveUpstreamModel } from "./models.ts";

type ChatMessage = { role?: string; content?: string };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 8787);

const upstreamBase = (
  process.env.UPSTREAM_BASE_URL ?? "https://api.fireworks.ai/inference/v1"
).replace(/\/$/, "");

function upstreamKey(): string | undefined {
  return (
    process.env.FIREWORKS_API_KEY?.trim() ||
    process.env.UPSTREAM_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    undefined
  );
}

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8787"],
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "ghostgpt-ai",
    upstream: Boolean(upstreamKey()),
    models: listPublicModels().map((m) => m.id),
  }),
);

app.get("/api/v1/models", (c) =>
  c.json({
    object: "list",
    data: listPublicModels(),
  }),
);

app.post("/api/v1/chat/completions", async (c) => {
  let body: {
    model?: string;
    messages?: ChatMessage[];
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: "Invalid JSON body" } }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return c.json({ error: { message: "messages is required" } }, 400);
  }

  const route = resolveUpstreamModel(body.model);
  const stream = Boolean(body.stream);
  const key = upstreamKey();

  if (key) {
    try {
      return await proxyUpstream(c, {
        key,
        routeId: route.id,
        upstreamModel: route.upstream,
        messages,
        stream,
        max_tokens: body.max_tokens ?? 1024,
        temperature: body.temperature ?? 0.4,
      });
    } catch (err) {
      console.error("[ghostgpt] upstream failed, falling back to local AI", err);
    }
  }

  const reply = buildLocalReply(messages, route.id);
  if (!stream) {
    return c.json(completionJson(route.id, reply));
  }

  return streamOpenAI(c, route.id, async (write) => {
    await streamLocalReply(reply, write);
  });
});

async function proxyUpstream(
  c: Context,
  opts: {
    key: string;
    routeId: string;
    upstreamModel: string;
    messages: ChatMessage[];
    stream: boolean;
    max_tokens: number;
    temperature: number;
  },
) {
  const system = {
    role: "system",
    content:
      "You are GhostGPT, a multi-model AI assistant for developers. Be precise, useful, and direct.",
  };

  const res = await fetch(`${upstreamBase}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.upstreamModel,
      messages: [system, ...opts.messages],
      stream: opts.stream,
      max_tokens: opts.max_tokens,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Upstream ${res.status}: ${detail.slice(0, 400)}`);
  }

  if (!opts.stream) {
    const data = (await res.json()) as { model?: string };
    data.model = opts.routeId;
    return c.json(data);
  }

  if (!res.body) {
    throw new Error("Upstream returned empty body");
  }

  return streamText(c, async (stream) => {
    c.header("Content-Type", "text/event-stream; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await stream.write(decoder.decode(value, { stream: true }));
    }
  });
}

function completionJson(model: string, content: string) {
  return {
    id: `chatcmpl_ghost_${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  };
}

function streamOpenAI(
  c: Context,
  model: string,
  produce: (write: (token: string) => Promise<void> | void) => Promise<void>,
) {
  return streamText(c, async (stream) => {
    c.header("Content-Type", "text/event-stream; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    const id = `chatcmpl_ghost_${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    const writeToken = async (token: string) => {
      const chunk = {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: { content: token }, finish_reason: null }],
      };
      await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    await produce(writeToken);
    await stream.write(
      `data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      })}\n\n`,
    );
    await stream.write("data: [DONE]\n\n");
  });
}

if (isProd) {
  const distRoot = "./dist";
  app.use("/*", serveStatic({ root: distRoot }));
  app.get("*", serveStatic({ root: distRoot, path: "index.html" }));
}

console.log(
  `[ghostgpt-ai] listening on http://127.0.0.1:${port} (upstream=${Boolean(upstreamKey())})`,
);

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" });
