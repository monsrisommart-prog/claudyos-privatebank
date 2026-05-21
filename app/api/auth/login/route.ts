import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { passcode } = await request.json();
  const expected = process.env.PRIVATEBANK_PASSCODE || "privatebank";

  if (String(passcode) !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pb_session", "local-private-session", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
