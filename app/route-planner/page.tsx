"use client";

import { useCallback, useEffect, useMemo, useState,useRef  } from "react";
import maplibregl from "maplibre-gl";

// import Map from "@vis.gl/react-maplibre";
import {
  Map as MapView,
  Marker,
  Source,
  Layer,
  NavigationControl,
} from "@vis.gl/react-maplibre";


import "maplibre-gl/dist/maplibre-gl.css";

type LngLat = { lon: number; lat: number };


const MT_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY!;
const OW_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY!;
const OCM_KEY = process.env.NEXT_PUBLIC_OPENCHARGEMAP_KEY || "";

// ------------------ Helpers
const fmtKm = (m: number) => (m / 1000).toFixed(1) + " km";
const fmtMin = (s: number) => Math.round(s / 60) + " min";
const fmtHourMin = (totalSec: number) => {
  const totalMin = Math.round(totalSec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h} h ${m} min`;
};
function middleOfLine(coords: [number, number][]) {
  const mid = Math.floor(coords.length / 2);
  return { lon: coords[mid][0], lat: coords[mid][1] };
}
function getArrivalBatteryByDistance(meters: number) {
  const km = meters / 1000;

  if (km < 50) return "60 %";
  if (km < 150) return "30 %";
  return "10 %";
}
function distanceKm(a: LngLat, b: LngLat) {
  const R = 6371; // Earth radius in km

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function sampleRoutePoints(
  coords: [number, number][],
  step = 20
): LngLat[] {
  const points: LngLat[] = [];

  for (let i = 0; i < coords.length; i += step) {
    points.push({
      lon: coords[i][0],
      lat: coords[i][1],
    });
  }

  return points;
}

// Simple EV energy model
const CONSUMPTION_WH_PER_KM = 160;
const BATTERY_BUFFER_PCT = 10;
const ELECTRICITY_PRICE = 8;
const PETROL_PRICE = 105;
const ICE_KM_PER_L = 15;
const ICE_CO2_G_PER_KM = 120;

export default function RoutePlanner() {
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Inputs
  const [srcText, setSrcText] = useState("");
  const [dstText, setDstText] = useState("");

  // Coordinates
  const [srcPoint, setSrcPoint] = useState<LngLat | null>(null);
  const [dstPoint, setDstPoint] = useState<LngLat | null>(null);

  // Route data
  const [routeGeoJSON, setRouteGeoJSON] = useState<any | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Sidebar
  const [weatherImpact, setWeatherImpact] = useState<string>("—");
  const [batteryNeeded, setBatteryNeeded] = useState<string>("—");
  const [arrivalBattery, setArrivalBattery] = useState<string>("—");
  const [energyKWh, setEnergyKWh] = useState<string>("—");
  const [whPerKm, setWhPerKm] = useState<string>(`${CONSUMPTION_WH_PER_KM} Wh/km`);
  const [chargingStops, setChargingStops] = useState<any[]>([]);
  const [topStations, setTopStations] = useState<any[]>([]);
const [chargingRouteGeoJSON, setChargingRouteGeoJSON] = useState<any | null>(null);
const [activeStation, setActiveStation] = useState<any | null>(null);


  // 🔋 Charging intelligence (NEW)
const [nearbyStations, setNearbyStations] = useState<any[]>([]);
const [totalRouteStations, setTotalRouteStations] = useState(0);
const [passedStations, setPassedStations] = useState(0);
const [remainingStations, setRemainingStations] = useState(0);

  const [evCost, setEvCost] = useState<string>("—");
  const [fuelCost, setFuelCost] = useState<string>("—");
  const [savings, setSavings] = useState<string>("—");
  const [co2Saved, setCo2Saved] = useState<string>("—");

  // Map View
  const [viewState, setViewState] = useState({
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 10,
  });

// const mapRef = useRef<any>(null);

  // ------------------ Auto GPS source
  useEffect(() => {
    if (!srcPoint && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const p = { lon: pos.coords.longitude, lat: pos.coords.latitude };
        setSrcPoint(p);
        mapRef.current?.flyTo({
  center: [p.lon, p.lat],
  zoom: 12,
  speed: 1.2,
});


        try {
          const url = `https://api.maptiler.com/geocoding/${p.lon},${p.lat}.json?key=${MT_KEY}`;
          const r = await fetch(url);
          const j = await r.json();
          setSrcText(j?.features?.[0]?.place_name || "");
        } catch {}

