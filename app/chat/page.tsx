import AgenticClient from "../agentic-client";
import { getConfiguredModel, getContextWindowLength } from "../lib/model-config";

export default function ChatPage() {
  return (
    <AgenticClient
      contextWindowLength={getContextWindowLength()}
      initialChatOpen
      llmModel={getConfiguredModel()}
    />
  );
}
