"use client";

import { useCallback, useEffect, useMemo, useState,useRef  } from "react";
import maplibregl from "maplibre-gl";
import type { LineLayerSpecification } from "maplibre-gl";

// import Map from "@vis.gl/react-maplibre";
import {
  Map as MapView,
  Marker,
  Source,
  Layer,
  NavigationControl,
  Popup,
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

function sampleRoutePointsDist(
  coords: [number, number][],
  distKm = 40
): LngLat[] {
  const points: LngLat[] = [];
  if (!coords || !coords.length) return points;
  
  points.push({ lon: coords[0][0], lat: coords[0][1] });
  let lastAdded = points[0];

  for (let i = 1; i < coords.length; i++) {
    const cur = { lon: coords[i][0], lat: coords[i][1] };
    if (distanceKm(lastAdded, cur) >= distKm) {
      points.push(cur);
      lastAdded = cur;
    }
  }
  return points;
}

// --- Route Deviation Detection ---
function getDistanceToRoute(userPos: LngLat, coords: [number, number][]) {
  let minDistance = Infinity;
  if (!coords || coords.length === 0) return minDistance;

  const latToMeters = 111320; 
  const lonToMeters = 111320 * Math.cos((userPos.lat * Math.PI) / 180);

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = { lon: coords[i][0], lat: coords[i][1] };
    const p2 = { lon: coords[i+1][0], lat: coords[i+1][1] };

    const dx = (p2.lon - p1.lon) * lonToMeters;
    const dy = (p2.lat - p1.lat) * latToMeters;
    const l2 = dx * dx + dy * dy;

    let t = 0;
    if (l2 > 0) {
      t = ((userPos.lon - p1.lon) * lonToMeters * dx + (userPos.lat - p1.lat) * latToMeters * dy) / l2;
      t = Math.max(0, Math.min(1, t));
    }

    const projLon = p1.lon + t * (p2.lon - p1.lon);
    const projLat = p1.lat + t * (p2.lat - p1.lat);

    const dist = distanceKm(userPos, { lon: projLon, lat: projLat }) * 1000;
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

// --- Overpass API Amenities Fetcher ---
async function getAmenitiesNear(lat: number, lon: number) {
  if (!lat || !lon) return [];
  try {
    const res = await fetch(`/api/amenities-near?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
      return [];
    }
    
    const data = await res.json();
    if (!data.elements) return [];
    
    const result = data.elements.map((el: any) => {
       const type = el.tags?.amenity || el.tags?.shop || "amenity";
       let icon = "📍";
       if (type.match(/restaurant|fast_food/)) icon = "🍔";
       if (type === "cafe") icon = "☕";
       if (type === "toilets") icon = "🚻";
       if (type.match(/supermarket|convenience|mall/)) icon = "🛍️";
       if (type === "pharmacy") icon = "⚕️";
       if (type === "atm") icon = "🏧";
       
       const elLat = el.lat;
       const elLon = el.lon;
       if (!elLat || !elLon) return null;

       const dist = distanceKm({lon, lat}, {lon: elLon, lat: elLat}) * 1000;
       return { type, icon, name: el.tags?.name || type, distMeters: dist };
    }).filter(Boolean);
    
    // Deduplicate and return closest 4
    const unique = result.filter((v:any,i:number,a:any[])=>a.findIndex((t:any)=>(t.type === v.type))===i);
    return unique.sort((a:any,b:any) => a.distMeters - b.distMeters).slice(0, 4);
  } catch(e) {
    console.error("Amenities fetch failed", e);
    return [];
  }
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
  const [confirmedVehicle, setConfirmedVehicle] = useState<any | null>(null);

  // Load vehicle on mount
  useEffect(() => {
    const saved = localStorage.getItem("confirmedVehicle");
    if (saved) {
      try {
        setConfirmedVehicle(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse confirmedVehicle", e);
      }
    }
  }, []);

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
  
  const currentConsumption = useMemo(() => {
    if (confirmedVehicle?.battery_kwh && confirmedVehicle?.range_km) {
      return Math.round((confirmedVehicle.battery_kwh * 1000) / confirmedVehicle.range_km);
    }
    return CONSUMPTION_WH_PER_KM;
  }, [confirmedVehicle]);

  const [whPerKm, setWhPerKm] = useState<string>(`${currentConsumption} Wh/km`);

  // Update whPerKm when vehicle changes
  useEffect(() => {
    setWhPerKm(`${currentConsumption} Wh/km`);
  }, [currentConsumption]);
  const [chargingStops, setChargingStops] = useState<any[]>([]);
  const [topStations, setTopStations] = useState<any[]>([]);
const [chargingRouteGeoJSON, setChargingRouteGeoJSON] = useState<any | null>(null);
const [activeStation, setActiveStation] = useState<any | null>(null);
const [selectedMarker, setSelectedMarker] = useState<any | null>(null);


  // 🔋 Charging intelligence (NEW)
const [nearbyStations, setNearbyStations] = useState<any[]>([]);
const [totalRouteStations, setTotalRouteStations] = useState(0);
const [passedStations, setPassedStations] = useState(0);
const [remainingStations, setRemainingStations] = useState(0);

  const [evCost, setEvCost] = useState<string>("—");
  const [fuelCost, setFuelCost] = useState<string>("—");
  const [savings, setSavings] = useState<string>("—");
  const [co2Saved, setCo2Saved] = useState<string>("—");

  // --- REAL-TIME NAVIGATION STATES ---
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const lastRerouteTime = useRef(0);

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

  // ------------------ GPS Real-Time Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lon: pos.coords.longitude,
          lat: pos.coords.latitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
    const energy = (km * currentConsumption) / 1000;
    const withBuffer = energy * (1 + BATTERY_BUFFER_PCT / 100);

    setEnergyKWh(energy.toFixed(1) + " kWh");
    setBatteryNeeded(withBuffer.toFixed(1) + " kWh");

    // Dynamic arrival battery based on confirmed vehicle capacity
    if (confirmedVehicle?.battery_kwh) {
       const remainingKWh = confirmedVehicle.battery_kwh - energy;
       const pct = Math.max(0, Math.round((remainingKWh / confirmedVehicle.battery_kwh) * 100));
       setArrivalBattery(pct + " %");
    } else {
       setArrivalBattery(getArrivalBatteryByDistance(meters));
    }

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
setChargingRouteGeoJSON(null);
setSelectedMarker(null);

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

// 🔑 STRATEGIC POINTS (Fast Fetching)
// Distance-based sampling: check every 40km 
const strategicPoints = sampleRoutePointsDist(coords, 40); 

let collected: any[] = [];

try {
  // Batch API Calls for Extreme Speed
  const BATCH_SIZE = 5;
  for (let i = 0; i < strategicPoints.length; i += BATCH_SIZE) {
    const batch = strategicPoints.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(p => getCharging(p)));
    
    results.forEach(stations => {
      stations.forEach((s: any) => {
        if (typeof s.lat === "number" && typeof s.lon === "number") {
          collected.push(s);
        }
      });
    });
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

  // 🔴 SMART FILTER: Remove stations that are more than 10km OFF the actual route
  const strictlyOnRoute = unique.filter((s) => {
     const distMeters = getDistanceToRoute({lon: s.lon, lat: s.lat}, coords);
     return distMeters <= 10000; // max 10 km detour allowed
  });

  setChargingStops(strictlyOnRoute);
  setTotalRouteStations(strictlyOnRoute.length);

  // ✅ SMART SEGMENTED SCORING FOR TOP STATIONS
  const scoredStations = strictlyOnRoute.map(s => {
    // 1. Calculate approximate distance from origin along path
    const distanceFromStart = distanceKm({lon: coords[0][0], lat: coords[0][1]}, {lat: s.lat, lon: s.lon});
    
    // 2. Power Score (Higher is better)
    const power = s.powerKW || 0;
    let powerScore = 1;
    if (power >= 150) powerScore = 15;
    else if (power >= 50) powerScore = 10;
    else if (power >= 22) powerScore = 5;

    // 3. Detour Penalty (closer to route is better)
    const detourMeters = getDistanceToRoute({ lon: s.lon, lat: s.lat }, coords);
    let detourScore = 0;
    if (detourMeters < 1000) detourScore = 8;
    else if (detourMeters < 3000) detourScore = 5;
    else if (detourMeters < 5000) detourScore = 2;

    return {
      ...s,
      distFromStart: distanceFromStart,
      score: powerScore + detourScore,
    };
  });

  // Group by 50km segments to ensure low-range EVs are fully supported!
  const INTERVAL = 50;
  const segmentsMap = new Map<number, any[]>();
  scoredStations.forEach(s => {
    const segId = Math.floor(s.distFromStart / INTERVAL);
    if (!segmentsMap.has(segId)) segmentsMap.set(segId, []);
    segmentsMap.get(segId)!.push(s);
  });

  // Pick top 1 from each segment
  const bestRouteStations = [];
  const sortedSegIds = Array.from(segmentsMap.keys()).sort((a,b) => a - b);
  for (const segId of sortedSegIds) {
     const stationsInSeg = segmentsMap.get(segId)!;
     // sort by highest score
     stationsInSeg.sort((a,b) => b.score - a.score);
     bestRouteStations.push(stationsInSeg[0]);
  }

  // Allow up to 15 stations (covers a massive 750km trip at 50km intervals)
  const finalTop = bestRouteStations.slice(0, 15);
  setTopStations(finalTop);

      // 🚀 SEQUENTIAL STAGGERED LOADING: Fetch in batches with delay to avoid rate limiting
      (async () => {
        try {
          const BATCH_SIZE = 5;
          const batches = [];
          for (let i = 0; i < finalTop.length; i += BATCH_SIZE) {
            batches.push(finalTop.slice(i, i + BATCH_SIZE));
          }

          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // Add a 500ms delay between batches (except the first one)
            if (i > 0) await new Promise(r => setTimeout(r, 600));

            const bulkRes = await fetch("/api/amenities-bulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stations: batch }),
            });
            const json = await bulkRes.json();
            
            if (json.results) {
              setTopStations(prev => prev.map(s => {
                const batchResult = json.results[s.id];
                // Only update if this station was in the current batch AND we got a result
                if (batch.find(bs => bs.id === s.id) && batchResult !== undefined) {
                    return { ...s, amenities: batchResult };
                }
                return s;
              }));
            }
          }

      // Final cleanup: ensure any station that didn't get results is marked as empty (not loading)
      setTopStations(prev => prev.map(s => s.amenities === undefined ? { ...s, amenities: [] } : s));

    } catch (err) {
      console.error("Error bulk fetching amenities:", err);
      setTopStations(prev => prev.map(s => s.amenities === undefined ? { ...s, amenities: [] } : s));
    }
  })();

  console.log("TOTAL ON ROUTE:", strictlyOnRoute.length);
  console.log("TOP SEGMENTED STATIONS:", finalTop);

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

  // ------------------ Route Deviation & Auto-Rerouting
  useEffect(() => {
    if (!userLocation) return;
    
    let activeGeoJSON = chargingRouteGeoJSON || routeGeoJSON;
    if (!activeGeoJSON) return;
    
    const coords = activeGeoJSON.features?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords) return;

    const distMeters = getDistanceToRoute(userLocation, coords);
    const deviated = distMeters > 40;
    setIsOffRoute(deviated);

    if (deviated && !rerouting) {
      const now = Date.now();
      if (now - lastRerouteTime.current > 5000) { // 5s debounce
        lastRerouteTime.current = now;
        setRerouting(true);

        const target = (chargingRouteGeoJSON && activeStation) 
          ? { lon: activeStation.lon, lat: activeStation.lat } 
          : dstPoint;

        if (target) {
          getRoute(userLocation, target)
            .then((r) => {
              if (chargingRouteGeoJSON && activeStation) {
                setChargingRouteGeoJSON({
                  type: "FeatureCollection",
                  features: [r.geojson],
                });
              } else {
                setRouteGeoJSON({
                  type: "FeatureCollection",
                  features: [r.geojson],
                });
                setDistance(r.distance);
                setDuration(r.duration);
              }
            })
            .catch((err) => {
              console.error("Rerouting failed", err);
            })
            .finally(() => {
              setRerouting(false);
            });
        } else {
          setRerouting(false);
        }
      }
    }
  }, [userLocation, routeGeoJSON, chargingRouteGeoJSON, dstPoint, activeStation, getRoute, rerouting]);

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
    () => `https://api.maptiler.com/maps/streets-v2/style.json?key=${MT_KEY}`,
    []
  );

const routeLayer = useMemo<LineLayerSpecification>(
  () => ({
    id: "route-line",
    type: "line",
    source: "route-src",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#22C55E",
      "line-width": 6,
      "line-opacity": 1,
    },
  }),
  []
);
const chargingRouteLayer = useMemo<LineLayerSpecification>(
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
  setSelectedMarker(station);

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
    const minLon = Math.min(...coords.map((c: number[]) => c[0]));
    const maxLon = Math.max(...coords.map((c: number[]) => c[0]));
    const minLat = Math.min(...coords.map((c: number[]) => c[1]));
    const maxLat = Math.max(...coords.map((c: number[]) => c[1]));
    
    mapRef.current?.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 80, duration: 1500 }
    );
  }
};