mapRef.current?.flyTo({
  center: [p.lon, p.lat],
  zoom: 12,
  speed: 1.2,
});
      });
    }
  }, [srcPoint]);

  // ------------------ Geocoding
  const geocode = useCallback(async (q: string): Promise<LngLat | null> => {
    if (!q) return null;

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?limit=1&key=${MT_KEY}`;
    const r = await fetch(url);
    const j = await r.json();
    const f = j?.features?.[0];

    if (!f || !f.center) return null;
    return { lon: f.center[0], lat: f.center[1] };
  }, []);

  // ------------------ Routing (OSRM)
  const getRoute = useCallback(async (a: LngLat, b: LngLat) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const j = await r.json();
    const route = j?.routes?.[0];

    if (!route) throw new Error("No route");

    return {
      geojson: {
        type: "Feature",
        geometry: route.geometry,
        properties: {},
      },
      distance: route.distance,
      duration: route.duration,
    };
  }, []);

  // ------------------ Weather
  const getWeatherImpact = useCallback(async (p: LngLat) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${p.lat}&lon=${p.lon}&units=metric&appid=${OW_KEY}`;
    const r = await fetch(url);
    const j = await r.json();

    const desc = j?.weather?.[0]?.description || "clear";
    const wind = j?.wind?.speed || 0;
    const rain = (j?.rain && (j.rain["1h"] || j.rain["3h"])) || 0;

    let impact = "Low";
    if (/storm|snow|thunder|sleet/i.test(desc) || wind > 12 || rain > 2) impact = "High";
    else if (/rain|drizzle|fog|mist|haze/i.test(desc) || wind > 7) impact = "Medium";

    return `Weather: ${desc}, Wind ${wind} m/s → Impact: ${impact}`;
  }, []);

  // ------------------ OpenChargeMap v4 (FIXED ✅)
 const getCharging = useCallback(async (p: LngLat) => {
  // ✅ ONLY CHANGE: use backend route
const url = `/api/chargers?lat=${p.lat}&lon=${p.lon}`;

  const r = await fetch(url);

  if (!r.ok) {
    console.error("OCM ERROR:", r.status, await r.text());
    return [];
  }

  const j = await r.json();

return j.map((x: any) => ({
  id: x.ID,
  title: x.AddressInfo?.Title,
  lat: x.AddressInfo?.Latitude,
  lon: x.AddressInfo?.Longitude,
  distanceKm: x.AddressInfo?.Distance || null,

  addressLine: x.AddressInfo?.AddressLine1 || "",
  city: x.AddressInfo?.Town || "",
  state: x.AddressInfo?.StateOrProvince || "",
  postcode: x.AddressInfo?.Postcode || "",

  powerKW: x.Connections?.[0]?.PowerKW || null,
  operator: x.OperatorInfo?.Title || "",
}));

}, []);


  // ------------------ Energy + Costs
  const computeEnergyAndCost = useCallback((meters: number) => {
    const km = meters / 1000;
    const energy = (km * CONSUMPTION_WH_PER_KM) / 1000;
    const withBuffer = energy * (1 + BATTERY_BUFFER_PCT / 100);

    setEnergyKWh(energy.toFixed(1) + " kWh");
    setBatteryNeeded(withBuffer.toFixed(1) + " kWh");
setArrivalBattery(getArrivalBatteryByDistance(meters));

    const ev_cost = energy * ELECTRICITY_PRICE;
    const fuel_cost = (km / ICE_KM_PER_L) * PETROL_PRICE;

    setEvCost("₹ " + ev_cost.toFixed(0));
    setFuelCost("₹ " + fuel_cost.toFixed(0));
    setSavings("₹ " + (fuel_cost - ev_cost).toFixed(0));
    setCo2Saved((ICE_CO2_G_PER_KM * km).toFixed(0) + " g");

  }, []);

 // ------------------ PLAN ROUTE
