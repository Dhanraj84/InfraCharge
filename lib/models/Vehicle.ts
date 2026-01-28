export type VehicleCategory = "4W" | "2W" | "3W";

export interface Vehicle {
  id?: number;
  category: VehicleCategory;     // 4W, 2W, 3W
  brand: string;                 // Tata, Ola, MG...
  model: string;                 // Nexon EV, S1 Pro...
  batteryKWh?: number;
  claimedRangeKm?: number;
  realRangeKm?: number;
  fastCharging?: string;
  socket?: string;
  powerKw?: number;
  torqueNm?: number;
  chargeTimeHours?: string;
  topSpeedKmph?: number;
  priceINR?: string;
  image?: string;
}

/**
 * Placeholder export to keep existing imports working.
 * Real DB operations are handled via SQL (SQLite).
 */
const VehicleModel = {} as unknown as Vehicle;

export default VehicleModel;