"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function AssistMap({ reports, userLocation }: any) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Helper to create a custom HTML marker with a pulse effect
  const createPulseMarker = (colorHex: string, sizeClass: string = "w-4 h-4") => {
    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center cursor-pointer group";
    el.innerHTML = `
      <div class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style="background-color: ${colorHex}; animation-duration: 2s;"></div>
      <div class="relative inline-flex rounded-full border-2 border-white/80 shadow-[0_0_15px_${colorHex}] transition-transform group-hover:scale-125 ${sizeClass}" style="background-color: ${colorHex};"></div>
    `;
    return el;
  };

  /* =============================
     INITIALIZE MAP (RUNS ONCE)
  ============================== */
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY || ""}`,
      center: userLocation
        ? [userLocation.lng, userLocation.lat]
        : [77.209, 28.6139],
      zoom: 14,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Force resize to prevent map clipping
    const resizeMap = () => map.current?.resize();
    window.addEventListener("resize", resizeMap);
    
    // Also use ResizeObserver for container changes
    const ro = new ResizeObserver(resizeMap);
    ro.observe(mapContainer.current);

    return () => {
      window.removeEventListener("resize", resizeMap);
      ro.disconnect();
    };
  }, []);

  /* =============================
     RECENTER & PLOT USER LOCATION
  ============================== */
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Fly to user
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 1200,
    });

    // Plot User (Blue Pin)
    if (!userMarkerRef.current) {
      const el = createPulseMarker("#3b82f6", "w-5 h-5"); // blue-500
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

  }, [userLocation]);

  /* =============================
     UPDATE FIREBASE & MOCK MARKERS
  ============================== */
  useEffect(() => {
    if (!map.current || !reports) return;

    // Remove previous markers safely
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Plot Firebase Reports (Red/Yellow based on type)
    reports.forEach((report: any) => {
      if (!report.location) return;

      let color = "#ef4444"; // default red (faulty)
      if (report.type === "congestion") color = "#eab308"; // yellow (busy)

      const el = createPulseMarker(color);
      
      const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
        .setHTML(`<div class="bg-card text-text px-3 py-2 rounded-lg text-sm font-bold border border-border">${report.type.replace('_', ' ').toUpperCase()}</div>`);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.location.lng, report.location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Mock Green (Available) Stations around user to make map feel alive
    if (userLocation) {
      const randomOffset = () => (Math.random() - 0.5) * 0.03;
      for(let i = 0; i < 4; i++) {
        const el = createPulseMarker("#10b981"); // emerald-500
        const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
          .setHTML(`<div class="bg-card text-emerald-500 px-3 py-2 rounded-lg text-sm font-bold border border-emerald-500/30 w-max">🟢 Available Fast Charger</div>`);
        
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng + randomOffset(), userLocation.lat + randomOffset()])
          .setPopup(popup)
          .addTo(map.current!);
          
        markersRef.current.push(marker);
      }
    }

  }, [reports, userLocation]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full object-cover relative z-0"
    />
  );
}