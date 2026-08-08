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

import { getCache, setCache } from "@/lib/redis";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/**
 * High-performance Redis + SQLite amenities lookup.
 * Tries Redis first; falls back to SQLite if Redis miss or unavailable.
 */
export async function getAmenitiesWithRedis(stationId: string): Promise<Amenity[] | null> {
  // 1. Try Redis
  const redisData = await getCache<Amenity[]>(`amenities:${stationId}`);
  if (redisData) return redisData;

  // 2. Fallback to SQLite cache
  const sqliteData = getCachedAmenities(stationId);
  if (sqliteData) {
    // Populate Redis cache asynchronously
    setCache(`amenities:${stationId}`, sqliteData, SEVEN_DAYS_SECONDS).catch(() => {});
    return sqliteData;
  }

  return null;
}

/**
 * Save amenities to both Redis and SQLite caches.
 */
export async function setAmenitiesWithRedis(stationId: string, amenities: Amenity[]) {
  setCachedAmenities(stationId, amenities);
  await setCache(`amenities:${stationId}`, amenities, SEVEN_DAYS_SECONDS);
}