// ------------------ UI

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6 items-start">
      <section className="flex flex-col gap-4 lg:sticky lg:top-[90px] lg:h-[calc(100vh-110px)] relative">
        <header className="shrink-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">EV Route Planner</h1>
          <p className="text-sm sm:text-base md:text-lg opacity-90 mt-1">
            Plan your trip with real-time traffic, weather updates, battery prediction & charging stops.
          </p>
        </header>

        {/* Inputs */}
        <div className="card grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 shrink-0 p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]">
          <input className="w-full p-3 rounded-xl bg-transparent border border-white/20"
            value={srcText} onChange={(e) => setSrcText(e.target.value)} placeholder="Source (GPS auto)" />
          <input className="w-full p-3 rounded-xl bg-transparent border border-white/20"
            value={dstText} onChange={(e) => setDstText(e.target.value)} placeholder="Destination" />
          <button onClick={planRoute} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 btn btn-primary">Plan Route</button>
        </div>

        {/* Map */}
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-full lg:min-h-[400px] card p-0 overflow-hidden rounded-xl">
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

  {/* 🔵 LIVE USER MARKER */}
  {userLocation && (
    <Marker 
      longitude={userLocation.lon} 
      latitude={userLocation.lat} 
      anchor="center"
      style={{ zIndex: 100 }}
    >
      <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
    </Marker>
  )}

  {/* 🔵 SOURCE MARKER */}
  {srcPoint && (
    <Marker 
      longitude={srcPoint.lon} 
      latitude={srcPoint.lat} 
      anchor="bottom" 
      color="#3B82F6"
      style={{ cursor: "pointer" }} 
      onClick={(e) => { 
        e.originalEvent.stopPropagation(); 
        setSelectedMarker({ id: "src", title: srcText || "Origin", type: "system", lon: srcPoint.lon, lat: srcPoint.lat }); 
      }} 
    />
  )}

  {/* 🔴 DESTINATION MARKER */}
  {dstPoint && (
    <Marker 
      longitude={dstPoint.lon} 
      latitude={dstPoint.lat} 
      anchor="bottom" 
      color="#EF4444"
      style={{ cursor: "pointer" }} 
      onClick={(e) => { 
        e.originalEvent.stopPropagation(); 
        setSelectedMarker({ id: "dst", title: dstText || "Destination", type: "system", lon: dstPoint.lon, lat: dstPoint.lat }); 
      }} 
    />
  )}

  {/* 🟦 MAIN ROUTE */}
  {routeGeoJSON && !chargingRouteGeoJSON && (
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
  {topStations
    .filter((c) => typeof c.lon === "number" && typeof c.lat === "number")
    .map((c) => (
      <Marker
        key={c.id}
        longitude={c.lon}
        latitude={c.lat}
        anchor="bottom"
        color={selectedMarker?.id === c.id ? "#EF4444" : "#22C55E"}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setSelectedMarker(c);
          mapRef.current?.flyTo({ center: [c.lon, c.lat], zoom: 14, duration: 1200 });
        }}
        style={{ cursor: "pointer" }}
      />
    ))}

  {/* Popups removed: Map minimal clean view */}
