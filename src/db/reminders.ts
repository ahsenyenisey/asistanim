import type { SQLiteDatabase } from 'expo-sqlite';

import type { Reminder } from './types';

const nowIso = () => new Date().toISOString();

export async function listReminders(db: SQLiteDatabase, includeDone = true): Promise<Reminder[]> {
  if (includeDone) {
    return db.getAllAsync<Reminder>('SELECT * FROM reminders ORDER BY done ASC, due_at ASC');
  }
  return db.getAllAsync<Reminder>('SELECT * FROM reminders WHERE done = 0 ORDER BY due_at ASC');
}

export async function listRemindersBetween(
  db: SQLiteDatabase,
  fromIso: string,
  toIso: string,
): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE due_at >= ? AND due_at < ? ORDER BY due_at ASC',
    fromIso,
    toIso,
  );
}

export async function listOverdueReminders(db: SQLiteDatabase, nowIsoValue: string): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE done = 0 AND due_at < ? ORDER BY due_at ASC',
    nowIsoValue,
  );
}

export async function getReminder(db: SQLiteDatabase, id: number): Promise<Reminder | null> {
  return db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE id = ?', id);
}

export async function createReminder(
  db: SQLiteDatabase,
  input: { title: string; body?: string; due_at: string; notification_id?: string | null },
): Promise<number> {
  const res = await db.runAsync(
    'INSERT INTO reminders (title, body, due_at, notification_id, created_at) VALUES (?, ?, ?, ?, ?)',
    input.title,
    input.body ?? '',
    input.due_at,
    input.notification_id ?? null,
    nowIso(),
  );
  return res.lastInsertRowId;
}

export async function updateReminder(
  db: SQLiteDatabase,
  id: number,
  input: { title: string; body: string; due_at: string; notification_id: string | null },
): Promise<void> {
  await db.runAsync(
    'UPDATE reminders SET title = ?, body = ?, due_at = ?, notification_id = ? WHERE id = ?',
    input.title,
    input.body,
    input.due_at,
    input.notification_id,
    id,
  );
}

export async function setReminderDone(db: SQLiteDatabase, id: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE reminders SET done = ? WHERE id = ?', done ? 1 : 0, id);
}

export async function deleteReminder(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

export async function countPendingReminders(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM reminders WHERE done = 0');
  return row?.c ?? 0;
}
