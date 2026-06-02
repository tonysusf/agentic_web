import AgenticClient from "./agentic-client";
import { getConfiguredModel, getContextWindowLength } from "./lib/model-config";

export default function Home() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      llmModel={getConfiguredModel()}
    />
  );
}
