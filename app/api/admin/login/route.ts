import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession
} from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    password?: unknown;
  } | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  try {
    const token = await createAdminSession(username, password);

    if (!token) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });
    return response;
  } catch (error) {
    console.error("Could not sign in to admin.", error);
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
