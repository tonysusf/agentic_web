import AgenticClient from "../agentic-client";
import {
  MODEL_OPTIONS,
  getConfiguredModel,
  getContextWindowLength
} from "../lib/model-config";

export default function ChatPage() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      models={[...MODEL_OPTIONS]}
      initialChatOpen
      llmModel={getConfiguredModel()}
    />
  );
}
