# GhostGPT

Multi-model AI chat and OpenAI-compatible API platform for [ghostgpt.live](https://ghostgpt.live/).

## Live surfaces

- Landing + product site (this app)
- [Web chat](/chat)
- [Ghost IDE](/code)
- [API docs](/api)

## Develop

```bash
npm install
npm run dev
```

This starts the Vite UI on `:5173` and the GhostGPT AI gateway on `:8787` (`/api` is proxied).

Build / production:

```bash
npm run build
npm start
```

## GhostGPT AI gateway

- `GET /api/health`
- `GET /api/v1/models`
- `POST /api/v1/chat/completions`

Model IDs: `ghost-nano`, `ghost-pro`, `ghost-ultra`.

Optional server secrets:

- `FIREWORKS_API_KEY` or `UPSTREAM_API_KEY` — enables full upstream inference
- `UPSTREAM_BASE_URL` — defaults to Fireworks OpenAI-compatible API

Without those secrets, the gateway still streams answers from the onboard GhostGPT AI brain.

Chat defaults to `/api/v1`. Optional browser `ghost_` keys stay in `localStorage`.

## Stack

- Vite + React + TypeScript
- React Router
- OpenAI-compatible client for `/v1/chat/completions` and `/v1/models`
