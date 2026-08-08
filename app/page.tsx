import AgenticClient from "./agentic-client";
import {
  FREE_MODEL_OPTIONS,
  getConfiguredModel,
  getContextWindowLength
} from "./lib/model-config";

export default function Home() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      freeModels={[...FREE_MODEL_OPTIONS]}
      llmModel={getConfiguredModel()}
    />
  );
}
