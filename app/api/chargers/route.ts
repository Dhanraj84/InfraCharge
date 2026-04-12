import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const range = searchParams.get("range") || "45"; // 🔥 larger range for route checks
    const maxresults = searchParams.get("maxresults") || "100";

    if (!lat || !lon) {
      return NextResponse.json([], { status: 200 });
    }

    const apiKey = process.env.OCM_API_KEY;

    const url =
      `https://api.openchargemap.io/v3/poi/?output=json` +
      `&latitude=${lat}&longitude=${lon}` +
      `&distance=${range}&distanceunit=KM&maxresults=${maxresults}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey || "",
      },
    });

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