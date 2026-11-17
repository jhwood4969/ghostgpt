export type GhostModelId = "ghost-nano" | "ghost-pro" | "ghost-ultra";

export type ModelRoute = {
  id: GhostModelId;
  label: string;
  description: string;
  upstream: string;
};

/** Map GhostGPT tiers onto OpenAI-compatible upstream model IDs (Fireworks by default). */
export const MODEL_ROUTES: Record<GhostModelId, ModelRoute> = {
  "ghost-nano": {
    id: "ghost-nano",
    label: "Nano",
    description: "Fast drafts and high-volume prompts",
    upstream:
      process.env.GHOST_NANO_MODEL ??
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
  },
  "ghost-pro": {
    id: "ghost-pro",
    label: "Pro",
    description: "Balanced reasoning for engineering work",
    upstream:
      process.env.GHOST_PRO_MODEL ??
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
  },
  "ghost-ultra": {
    id: "ghost-ultra",
    label: "Ultra",
    description: "Maximum fidelity for hard problems",
    upstream:
      process.env.GHOST_ULTRA_MODEL ??
      "accounts/fireworks/models/deepseek-r1",
  },
};

export function resolveUpstreamModel(requested: string | undefined): ModelRoute {
  const id = (requested ?? "ghost-nano") as GhostModelId;
  return MODEL_ROUTES[id] ?? MODEL_ROUTES["ghost-nano"];
}

export function listPublicModels() {
  return Object.values(MODEL_ROUTES).map((m) => ({
    id: m.id,
    object: "model",
    owned_by: "ghostgpt",
    description: m.description,
  }));
}
