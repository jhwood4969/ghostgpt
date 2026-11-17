# GhostGPT API

OpenAI-compatible chat completions powered by Fireworks.

## Model

| Field | Value |
| --- | --- |
| Wire ID | `accounts/fireworks/models/gpt-oss-120b` |
| Upstream | `https://api.fireworks.ai/inference/v1/chat/completions` |
| Context | 131k tokens |
| Max output (GhostGPT) | 4096 tokens |

The `model` field in requests is ignored — GhostGPT always routes to gpt-oss-120b.

## Endpoint

```
POST /api/v1/chat/completions
Content-Type: application/json
```

### Body

```json
{
  "messages": [
    { "role": "system", "content": "You are GhostGPT." },
    { "role": "user", "content": "Hello" }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### cURL

```bash
curl -N https://YOUR_HOST/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Say hi from GhostGPT"}],
    "stream": true
  }'
```

### Web chat

`POST /api/chat` accepts `{ "messages": [...] }` and always streams SSE.

## Auth

On Cursor private/team hosts, the platform identity gate authenticates callers. Configure `FIREWORKS_API_KEY` in Cursor app secrets for live inference.