const planRoute = useCallback(async () => {
  try {
    const a = srcPoint ?? (await geocode(srcText));
    const b = await geocode(dstText);

    if (!a || !b) {
      alert("Please enter valid locations");
      return;
    }

    setSrcPoint(a);
    setDstPoint(b);

    const r = await getRoute(a, b);

    setRouteGeoJSON({
  type: "FeatureCollection",
  features: [r.geojson],
});

    setDistance(r.distance);
    setDuration(r.duration);
   

    // Fit map
 const coords = r.geojson.geometry.coordinates as [number, number][];
 const minLon = Math.min(...coords.map((c) => c[0]));
const maxLon = Math.max(...coords.map((c) => c[0]));
const minLat = Math.min(...coords.map((c) => c[1]));
const maxLat = Math.max(...coords.map((c) => c[1]));

mapRef.current?.fitBounds(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  {
    padding: 80,
    duration: 1200,
  }
);


try {
  const minLon = Math.min(...coords.map((c) => c[0]));
  const maxLon = Math.max(...coords.map((c) => c[0]));
  const minLat = Math.min(...coords.map((c) => c[1]));
  const maxLat = Math.max(...coords.map((c) => c[1]));

  mapRef.current?.fitBounds(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  {
    padding: 80,
    duration: 1200,
  }
);

} catch {}

const mid = middleOfLine(coords);
const weather = await getWeatherImpact(mid);
setWeatherImpact(weather);

// 🔑 STRATEGIC POINTS (prevents 429)
const strategicPoints = sampleRoutePoints(coords, 80); // every ~8–10 km


const collected: any[] = [];

try {
  for (const p of strategicPoints) {
    const stations = await getCharging(p);

    for (const s of stations) {
if (typeof s.lat === "number" && typeof s.lon === "number") {
  collected.push(s);
}

    }
  }

  // ✅ spatial deduplication (NOT ID-based)
  const unique = collected.filter(
    (s, i, arr) =>
      i === arr.findIndex(
        (x) =>
          Math.abs(x.lat - s.lat) < 0.001 &&
          Math.abs(x.lon - s.lon) < 0.001
      )
  );

  setChargingStops(unique);
  setTotalRouteStations(unique.length);
  // ✅ PICK TOP 5 BEST STATIONS (BY POWER → FALLBACK RANDOM)
const ranked = [...unique].sort((a, b) => {
  const pA = a.powerKW ?? 0;
  const pB = b.powerKW ?? 0;
  return pB - pA;
});

setTopStations(ranked.slice(0, 5));
console.log("TOTAL STATIONS:", unique.length);
console.log("TOP STATIONS:", ranked.slice(0, 5));



} catch (err) {
  console.error("Charging fetch failed", err);
  setChargingStops([]);
}


    computeEnergyAndCost(r.distance);

  } catch (err) {
    console.error(err);
    alert("Failed to plan route. Check API keys or network.");
  }
}, [
  srcText,
  dstText,
  srcPoint,
  geocode,
  getRoute,
  getWeatherImpact,
  getCharging,
  computeEnergyAndCost,
]);
// // ------------------ DRAW ROUTE ON MAP
// useEffect(() => {
//   if (!mapRef.current || !routeGeoJSON) return;

//   const map = mapRef.current;

//   if (map.getLayer("route-line")) {
//     map.removeLayer("route-line");
//   }
//   if (map.getSource("route")) {
//     map.removeSource("route");
//   }

//   map.addSource("route", {
//     type: "geojson",
//     data: routeGeoJSON,
//   });

//   map.addLayer({
//     id: "route-line",
//     type: "line",
//     source: "route",
//     layout: {
//       "line-join": "round",
//       "line-cap": "round",
//     },
//     paint: {
//       "line-color": "#3B82F6",
//       "line-width": 5,
//     },
//   });
// }, [routeGeoJSON]);

