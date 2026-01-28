import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon)
      return NextResponse.json({ error: "lat & lon required" }, { status: 400 });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { "User-Agent": "InfraCharge" }});
    const data = await res.json();

    return NextResponse.json({ address: data.display_name });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
