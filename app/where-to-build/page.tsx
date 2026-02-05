"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

/* --------------------- TYPES --------------------- */
type Amenity = {
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

type Charger = {
  AddressInfo?: {
    Latitude?: number;
    Longitude?: number;
  };
};

type PurchaseResp = {
  stateTotal?: number;
  districtTotal?: number;
  growthPct?: number | null;
};

/* --------------------- HELPERS --------------------- */
const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

const AMENITY_WEIGHTS: Record<string, number> = {
  hospital: 6,
  clinic: 4,
  doctors: 3,
  pharmacy: 3,
  school: 3,
  college: 3,
  university: 4,
  restaurant: 3,
  cafe: 2,
  fast_food: 2,
  supermarket: 3,
  mall: 5,
  parking: 4,
  fuel: 4,
  bus_stop: 3,
  railway_station: 5,
  office: 2,
  bank: 2,
  atm: 1,
  charging_station: 6,
};

function icon(tags?: Record<string, string>) {
  const a = tags?.amenity;
  const s = tags?.shop;

  if (a === "parking") return "🅿";
  if (a === "hospital" || a === "clinic") return "🏥";
  if (a === "restaurant" || a === "fast_food") return "🍔";
  if (a === "bank" || a === "atm") return "🏦";
  if (s === "supermarket") return "🛍";
  return "📍";
}

/* --------------------- COMPONENT --------------------- */

export default function WhereToBuild() {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [stateTotal, setStateTotal] = useState<number | null>(null);
  const [districtTotal, setDistrictTotal] = useState<number | null>(null);
  const [growth, setGrowth] = useState<number | null>(null);

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [amenitiesCount, setAmenitiesCount] = useState(0);
  const [error, setError] = useState("");

  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  /* ✅ Cost Calculator States */
  const [evsPerDay, setEvsPerDay] = useState("");
  const [chargerKw, setChargerKw] = useState("");
  const [batteryKwh, setBatteryKwh] = useState("");

  const [totalCapacity, setTotalCapacity] = useState<number | null>(null);
  const [evsPerHour, setEvsPerHour] = useState<number | null>(null);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);

  /* ---------------- MAP INIT ---------------- */
  useEffect(() => {
    if (mapRef.current) return;
    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

    mapRef.current = new maptilersdk.Map({
      container: "build-map",
      style: maptilersdk.MapStyle.STREETS,
      center: [78.9629, 20.5937],
      zoom: 4,
    });
  }, []);

  /* ---------------- API LOADERS ---------------- */
  async function loadPurchases(): Promise<PurchaseResp> {
    const res = await fetch(
      `/api/ev-purchases?state=${state}&district=${district}`
    );
    return res.json();
  }

  async function loadAmenities() {
    const res = await fetch(
      `/api/amenities?state=${state}&district=${district}`
    );
    return res.json();
  }

  async function loadChargersAll(): Promise<Charger[]> {
    const res = await fetch(`/api/chargers-all`);
    if (!res.ok) return [];
    return res.json();
  }

  async function reverse(lon: number, lat: number) {
    try {
      const res = await fetch(
        `/api/reverse-geocode?lon=${lon}&lat=${lat}`
      );
      const j = await res.json();
      return j?.address || "";
    } catch {
      return "";
    }
  }

/* ---------------- MAIN ANALYZE ---------------- */
async function analyze() {
  setError("");

  if (!state.trim() || !district.trim()) {
    setError("Please enter both state and district");
    return;
  }

  setLoading(true);

  try {
    const [p, aData, cData] = await Promise.all([
      loadPurchases(),
      loadAmenities(),
      loadChargersAll(),
    ]);

    setStateTotal(p.stateTotal ?? null);
    setDistrictTotal(p.districtTotal ?? null);
    setGrowth(p.growthPct ?? null);

    // ✅ CI-safe filtering with type guard
    const pts = Array.isArray(aData?.elements)
      ? aData.elements.filter(
          (e: any): e is { lat: number; lon: number } =>
            Number.isFinite(e.lat) && Number.isFinite(e.lon)
        )
      : [];

    setAmenities(pts);
    setAmenitiesCount(pts.length);
    setChargers(cData);

    const map = mapRef.current;
    if (map && pts.length) {
      const b = new maptilersdk.LngLatBounds();

      pts.forEach((p) => {
        if (Number.isFinite(p.lon) && Number.isFinite(p.lat)) {
          b.extend([p.lon, p.lat] as [number, number]);
        }
      });

      map.fitBounds(b, { padding: 50 });
    }

    const sug = await computeSuggestions(pts, cData, p);
    setSuggestions(sug);
    drawMarkers(sug);
  } catch (e: unknown) {
    setError("District not found or Overpass failed.");
    console.error(e);
  } finally {
    setLoading(false);
  }
}




  /* ---------------- COST CALCULATOR LOGIC ---------------- */
  function calculate() {
    const ev = Number(evsPerDay);
    const kw = Number(chargerKw);
    const batt = Number(batteryKwh);

    if (!ev || !kw || !batt) return;

    const capacity = kw * 24;
    const evHour = ev / 24;
    const energy = ev * batt;
    const cost = energy * 10;

    setTotalCapacity(capacity);
    setEvsPerHour(Number(evHour.toFixed(1)));
    setTotalEnergy(energy);
    setTotalCost(cost);
  }

  /* ---------------- COMPUTE SUGGESTIONS ---------------- */
  async function computeSuggestions(
    pts: Amenity[],
    chargers: Charger[],
    purchase: PurchaseResp
  ) {
    const grid = new Map();

    pts.forEach((p) => {
      const key = `${p.lon!.toFixed(2)},${p.lat!.toFixed(2)}`;
      if (!grid.has(key))
        grid.set(key, {
          lon: p.lon!,
          lat: p.lat!,
          score: 0,
          icons: [],
        });

      const entry = grid.get(key);

      const tag =
        p.tags?.amenity ||
        p.tags?.shop ||
        p.tags?.railway ||
        p.tags?.highway ||
        "poi";

      entry.score += AMENITY_WEIGHTS[tag] ?? 1;

      const ic = icon(p.tags);
      if (entry.icons.length < 4 && !entry.icons.includes(ic)) {
        entry.icons.push(ic);
      }
    });

    const chargerPoints = chargers
      .map((c) =>
        c.AddressInfo?.Latitude && c.AddressInfo?.Longitude
          ? [c.AddressInfo.Longitude, c.AddressInfo.Latitude]
          : null
      )
      .filter(Boolean) as [number, number][];

    for (const [key, b] of grid) {
      const here: [number, number] = [b.lon, b.lat];

      const near = chargerPoints.some(
        (cp) => haversine(here, cp) < 1.0
      );

      if (near) b.score *= 0.65;
      else b.score *= 1.2;
    }

    if (purchase.districtTotal) {
      const scale = clamp(
        1 + purchase.districtTotal / 50000,
        1,
        1.4
      );

      for (const [k, b] of grid) {
        b.score *= scale;
      }
    }

    const ranked = [...grid.values()].sort(
      (a, b) => b.score - a.score
    );

    const selected: any[] = [];
    for (const r of ranked) {
      const tooClose = selected.some(
        (s) => haversine([s.lon, s.lat], [r.lon, r.lat]) < 1.2
      );
      if (!tooClose) selected.push(r);
      if (selected.length >= 5) break;
    }

    for (const s of selected) {
      s.address = await reverse(s.lon, s.lat);
    }

    selected.forEach((loc) => {
      const here: [number, number] = [loc.lon, loc.lat];

      const nearby = pts
        .map((p) => ({
          icon: icon(p.tags),
          name:
            p.tags?.amenity ||
            p.tags?.shop ||
            p.tags?.railway ||
            p.tags?.highway ||
            "amenity",
          dist: haversine(here, [p.lon!, p.lat!]),
        }))
        .filter((x) => x.dist <= 2)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      loc.nearbyAmenities = nearby.map((a) => ({
        icon: a.icon,
        name: a.name,
        distance: Number(a.dist.toFixed(2)),
      }));
    });
/* ✅ NORMALIZE SCORE TO 0–100 SCALE */
const maxScore = Math.max(...selected.map((s) => s.score));
const minScore = Math.min(...selected.map((s) => s.score));

selected.forEach((s) => {
  if (maxScore === minScore) {
    s.normScore = 50; // avoid divide-by-zero
  } else {
    s.normScore = Math.round(
      ((s.score - minScore) / (maxScore - minScore)) * 100
    );
  }
});



    return selected;
  }

  /* ---------------- DRAW MARKERS ---------------- */
  function drawMarkers(sug: any[]) {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    sug.forEach((s, i) => {
      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background = i === 0 ? "red" : "blue";
      el.style.border = "2px solid white";

      const mk = new maptilersdk.Marker({ element: el })
        .setLngLat([s.lon, s.lat])
        .addTo(map);

      markersRef.current.push(mk);
    });
  }

 return (
  <div className="space-y-10 px-6 md:px-20 py-10 bg-bg text-text">
    <h1 className="text-3xl font-bold text-primary">
      Where to Build Your EV Charging Station
    </h1>

    {/* SEARCH BAR */}
    <div className="grid md:grid-cols-3 gap-3 bg-card p-5 rounded-xl border border-border">
      <input
        value={state}
        onChange={(e) => setState(e.target.value)}
        placeholder="State"
        className="p-3 rounded-xl bg-transparent border border-border text-text"
      />
      <input
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        placeholder="District"
        className="p-3 rounded-xl bg-transparent border border-border text-text"
      />
      <button onClick={analyze} className="btn btn-primary">
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </div>

    {error && (
      <div className="p-4 rounded-xl border border-red-500 bg-red-500/20 text-red-200">
        {error}
      </div>
    )}

    {/* 3 STATS CARDS */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-card p-5 rounded-xl border border-border">
        <h3 className="text-primary font-bold">EV Purchases (State)</h3>
        <p className="mt-2">{stateTotal ?? "—"}</p>
      </div>

      <div className="bg-card p-5 rounded-xl border border-border">
        <h3 className="text-primary font-bold">EV Purchases (District)</h3>
        <p className="mt-2">{districtTotal ?? "—"}</p>
      </div>

      <div className="bg-card p-5 rounded-xl border border-border">
        <h3 className="text-primary font-bold">Growth Potential</h3>
        <p className="mt-2">{growth ?? "—"}%</p>
      </div>
    </div>

    {/* AMENITIES SUMMARY */}
    <div className="bg-card p-5 rounded-xl border border-border">
      <h3 className="text-primary font-bold">Nearby Amenities</h3>
      <p className="mt-2 text-muted">
        {amenitiesCount ? `${amenitiesCount} amenities found` : "—"}
      </p>
    </div>

    {/* MAP */}
    <div className="bg-card p-3 rounded-xl border border-border h-[450px]">
      <div id="build-map" className="w-full h-full rounded-xl" />
    </div>

    {/* TOP 5 LOCATIONS */}
    <section>
      <h3 className="text-xl font-bold mb-3 text-primary">
        Top 5 Recommended Locations
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(suggestions.length ? suggestions : Array(5).fill(null)).map((s, i) => (
          <div
            key={i}
            className="card bg-card p-5 rounded-xl border border-border"
          >
            <h4 className="font-semibold text-primary">
              Location {i + 1}
            </h4>

            <ul className="text-sm mt-2 space-y-1 text-text">
              <li>
                <b>Location Score:</b> {s?.normScore ?? "—"}/100
              </li>
              <li>
                <b>EV Demand:</b> {districtTotal ?? "—"}
              </li>
              <li>
                <b>Traffic:</b> —
              </li>
              <li>
                <b>Charger Gap:</b>{" "}
                {chargers.length ? "Moderate" : "High"}
              </li>

              <li className="mt-2">
                <b>Nearest Amenities:</b>
                <ul className="ml-4 mt-1 space-y-1 text-xs text-muted">
                  {s?.nearbyAmenities?.length ? (
                    s.nearbyAmenities.map((a: any, idx: number) => (
                      <li key={idx}>
                        {a.icon} {a.name.replace(/_/g, " ")} • {a.distance} km
                      </li>
                    ))
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </li>

              <li>
                <b>Recommended:</b> AC/DC
              </li>
            </ul>

            <button className="mt-3 w-full btn btn-outline">
              View on Map
            </button>
          </div>
        ))}
      </div>
    </section>

    {/* COST & ENERGY CALCULATOR */}
    <section className="space-y-3">
      <h3 className="text-xl font-bold text-primary">
        Cost & Energy Calculator
      </h3>

      <div className="card bg-card p-5 rounded-xl border border-border grid md:grid-cols-4 gap-3">
        <input
          value={evsPerDay}
          onChange={(e) => setEvsPerDay(e.target.value)}
          placeholder="No. of EVs / day"
          className="p-3 rounded-xl bg-transparent border border-border"
        />
        <input
          value={chargerKw}
          onChange={(e) => setChargerKw(e.target.value)}
          placeholder="Charger Rating (kW)"
          className="p-3 rounded-xl bg-transparent border border-border"
        />
        <input
          value={batteryKwh}
          onChange={(e) => setBatteryKwh(e.target.value)}
          placeholder="Battery Capacity (kWh)"
          className="p-3 rounded-xl bg-transparent border border-border"
        />
        <button onClick={calculate} className="btn btn-primary">
          Calculate
        </button>
      </div>
    </section>
  </div>
);
}