// ------------------ Charging intelligence (GPS based)
useEffect(() => {
  if (!srcPoint || chargingStops.length === 0) return;

  const nearby = chargingStops.filter((s) =>
    distanceKm(srcPoint, { lat: s.lat, lon: s.lon }) <= 10
  );

  const passed = chargingStops.filter(
    (s) => distanceKm(srcPoint, { lat: s.lat, lon: s.lon }) < 1
  );

  setNearbyStations(nearby);
  setPassedStations(passed.length);
  setRemainingStations(
    Math.max(chargingStops.length - passed.length, 0)
  );
}, [srcPoint, chargingStops]);


  // ------------------ Map Style
  const mapStyle = useMemo(
    () => `https://api.maptiler.com/maps/streets/style.json?key=${MT_KEY}`,
    []
  );

const routeLayer = useMemo(
  () => ({
    id: "route-line",
    type: "line",
    source: "route-src",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#3B82F6",
      "line-width": 6,
      "line-opacity": 1,
    },
  }),
  []
);
const chargingRouteLayer = useMemo(
  () => ({
    id: "charging-route-line",
    type: "line",
    source: "charging-route-src",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#EF4444", // 🔴 Red route
      "line-width": 5,
      "line-opacity": 0.9,
    },
  }),
  []
);
const navigateToStation = async (station: any) => {
  
  if (!srcPoint || !station) return;

  setActiveStation(station);

  const r = await getRoute(srcPoint, {
    lat: station.lat,
    lon: station.lon,
  });

  setChargingRouteGeoJSON({
    type: "FeatureCollection",
    features: [r.geojson],
  });
  const coords = r.geojson.geometry.coordinates;
if (coords?.length) {
    mapRef.current?.easeTo({
    center: [station.lon, station.lat],
    zoom: 13,
    pitch: 45,
    bearing: 0,
    duration: 1000,
  });
}
  const lons = coords.map((c: number[]) => c[0]);
  const lats = coords.map((c: number[]) => c[1]);

mapRef.current?.easeTo({
  center: [station.lon, station.lat],
  zoom: 13,
  pitch: 45,
  bearing: 0,
  duration: 1000,
});

};


// ------------------ UI

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      <section className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold">EV Route Planner</h1>
          <p className="opacity-90">
            Plan your trip with real-time traffic, weather updates, battery prediction & charging stops.
          </p>
        </header>

        {/* Inputs */}
        <div className="card grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input className="p-3 rounded-xl bg-transparent border border-white/20"
            value={srcText} onChange={(e) => setSrcText(e.target.value)} placeholder="Source (GPS auto)" />
          <input className="p-3 rounded-xl bg-transparent border border-white/20"
            value={dstText} onChange={(e) => setDstText(e.target.value)} placeholder="Destination" />
          <button onClick={planRoute} className="btn btn-primary">Plan Route</button>
        </div>

        {/* Map */}
        <div className="h-[480px] card p-0 overflow-hidden">
<MapView
  mapLib={maplibregl}
  mapStyle={mapStyle}
  initialViewState={{
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 10,
  }}
  onLoad={(e) => {
    mapRef.current = e.target;
  }}
  style={{ width: "100%", height: "100%" }}
  dragPan
  scrollZoom
  doubleClickZoom
  touchZoomRotate
  keyboard
