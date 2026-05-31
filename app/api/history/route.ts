import { NextResponse } from "next/server";
import { getMessages } from "../../lib/chat-store";

function getSessionId(request: Request) {
  return new URL(request.url).searchParams.get("sessionId")?.trim() || "";
}

export async function GET(request: Request) {
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const messages = await getMessages(sessionId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load chat history." },
      { status: 500 }
    );
  }
}
