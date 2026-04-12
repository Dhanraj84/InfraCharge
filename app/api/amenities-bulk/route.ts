import { NextResponse } from "next/server";
import { getCachedAmenities, setCachedAmenities, Amenity } from "@/lib/amenities-cache";

// Distance helper since we are doing this on the server now
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  try {
    const { stations } = await req.json();

    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      return NextResponse.json({ results: {} });
    }

    const results: Record<string, Amenity[]> = {};
    const uncachedStations: any[] = [];

    // 1. Check Cache First
    for (const s of stations) {
      const cached = getCachedAmenities(s.id);
      if (cached) {
        results[s.id] = cached;
      } else {
        uncachedStations.push(s);
      }
    }

    // If everything was in cache, return immediately! ⚡
    if (uncachedStations.length === 0) {
      return NextResponse.json({ results });
    }

    // 2. Build Overpass query for uncached stations
    const clauses = uncachedStations
      .map((s: any) => {
        if (!s.lat || !s.lon) return "";
        return `(node["amenity"~"restaurant|cafe|fast_food|toilets|pharmacy|atm"](around:800,${s.lat},${s.lon});
                 node["shop"~"supermarket|convenience|mall"](around:800,${s.lat},${s.lon}););`;
      })
      .filter(Boolean)
      .join("");

    if (!clauses.trim()) {
      return NextResponse.json({ results });
    }

    const query = `[out:json][timeout:30];(${clauses});out center;`;

    const fetchWithTimeout = async (url: string, options: any) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 25000); // 25s timeout
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    const servers = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.osm.ch/api/interpreter"
    ];

    let res;
    let success = false;

    for (const server of servers) {
        try {
            res = await fetchWithTimeout(server, {
                method: "POST",
                body: "data=" + encodeURIComponent(query),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "InfraCharge-EV-Planner/1.2 (admin@infracharge.com)",
                },
            });
            if (res && res.ok) {
                success = true;
                break;
            }
            console.warn(`Server ${server} failed with status ${res?.status}`);
        } catch (e) {
            console.warn(`Server ${server} timed out or failed.`);
        }
    }

    if (!success || !res) {
      return NextResponse.json({ 
        results, // return what we have from cache
        error: "all_overpass_servers_failed" 
      }, { status: 504 });
    }

    const data = await res.json();
    const elements = data.elements || [];

    // 3. Process results and Update Cache
    for (const station of uncachedStations) {
      if (!station.lat || !station.lon) continue;

      const nearElements = elements
        .map((el: any) => {
          const type = el.tags?.amenity || el.tags?.shop || "amenity";
          let icon = "📍";
          if (type.match(/restaurant|fast_food/)) icon = "🍔";
          if (type === "cafe") icon = "☕";
          if (type === "toilets") icon = "🚻";
          if (type.match(/supermarket|convenience|mall/)) icon = "🛍️";
          if (type === "pharmacy") icon = "⚕️";
          if (type === "atm") icon = "🏧";

          const elLat = el.lat || el.center?.lat;
          const elLon = el.lon || el.center?.lon;
          if (!elLat || !elLon) return null;

          const dist = distanceKm(station.lat, station.lon, elLat, elLon) * 1000;
          if (dist > 1000) return null;

          return { type, icon, name: el.tags?.name || type, distMeters: dist };
        })
        .filter(Boolean);

      const unique = (nearElements as any[]).filter(
        (v: any, i: number, a: any[]) => a.findIndex((t: any) => t.type === v.type) === i
      );
      
      const stationAmenities = unique.sort((a: any, b: any) => a.distMeters - b.distMeters).slice(0, 4);
      
      // Save to results and cache
      results[station.id] = stationAmenities;
      setCachedAmenities(station.id, stationAmenities);
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Bulk amenities fetch failed:", err);
    return NextResponse.json({ results: {}, error: err.message });
  }
}
