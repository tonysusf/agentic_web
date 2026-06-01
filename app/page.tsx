import AgenticClient from "./agentic-client";
import { getConfiguredModel } from "./lib/model-config";

export default function Home() {
  return <AgenticClient llmModel={getConfiguredModel()} />;
}
