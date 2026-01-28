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
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });

  const text = await res.text();

  if (!res.ok || text.startsWith("<")) {
    throw new Error("Overpass returned non-JSON response");
  }

  return JSON.parse(text);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const districtRaw = searchParams.get("district") || "";
    const stateRaw = searchParams.get("state") || "";

    const districtName = esc(districtRaw);
    const stateName = esc(stateRaw);

    if (!districtName) {
      return NextResponse.json(
        { error: "District is required" },
        { status: 400 }
      );
    }

    console.log("✅ Request:", { stateName, districtName });

    /* ----------------------------------------------------------
       ✅ STEP 1: FIND DISTRICT DIRECTLY
    -----------------------------------------------------------*/
    const vlist = variants(districtName);
    let districtAreaId: number | null = null;

    for (const v of vlist) {
      try {
        const query = `
          [out:json];
          area["name"="${esc(v)}"]["admin_level"="5"];
          out ids;
        `;

        const json = await safeOverpass(query);

        if (json?.elements?.length) {
          districtAreaId = json.elements[0].id;
          console.log("✅ DIRECT DISTRICT MATCH:", v, "→", districtAreaId);
          break;
        }
      } catch {
        continue;
      }
    }

    /* ----------------------------------------------------------
       ✅ STEP 2: CITY FALLBACK
    -----------------------------------------------------------*/
    if (!districtAreaId) {
      console.log("⚠️ Trying CITY fallback...");

      for (const v of vlist) {
        try {
          const query = `
            [out:json];
            (
              rel["name"="${esc(v)}"]["place"="city"];
              rel["name"="${esc(v)}"]["place"="town"];
              rel["name"="${esc(v)}"]["boundary"="administrative"];
            );
            out ids;
          `;

          const json = await safeOverpass(query);

          if (json?.elements?.length) {
            districtAreaId = json.elements[0].id;
            console.log("✅ CITY MATCH:", v, "→", districtAreaId);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!districtAreaId) {
      return NextResponse.json(
        { error: `No OSM boundary found for '${districtName}'` },
        { status: 400 }
      );
    }

    /* ----------------------------------------------------------
       ✅ STEP 3: FETCH AMENITIES
    -----------------------------------------------------------*/
    const amenitiesQuery = `
      [out:json][timeout:240];
      area(${districtAreaId})->.d;

      (
        node(area.d)["amenity"];
        // node(area.d)["shop"];
        // node(area.d)["office"];
        node(area.d)["public_transport"];
        node(area.d)["railway"];
        // node(area.d)["highway"];
        node(area.d)["building"];
      );

      out center;
    `;

    const amenitiesJson = await safeOverpass(amenitiesQuery);

    console.log("✅ AMENITIES FOUND:", amenitiesJson?.elements?.length || 0);

    return NextResponse.json(amenitiesJson);
  } catch (err: any) {
    console.log("❌ SERVER ERROR:", err.message);

    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
