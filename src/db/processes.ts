import type { SQLiteDatabase } from 'expo-sqlite';

import type { Process, ProcessStatus, ProcessStep, ProcessWithProgress } from './types';

const nowIso = () => new Date().toISOString();

const PROGRESS_SQL = `
  SELECT p.*,
    (SELECT COUNT(*) FROM process_steps s WHERE s.process_id = p.id) AS total_steps,
    (SELECT COUNT(*) FROM process_steps s WHERE s.process_id = p.id AND s.done = 1) AS done_steps
  FROM processes p
`;

export async function listProcesses(db: SQLiteDatabase, status?: ProcessStatus): Promise<ProcessWithProgress[]> {
  if (status) {
    return db.getAllAsync<ProcessWithProgress>(`${PROGRESS_SQL} WHERE p.status = ? ORDER BY p.updated_at DESC`, status);
  }
  return db.getAllAsync<ProcessWithProgress>(
    `${PROGRESS_SQL} ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'done' THEN 1 ELSE 2 END, p.updated_at DESC`,
  );
}

export async function getProcess(db: SQLiteDatabase, id: number): Promise<Process | null> {
  return db.getFirstAsync<Process>('SELECT * FROM processes WHERE id = ?', id);
}

export async function listSteps(db: SQLiteDatabase, processId: number): Promise<ProcessStep[]> {
  return db.getAllAsync<ProcessStep>(
    'SELECT * FROM process_steps WHERE process_id = ? ORDER BY position ASC',
    processId,
  );
}

export async function createProcess(
  db: SQLiteDatabase,
  input: { title: string; description?: string; steps?: string[] },
): Promise<number> {
  const ts = nowIso();
  let id = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO processes (title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      input.title,
      input.description ?? '',
      'active',
      ts,
      ts,
    );
    id = res.lastInsertRowId;
    const steps = (input.steps ?? []).map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < steps.length; i++) {
      await db.runAsync(
        'INSERT INTO process_steps (process_id, title, position) VALUES (?, ?, ?)',
        id,
        steps[i],
        i,
      );
    }
  });
  return id;
}

export async function updateProcess(
  db: SQLiteDatabase,
  id: number,
  input: { title: string; description: string },
): Promise<void> {
  await db.runAsync(
    'UPDATE processes SET title = ?, description = ?, updated_at = ? WHERE id = ?',
    input.title,
    input.description,
    nowIso(),
    id,
  );
}

export async function setProcessStatus(db: SQLiteDatabase, id: number, status: ProcessStatus): Promise<void> {
  await db.runAsync('UPDATE processes SET status = ?, updated_at = ? WHERE id = ?', status, nowIso(), id);
}

export async function deleteProcess(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM process_steps WHERE process_id = ?', id);
    await db.runAsync('DELETE FROM processes WHERE id = ?', id);
  });
}

export async function addStep(db: SQLiteDatabase, processId: number, title: string): Promise<number> {
  const row = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(position) AS m FROM process_steps WHERE process_id = ?',
    processId,
  );
  const position = (row?.m ?? -1) + 1;
  const res = await db.runAsync(
    'INSERT INTO process_steps (process_id, title, position) VALUES (?, ?, ?)',
    processId,
    title,
    position,
  );
  await db.runAsync('UPDATE processes SET updated_at = ? WHERE id = ?', nowIso(), processId);
  return res.lastInsertRowId;
}

export async function setStepDone(db: SQLiteDatabase, stepId: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE process_steps SET done = ? WHERE id = ?', done ? 1 : 0, stepId);
}

export async function deleteStep(db: SQLiteDatabase, stepId: number): Promise<void> {
  await db.runAsync('DELETE FROM process_steps WHERE id = ?', stepId);
}

export async function countActiveProcesses(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) AS c FROM processes WHERE status = 'active'");
  return row?.c ?? 0;
}
