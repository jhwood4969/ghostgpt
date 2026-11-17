# GhostGPT API

OpenAI-compatible gateway for GhostGPT.

## Base URL

```
https://api.ghostgpt.live/v1
```

Authenticate with:

```
Authorization: Bearer ghost_YOUR_KEY
```

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
