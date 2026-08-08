export const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const DEFAULT_CONTEXT_WINDOW_LENGTH = 4;

export type ModelKind = "chat" | "embedding";

export const MODEL_OPTIONS = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "NVIDIA Nemotron 3 Super 120B",
    kind: "chat"
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Google Gemma 4 31B",
    kind: "chat"
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "OpenAI gpt-oss 20B",
    kind: "chat"
  },
  {
    id: "nvidia/nemotron-3-embed-1b:free",
    label: "NVIDIA Nemotron 3 Embed 1B",
    kind: "embedding"
  },
  {
    id: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    label: "NVIDIA Llama Nemotron Embed VL 1B V2",
    kind: "embedding"
  }
] as const satisfies ReadonlyArray<{ id: string; label: string; kind: ModelKind }>;

const RETIRED_MODELS: Record<string, string> = {
  "openai/gpt-oss-120b:free": DEFAULT_MODEL,
  "openrouter/free": DEFAULT_MODEL,
  "google/gemma-4-26b-a4b-it:free": DEFAULT_MODEL
};

export function getConfiguredModel() {
  const configuredModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const resolvedModel = RETIRED_MODELS[configuredModel] || configuredModel;

  return isAvailableModel(resolvedModel) ? resolvedModel : DEFAULT_MODEL;
}

export function isAvailableModel(model: string) {
  return MODEL_OPTIONS.some((option) => option.id === model);
}

export function getModelKind(model: string): ModelKind | undefined {
  return MODEL_OPTIONS.find((option) => option.id === model)?.kind;
}

export function getContextWindowLength() {
  const configuredLength = Number.parseInt(process.env.CHAT_CONTEXT_WINDOW_LENGTH || "", 10);

  if (!Number.isFinite(configuredLength) || configuredLength < 0) {
    return DEFAULT_CONTEXT_WINDOW_LENGTH;
  }

  return configuredLength;
}
