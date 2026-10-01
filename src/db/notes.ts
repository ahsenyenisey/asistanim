import type { SQLiteDatabase } from 'expo-sqlite';

import type { Note } from './types';

const nowIso = () => new Date().toISOString();

export async function listNotes(db: SQLiteDatabase, search = ''): Promise<Note[]> {
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    return db.getAllAsync<Note>(
      'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY pinned DESC, updated_at DESC',
      q,
      q,
    );
  }
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC');
}

export async function getNote(db: SQLiteDatabase, id: number): Promise<Note | null> {
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', id);
}

export async function createNote(
  db: SQLiteDatabase,
  input: { title: string; content?: string; image_uri?: string | null },
): Promise<number> {
  const ts = nowIso();
  const res = await db.runAsync(
    'INSERT INTO notes (title, content, image_uri, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    input.title,
    input.content ?? '',
    input.image_uri ?? null,
    ts,
    ts,
  );
  return res.lastInsertRowId;
}

export async function updateNote(
  db: SQLiteDatabase,
  id: number,
  input: { title: string; content: string; image_uri: string | null },
): Promise<void> {
  await db.runAsync(
    'UPDATE notes SET title = ?, content = ?, image_uri = ?, updated_at = ? WHERE id = ?',
    input.title,
    input.content,
    input.image_uri,
    nowIso(),
    id,
  );
}

export async function togglePinNote(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE notes SET pinned = CASE pinned WHEN 1 THEN 0 ELSE 1 END WHERE id = ?', id);
}

export async function deleteNote(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

export async function countNotes(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM notes');
  return row?.c ?? 0;
}
