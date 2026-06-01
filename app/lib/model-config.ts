export const DEFAULT_MODEL = "openai/gpt-oss-120b:free";

export function getConfiguredModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}
