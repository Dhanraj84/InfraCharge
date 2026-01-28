import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json([], { status: 200 });
    }

    const apiKey = process.env.OCM_API_KEY;

    const url =
      `https://api.openchargemap.io/v3/poi/?output=json` +
      `&latitude=${lat}&longitude=${lon}` +
      `&distance=10&distanceunit=KM&maxresults=50`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey || "",
      },
    });

    // ✅ THIS FIXES 500
    if (!response.ok) {
      console.error("OCM fetch failed:", response.status);
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("OCM error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

