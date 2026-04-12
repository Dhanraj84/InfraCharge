"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncUserToFirestore } from "@/lib/userActions";

type Vehicle = {
  id: number;
  name: string;
  category: string;
  battery_kwh: number;
  range_km: number;
  charge_time_hr: number;
  charger_type: string;
  power_kw: number;
};

export default function SelectVehiclePage() {
  const { user } = useAuth();
  const [category, setCategory] = useState<"2W" | "3W" | "4W">("2W");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    
    // Save locally
    localStorage.setItem("confirmedVehicle", JSON.stringify(selected));
    
    // Save to Cloud if logged in
    if (user) {
      await syncUserToFirestore(user);
    }
    
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setSelected(null);

        const res = await fetch(`/api/vehicles?category=${category}`);
        const data = await res.json();

        setVehicles(data.items || []);
      } catch (err) {
        console.error(err);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  return (
    <section className="p-8 max-w-6xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold text-red-400 mb-2">
        Select Your Vehicle
      </h1>
      <p className="text-gray-400 mb-8">
        Choose your EV to personalize routes, charging & CO₂ insights
      </p>

      {/* Category selector */}
      <div className="flex gap-4 mb-10">
        {(["2W", "3W", "4W"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-6 py-2 rounded-full border transition
              ${
                category === c
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-[#121222] border-gray-700 text-gray-300 hover:border-red-400"
              }`}
          >
            {c === "2W" && "🛵 Two Wheeler"}
            {c === "3W" && "🛺 Three Wheeler"}
            {c === "4W" && "🚗 Four Wheeler"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-400">Loading vehicles…</p>}

      {/* Vehicle cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          vehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelected(v)}
              className={`group relative cursor-pointer backdrop-blur-lg p-6 rounded-2xl border shadow-lg transition-all duration-300 overflow-hidden text-left
                ${
                  selected?.id === v.id
                    ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(255,77,77,0.4)] dark:shadow-[0_0_20px_rgba(255,77,77,0.3)]"
                    : "border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5 hover:border-white/20 dark:hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,77,77,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] hover:scale-[1.02]"
                }`}
            >
              <h3 className="text-lg font-semibold mb-3">{v.name}</h3>

              <div className="text-sm text-gray-400 space-y-1">
                <p>🔋 Battery: {v.battery_kwh} kWh</p>
                <p>📏 Range: {v.range_km} km</p>
                <p>⚡ Charging: {v.charge_time_hr} hrs</p>
                <p>🔌 Charger: {v.charger_type}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Selected vehicle summary */}
      {selected && (
        <div className="mt-12 group relative bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,77,77,0.2)] dark:shadow-[0_0_20px_rgba(255,77,77,0.15)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-500/10 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold mb-2">
            {selected.name} selected
          </h2>
          <p className="text-gray-400 mb-4">
            This vehicle will be used for route planning, charging & CO₂ analysis.
          </p>

          <button
            onClick={handleConfirm}
            className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
              confirmed 
              ? "bg-green-500 text-white cursor-default" 
              : "bg-red-500 hover:bg-red-600 text-white hover:-translate-y-1 active:translate-y-0"
            }`}
          >
            {confirmed ? "✅ Vehicle Confirmed!" : "Confirm Vehicle"}
          </button>
        </div>
      )}
    </section>
  );
}
