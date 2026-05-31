import { NextResponse } from "next/server";
import { getMessages, listSessions } from "../../lib/chat-store";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin";

function isAuthorized(request: Request) {
  return (
    request.headers.get("x-admin-user") === ADMIN_USER &&
    request.headers.get("x-admin-password") === ADMIN_PASSWORD
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();

  try {
    if (sessionId) {
      const messages = await getMessages(sessionId);
      return NextResponse.json({ messages });
    }

    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin data." },
      { status: 500 }
    );
  }
}
