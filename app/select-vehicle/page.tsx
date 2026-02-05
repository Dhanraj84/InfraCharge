"use client";

import { useEffect, useState } from "react";

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
  const [category, setCategory] = useState<"2W" | "3W" | "4W">("2W");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);

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
              className={`cursor-pointer rounded-xl p-5 border transition
                ${
                  selected?.id === v.id
                    ? "border-red-400 bg-[#181830]"
                    : "border-gray-700 bg-[#121222] hover:border-red-400"
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
        <div className="mt-12 p-6 rounded-xl border border-red-400 bg-[#0b0b14]">
          <h2 className="text-xl font-bold mb-2">
            {selected.name} selected
          </h2>
          <p className="text-gray-400 mb-4">
            This vehicle will be used for route planning, charging & CO₂ analysis.
          </p>

          <button
            className="px-6 py-3 rounded bg-red-500 hover:bg-red-600 transition"
          >
            Confirm Vehicle
          </button>
        </div>
      )}
    </section>
  );
}
