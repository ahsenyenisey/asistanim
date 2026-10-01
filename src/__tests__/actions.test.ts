import type { SQLiteDatabase } from 'expo-sqlite';

import { listNotes } from '@/db/notes';
import { listProcesses, listSteps } from '@/db/processes';
import { listReminders } from '@/db/reminders';
import { migrateDb } from '@/db/schema';
import { applyAiActions, intentToActions } from '@/services/actions';
import { parseIntent } from '@/utils/nlp';

import { createTestDb } from './helpers/node-sqlite';

jest.mock('@/services/notifications', () => ({
  scheduleReminderNotification: jest.fn(async () => 'notif-1'),
}));

let db: SQLiteDatabase;
beforeEach(async () => {
  db = createTestDb();
  await migrateDb(db);
});

describe('applyAiActions', () => {
  it('Claude eylemlerini veritabanına uygular', async () => {
    const summary = await applyAiActions(db, [
      { type: 'create_note', title: 'Fikir', content: 'uygulama ikonu', due_at: null, steps: [] },
      { type: 'create_reminder', title: 'Dişçi', content: '', due_at: '2099-01-01T15:00:00+03:00', steps: [] },
      { type: 'create_process', title: 'Taşınma', content: '', due_at: null, steps: ['Kutu al', 'Nakliye'] },
    ]);
    expect(summary).toHaveLength(3);
    expect((await listNotes(db))[0].title).toBe('Fikir');
    const [r] = await listReminders(db);
    expect(r).toMatchObject({ title: 'Dişçi', notification_id: 'notif-1' });
    const [p] = await listProcesses(db);
    expect(p).toMatchObject({ title: 'Taşınma', total_steps: 2 });
    expect((await listSteps(db, p.id)).map((s) => s.title)).toEqual(['Kutu al', 'Nakliye']);
  });

  it('geçersiz tarihte 1 saat sonrasına düşer', async () => {
    await applyAiActions(db, [{ type: 'create_reminder', title: 'X', content: '', due_at: 'tarih değil', steps: [] }]);
    const [r] = await listReminders(db);
    expect(new Date(r.due_at).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('çevrimdışı akış: parseIntent → intentToActions → applyAiActions', () => {
  it('uçtan uca hatırlatma oluşturur', async () => {
    const intent = parseIntent('yarın 15:00 dişçi randevusu hatırlat', new Date(2026, 9, 1, 10, 0));
    const actions = intentToActions(intent);
    expect(actions[0].type).toBe('create_reminder');
    await applyAiActions(db, actions);
    const [r] = await listReminders(db);
    expect(r.title.toLowerCase()).toContain('dişçi');
    expect(new Date(r.due_at).getHours()).toBe(15);
  });
  it('süreç cümlesinden adımlar çıkar', async () => {
    const actions = intentToActions(parseIntent('Süreç: Vize başvurusu - evrak, form, randevu'));
    await applyAiActions(db, actions);
    const [p] = await listProcesses(db);
    expect(p.total_steps).toBe(3);
  });
});
