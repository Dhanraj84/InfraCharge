"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";


// ---------- Types ----------
type OCM = {
  ID?: number;
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    Distance?: number;
    Latitude?: number;
    Longitude?: number;
  };
  Connections?: {
    ConnectionType?: { Title?: string };
    Level?: { Title?: string };
    CurrentTypeID?: number;
    PowerKW?: number | null;
  }[];
};

// ---------- Helpers ----------
function dcOrAc(connections?: OCM["Connections"]) {
  if (!connections?.length) return "—";
  const hasDC = connections.some((c) => c.CurrentTypeID === 30);
  const hasAC = connections.some((c) => c.CurrentTypeID === 20);
  if (hasDC && hasAC) return "AC + DC";
  if (hasDC) return "DC Fast";
  if (hasAC) return "AC";
  return "—";
}

function getPower(connections?: OCM["Connections"]) {
  if (!connections?.length) return null;
  const max = Math.max(...connections.map((c) => c.PowerKW || 0));
  return max > 0 ? `${max} kW` : null;
}

export default function FindChargingPage() {
  maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

  const GRAPH_KEY = process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY;

  const [query, setQuery] = useState("");
  const [chargers, setChargers] = useState<OCM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [routingStationId, setRoutingStationId] = useState<number | null>(null);
  const [travelInfos, setTravelInfos] = useState<Record<number, { distanceKm: number; timeMin: number }>>({});

  const mapRef = useRef<maptilersdk.Map | null>(null);
  const startMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const endMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const stationMarkersRef = useRef<maptilersdk.Marker[]>([]);

  const gpsStart = useRef<[number, number] | null>(null);
  const manualStart = useRef<[number, number] | null>(null);

  const ROUTE_SOURCE = "route";
  const ROUTE_LAYER = "route-line";

  // ---------- Map Resize Fix ----------
  const triggerMapResize = () => {
    setTimeout(() => {
      if (mapRef.current) {
        if (typeof mapRef.current.resize === "function") {
          mapRef.current.resize();
        }
        if (typeof (mapRef.current as any).invalidateSize === "function") {
          (mapRef.current as any).invalidateSize();
        }
      }
    }, 200);
  };

  useEffect(() => {
    triggerMapResize();
  }, [chargers, loading, selectedStationId]);

  useEffect(() => {
    const handleResizeOrScroll = () => {
      if (mapRef.current) {
        if (typeof mapRef.current.resize === "function") mapRef.current.resize();
        if (typeof (mapRef.current as any).invalidateSize === "function") (mapRef.current as any).invalidateSize();
      }
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, { passive: true });
    
    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll);
    };
  }, []);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // ---------- Init Map ----------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maptilersdk.Map({
      container: mapContainerRef.current as HTMLElement,
      style: maptilersdk.MapStyle.STREETS,
      center: [77.59, 12.97],
      zoom: 12,
    });

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        paint: {
          "line-color": "#22c55e",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });
      triggerMapResize();
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ---------- Fetch Chargers ----------
  async function fetchChargers(lat: number, lon: number) {
    try {
      setLoading(true);
      setError("");
      setChargers([]);
      setSelectedStationId(null);
      setTravelInfos({});

      const ranges = [5, 10, 25];

      for (const r of ranges) {
        console.log("Searching range:", r);

        const res = await fetch(
          `/api/chargers?lat=${lat}&lon=${lon}&range=${r}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        console.log("Stations found:", data.length);

        if (Array.isArray(data) && data.length > 0) {
          const sorted = data.sort(
            (a: OCM, b: OCM) =>
              (a.AddressInfo?.Distance || 0) - (b.AddressInfo?.Distance || 0)
          );
          
          const top5 = sorted.slice(0, 5);
          setChargers(top5);

          setError(`Showing top 5 stations within ${r} km`);
          
          // Fetch real travel logic for these 5 and place markers
          fetchTravelInfos(top5, lon, lat);
          placeStationMarkers(top5, null);
          
          return; // ✅ stop when found
        }
      }

      setError("No EV stations found within 25 km");
    } catch (err) {
      console.error(err);
      setError("Unable to load charging stations.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Fetch Travel Infos ----------
  async function fetchTravelInfos(stations: OCM[], startLon: number, startLat: number) {
    // Sequentially process stations with a tiny delay to ensure GraphHopper respects 
    // the max API burst limit, preventing routes 4 and 5 from failing!
    const infos: Record<number, { distanceKm: number; timeMin: number }> = {};
    
    for (const st of stations) {
      const endLat = st.AddressInfo?.Latitude;
      const endLon = st.AddressInfo?.Longitude;
      if (!endLat || !endLon || !st.ID) continue;
      
      try {
        // Use OSRM public API to completely bypass strict GraphHopper limits
        const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
        const res = await fetch(url);
        const json = await res.json();
        const route = json?.routes?.[0];
        if (route) {
          infos[st.ID] = {
            distanceKm: route.distance / 1000,
            timeMin: Math.round(route.duration / 60),
          };
          // Incrementally broadcast valid results to state so UX is seamless
          setTravelInfos((prev) => ({ ...prev, [st.ID!]: infos[st.ID!] }));
        }
        
        // Anti-DDoS 250ms buffer to safely let the remaining stations load completely
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        console.error("Failed fetching routing for station", st.ID, err);
      }
    }
  }

  // ---------- Manual Search ----------
  async function searchByAddress() {
    if (!query.trim()) return setError("Enter location");

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY!;
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
      query
    )}.json?key=${key}`;

    const res = await fetch(url);
    const geo = await res.json();

    if (!geo.features?.length) {
      setError("Location not found");
      return;
    }

    const [lon, lat] = geo.features[0].center;
    manualStart.current = [lon, lat];
    gpsStart.current = null; // Clear GPS if manual

    placeStartMarker([lon, lat]);
    await fetchChargers(lat, lon);

    mapRef.current?.easeTo({ center: [lon, lat], zoom: 13 });
  }

  // ---------- GPS ----------
  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        gpsStart.current = [lon, lat];
        manualStart.current = null; // Clear manual if GPS
        
        setQuery("My Location");
        placeStartMarker([lon, lat]);
        await fetchChargers(lat, lon);

        mapRef.current?.easeTo({ center: [lon, lat], zoom: 13 });
      },
      () => setError("GPS permission denied")
    );
  };

  // ✅ ✅ ✅ GRAPHOPPER ROUTING — PERFECT ✅
  async function drawRoute(station: OCM) {
    const endLat = station.AddressInfo?.Latitude;
    const endLon = station.AddressInfo?.Longitude;

    if (!endLat || !endLon) return;

    const start = gpsStart.current ?? manualStart.current;
    if (!start) return setError("Select starting point first");

    placeStartMarker([start[0], start[1]]);

    try {
      // OSRM Public API (Requires NO Key and supports heavy usage!)
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${endLon},${endLat}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      const route = json?.routes?.[0];
      if (!route) return setError("Routing failed: No route found");
      
      const coords = route.geometry.coordinates;

      // ✅ ADD TYPE HERE
      const routeGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coords,
            },
            properties: {},
          },
        ],
      };

      const map = mapRef.current!;
      const src = map.getSource(ROUTE_SOURCE) as maptilersdk.GeoJSONSource;
      src.setData(routeGeoJSON);

      const bounds = new maptilersdk.LngLatBounds();
      coords.forEach((pt: [number, number]) => bounds.extend(pt));
      map.fitBounds(bounds, { padding: 60 });
    } catch (err) {
      console.error(err);
      setError("Routing failed");
    }
  }

  // ---------- Markers ----------
  function placeStartMarker([lon, lat]: [number, number]) {
    startMarkerRef.current?.remove();
    startMarkerRef.current = new maptilersdk.Marker({ color: "#3b82f6" })
      .setLngLat([lon, lat])
      .addTo(mapRef.current!);
  }

  function placeStationMarkers(stations: OCM[], activeId: number | null) {
    stationMarkersRef.current.forEach(m => m.remove());
    stationMarkersRef.current = [];

    stations.forEach((st, index) => {
      const lat = st.AddressInfo?.Latitude;
      const lon = st.AddressInfo?.Longitude;
      if (!lat || !lon) return;

      const isSelected = st.ID === activeId;

      const el = document.createElement("div");
      // Added custom-map-marker to exempt it from the global CSS background transparency reset
      el.className = "custom-map-marker";

      // Explicit strict styling as requested, NO Tailwind
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "bold";
      el.style.fontSize = "14px";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
      el.style.zIndex = isSelected ? "999" : "1";

      el.style.backgroundColor = isSelected ? "#ef4444" : "#22c55e";

      el.innerText = (index + 1).toString();

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStationClick(st);
      });

      const marker = new maptilersdk.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(mapRef.current!);
      
      stationMarkersRef.current.push(marker);
    });
  }

  // ---------- Interactions ----------
  const handleStationClick = async (station: OCM) => {
    if (!station.ID) return;
    if (routingStationId === station.ID) return; // Prevent double trigger instead of disabling button
    
    setSelectedStationId(station.ID);
    setRoutingStationId(station.ID);
    placeStationMarkers(chargers, station.ID);
    
    await drawRoute(station);
    setRoutingStationId(null);

    const endLat = station.AddressInfo?.Latitude;
    const endLon = station.AddressInfo?.Longitude;
    if (endLat && endLon) {
      setTimeout(() => {
        mapRef.current?.flyTo({ center: [endLon, endLat], zoom: 15, duration: 1500 });
      }, 500); // 500ms allows the route bounds to set first, then fly in precisely.
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
          Find Nearest <span className="text-red-500">Charging Station</span>
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 bg-card border border-border rounded"
            placeholder="Search location..."
            onKeyDown={(e) => e.key === "Enter" && searchByAddress()}
          />

          <button onClick={useMyLocation} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 btn btn-outline transition-all duration-300 ease-in-out hover:-translate-y-[2px] active:ring-2 active:ring-white active:ring-offset-2 hover:shadow-[0_4px_15px_rgba(239,68,68,0.25)]">
            Use My Location
          </button>

          <button onClick={searchByAddress} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 btn btn-primary transition-all duration-300 ease-in-out hover:-translate-y-[2px] active:ring-2 active:ring-white active:ring-offset-2 hover:shadow-[0_4px_15px_rgba(239,68,68,0.4)]">
            Search
          </button>
        </div>
      </div>

      {/* Map + Station List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* Map Container */}
        <div className="w-full lg:w-[68%] shrink-0 h-[300px] sm:h-[400px] md:h-[500px] relative flex flex-col">
          <div
            ref={mapContainerRef}
            className="w-full h-full relative z-0 flex-1 border border-border rounded-xl shadow-md overflow-hidden bg-black/5"
            style={{ minHeight: "300px" }}
          >
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 text-white font-medium rounded-xl">
                Searching Stations...
              </div>
            )}
          </div>
          {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
        </div>

        {/* Station Cards Section */}
        <div className="w-full lg:w-[32%] flex flex-col h-[500px] lg:h-[75vh]">
          <h2 className="text-2xl font-bold text-primary mb-5 relative z-10 shrink-0">
            Nearby Charging Stations
          </h2>

          <div className="flex-1 overflow-y-auto pr-4 pb-10 custom-scrollbar">
            {chargers.length === 0 && !loading && !error && (
              <div className="text-muted text-sm p-4 bg-card border border-border rounded-xl">
                Enter a location or use your GPS to find nearby stations.
              </div>
            )}

            {chargers.map((c, i) => {
            const isSelected = c.ID === selectedStationId;
            const travel = c.ID ? travelInfos[c.ID] : null;
            const power = getPower(c.Connections);

            return (
              <div
                key={c.ID || i}
                onClick={() => handleStationClick(c)}
                className={`w-full p-4 sm:p-6 bg-card border rounded-xl mb-5 cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,77,77,0.25)] ${
                  isSelected
                    ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(255,77,77,0.25)]"
                    : "border-border"
                }`}
              >
                <h3 className={`font-semibold text-lg transition-colors ${
                  isSelected ? "text-red-500" : "text-primary"
                }`}>
                  {i + 1}. {c.AddressInfo?.Title || "Unknown Station"}
                </h3>

                <p className="text-muted text-xs mb-3 flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                  {travel ? (
                    <span className="text-white font-medium bg-black/40 px-2 py-0.5 rounded border border-white/10 shadow-sm">
                      {travel.distanceKm.toFixed(1)} km • {travel.timeMin} min
                    </span>
                  ) : (
                    <span className="opacity-80">
                      {c.AddressInfo?.Distance?.toFixed(1)} km (straight)
                    </span>
                  )}
                  {power && (
                    <span className="text-green-400 font-medium whitespace-nowrap">
                      {power}
                    </span>
                  )}
                  <span className="opacity-70 whitespace-nowrap">
                    • {dcOrAc(c.Connections)}
                  </span>
                </p>

                <div className="text-text text-sm space-y-1 opacity-90 mt-2">
                  <p><b>Address:</b> {c.AddressInfo?.AddressLine1 || "N/A"}</p>
                  <p><b>City:</b> {c.AddressInfo?.Town || "N/A"}</p>
                  <p><b>State:</b> {c.AddressInfo?.StateOrProvince || "N/A"}</p>
                  <p><b>Pincode:</b> {c.AddressInfo?.Postcode || "N/A"}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStationClick(c);
                  }}
                  className={`w-full h-[48px] mt-5 rounded-xl flex items-center justify-center font-medium transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_0_15px_rgba(255,77,77,0.5)] active:ring-2 active:ring-white active:ring-offset-2 active:bg-red-500/50 backdrop-blur-sm border ${
                    isSelected
                      ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                      : "bg-transparent text-red-500 border-red-500 hover:bg-red-500/10"
                  }`}
                >
                  {routingStationId === c.ID ? "Navigating..." : "Navigate"}
                </button>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
