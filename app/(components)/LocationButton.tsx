"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export default function LocationButton() {
  const [location, setLocation] = useState<string | null>(null);

  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(3);
        const lng = position.coords.longitude.toFixed(3);
        setLocation(`${lat}, ${lng}`);
      },
      () => {
        alert("Location permission denied");
      }
    );
  };

  return (
    <button
      onClick={handleLocation}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition text-sm"
    >
      <MapPin size={16} />
      {location ? location : "Enable Location"}
    </button>
  );
}