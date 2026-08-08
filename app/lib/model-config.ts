export const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const DEFAULT_CONTEXT_WINDOW_LENGTH = 4;

export const FREE_MODEL_OPTIONS = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "NVIDIA Nemotron 3 Super 120B"
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Google Gemma 4 31B"
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "OpenAI gpt-oss 20B"
  }
] as const;

const RETIRED_MODELS: Record<string, string> = {
  "openai/gpt-oss-120b:free": DEFAULT_MODEL,
  "openrouter/free": DEFAULT_MODEL,
  "google/gemma-4-26b-a4b-it:free": DEFAULT_MODEL
};

export function getConfiguredModel() {
  const configuredModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const resolvedModel = RETIRED_MODELS[configuredModel] || configuredModel;

  return isAvailableFreeModel(resolvedModel) ? resolvedModel : DEFAULT_MODEL;
}

export function isAvailableFreeModel(model: string) {
  return FREE_MODEL_OPTIONS.some((option) => option.id === model);
}

export function getContextWindowLength() {
  const configuredLength = Number.parseInt(process.env.CHAT_CONTEXT_WINDOW_LENGTH || "", 10);

  if (!Number.isFinite(configuredLength) || configuredLength < 0) {
    return DEFAULT_CONTEXT_WINDOW_LENGTH;
  }

  return configuredLength;
}
