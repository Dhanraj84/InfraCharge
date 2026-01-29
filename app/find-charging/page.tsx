"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";


// ---------- Types ----------
type OCM = {
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

export default function FindChargingPage() {
  maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

  const GRAPH_KEY = process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY;

  const [query, setQuery] = useState("");
  const [chargers, setChargers] = useState<OCM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapRef = useRef<maptilersdk.Map | null>(null);
  const startMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const endMarkerRef = useRef<maptilersdk.Marker | null>(null);

  const gpsStart = useRef<[number, number] | null>(null);
  const manualStart = useRef<[number, number] | null>(null);

  const ROUTE_SOURCE = "route";
  const ROUTE_LAYER = "route-line";

  // ---------- Init Map ----------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maptilersdk.Map({
      container: "map",
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
    });

    mapRef.current = map;
  }, []);

  // ---------- Fetch Chargers ----------
  async function fetchChargers(lat: number, lon: number) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/chargers?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setChargers([]);
        return;
      }

      setChargers(data);
    } catch (err) {
      setError("Unable to load charging stations.");
    } finally {
      setLoading(false);
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
    placeEndMarker([endLon, endLat]);

    try {
      const url = `https://graphhopper.com/api/1/route?point=${start[1]},${start[0]}&point=${endLat},${endLon}&vehicle=car&locale=en&points_encoded=false&instructions=false&key=${GRAPH_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

   const coords = json?.paths?.[0]?.points?.coordinates;
if (!coords) return setError("Routing failed: No coordinates found");

// ✅ ADD TYPE HERE (THIS IS THE ONLY CHANGE)
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

  function placeEndMarker([lon, lat]: [number, number]) {
    endMarkerRef.current?.remove();
    endMarkerRef.current = new maptilersdk.Marker({ color: "#ef4444" })
      .setLngLat([lon, lat])
      .addTo(mapRef.current!);
  }

  // ---------- UI ----------
  return (
  <div className="min-h-screen bg-bg text-text">
    {/* Search bar */}
    <div className="max-w-[1200px] mx-auto px-4 pt-6 flex gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 p-3 bg-card border border-border rounded"
        placeholder="Search location..."
      />

      <button
        onClick={useMyLocation}
        className="btn btn-outline"
      >
        Use My Location
      </button>

      <button
        onClick={searchByAddress}
        className="btn btn-primary"
      >
        Search
      </button>
    </div>

    {/* Map + Station List */}
    <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6">
      
      {/* Map */}
      <div className="w-[68%]">
        <div
          id="map"
          className="w-full h-[70vh] border border-border rounded"
        />
        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>

      {/* Station Cards */}
      <div className="w-[32%]">
        <h2 className="text-2xl font-bold text-primary mb-3">
          Nearby Charging Stations
        </h2>

        {chargers.map((c, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 mb-3"
          >
            <h3 className="text-primary font-semibold text-lg">
              {c.AddressInfo?.Title}
            </h3>

            <p className="text-muted text-xs mb-3">
              {c.AddressInfo?.Distance?.toFixed(1)} km • {dcOrAc(c.Connections)}
            </p>

            <div className="text-text text-sm space-y-1">
              <p><b>Address:</b> {c.AddressInfo?.AddressLine1}</p>
              <p><b>City:</b> {c.AddressInfo?.Town}</p>
              <p><b>State:</b> {c.AddressInfo?.StateOrProvince}</p>
              <p><b>Pincode:</b> {c.AddressInfo?.Postcode}</p>
            </div>

            <button
              onClick={() => drawRoute(c)}
              className="w-full mt-4 btn btn-outline"
            >
              Navigate
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

}
