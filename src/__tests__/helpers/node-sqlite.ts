/**
 * Test yardımcısı: expo-sqlite'ın async API'sini Node'un yerleşik `node:sqlite`
 * modülü üzerinde taklit eder. Böylece repository fonksiyonları gerçek SQL ile,
 * cihaz olmadan test edilir.
 */
import { DatabaseSync } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

type Param = string | number | null;

export function createTestDb(): SQLiteDatabase {
  const db = new DatabaseSync(':memory:');
  const shim = {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: Param[]) {
      const res = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(res.lastInsertRowid), changes: Number(res.changes) };
    },
    async getFirstAsync<T>(sql: string, ...params: Param[]) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: Param[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async withTransactionAsync(task: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return shim as unknown as SQLiteDatabase;
}
