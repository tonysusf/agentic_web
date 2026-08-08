import AgenticClient from "../agentic-client";
import {
  FREE_MODEL_OPTIONS,
  getConfiguredModel,
  getContextWindowLength
} from "../lib/model-config";

export default function ChatPage() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      freeModels={[...FREE_MODEL_OPTIONS]}
      initialChatOpen
      llmModel={getConfiguredModel()}
    />
  );
}
