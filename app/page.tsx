import AgenticClient from "./agentic-client";
import {
  MODEL_OPTIONS,
  getConfiguredModel,
  getContextWindowLength
} from "./lib/model-config";

export default function Home() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      models={[...MODEL_OPTIONS]}
      llmModel={getConfiguredModel()}
    />
  );
}
