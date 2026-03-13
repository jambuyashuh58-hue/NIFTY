import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const correctPassword = process.env.APP_PASSWORD ?? "tradepulse123";
    const secret = process.env.SESSION_SECRET ?? "tradepulse_default_secret";

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set session cookie — httpOnly so JS can't read it
    response.cookies.set("tp_session", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
