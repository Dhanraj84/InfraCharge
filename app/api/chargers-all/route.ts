import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OCM_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OCM API key missing. Add NEXT_PUBLIC_OCM_KEY in .env.local" },
        { status: 500 }
      );
    }

    const url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=5000&compact=true&verbose=false&key=${apiKey}`;

    console.log("⚡ Fetching India chargers from OCM...");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "InfraChargeApp/1.0 (contact: youremail@example.com)",
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();

    // ✅ Overpass sometimes returns HTML on rate-limit or error
    if (text.startsWith("<")) {
      console.error("❌ OCM returned HTML instead of JSON");
      return NextResponse.json(
        { error: "OCM returned HTML — possible rate limit", raw: text.slice(0, 200) },
        { status: 500 }
      );
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error("❌ Failed to parse OCM JSON");
      return NextResponse.json(
        { error: "OCM JSON parse failed", details: String(err) },
        { status: 500 }
      );
    }

    console.log(`✅ Chargers loaded: ${json.length}`);

    // ✅ Ensure station objects have clean structure
    const cleaned = json.map((item: any) => ({
      id: item?.ID || null,
      AddressInfo: {
        Title: item?.AddressInfo?.Title || "Unknown",
        Latitude: item?.AddressInfo?.Latitude || null,
        Longitude: item?.AddressInfo?.Longitude || null,
        AddressLine1: item?.AddressInfo?.AddressLine1 || "",
        State: item?.AddressInfo?.StateOrProvince || "",
        Town: item?.AddressInfo?.Town || "",
        Postcode: item?.AddressInfo?.Postcode || "",
      },
      Connections: item?.Connections ?? [],
    }));

    return NextResponse.json(cleaned);
  } catch (err: any) {
    console.error("💥 CHARGERS-ALL FAILED:", err);
    return NextResponse.json(
      { error: "Failed to fetch chargers", details: String(err) },
      { status: 500 }
    );
  }
}
