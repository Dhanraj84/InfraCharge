"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { 
  MapPin, Brain, Activity, BatteryCharging, TrendingUp,
  Map as MapIcon, Sun, Zap, IndianRupee, Clock, Navigation
} from "lucide-react";

maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  /* ✅ Cost Calculator States */
  const [evsPerDay, setEvsPerDay] = useState("");
  const [chargerKw, setChargerKw] = useState("");
  const [batteryKwh, setBatteryKwh] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("20");

  const [totalCapacity, setTotalCapacity] = useState<number | null>(null);
  const [evsPerHour, setEvsPerHour] = useState<number | null>(null);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [roiMonths, setRoiMonths] = useState<number | null>(null);
  const [landArea, setLandArea] = useState("");
const [solarPanels, setSolarPanels] = useState<number | null>(null);
const [solarEnergyKwh, setSolarEnergyKwh] = useState<number | null>(null);
const [evsFromSolar, setEvsFromSolar] = useState<number | null>(null);

  /* ---------------- MAP INIT ---------------- */
  useEffect(() => {
    if (mapRef.current) return;
    
    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";
    mapRef.current = new maptilersdk.Map({
      container: mapContainerRef.current as HTMLElement,
      style: maptilersdk.MapStyle.STREETS,
      center: [78.9629, 20.5937],
      zoom: 4,
    });
    
    mapRef.current.on("load", () => {
      console.log("🗺 Map loaded, POI layer ready");
      if (mapRef.current) mapRef.current.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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
      `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    );

    const data = await res.json();

    return data?.features?.[0]?.place_name || "Address not available";
  } catch {
    return "Address not available";
  }
}

async function zoomToPlace(map: maptilersdk.Map, place: string) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const res = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(place)}.json?key=${key}`
  );

  const data = await res.json();

  if (!data?.features?.length) {
    console.warn("❌ Geocode failed for:", place);
    return false; // 🔴 tell caller it failed
  }

  const [lon, lat] = data.features[0].center;

 map.flyTo({
  center: [lon, lat],
  zoom: 15,
  essential: true,
});

  await new Promise((res) => map.once("idle", res));

  return true; // ✅ success
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
    const [p, cData] = await Promise.all([
      loadPurchases(),
      loadChargersAll(),
    ]);

    setStateTotal(p.stateTotal ?? null);
    setDistrictTotal(p.districtTotal ?? null);
    setGrowth(p.growthPct ?? null);
    setChargers(cData);

    const map = mapRef.current;
    if (!map) return;

    // 🟢 Get district center
    const geoRes = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(
        `${district}, ${state}, India`
      )}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    );

    const geo = await geoRes.json();

    if (!geo?.features?.length) {
      setError("Location not found. Use proper district name.");
      return;
    }

    const [lon, lat] = geo.features[0].center;

    map.flyTo({ center: [lon, lat], zoom: 12 });

    // 🟢 Simulated amenities around district
    const pts: Amenity[] = [];

    const AMENITY_TYPES = [
      "restaurant",
      "hospital",
      "school",
      "supermarket",
      "fuel",
      "parking",
      "bank",
      "bus_stop",
    ];

    for (let i = 0; i < 120; i++) {
      const offsetLat = lat + (Math.random() - 0.5) * 0.08;
      const offsetLon = lon + (Math.random() - 0.5) * 0.08;

      pts.push({
        id: i,
        lat: offsetLat,
        lon: offsetLon,
        tags: {
          amenity:
            AMENITY_TYPES[
              Math.floor(Math.random() * AMENITY_TYPES.length)
            ],
        },
      });
    }

    setAmenities(pts);
    setAmenitiesCount(pts.length);

    const sug = await computeSuggestions(pts, cData, p);
    setSuggestions(sug);
    drawMarkers(sug);
  } catch (e) {
    setError("Something went wrong. Try again.");
    console.error(e);
  } finally {
    setLoading(false);
  }
}




  /* ---------------- COST CALCULATOR LOGIC ---------------- */
  function calculate() {
    const ev = Number(evsPerDay);
    const kw = Number(chargerKw) || 50; // default 50kW if empty
    const batt = Number(batteryKwh) || 30; // default 30kWh if empty
    const price = Number(pricePerKwh) || 20; // default ₹20

    if (!ev) {
      alert("Please enter the number of EVs per day");
      return;
    }

    const capacity = kw * 24;      // total kWh per day charger can deliver
    const evHour = ev / 24;        // EVs per hour
    const energy = ev * batt;      // total kWh demand per day
    const cost = energy * 10;      // ₹10 per kWh estimate for grid cost
    
    // Revenue & ROI
    const revenueDaily = energy * price;
    const profitDaily = revenueDaily - cost;
    const revenueMonthly = profitDaily * 30;
    
    const assumedCapEx = 1500000; // 15 Lakhs setup cost
    const roi = profitDaily > 0 ? Math.ceil(assumedCapEx / revenueMonthly) : 0;

    setTotalCapacity(capacity);
    setEvsPerHour(Number(evHour.toFixed(1)));
    setTotalEnergy(energy);
    setTotalCost(cost);
    setDailyRevenue(revenueDaily);
    setMonthlyRevenue(revenueMonthly);
    setRoiMonths(roi);
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
      const mk = new maptilersdk.Marker({
        color: i === 0 ? "#ef4444" : "#3b82f6",
      })
        .setLngLat([s.lon, s.lat])
        .addTo(map);

      markersRef.current.push(mk);
    });

    // Fix map cutting issue on analysis complete
    setTimeout(() => {
      map.resize();
    }, 500);
  }
