import type { SQLiteDatabase } from 'expo-sqlite';

import { createNote } from '@/db/notes';
import { createProcess } from '@/db/processes';
import { createReminder } from '@/db/reminders';
import type { AiAction } from '@/services/ai';
import { scheduleReminderNotification } from '@/services/notifications';
import { formatRelative } from '@/utils/date';
import type { ParsedIntent } from '@/utils/nlp';

/**
 * Asistanın (Claude ya da çevrimdışı ayrıştırıcı) ürettiği eylemleri
 * veritabanına uygular ve kullanıcıya gösterilecek kısa bir özet döner.
 */
export async function applyAiActions(db: SQLiteDatabase, actions: AiAction[]): Promise<string[]> {
  const done: string[] = [];
  for (const a of actions) {
    if (a.type === 'create_note') {
      await createNote(db, { title: a.title || 'Not', content: a.content ?? '' });
      done.push(`📝 Not eklendi: ${a.title}`);
    } else if (a.type === 'create_reminder') {
      const due = a.due_at ? new Date(a.due_at) : new Date(Date.now() + 60 * 60 * 1000);
      const safeDue = Number.isNaN(due.getTime()) ? new Date(Date.now() + 60 * 60 * 1000) : due;
      const notificationId = await scheduleReminderNotification(a.title, a.content ?? '', safeDue);
      await createReminder(db, { title: a.title, body: a.content ?? '', due_at: safeDue.toISOString(), notification_id: notificationId });
      done.push(`⏰ Hatırlatma kuruldu: ${a.title} — ${formatRelative(safeDue.toISOString())}`);
    } else if (a.type === 'create_process') {
      await createProcess(db, { title: a.title, description: a.content ?? '', steps: a.steps ?? [] });
      done.push(`🗂️ Süreç oluşturuldu: ${a.title} (${(a.steps ?? []).length} adım)`);
    }
  }
  return done;
}

/** Çevrimdışı ayrıştırıcı sonucunu AiAction biçimine çevirir. */
export function intentToActions(intent: ParsedIntent): AiAction[] {
  switch (intent.type) {
    case 'create_reminder':
      return [{ type: 'create_reminder', title: intent.title, content: '', due_at: intent.due.toISOString(), steps: [] }];
    case 'create_note':
      return [{ type: 'create_note', title: intent.title, content: intent.content, due_at: null, steps: [] }];
    case 'create_process':
      return [{ type: 'create_process', title: intent.title, content: '', due_at: null, steps: intent.steps }];
    default:
      return [];
  }
}
