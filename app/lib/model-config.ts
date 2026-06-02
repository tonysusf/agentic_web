export const DEFAULT_MODEL = "openai/gpt-oss-120b:free";
export const DEFAULT_CONTEXT_WINDOW_LENGTH = 4;

export function getConfiguredModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

export function getContextWindowLength() {
  const configuredLength = Number.parseInt(process.env.CHAT_CONTEXT_WINDOW_LENGTH || "", 10);

  if (!Number.isFinite(configuredLength) || configuredLength < 0) {
    return DEFAULT_CONTEXT_WINDOW_LENGTH;
  }

  return configuredLength;
}