>
  <NavigationControl position="top-left" />

  {/* 🔵 SOURCE MARKER */}
  {srcPoint && (
    <Marker longitude={srcPoint.lon} latitude={srcPoint.lat} anchor="bottom">
      <div className="relative">
        <div className="w-7 h-7 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-full" />
        </div>
        <div
          className="absolute left-1/2 -bottom-3 w-0 h-0
          border-l-[7px] border-r-[7px] border-t-[12px]
          border-l-transparent border-r-transparent border-t-blue-600
          -translate-x-1/2"
        />
      </div>
    </Marker>
  )}

  {/* 🔴 DESTINATION MARKER */}
  {dstPoint && (
    <Marker longitude={dstPoint.lon} latitude={dstPoint.lat} anchor="bottom">
      <div className="relative">
        <div className="w-7 h-7 bg-red-600 rounded-full shadow-lg flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-full" />
        </div>
        <div
          className="absolute left-1/2 -bottom-3 w-0 h-0
          border-l-[7px] border-r-[7px] border-t-[12px]
          border-l-transparent border-r-transparent border-t-red-600
          -translate-x-1/2"
        />
      </div>
    </Marker>
  )}

  {/* 🔴 ACTIVE CHARGING STATION */}
  {activeStation && (
    <Marker
      longitude={activeStation.lon}
      latitude={activeStation.lat}
      anchor="bottom"
    >
      <div className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg shadow">
        Charging Stop
      </div>
    </Marker>
  )}

  {/* 🟦 MAIN ROUTE */}
  {routeGeoJSON && (
    <Source id="route-src" type="geojson" data={routeGeoJSON}>
      <Layer {...routeLayer} />
    </Source>
  )}

  {/* 🔴 NAVIGATION TO CHARGER ROUTE */}
  {chargingRouteGeoJSON && (
    <Source
      id="charging-route-src"
      type="geojson"
      data={chargingRouteGeoJSON}
    >
      <Layer {...chargingRouteLayer} />
    </Source>
  )}

  {/* 🟢 CHARGING STATIONS */}
  {chargingStops
    .filter((c) => typeof c.lon === "number" && typeof c.lat === "number")
    .map((c) => (
      <Marker
        key={c.id}
        longitude={c.lon}
        latitude={c.lat}
        anchor="center"
      >
        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white shadow-md" />
      </Marker>
    ))}
</MapView>

        </div>
      </section>

      {/* SIDEBAR */}
      <aside className="space-y-4">

        <div className="card">
          <h3 className="font-bold">Route Summary</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            <li>Distance: {distance ? fmtKm(distance) : "—"}</li>
            <li>Time: {duration ? fmtHourMin(duration) : "—"}</li>

            <li>Traffic: N/A</li>
            <li>Weather Impact: {weatherImpact}</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-bold">Battery & Energy</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            <li>Battery needed: {batteryNeeded}</li>
            <li>Arrival battery: {arrivalBattery}</li>
            <li>Energy: {energyKWh}</li>
            <li>Consumption: {whPerKm}</li>
          </ul>
        </div>

        <div className="card">
          <div className="card">
  <h3 className="font-bold">Charging Intelligence</h3>

  <p className="text-sm opacity-80 mt-1">
    Total stations along route: {totalRouteStations}
  </p>
  <p className="text-sm opacity-80">
    Passed: {passedStations} | Remaining: {remainingStations}
  </p>

<h4 className="mt-3 font-semibold text-sm">
  Best charging stations on route
</h4>

 {topStations.length === 0 ? (
  <p className="text-sm opacity-60 mt-2">No stations found along route</p>
) : (

    <div className="mt-2 space-y-2">
    {topStations.map((c) => (
  <div
    key={c.id}
    className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2"
  >
    <h3 className="text-lg font-bold text-red-400">
      {c.title || "Charging Station"}
    </h3>

    <p className="text-sm opacity-80">
      {c.distanceKm ? `${c.distanceKm.toFixed(1)} km` : "—"} ·{" "}
      {c.powerKW ? `${c.powerKW} kW` : "—"}
    </p>

    <p className="text-sm">
      <strong>Address:</strong> {c.addressLine}
    </p>

    <p className="text-sm">
      <strong>City:</strong> {c.city}
    </p>

    <p className="text-sm">
      <strong>State:</strong> {c.state}
    </p>

    <p className="text-sm">
      <strong>Pincode:</strong> {c.postcode}
    </p>

    {/* <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`}
      target="_blank"
      className="block mt-3 text-center border border-red-500 text-red-400 rounded-xl py-2 hover:bg-red-500 hover:text-black transition"
    >
      Navigate
    </a> */}
    <button
  onClick={() => navigateToStation(c)}
  className="block w-full mt-3 text-center border border-red-500 text-red-400 rounded-xl py-2 hover:bg-red-500 hover:text-black transition"
>
  Navigate
</button>

  </div>
))}

    </div>
  )}
</div>

        
        </div>

        <div className="card">
          <h3 className="font-bold">Trip Cost & CO₂</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            <li>EV Cost: {evCost}</li>
            <li>Fuel Cost: {fuelCost}</li>
            <li>Savings: {savings}</li>
            <li>CO₂ Saved: {co2Saved}</li>
          </ul>
        </div>

      </aside>
    </div>
  );
}
