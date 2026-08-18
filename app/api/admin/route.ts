import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "../../lib/admin-auth";
import { getMessages, listSessions } from "../../lib/chat-store";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!(await isAdminSessionValid(token))) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();

    if (sessionId) {
      const messages = await getMessages(sessionId);
      return NextResponse.json({ messages });
    }

    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Could not load admin data.", error);
    return NextResponse.json(
      { error: "Could not load admin data." },
      { status: 500 }
    );
  }
}
