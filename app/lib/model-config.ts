export const DEFAULT_MODEL = "openrouter/free";
export const DEFAULT_CONTEXT_WINDOW_LENGTH = 4;

const RETIRED_MODELS: Record<string, string> = {
  "openai/gpt-oss-120b:free": DEFAULT_MODEL
};

export function getConfiguredModel() {
  const configuredModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  return RETIRED_MODELS[configuredModel] || configuredModel;
}

export function getContextWindowLength() {
  const configuredLength = Number.parseInt(process.env.CHAT_CONTEXT_WINDOW_LENGTH || "", 10);

  if (!Number.isFinite(configuredLength) || configuredLength < 0) {
    return DEFAULT_CONTEXT_WINDOW_LENGTH;
  }

  return configuredLength;
}
