"use client";

import { useEffect, useState } from "react";

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  category: string;
};

export default function SelectVehiclePage() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams();
        query.set("category", "4W");

        const res = await fetch(`/api/vehicles?${query.toString()}`);

        // ✅ IMPORTANT FIX (do NOT remove)
        if (!res.ok) {
          console.error("Vehicles API failed:", res.status);
          setItems([]);
          return;
        }

        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="p-4">Loading vehicles...</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Select Vehicle</h1>

      {items.length === 0 && (
        <p className="text-gray-500">No vehicles found</p>
      )}

      <ul className="space-y-2">
        {items.map((v) => (
          <li key={v.id} className="border p-3 rounded">
            <p className="font-medium">
              {v.brand} {v.model}
            </p>
            <p className="text-sm text-gray-500">
              Category: {v.category}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
