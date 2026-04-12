import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
  }

  try {
    const query = `
      [out:json][timeout:5];
      (
        node["amenity"~"restaurant|cafe|fast_food|toilets|pharmacy|atm"](around:1000,${lat},${lon});
        node["shop"~"supermarket|convenience|mall"](around:1000,${lat},${lon});
      );
      out 5;
    `;

    // Try primary Overpass server
    let res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // If primary is down/rate-limited, instantly fallback to secondary server
    if (!res.ok) {
      res = await fetch("https://overpass.kumi.systems/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    }

    if (!res.ok) {
      console.warn("Overpass API Failed - Both Servers Down/Limited. Status:", res.status);
      return NextResponse.json({ elements: [] }); // Return empty array with 200 to avoid client console errors
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Amenities-near fetch failed:", err);
    return NextResponse.json({ elements: [] }); // Return empty array with 200 to avoid client console errors
  }
}
