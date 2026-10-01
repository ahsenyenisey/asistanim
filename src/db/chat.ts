import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChatMessage, ChatRole } from './types';

export async function listChatMessages(db: SQLiteDatabase, limit = 100): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<ChatMessage>(
    'SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?',
    limit,
  );
  return rows.reverse();
}

export async function addChatMessage(db: SQLiteDatabase, role: ChatRole, content: string): Promise<number> {
  const res = await db.runAsync(
    'INSERT INTO chat_messages (role, content, created_at) VALUES (?, ?, ?)',
    role,
    content,
    new Date().toISOString(),
  );
  return res.lastInsertRowId;
}

export async function clearChat(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM chat_messages');
}