function flyToLocation(lon: number, lat: number, address?: string, score?: number) {
  const map = mapRef.current;
  if (!map) return;

  // Removed automatic window scroll behavior per user request


  map.flyTo({
    center: [lon, lat],
    zoom: 15,
    essential: true,
  });

  // No need to reset marker styles because we are using default map pins now

  const selected = markersRef.current.find((m) => {
    const pos = m.getLngLat();
    return pos.lng === lon && pos.lat === lat;
  });

  if (selected) {
    // Create the Popup Card map pin overlay
const popup = new maptilersdk.Popup({
  offset: 25,
  closeButton: true,
  closeOnClick: false,
})
  .setLngLat([lon, lat])
  .setHTML(`
    <div style="
      font-size:14px !important;
      line-height:1.6 !important;
      color:#000000 !important;
      background:#ffffff !important;
      padding:14px 16px !important;
      border-radius:12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
      max-width:280px !important;
      font-family: ui-sans-serif, system-ui, sans-serif !important;
      opacity: 1 !important;
    ">
      <div style="margin-bottom:8px; display:flex; gap:6px; font-weight:600; color:#000000 !important;">
        <span>📍</span> <span style="color:#000000 !important;">${address || "Recommended Location"}</span>
      </div>
      <div style="font-weight:700; color:#ef4444 !important; border-top: 1px solid #e2e8f0 !important; padding-top: 8px;">
        ⭐ Location Score: ${score ?? "--"}/100
      </div>
    </div>
  `);

popup.addTo(map);
  }
}
 return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 py-6 md:py-10 bg-bg text-text">
    <div>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
        ⚡ Where to Build Your <span className="text-red-500">EV Charging Station</span>
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-muted mt-1">
        AI-powered insights to choose the best EV charging location
      </p>
    </div>

    {/* STEP 1: INPUT SECTION */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-card p-4 sm:p-6 rounded-xl border border-border shadow-lg relative z-10 transition-all duration-300">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none" />
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
          className="w-full p-3 pl-12 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="relative">
        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none" />
        <input
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="District"
          className="w-full p-3 pl-12 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <button 
        onClick={analyze} 
        disabled={loading}
        className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? "Analyzing..." : "Analyze Location"}
      </button>
    </div>

    {error && (
      <div className="p-4 rounded-xl border border-red-500 bg-red-500/20 text-red-200">
        {error}
      </div>
    )}

    {/* STEP 2: ANALYSIS SUMMARY & AI INSIGHT */}
    {(stateTotal !== null || loading) && (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* EV Demand Card */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-[0_0_15px_rgba(255,255,255,0.03)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:bg-orange-500 transition-colors"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-primary font-bold tracking-wide">EV Demand</h3>
            </div>
            <p className="text-2xl font-bold text-text mt-2">
              {districtTotal ? (districtTotal > 5000 ? "High" : districtTotal > 2000 ? "Medium" : "Low") : "—"}
            </p>
            <p className="text-sm text-muted mt-1">{districtTotal ? `${districtTotal.toLocaleString()} registered EVs` : "—"}</p>
          </div>

          {/* Charger Gap Card */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-[0_0_15px_rgba(255,255,255,0.03)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-400 transition-colors"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <h3 className="text-primary font-bold tracking-wide">Charger Gap</h3>
            </div>
            <p className="text-2xl font-bold text-text mt-2">
              {chargers.length ? "Moderate" : "High"}
            </p>
            <p className="text-sm text-muted mt-1">{chargers.length} active stations nearby</p>
          </div>

          {/* Growth Rate Card */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-[0_0_15px_rgba(255,255,255,0.03)] hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 group-hover:bg-green-400 transition-colors"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-primary font-bold tracking-wide">Growth Rate</h3>
            </div>
            <p className="text-2xl font-bold text-text mt-2">
              {growth ? `+${growth}%` : "—"}
            </p>
            <p className="text-sm text-muted mt-1">YoY EV adoption surge</p>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 backdrop-blur-md p-6 rounded-2xl flex items-start gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-500 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary mb-1">🧠 AI Recommendation</h3>
            <p className="text-text/90 leading-relaxed">
              Based on the <b>{growth ? `+${growth}%` : "high"}</b> YoY growth rate and the existing <b>{chargers.length ? "moderate" : "huge"}</b> charger gap in {district || "this area"}, it is highly recommended to install a fast-charging DC station. Ensure nearby amenities like dining or shopping to maximize station dwell-time revenue.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* STEP 3: MAP & TOP LOCATIONS */}
    <section className="flex flex-col lg:flex-row gap-6 mt-10">
      
      {/* MAP COLUMN */}
      <div className="flex flex-col space-y-3 w-full lg:w-[60%]">
        <h3 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
          <MapIcon className="w-6 h-6" /> Location Map
        </h3>
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-card p-2 rounded-xl border border-border overflow-hidden shadow-lg relative group flex flex-col">
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/20 transition-colors pointer-events-none z-10 rounded-2xl"></div>
          <div ref={mapContainerRef} className="w-full h-full relative z-0 flex-1 rounded-xl overflow-hidden bg-black/5" />
        </div>
      </div>

      {/* TOP 5 LOCATIONS COLUMN */}
      <div className="flex flex-col space-y-3 w-full lg:w-[40%]">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Top 5 Locations
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px] lg:max-h-[600px] custom-scrollbar">
          {(suggestions.length ? suggestions : Array(5).fill(null)).map((s, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={i}
                className={`card w-full p-4 sm:p-6 bg-card rounded-xl border ${isFirst ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-border shadow-sm'} hover:scale-[1.02] transition-all duration-300 relative overflow-hidden`}
              >
                {/* Score Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-border">
                  <div className={`h-full transition-all duration-1000 ${isFirst ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-green-500'}`} style={{ width: s?.normScore ? `${s.normScore}%` : '0%' }}></div>
                </div>

                <div className="flex items-start justify-between">
                  <h4 className="font-extrabold text-lg text-primary flex items-start gap-3">
                    <span className={`flex shrink-0 items-center justify-center w-6 h-6 rounded-full text-xs text-white ${isFirst ? 'bg-red-500' : 'bg-blue-500'}`}>{i + 1}</span>
                    <span className="leading-tight break-words">{s?.address?.split(',')[0] || `Location ${i + 1}`}</span>
                  </h4>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${isFirst ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {s?.normScore ?? "—"} / 100
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-bg py-2 px-3 rounded-xl border border-border">
                    <span className="text-muted block text-xs">EV Demand</span>
                    <span className="font-semibold text-text">{districtTotal ?? "—"}</span>
                  </div>
                  <div className="bg-bg py-2 px-3 rounded-xl border border-border">
                    <span className="text-muted block text-xs">Charger Gap</span>
                    <span className="font-semibold text-text">{chargers.length ? "Moderate" : "High"}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-xs text-muted block mb-2 font-semibold">Nearest Amenities</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {s?.nearbyAmenities?.length ? (
                      s.nearbyAmenities.slice(0, 3).map((a: any, idx: number) => (
                        <span key={idx} className="bg-bg border border-border px-2 py-1.5 rounded-lg text-text flex items-center gap-1 shadow-sm">
                          {a.icon} <span className="capitalize">{a.name.replace(/_/g, " ")}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-muted italic">Analyzing...</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => s && flyToLocation(s.lon, s.lat, s.address, s.normScore)}
                  disabled={!s}
                  className="mt-5 w-full py-2.5 rounded-xl border border-border bg-bg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] focus:ring-2 focus:ring-white focus:outline-none focus:ring-offset-2 focus:ring-offset-bg transition-all font-semibold text-text flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MapPin className="w-4 h-4" /> View on Map
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* STEP 4: SOLAR SIZING FROM LAND AREA */}
<section className="space-y-4 mt-6">
  <h3 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
    <Sun className="w-6 h-6 text-yellow-500" /> Solar & Energy Planning
  </h3>

  <div className="card w-full bg-card p-4 sm:p-6 rounded-xl border border-border shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300 hover:scale-[1.02]">
    <input 
      value={landArea}
      onChange={(e) => setLandArea(e.target.value)}
      placeholder="Available Land Area (sq meters)"
      className="p-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-yellow-500"
    />

  <button
  className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold tracking-wide shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300"
  onClick={async () => {
    if (!landArea) {
      alert("Enter land area");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ML_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(
        `${apiUrl}/solar-analysis?land_area=${landArea}`
      );

      // ✅ CHECK RESPONSE
      if (!res.ok) {
        throw new Error("API failed");
      }

      const data = await res.json();

      // ✅ SET DATA
      setSolarPanels(data.total_panels);
      setSolarEnergyKwh(data.energy_generated_kW);
      setEvsFromSolar(data.evs_supported_per_day);

    } catch (err) {
      console.error("REAL ERROR:", err);
      alert("ML server error");
    }
  }}
>
  Calculate Solar
</button>
  </div>

  {solarPanels !== null && (
    <div className="bg-card p-6 rounded-2xl border border-border mt-4">
      <h4 className="text-primary font-bold mb-5 text-lg tracking-wide">
        Solar Plant Estimation
      </h4>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-bg p-4 rounded-xl border border-border">
          <p className="text-primary text-xs mb-1 tracking-wide">
            Solar Panels Required
          </p>
          <p className="text-lg font-semibold text-text">
            {solarPanels.toLocaleString()}
          </p>
        </div>

        <div className="bg-bg p-4 rounded-xl border border-border">
          <p className="text-primary text-xs mb-1 tracking-wide">
            Energy Generated
          </p>
          <p className="text-lg font-semibold text-text">
            {solarEnergyKwh?.toLocaleString()} kWh/day
          </p>
        </div>

        <div className="bg-bg p-4 rounded-xl border border-border">
          <p className="text-primary text-xs mb-1 tracking-wide">
            EVs Supported per Day
          </p>
          <p className="text-lg font-semibold text-text">
            {evsFromSolar}
          </p>
        </div>
      </div>
    </div>
  )}
</section>

    {/* STEP 5: PROFIT ESTIMATOR */}
    <section className="space-y-4 mt-10">
      <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
        <IndianRupee className="w-6 h-6 text-green-500" /> Business Profit Estimator
      </h3>

      <div className="card bg-card p-6 rounded-2xl border border-border shadow-[0_0_15px_rgba(255,255,255,0.02)] grid md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="relative">
          <label className="text-xs text-muted mb-1 block">Expected EVs / day</label>
          <input
            value={evsPerDay}
            onChange={(e) => setEvsPerDay(e.target.value)}
            placeholder="e.g. 50"
            className="w-full p-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="relative">
          <label className="text-xs text-muted mb-1 block">Selling Price / kWh (₹)</label>
          <input
            value={pricePerKwh}
            onChange={(e) => setPricePerKwh(e.target.value)}
            placeholder="e.g. 20"
            className="w-full p-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="relative">
          <label className="text-xs text-muted mb-1 block">Charger Rating (kW)</label>
          <input
            value={chargerKw}
            onChange={(e) => setChargerKw(e.target.value)}
            placeholder="e.g. 50"
            className="w-full p-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="relative">
          <label className="text-xs text-muted mb-1 block">Avg Battery (kWh)</label>
          <input
            value={batteryKwh}
            onChange={(e) => setBatteryKwh(e.target.value)}
            placeholder="e.g. 30"
            className="w-full p-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={calculate} 
            className="w-full p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold tracking-wide shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300 h-[50px]"
          >
            Calculate ROI
          </button>
        </div>
      </div>
       
      {/* ✅ RESULT CARDS */}
      {totalCapacity !== null && (
        <div className="bg-card p-6 rounded-2xl border border-border mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-primary font-bold mb-5 text-lg tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Revenue & ROI Projection
          </h4>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DAILY REVENUE */}
            <div className="bg-bg p-5 rounded-2xl border border-border shadow-[0_0_15px_rgba(255,255,255,0.02)] group hover:-translate-y-1 transition-all duration-300">
              <p className="text-muted text-xs mb-1 tracking-wide font-semibold">Daily Revenue</p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded-lg"><IndianRupee className="w-4 h-4 text-green-500" /></div>
                <p className="text-2xl font-bold text-text">₹ {dailyRevenue?.toLocaleString()}</p>
              </div>
            </div>

            {/* MONTHLY PROFIT */}
            <div className="bg-bg p-5 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/20 to-transparent rounded-bl-full pointer-events-none"></div>
              <p className="text-green-500 text-xs mb-1 tracking-wide font-bold">Estimated Monthly Profit</p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 rounded-lg"><TrendingUp className="w-4 h-4 text-green-500" /></div>
                <p className="text-2xl font-extrabold text-white">₹ {monthlyRevenue?.toLocaleString()}</p>
              </div>
            </div>

            {/* ROI MONTHS */}
            <div className="bg-bg p-5 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] group hover:-translate-y-1 transition-all duration-300">
              <p className="text-yellow-500 text-xs mb-1 tracking-wide font-bold">Est. Break-even (ROI)</p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/20 rounded-lg"><Clock className="w-4 h-4 text-yellow-500" /></div>
                <p className="text-2xl font-extrabold text-white">{roiMonths} <span className="text-sm text-muted font-normal">months</span></p>
              </div>
            </div>
            
            {/* ENERGY DEMAND (PREV) */}
            <div className="bg-bg p-5 rounded-2xl border border-border group hover:-translate-y-1 transition-all duration-300">
              <p className="text-muted text-xs mb-1 tracking-wide font-semibold">Daily Energy Demand</p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg"><Zap className="w-4 h-4 text-blue-500" /></div>
                <p className="text-xl font-bold text-text">{totalEnergy?.toLocaleString()} <span className="text-sm font-normal text-muted">kWh</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  </div>
);
}
