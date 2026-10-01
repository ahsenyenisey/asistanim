import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Note, Process, ProcessStep, Reminder } from '@/db/types';

/**
 * Veri yedekleme: tüm tablolar tek bir JSON dosyasına yazılır ve sistem
 * paylaşım menüsüyle dışa aktarılır (Drive, e-posta, AirDrop...).
 * Geri yükleme için aynı dosya seçilir.
 */

export interface BackupPayload {
  app: 'asistanim';
  version: 1;
  exported_at: string;
  notes: Note[];
  reminders: Reminder[];
  processes: Process[];
  process_steps: ProcessStep[];
}

export async function buildBackup(db: SQLiteDatabase): Promise<BackupPayload> {
  const [notes, reminders, processes, process_steps] = await Promise.all([
    db.getAllAsync<Note>('SELECT * FROM notes'),
    db.getAllAsync<Reminder>('SELECT * FROM reminders'),
    db.getAllAsync<Process>('SELECT * FROM processes'),
    db.getAllAsync<ProcessStep>('SELECT * FROM process_steps'),
  ]);
  return { app: 'asistanim', version: 1, exported_at: new Date().toISOString(), notes, reminders, processes, process_steps };
}

export async function exportBackup(db: SQLiteDatabase): Promise<string> {
  const payload = await buildBackup(db);
  const stamp = payload.exported_at.replace(/[:.]/g, '-');
  const file = new File(Paths.cache, `asistanim-yedek-${stamp}.json`);
  file.write(JSON.stringify(payload, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Yedeği paylaş' });
  }
  return file.uri;
}

export function validateBackup(data: unknown): data is BackupPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.app === 'asistanim' && Array.isArray(d.notes) && Array.isArray(d.reminders) && Array.isArray(d.processes);
}

export async function importBackup(db: SQLiteDatabase, payload: BackupPayload): Promise<{ notes: number; reminders: number; processes: number }> {
  let notes = 0;
  let reminders = 0;
  let processes = 0;
  await db.withTransactionAsync(async () => {
    for (const n of payload.notes) {
      await db.runAsync(
        'INSERT INTO notes (title, content, image_uri, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        n.title, n.content ?? '', null, n.pinned ?? 0, n.created_at, n.updated_at,
      );
      notes++;
    }
    for (const r of payload.reminders) {
      await db.runAsync(
        'INSERT INTO reminders (title, body, due_at, notification_id, done, created_at) VALUES (?, ?, ?, NULL, ?, ?)',
        r.title, r.body ?? '', r.due_at, r.done ?? 0, r.created_at,
      );
      reminders++;
    }
    const idMap = new Map<number, number>();
    for (const p of payload.processes) {
      const res = await db.runAsync(
        'INSERT INTO processes (title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        p.title, p.description ?? '', p.status ?? 'active', p.created_at, p.updated_at,
      );
      idMap.set(p.id, res.lastInsertRowId);
      processes++;
    }
    for (const s of payload.process_steps ?? []) {
      const newId = idMap.get(s.process_id);
      if (!newId) continue;
      await db.runAsync(
        'INSERT INTO process_steps (process_id, title, position, done) VALUES (?, ?, ?, ?)',
        newId, s.title, s.position, s.done ?? 0,
      );
    }
  });
  return { notes, reminders, processes };
}

export async function pickAndReadBackup(): Promise<BackupPayload | null> {
  const result = await File.pickFileAsync({ multipleFiles: false, mimeTypes: ['application/json', '*/*'] });
  if (result.canceled) return null;
  const text = await result.result.text();
  const data: unknown = JSON.parse(text);
  if (!validateBackup(data)) throw new Error('Dosya geçerli bir Asistanım yedeği değil.');
  return data;
}
