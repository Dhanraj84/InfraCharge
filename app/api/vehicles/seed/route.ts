import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";

/**
 * SQL-safe vehicle seed route.
 * MongoDB/mongoose logic removed.
 * Seed data preserved for future SQLite inserts.
 */

// Popular/representative Indian EVs (starter set). Add freely.
const SEED = [
  // ---- 4W ----
  { category: "4W", brand: "Tata", model: "Nexon EV LR", batteryKWh: 40.5, claimedRangeKm: 325, realRangeKm: 260, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 106, torqueNm: 215, chargeTimeHours: "56 min (10–80% DC)", topSpeedKmph: 150, priceINR: "₹15–19L" },
  { category: "4W", brand: "Tata", model: "Tiago EV", batteryKWh: 24, claimedRangeKm: 315, realRangeKm: 200, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 45, torqueNm: 110, chargeTimeHours: "58 min (10–80% DC)", topSpeedKmph: 120, priceINR: "₹8.7–12L" },
  { category: "4W", brand: "Tata", model: "Punch EV LR", batteryKWh: 35, claimedRangeKm: 421, realRangeKm: 280, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 90, torqueNm: 190, chargeTimeHours: "56 min (10–80% DC)", topSpeedKmph: 140, priceINR: "₹11–15L" },
  { category: "4W", brand: "MG", model: "ZS EV", batteryKWh: 50.3, claimedRangeKm: 461, realRangeKm: 320, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 130, torqueNm: 280, chargeTimeHours: "60 min (5–80% DC)", topSpeedKmph: 175, priceINR: "₹18–24L" },
  { category: "4W", brand: "BYD", model: "Atto 3", batteryKWh: 60.5, claimedRangeKm: 521, realRangeKm: 360, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 150, torqueNm: 310, chargeTimeHours: "50 min (10–80% DC)", topSpeedKmph: 160, priceINR: "₹32–35L" },
  { category: "4W", brand: "Mahindra", model: "XUV400 EL", batteryKWh: 39.4, claimedRangeKm: 456, realRangeKm: 300, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 110, torqueNm: 310, chargeTimeHours: "50 min (0–80% DC)", topSpeedKmph: 150, priceINR: "₹16–20L" },
  { category: "4W", brand: "Hyundai", model: "Kona Electric", batteryKWh: 39.2, claimedRangeKm: 452, realRangeKm: 300, fastCharging: "CCS2", socket: "Type-2 AC", powerKw: 100, torqueNm: 395, chargeTimeHours: "57 min (10–80% DC)", topSpeedKmph: 155, priceINR: "₹24–25L" },

  // ---- 2W ----
  { category: "2W", brand: "Ola", model: "S1 Pro", batteryKWh: 4, claimedRangeKm: 181, realRangeKm: 130, socket: "Portable (16A)", powerKw: 8.5, torqueNm: 58, topSpeedKmph: 120, priceINR: "₹1.3L–1.4L" },
  { category: "2W", brand: "Ather", model: "450X", batteryKWh: 3.7, claimedRangeKm: 150, realRangeKm: 110, socket: "Ather Grid/Portable", powerKw: 6.4, torqueNm: 26, topSpeedKmph: 90, priceINR: "₹1.3L–1.5L" },
  { category: "2W", brand: "TVS", model: "iQube ST", batteryKWh: 4.56, claimedRangeKm: 145, realRangeKm: 110, socket: "Portable (16A)", powerKw: 4.4, torqueNm: 140, topSpeedKmph: 82, priceINR: "₹1.3L–1.5L" },
  { category: "2W", brand: "Bajaj", model: "Chetak", batteryKWh: 3, claimedRangeKm: 108, realRangeKm: 85, socket: "Portable (16A)", powerKw: 4.08, torqueNm: 20, topSpeedKmph: 73, priceINR: "₹1.2L–1.4L" },
  { category: "2W", brand: "Revolt", model: "RV400", batteryKWh: 3.24, claimedRangeKm: 150, realRangeKm: 100, socket: "Portable/Swappable", powerKw: 3, torqueNm: 170, topSpeedKmph: 85, priceINR: "₹1.3L–1.4L" },
  { category: "2W", brand: "Simple", model: "One", batteryKWh: 5, claimedRangeKm: 212, realRangeKm: 150, socket: "Portable (16A)", powerKw: 8.5, torqueNm: 72, topSpeedKmph: 105, priceINR: "₹1.5L–1.7L" },

  // ---- 3W ----
  { category: "3W", brand: "Mahindra", model: "Treo", batteryKWh: 7.37, claimedRangeKm: 130, realRangeKm: 100, socket: "GB/T", powerKw: 8, torqueNm: 42, priceINR: "₹2.7L–3.1L" },
  { category: "3W", brand: "Piaggio", model: "Ape E-City", batteryKWh: 7.5, claimedRangeKm: 110, realRangeKm: 90, socket: "GB/T", powerKw: 5.4, torqueNm: 29, priceINR: "₹2.8L–3.2L" },
  { category: "3W", brand: "Euler", model: "HiLoad EV", batteryKWh: 12.4, claimedRangeKm: 170, realRangeKm: 140, socket: "GB/T", powerKw: 10, torqueNm: 88, priceINR: "₹3.8L–4.2L" },
  { category: "3W", brand: "Kinetic", model: "Safar Smart", batteryKWh: 8, claimedRangeKm: 130, realRangeKm: 90, socket: "GB/T", powerKw: 4.5, priceINR: "₹2.2L–2.6L" },
];

export async function POST() {
  await connectDb();

  // SQL seeding will be implemented later
  return NextResponse.json({
    ok: true,
    inserted: SEED.length,
    note: "Seed data ready for SQLite implementation",
  });
}
