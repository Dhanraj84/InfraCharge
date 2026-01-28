import { NextResponse } from "next/server";

/**
 * SQL-safe seed placeholder.
 * Actual seeding logic will be implemented using SQLite later.
 */
export async function POST() {
  // Seed data kept for future SQL insert
  const SEED = [
    // ---- 4W ----
    {
      category: "4W",
      brand: "Tata",
      model: "Nexon EV LR",
      batteryKWh: 40.5,
      claimedRangeKm: 325,
      realRangeKm: 260,
      fastCharging: "CCS2",
      socket: "Type-2 AC",
      powerKw: 106,
      torqueNm: 215,
      chargeTimeHours: "56 min (10–80% DC)",
      topSpeedKmph: 150,
      priceINR: "₹15–19L",
    },
    {
      category: "4W",
      brand: "Tata",
      model: "Tiago EV",
      batteryKWh: 24,
      claimedRangeKm: 315,
      realRangeKm: 200,
      fastCharging: "CCS2",
      socket: "Type-2 AC",
      powerKw: 45,
      torqueNm: 110,
      chargeTimeHours: "58 min (10–80% DC)",
      topSpeedKmph: 120,
      priceINR: "₹8.7–12L",
    },
  ];

  // SQL seeding will be added later
  return NextResponse.json({
    message: "Vehicle seed placeholder (SQL)",
    count: SEED.length,
  });
}
