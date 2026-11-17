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

Build:

```bash
npm run build
npm run preview
```

## Chat / API settings

In Chat → Settings, set:

- Base URL: `https://api.ghostgpt.live/v1`
- API key: `ghost_…`

Keys stay in `localStorage` on the client. If the gateway is unreachable or no key is set, the UI falls back to a local demo stream so you can still exercise the product flows.

## Stack

- Vite + React + TypeScript
- React Router
- OpenAI-compatible client for `/v1/chat/completions` and `/v1/models`
