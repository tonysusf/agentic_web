import { NextResponse } from "next/server";
import { countUserMessagesToday, getRecentMessages, saveMessage } from "../../lib/chat-store";
import { getConfiguredModel, getContextWindowLength } from "../../lib/model-config";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getDailyQuestionLimit() {
  const configuredLimit = Number.parseInt(process.env.CHAT_DAILY_QUESTION_LIMIT || "8", 10);
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 8;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: unknown; sessionId?: unknown } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = getConfiguredModel();
  const contextWindowLength = getContextWindowLength();
  const dailyQuestionLimit = getDailyQuestionLimit();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const usedQuestionsToday = await countUserMessagesToday(sessionId);

  if (usedQuestionsToday >= dailyQuestionLimit) {
    return NextResponse.json(
      {
        error: `Daily question limit reached. This browser session can ask up to ${dailyQuestionLimit} questions per day.`
      },
      { status: 429 }
    );
  }

  const contextMessages = await getRecentMessages(sessionId, contextWindowLength);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://agentic.im996.com",
      "X-OpenRouter-Title": "Agentic Lite"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Agentic Lite, a concise but helpful AI assistant. Answer the user directly in 2-4 short paragraphs. Keep the tone practical and clear. Check factual claims and the final answer for internal contradictions before responding. When regional terminology is ambiguous, lead with the broad geographic interpretation and list the useful real-world cases before briefly explaining narrower cultural definitions. Distinguish official languages from languages that are merely widely spoken."
        },
        ...contextMessages.map((message) => ({
          role: message.role,
          content: message.content
        })),
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 700
    })
  });

  const data = (await response.json().catch(() => null)) as OpenRouterResponse | null;

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "OpenRouter request failed." },
      { status: response.status }
    );
  }

  const result = data?.choices?.[0]?.message?.content?.trim();

  if (!result) {
    return NextResponse.json({ error: "OpenRouter returned an empty response." }, { status: 502 });
  }

  await saveMessage({
    id: crypto.randomUUID(),
    sessionId,
    role: "user",
    content: prompt
  });
  await saveMessage({
    id: crypto.randomUUID(),
    sessionId,
    role: "assistant",
    content: result
  });

  return NextResponse.json({
    prompt,
    result
  });
}
