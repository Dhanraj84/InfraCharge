import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const runtime = "nodejs";

// Detect table name
function findTableName(db: any): string {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[];

  const pref = ["ev_purchases", "purchases", "registrations", "ev_registrations"];
  for (const p of pref) {
    const found = rows.find((r) => r.name.toLowerCase() === p);
    if (found) return found.name;
  }

  return rows[0]?.name;
}

// Get all table columns
function getColumns(db: any, table: string): string[] {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return cols.map((c) => c.name);
}


// Try automatically mapping column names
function guessColumns(cols: string[]) {
  const lc = (s: string) => s.toLowerCase();

  const find = (names: string[]) =>
    cols.find((c) => names.includes(lc(c))) ??
    cols.find((c) => lc(c) === names[0]);

  return {
    state: find(["state", "state_name"]),
    district: find(["district", "district_name"]),
    count: find(["count", "ev_count", "value", "registrations", "purchases"]),
    year: find(["year"]),
    month: find(["month"]),
    date: find(["date", "txn_date"])
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawState = (searchParams.get("state") || "").trim();
    const rawDistrict = (searchParams.get("district") || "").trim();

    if (!rawState || !rawDistrict) {
      return NextResponse.json(
        { error: "state and district are required." },
        { status: 400 }
      );
    }

    const state = rawState.toLowerCase();
    const district = rawDistrict.toLowerCase();

    const db = getDb();
    const table = findTableName(db);
    const cols = getColumns(db, table);

    const c = guessColumns(cols.map((x) => x.toLowerCase()));

    if (!c.state || !c.district || !c.count) {
      return NextResponse.json(
        {
          error: "Could not detect required DB column names.",
          details: { table, cols }
        },
        { status: 500 }
      );
    }

    // District total
    const districtTotal =
      db
        .prepare(
          `SELECT SUM(${c.count}) AS total 
           FROM ${table}
           WHERE LOWER(${c.state}) = @state
           AND LOWER(${c.district}) = @district`
        )
        .get({ state, district })?.total ?? 0;

    // State total
    const stateTotal =
      db
        .prepare(
          `SELECT SUM(${c.count}) AS total 
           FROM ${table}
           WHERE LOWER(${c.state}) = @state`
        )
        .get({ state })?.total ?? 0;

    return NextResponse.json({
      table,
      stateTotal,
      districtTotal
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
