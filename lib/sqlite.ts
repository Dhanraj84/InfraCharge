import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;
  const file = path.join(process.cwd(), "data", "ev_purchases.sqlite");
  db = new Database(file, { readonly: true, fileMustExist: true });
  return db;
}
