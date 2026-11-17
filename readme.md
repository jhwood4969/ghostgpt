# GhostGPT

High-performance AI chat for [ghostgpt.live](https://ghostgpt.live/), backed by Fireworks **`accounts/fireworks/models/gpt-oss-120b`**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Without `FIREWORKS_API_KEY`, the app runs in sample mode.

## Live inference

Set the Cursor app secret `FIREWORKS_API_KEY` (Fireworks AI console). The chat UI and `/api/v1/chat/completions` then stream from gpt-oss-120b.

## API

See [api.md](./api.md).

## Stack

- Next.js App Router
- Fireworks OpenAI-compatible Chat Completions
- Cursor app identity for authenticated routes
