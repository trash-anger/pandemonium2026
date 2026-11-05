// @ts-nocheck : aide de test exécutée par Node (node:sqlite), hors des types Workers du projet.
// D1 en mémoire pour les tests (node:sqlite) : prepare/bind/first/all/run et batch transactionnel.
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Val = string | number | bigint | null | Uint8Array;
const norm = (v: unknown): Val => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : (v as Val));

class Requete {
  constructor(private db: DatabaseSync, private sql: string, private args: Val[] = []) {}
  bind(...a: unknown[]) { return new Requete(this.db, this.sql, a.map(norm)); }
  async first<T>(col?: string): Promise<T | null> {
    const r = this.db.prepare(this.sql).get(...this.args) as Record<string, unknown> | undefined;
    if (!r) return null;
    return (col ? r[col] : { ...r }) as T;
  }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.args).map((r) => ({ ...r })) as T[], success: true, meta: {} }; }
  async run() { return this.executer(); }
  executer() {
    const r = this.db.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export function d1Memoire() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const dossier = join(__dirname, "..", "migrations");
  for (const f of readdirSync(dossier).filter((x) => x.endsWith(".sql")).sort()) db.exec(readFileSync(join(dossier, f), "utf8"));
  return {
    sqlite: db,
    prepare: (sql: string) => new Requete(db, sql),
    async batch(rs: Requete[]) {
      db.exec("BEGIN");
      try { const out = rs.map((r) => r.executer()); db.exec("COMMIT"); return out; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  } as unknown as D1Database & { sqlite: DatabaseSync };
}
