require("dotenv").config({ path: ".env.local" });
const sqlite3 = require("sqlite3").verbose();
const { Pool } = require("pg");

const sqlite = new sqlite3.Database("./data/ev_purchases.sqlite");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateTable(sqliteQuery, insertQuery, mapRow) {
  return new Promise((resolve, reject) => {
    sqlite.all(sqliteQuery, async (err, rows) => {
      if (err) return reject(err);

      for (const row of rows) {
        const values = mapRow(row);
        await pool.query(insertQuery, values);
      }

      resolve();
    });
  });
}

async function migrate() {
  try {
    console.log("🚀 Migrating ev_purchases...");
    await migrateTable(
      "SELECT * FROM ev_purchases",
      `INSERT INTO ev_purchases (state, vehicle_type, count, year)
       VALUES ($1, $2, $3, $4)`,
      (row) => [row.state, row.vehicle_type, row.count, row.year]
    );

    console.log("🚀 Migrating ev_vehicle_details...");
    await migrateTable(
      "SELECT * FROM vehicles",
      `INSERT INTO ev_vehicle_details
       (vehicle_name, manufacturer, battery_capacity, range_km, charging_time, price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      (row) => [
        row.vehicle_name,
        row.manufacturer,
        row.battery_capacity,
        row.range_km,
        row.charging_time,
        row.price,
      ]
    );

    console.log("✅ All tables migrated successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();