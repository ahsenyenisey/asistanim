import type { SQLiteDatabase } from 'expo-sqlite';

/** Küçük, hassas olmayan ayarlar SQLite'ta tutulur. API anahtarı SecureStore'dadır. */
export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export const SettingKeys = {
  userName: 'user_name',
  model: 'ai_model',
  voiceReplies: 'voice_replies',
} as const;
