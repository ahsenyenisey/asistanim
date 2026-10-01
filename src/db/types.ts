/** SQLite tablolarına karşılık gelen tipler. Tarihler ISO-8601 string olarak saklanır. */

export interface Note {
  id: number;
  title: string;
  content: string;
  image_uri: string | null;
  pinned: number; // 0 | 1
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  title: string;
  body: string;
  due_at: string;
  notification_id: string | null;
  done: number; // 0 | 1
  created_at: string;
}

export type ProcessStatus = 'active' | 'done' | 'archived';

export interface Process {
  id: number;
  title: string;
  description: string;
  status: ProcessStatus;
  created_at: string;
  updated_at: string;
}

export interface ProcessStep {
  id: number;
  process_id: number;
  title: string;
  position: number;
  done: number; // 0 | 1
}

export interface ProcessWithProgress extends Process {
  total_steps: number;
  done_steps: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  created_at: string;
}
