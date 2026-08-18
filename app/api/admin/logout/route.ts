import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, revokeAdminSession } from "../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

  try {
    await revokeAdminSession(token);
  } catch (error) {
    console.error("Could not revoke admin session.", error);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
