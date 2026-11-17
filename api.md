# GhostGPT API

OpenAI-compatible gateway for GhostGPT.

## Base URL

Onboard (this app):

```
/api/v1
```

Public gateway:

```
https://api.ghostgpt.live/v1
```

Optional auth for external clients:

```
Authorization: Bearer ghost_YOUR_KEY
```

Upstream inference uses `FIREWORKS_API_KEY` or `UPSTREAM_API_KEY` on the server. Without those
secrets, GhostGPT AI still answers via the onboard local brain.

## Endpoints

### `GET /v1/models`

List models available to the key.

Typical IDs:

- `ghost-nano`
- `ghost-pro`
- `ghost-ultra`

### `POST /v1/chat/completions`

```json
{
  "model": "ghost-nano",
  "messages": [{ "role": "user", "content": "Hello" }],
  "stream": false,
  "max_tokens": 1024,
  "temperature": 0.2
}
```

Streaming is supported via SSE (`stream: true`) in the same shape as OpenAI chat completions.

## CLI

See [ghost-forge-cli](https://github.com/GHOST-GPT/ghost-forge-cli) for an operator client aimed at this contract.

## Errors

| Status | Meaning |
|--------|---------|
| 401 | Missing or inactive key |
| 403 | Model not entitled for this plan |
| 429 | Rate or daily limit reached |
