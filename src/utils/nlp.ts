/**
 * Çevrimdışı (API anahtarsız) doğal dil ayrıştırıcı.
 * "yarın 15:00 dişçi randevusu hatırlat" gibi Türkçe cümleleri basit kurallarla çözer.
 * Claude API kullanılamadığında yedek olarak devreye girer.
 */
import { addDays, startOfDay } from './date';

export type ParsedIntent =
  | { type: 'create_reminder'; title: string; due: Date }
  | { type: 'create_note'; title: string; content: string }
  | { type: 'create_process'; title: string; steps: string[] }
  | { type: 'summary' }
  | { type: 'unknown'; text: string };

const DAY_WORDS: Record<string, number> = {
  pazar: 0, pazartesi: 1, salı: 2, sali: 2, çarşamba: 3, carsamba: 3,
  perşembe: 4, persembe: 4, cuma: 5, cumartesi: 6,
};

const lower = (s: string) => s.toLocaleLowerCase('tr-TR');

/** Metin içindeki saat ifadesini bulur ("15:00", "15.30", "saat 9", "sabah 8'de"). */
export function extractTime(text: string): { hour: number; minute: number; match: string } | null {
  const t = lower(text);
  let m = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (m) return { hour: +m[1], minute: +m[2], match: m[0] };
  m = t.match(/saat\s+(\d{1,2})(?:'?[dt][ea])?\b/);
  if (m) return { hour: +m[1], minute: 0, match: m[0] };
  m = t.match(/\b(sabah|öğlen|oglen|akşam|aksam|gece)\s+(\d{1,2})(?:'?[dt][ea])?\b/);
  if (m) {
    let h = +m[2];
    const part = m[1];
    if ((part === 'akşam' || part === 'aksam' || part === 'gece') && h < 12) h += 12;
    if ((part === 'öğlen' || part === 'oglen') && h < 11) h += 12;
    return { hour: h, minute: 0, match: m[0] };
  }
  m = t.match(/\b(\d{1,2})'?[dt][ea]\b/);
  if (m) return { hour: +m[1], minute: 0, match: m[0] };
  return null;
}

/** Metindeki gün ifadesini çözer ("yarın", "bugün", "cuma", "3 gün sonra", "haftaya"). */
export function extractDay(text: string, now: Date): { date: Date; match: string } | null {
  const t = lower(text);
  const today = startOfDay(now);
  let m = t.match(/\b(\d{1,2})\s+gün\s+sonra\b/);
  if (m) return { date: addDays(today, +m[1]), match: m[0] };
  m = t.match(/\böbür\s*gün\b/);
  if (m) return { date: addDays(today, 2), match: m[0] };
  m = t.match(/\byarın\b/);
  if (m) return { date: addDays(today, 1), match: m[0] };
  m = t.match(/\bbugün\b/);
  if (m) return { date: today, match: m[0] };
  m = t.match(/\bhaftaya\b/);
  if (m) return { date: addDays(today, 7), match: m[0] };
  for (const [word, dow] of Object.entries(DAY_WORDS)) {
    const re = new RegExp(`\\b${word}(?:\\s+günü)?\\b`);
    const dm = t.match(re);
    if (dm) {
      let diff = (dow - today.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      return { date: addDays(today, diff), match: dm[0] };
    }
  }
  return null;
}

function cleanTitle(text: string, removals: string[]): string {
  let t = text;
  for (const r of removals) {
    if (!r) continue;
    t = t.replace(new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
  }
  t = t
    .replace(/\b(hatırlat(ır mısın)?|hatirlat|bana|lütfen|not al|not et|ekle|oluştur|olustur)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,:\-\s]+|[,:\-\s]+$/g, '');
  return t.length ? t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1) : 'Hatırlatma';
}

export function parseIntent(text: string, now: Date = new Date()): ParsedIntent {
  const raw = text.trim();
  const t = lower(raw);
  if (!raw) return { type: 'unknown', text: raw };

  const noteMatch = raw.match(/^\s*not(?:\s*al|\s*et)?\s*[:\-]\s*(.+)$/i);
  if (noteMatch) {
    const body = noteMatch[1].trim();
    const [first, ...rest] = body.split(/\n|\.\s+/);
    return { type: 'create_note', title: first.trim(), content: rest.join('. ').trim() };
  }

  const processMatch = raw.match(/^\s*(?:süreç|surec|iş|is|görev listesi|gorev listesi)\s*[:\-]\s*([^:]+?)\s*(?:adımlar|adimlar)?\s*[:\-]\s*(.+)$/i);
  if (processMatch) {
    const steps = processMatch[2].split(/,|;|\n|\d+\)/).map((s) => s.trim()).filter(Boolean);
    return { type: 'create_process', title: processMatch[1].trim(), steps };
  }

  // Not: JS'de \b Türkçe karakterlerle çalışmadığı için sınır kontrolü yapılmaz.
  if (/(özet|ozet|günüm|gunum|bugün ne var|planım|planim|programım|programim)/.test(t)) {
    return { type: 'summary' };
  }

  const day = extractDay(raw, now);
  const time = extractTime(raw);
  const wantsReminder = /\b(hatırlat|hatirlat|alarm|randevu|toplantı|toplanti)\b/.test(t) || day || time;
  if (wantsReminder && (day || time)) {
    const base = day ? day.date : startOfDay(now);
    const due = new Date(base);
    if (time) {
      due.setHours(time.hour, time.minute, 0, 0);
    } else {
      due.setHours(9, 0, 0, 0);
    }
    if (!day && due.getTime() <= now.getTime()) {
      due.setDate(due.getDate() + 1);
    }
    const title = cleanTitle(raw, [day?.match ?? '', time?.match ?? '']);
    return { type: 'create_reminder', title, due };
  }

  if (/\b(not|unutma)\b/.test(t)) {
    return { type: 'create_note', title: cleanTitle(raw, []), content: '' };
  }

  return { type: 'unknown', text: raw };
}
