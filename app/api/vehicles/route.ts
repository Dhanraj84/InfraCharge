import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const db = getDb();

  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const brand = searchParams.get("brand");

  let sql = "SELECT * FROM vehicles WHERE 1=1";
  const params: any[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  if (brand) {
    sql += " AND brand = ?";
    params.push(brand);
  }

  if (q) {
    sql += " AND (brand LIKE ? OR model LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  const items = db.prepare(sql).all(...params);

  return NextResponse.json({ items });
}