</MapView>
        </div>
      </section>

      {/* SIDEBAR */}
      <aside className="flex flex-col gap-5 pb-10">

        <div className="card w-full p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
          <h3 className="font-bold">Route Summary</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            {confirmedVehicle && (
              <li className="text-red-500 font-bold mb-2 flex items-center gap-2">
                🚗 Vehicle: {confirmedVehicle.name}
              </li>
            )}
            <li>Distance: {distance ? fmtKm(distance) : "—"}</li>
            <li>Time: {duration ? fmtHourMin(duration) : "—"}</li>
            <li>Traffic: N/A</li>
            <li>Weather Impact: {weatherImpact}</li>
          </ul>
        </div>

        <div className="card w-full p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
          <h3 className="font-bold">Battery & Energy</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            <li>Battery needed: {batteryNeeded}</li>
            <li>Arrival battery: {arrivalBattery}</li>
            <li>Energy: {energyKWh}</li>
            <li>Consumption: {whPerKm}</li>
          </ul>
        </div>

        <div className="card w-full p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
          <h3 className="font-bold">Trip Cost & CO₂</h3>
          <ul className="opacity-90 text-sm space-y-1 mt-2">
            <li>EV Cost: {evCost}</li>
            <li>Fuel Cost: {fuelCost}</li>
            <li>Savings: {savings}</li>
            <li>CO₂ Saved: {co2Saved}</li>
          </ul>
        </div>

        <div className="card w-full p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
          <h3 className="font-bold">Charging Stations</h3>
          <p className="text-sm opacity-80 mt-1">
            Stations: {totalRouteStations} | Passed: {passedStations} | Remaining: {remainingStations}
          </p>

          <h4 className="mt-4 font-semibold text-sm">
            Best charging stations on route
          </h4>

          {topStations.length === 0 ? (
            <p className="text-sm opacity-60 mt-2">No stations found along route</p>
          ) : (
            <div className="mt-3 space-y-3">
              {topStations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedMarker(c);
                    mapRef.current?.flyTo({ center: [c.lon, c.lat], zoom: 14, duration: 1200 });
                  }}
                  className={`group p-4 rounded-xl border bg-card/50 space-y-2 shadow-sm cursor-pointer transition-all duration-300 ${selectedMarker?.id === c.id ? "border-red-500 bg-red-500/5" : "border-border hover:border-red-500/30"}`}
                >
                  <h3 className="text-lg font-bold text-red-500">
                    {c.title || "Charging Station"}
                  </h3>

                  <p className="text-sm font-semibold opacity-90">
                    {c.distFromStart !== undefined ? `Drive ${c.distFromStart.toFixed(0)} km` : "—"} ·{" "}
                    {c.powerKW ? `${c.powerKW} kW` : "—"}
                  </p>

                  <p className="text-sm opacity-80">
                    <strong>Address:</strong> {c.addressLine}
                  </p>
                  <p className="text-sm opacity-80">
                    <strong>City:</strong> {c.city} • <strong>State:</strong> {c.state}
                  </p>

                  {/* EXPANDABLE AMENITIES SECTION */}
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100 group-hover:mt-2">
                    <div className="overflow-hidden space-y-2">
                       <h5 className="text-xs font-bold text-red-400 border-t border-border pt-3 mt-1 uppercase tracking-wider">Nearby Amenities</h5>
                       {c.amenities ? (
                         c.amenities.length > 0 ? (
                           <div className="flex gap-2 flex-wrap">
                             {c.amenities.map((a:any, i:number) => (
                               <span key={i} className="bg-bg text-text text-xs px-2 py-1.5 rounded-md border border-border shadow-sm flex items-center gap-1">
                                 {a.icon} <span className="capitalize font-semibold">{a.name.replace(/_/g, " ")}</span> <span className="opacity-60 text-[10px]">({Math.round(a.distMeters)}m)</span>
                               </span>
                             ))}
                           </div>
                         ) : (
                           <p className="text-xs text-muted flex items-center gap-1">📍 No amenities within walking distance.</p>
                         )
                       ) : (
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                           <p className="text-xs text-muted">Scanning area for amenities...</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToStation(c);
                    }}
                    className="block w-full mt-4 text-center border border-red-500 text-red-500 rounded-xl py-2 hover:bg-red-500 hover:text-white transition-colors duration-300"
                  >
                    Navigate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </aside>
    </div>
  );
}
