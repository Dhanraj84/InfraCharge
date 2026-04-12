import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "amenities_cache.sqlite");
const db = new Database(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS amenities_cache (
    station_id TEXT PRIMARY KEY,
    amenities_json TEXT,
    timestamp INTEGER
  )
`);

export type Amenity = {
  type: string;
  icon: string;
  name: string;
  distMeters: number;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function getCachedAmenities(stationId: string): Amenity[] | null {
  try {
    const row = db.prepare("SELECT amenities_json, timestamp FROM amenities_cache WHERE station_id = ?").get(stationId) as any;
    
    if (!row) return null;

    // Check expiration
    if (Date.now() - row.timestamp > SEVEN_DAYS_MS) {
      db.prepare("DELETE FROM amenities_cache WHERE station_id = ?").run(stationId);
      return null;
    }

    return JSON.parse(row.amenities_json);
  } catch (err) {
    console.error("Cache read failed:", err);
    return null;
  }
}

export function setCachedAmenities(stationId: string, amenities: Amenity[]) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO amenities_cache (station_id, amenities_json, timestamp)
      VALUES (?, ?, ?)
    `);
    stmt.run(stationId, JSON.stringify(amenities), Date.now());
  } catch (err) {
    console.error("Cache write failed:", err);
  }
}
