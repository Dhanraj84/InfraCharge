import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import Profile from "@/lib/models/Profile";
import Vehicle from "@/lib/models/Vehicle";

async function getUserId() {
  return "demo-user-id"; // Replace after adding auth
}

export async function GET() {
  await connectDb();
  const userId = await getUserId();

  const profile = await Profile.findOne({ userId }).populate("selectedVehicle");
  return NextResponse.json({ selected: profile?.selectedVehicle || null });
}

export async function POST(req: Request) {
  await connectDb();

  const userId = await getUserId();
  const { vehicleId } = await req.json();

  const exists = await Vehicle.findById(vehicleId);
  if (!exists)
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: { selectedVehicle: exists._id } },
    { upsert: true, new: true }
  ).populate("selectedVehicle");

  return NextResponse.json({ selected: profile.selectedVehicle });
}
