import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Dummy response for now (safe for CI)
    return NextResponse.json({
      address,
      latitude: 0,
      longitude: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Geocode failed" },
      { status: 500 }
    );
  }
}
