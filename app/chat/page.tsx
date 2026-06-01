import AgenticClient from "../agentic-client";
import { getConfiguredModel } from "../lib/model-config";

export default function ChatPage() {
  return <AgenticClient initialChatOpen llmModel={getConfiguredModel()} />;
}
