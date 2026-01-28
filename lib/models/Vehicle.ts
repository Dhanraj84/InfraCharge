import { Schema, model, models } from "mongoose";

export type VehicleCategory = "4W" | "2W" | "3W";

export interface Vehicle {
  _id?: string;
  category: VehicleCategory;            // 4W, 2W, 3W
  brand: string;                        // Tata, Ola, MG...
  model: string;                        // Nexon EV, S1 Pro...
  batteryKWh?: number;                  // kWh
  claimedRangeKm?: number;              // ARAI/IDC
  realRangeKm?: number;                 // practical (approx)
  fastCharging?: string;                // CCS2, CHAdeMO, Proprietary etc.
  socket?: string;                      // Type2, 3-pin etc. (esp. 2W/3W)
  powerKw?: number;                     // motor power (kW)
  torqueNm?: number;                    // torque
  chargeTimeHours?: string;             // e.g. 0–80% in 56 min (DC)
  topSpeedKmph?: number;
  priceINR?: string;                    // ex-showroom approx
  image?: string;                       // optional URL
}

const VehicleSchema = new Schema<Vehicle>(
  {
    category: { type: String, enum: ["4W", "2W", "3W"], required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    batteryKWh: Number,
    claimedRangeKm: Number,
    realRangeKm: Number,
    fastCharging: String,
    socket: String,
    powerKw: Number,
    torqueNm: Number,
    chargeTimeHours: String,
    topSpeedKmph: Number,
    priceINR: String,
    image: String,
  },
  { timestamps: true, versionKey: false }
);

VehicleSchema.index({ category: 1, brand: 1, model: 1 }, { unique: true });

export default models.Vehicle || model<Vehicle>("Vehicle", VehicleSchema);
