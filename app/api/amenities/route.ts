import { NextResponse } from "next/server";

// Clean string for Overpass
function esc(str: string) {
  return str.replace(/"/g, "'");
}

// Generate name variants
function variants(name: string) {
  const n = name.trim();
  return Array.from(
    new Set([
      n,
      n + " district",
      n.toLowerCase(),
      n.toUpperCase(),
      n.charAt(0).toUpperCase() + n.slice(1),
      n.replace(/ district/i, ""),
      n.replace(/ city/i, ""),
      n.replace(/ tehsil/i, ""),
      n.replace(/ /g, "_"),
      n.replace(/_/g, " "),
    ])
  );
}

async function safeOverpass(query: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 seconds max

    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const text = await res.text();

    if (!res.ok || text.startsWith("<")) {
      throw new Error("Overpass returned non-JSON response");
    }

    return JSON.parse(text);
  } catch (err) {
    console.log("⚠️ Overpass failed:", err);
    return { elements: [] }; // ✅ prevent 500 crash
  }
}

// 🔎 Geocode fallback (Nominatim)
async function geocodePlace(place: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
  );
  const data = await res.json();
  return data?.[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const districtRaw = searchParams.get("district") || "";
    const stateRaw = searchParams.get("state") || "";

    const districtName =
      districtRaw.charAt(0).toUpperCase() +
      districtRaw.slice(1).toLowerCase();

    const stateName =
      stateRaw.charAt(0).toUpperCase() +
      stateRaw.slice(1).toLowerCase();

    if (!districtName) {
      return NextResponse.json(
        { error: "District is required" },
        { status: 400 }
      );
    }

    console.log("✅ Request:", { stateName, districtName });

    /* ----------------------------------------------------------
       STEP 1: Try relation-based district lookup
    -----------------------------------------------------------*/
    const vlist = variants(districtName);
    let districtAreaId: number | null = null;

    for (const v of vlist) {
      try {
        const query = `
[out:json][timeout:60];
area["name"="India"]->.country;
relation
  (area.country)
  ["name"="${esc(v)}"]
  ["boundary"="administrative"]
  ["admin_level"="6"];
out ids;
`;

        const json = await safeOverpass(query);

        if (json?.elements?.length) {
          const el = json.elements[0];
          districtAreaId = 3600000000 + el.id;
          console.log("✅ DISTRICT MATCH:", v, "→", districtAreaId);
          break;
        }
      } catch {
        continue;
      }
    }

    /* ----------------------------------------------------------
       STEP 2: If relation not found → use BBOX fallback
    -----------------------------------------------------------*/
    let bbox: string | null = null;

    if (!districtAreaId) {
      const place = `${districtName}, ${stateName || "India"}`;
      const geo = await geocodePlace(place);

      if (geo) {
        const lat = parseFloat(geo.lat);
        const lon = parseFloat(geo.lon);

        const delta = 0.06;
        const south = lat - delta;
        const north = lat + delta;
        const west = lon - delta;
        const east = lon + delta;

        bbox = `${south},${west},${north},${east}`;
        console.log("⚠️ Using BBOX fallback:", bbox);
      } else {
        return NextResponse.json(
          { error: `Location not found for '${place}'` },
          { status: 400 }
        );
      }
    }

    /* ----------------------------------------------------------
       STEP 3: Fetch amenities
    -----------------------------------------------------------*/
    let amenitiesQuery = "";

if (districtAreaId) {
  amenitiesQuery = `
[out:json][timeout:60];
area(${districtAreaId})->.d;

(
  node(area.d)["amenity"~"parking|fuel|restaurant|cafe|bank|atm|school|hospital"];
  node(area.d)["shop"~"mall|supermarket|convenience"];
  node(area.d)["highway"="bus_stop"];
);

out center 200;
`;
} else if (bbox) {
  amenitiesQuery = `
[out:json][timeout:60];
(
  node(${bbox})["amenity"~"parking|fuel|restaurant|cafe|bank|atm|school|hospital"];
  node(${bbox})["shop"~"mall|supermarket|convenience"];
  node(${bbox})["highway"="bus_stop"];
);

out center 200;
`;
}

    const amenitiesJson = await safeOverpass(amenitiesQuery);

    console.log(
      "✅ AMENITIES FOUND:",
      amenitiesJson?.elements?.length || 0
    );

    return NextResponse.json(amenitiesJson);
  } catch (err: any) {
    console.log("❌ SERVER ERROR:", err.message);

    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}