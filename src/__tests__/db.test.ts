import type { SQLiteDatabase } from 'expo-sqlite';

import { addChatMessage, clearChat, listChatMessages } from '@/db/chat';
import { countNotes, createNote, deleteNote, getNote, listNotes, togglePinNote, updateNote } from '@/db/notes';
import { addStep, createProcess, deleteProcess, deleteStep, listProcesses, listSteps, setProcessStatus, setStepDone } from '@/db/processes';
import { countPendingReminders, createReminder, listOverdueReminders, listReminders, listRemindersBetween, setReminderDone } from '@/db/reminders';
import { migrateDb } from '@/db/schema';
import { getSetting, setSetting } from '@/db/settings';

import { createTestDb } from './helpers/node-sqlite';

let db: SQLiteDatabase;

beforeEach(async () => {
  db = createTestDb();
  await migrateDb(db);
});

describe('schema', () => {
  it('migrasyon user_version=1 yapar ve tekrar çalıştırılabilir', async () => {
    const v1 = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(v1?.user_version).toBe(1);
    await migrateDb(db); // idempotent
    const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(['notes', 'reminders', 'processes', 'process_steps', 'chat_messages', 'settings']));
  });
});

describe('notes', () => {
  it('CRUD, arama ve sabitleme', async () => {
    const id = await createNote(db, { title: 'Market', content: 'süt, ekmek' });
    await createNote(db, { title: 'Ders notu', content: 'React Native' });
    expect(await countNotes(db)).toBe(2);
    expect((await listNotes(db, 'ekmek')).map((n) => n.title)).toEqual(['Market']);

    await updateNote(db, id, { title: 'Market 2', content: 'yumurta', image_uri: 'file://x.jpg' });
    const n = await getNote(db, id);
    expect(n).toMatchObject({ title: 'Market 2', content: 'yumurta', image_uri: 'file://x.jpg' });

    await togglePinNote(db, id);
    expect((await listNotes(db))[0].id).toBe(id); // sabitlenen üste gelir
    expect((await getNote(db, id))?.pinned).toBe(1);

    await deleteNote(db, id);
    expect(await countNotes(db)).toBe(1);
  });
});

describe('reminders', () => {
  it('tarih aralığı, gecikmiş ve tamamlandı sorguları', async () => {
    const now = new Date(2026, 9, 1, 10, 0);
    const today = await createReminder(db, { title: 'Bugün', due_at: new Date(2026, 9, 1, 15, 0).toISOString() });
    await createReminder(db, { title: 'Dün', due_at: new Date(2026, 8, 30, 9, 0).toISOString() });
    await createReminder(db, { title: 'Yarın', due_at: new Date(2026, 9, 2, 9, 0).toISOString(), notification_id: 'n1' });

    const from = new Date(2026, 9, 1).toISOString();
    const to = new Date(2026, 9, 2).toISOString();
    expect((await listRemindersBetween(db, from, to)).map((r) => r.title)).toEqual(['Bugün']);
    expect((await listOverdueReminders(db, from)).map((r) => r.title)).toEqual(['Dün']);
    expect(await countPendingReminders(db)).toBe(3);

    await setReminderDone(db, today, true);
    expect(await countPendingReminders(db)).toBe(2);
    expect((await listReminders(db, false)).map((r) => r.title)).toEqual(['Dün', 'Yarın']);
    expect((await listReminders(db, true)).at(-1)?.title).toBe('Bugün'); // tamamlananlar sona
    expect(now.getTime()).toBeGreaterThan(0);
  });
});

describe('processes', () => {
  it('adımlarla oluşturma, ilerleme ve silme (transaction)', async () => {
    const id = await createProcess(db, { title: 'Vize', description: 'd', steps: ['Evrak', ' Form ', '', 'Randevu'] });
    let steps = await listSteps(db, id);
    expect(steps.map((s) => s.title)).toEqual(['Evrak', 'Form', 'Randevu']);
    expect(steps.map((s) => s.position)).toEqual([0, 1, 2]);

    await setStepDone(db, steps[0].id, true);
    let [p] = await listProcesses(db, 'active');
    expect(p).toMatchObject({ total_steps: 3, done_steps: 1 });

    const newStepId = await addStep(db, id, 'Ödeme');
    steps = await listSteps(db, id);
    expect(steps.at(-1)).toMatchObject({ id: newStepId, position: 3 });

    await deleteStep(db, newStepId);
    await setProcessStatus(db, id, 'done');
    expect((await listProcesses(db, 'done')).length).toBe(1);
    expect((await listProcesses(db, 'active')).length).toBe(0);
    [p] = await listProcesses(db);
    expect(p.status).toBe('done');

    await deleteProcess(db, id);
    expect(await listProcesses(db)).toEqual([]);
    expect(await listSteps(db, id)).toEqual([]);
  });
});

describe('chat & settings', () => {
  it('sohbet mesajları kronolojik döner ve temizlenir', async () => {
    await addChatMessage(db, 'user', 'merhaba');
    await addChatMessage(db, 'assistant', 'selam');
    expect((await listChatMessages(db)).map((m) => m.content)).toEqual(['merhaba', 'selam']);
    await clearChat(db);
    expect(await listChatMessages(db)).toEqual([]);
  });
  it('ayar upsert', async () => {
    expect(await getSetting(db, 'user_name')).toBeNull();
    await setSetting(db, 'user_name', 'Ahsen');
    await setSetting(db, 'user_name', 'Ahsen Y.');
    expect(await getSetting(db, 'user_name')).toBe('Ahsen Y.');
  });
});
