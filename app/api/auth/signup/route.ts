import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      message: "User verified successfully",
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}