import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import Profile from "@/lib/models/Profile";
import Vehicle from "@/lib/models/Vehicle";

async function getUserId() {
  return "demo-user-id"; // Replace after adding auth
}

/**
 * GET selected vehicle for the user
 * (SQL implementation will be added later)
 */
export async function GET() {
  await connectDb();

  const userId = await getUserId();

  // SQL placeholder (no mongoose usage)
  // Later: fetch from SQLite using userId
  const selectedVehicle = null;

  return NextResponse.json({ selected: selectedVehicle });
}

/**
 * POST selected vehicle for the user
 * (SQL implementation will be added later)
 */
export async function POST(req: Request) {
  await connectDb();

  const userId = await getUserId();
  const { vehicleId } = await req.json();

  if (!vehicleId) {
    return NextResponse.json(
      { error: "Vehicle not provided" },
      { status: 400 }
    );
  }

  // SQL placeholder validation
  // Later: check vehicle exists in SQLite
  const vehicleExists = true;

  if (!vehicleExists) {
    return NextResponse.json(
      { error: "Vehicle not found" },
      { status: 404 }
    );
  }

  // SQL placeholder update
  // Later: upsert profile + selected vehicle in SQLite
  const selectedVehicle = {
    id: vehicleId,
  };

  return NextResponse.json({ selected: selectedVehicle });
}
