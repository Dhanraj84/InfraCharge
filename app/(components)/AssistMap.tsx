"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function AssistMap({ reports, userLocation }: any) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  /* =============================
     INITIALIZE MAP (RUNS ONCE)
  ============================== */
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: userLocation
        ? [userLocation.lng, userLocation.lat]
        : [77.209, 28.6139],
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
  }, []);

  /* =============================
     RECENTER WHEN USER LOCATION CHANGES
  ============================== */
  useEffect(() => {
    if (!map.current || !userLocation) return;

    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 1200,
    });

    // Scroll to map smoothly
    mapContainer.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [userLocation]);

  /* =============================
     UPDATE MARKERS
  ============================== */
  useEffect(() => {
    if (!map.current || !reports) return;

    // Remove previous markers safely
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    reports.forEach((report: any) => {
      if (!report.location) return;

      const marker = new maplibregl.Marker({ color: "red" })
        .setLngLat([report.location.lng, report.location.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [reports]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[400px] rounded-xl border border-border"
    />
  );
}