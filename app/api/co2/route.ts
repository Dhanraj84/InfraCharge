import { NextResponse } from "next/server";

// Simple calc; tune to your pricing
const PETROL_CO2_G_PER_KM = 120;
const DIESEL_CO2_G_PER_KM = 150;
const PETROL_RS_PER_L = 110;
const DIESEL_RS_PER_L = 95;

export async function POST(req: Request) {
  const { fuel, km, freq, kmpl } = await req.json();
  const tripsPer = freq === "Daily" ? 30 : freq === "Weekly" ? 4 : 1; // approx/month
  const totalKm = (km || 0) * tripsPer;

  const perKmFuelCost = fuel === "diesel"
    ? (DIESEL_RS_PER_L / Math.max(kmpl || 1,1))
    : (PETROL_RS_PER_L / Math.max(kmpl || 1,1));

  const evPerKmCost = 1.2; // rough ₹/km
  const moneySaved = Math.max(0, (perKmFuelCost - evPerKmCost) * totalKm);

  const co2Saved = totalKm * (fuel === "diesel" ? DIESEL_CO2_G_PER_KM : PETROL_CO2_G_PER_KM);
  return NextResponse.json({ money: moneySaved, co2: co2Saved });
}
