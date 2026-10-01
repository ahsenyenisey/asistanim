import { addDays, formatRelative, isOverdue, isSameDay, startOfDay, toLocalIsoString } from '@/utils/date';

const NOW = new Date(2026, 9, 1, 10, 0, 0);

describe('date utils', () => {
  it('startOfDay saati sıfırlar', () => {
    const d = startOfDay(NOW);
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
  it('addDays ay sınırını aşar', () => {
    expect(addDays(new Date(2026, 9, 31), 1).getMonth()).toBe(10);
  });
  it('isSameDay', () => {
    expect(isSameDay(NOW, new Date(2026, 9, 1, 23, 59))).toBe(true);
    expect(isSameDay(NOW, addDays(NOW, 1))).toBe(false);
  });
  it('formatRelative bugün/yarın etiketler', () => {
    expect(formatRelative(new Date(2026, 9, 1, 14, 30).toISOString(), NOW)).toBe('Bugün 14:30');
    expect(formatRelative(new Date(2026, 9, 2, 9, 5).toISOString(), NOW)).toBe('Yarın 09:05');
    expect(formatRelative(new Date(2026, 10, 12, 18, 0).toISOString(), NOW)).toBe('12 Kasım 2026 18:00');
  });
  it('isOverdue', () => {
    expect(isOverdue(new Date(2026, 8, 30).toISOString(), NOW)).toBe(true);
    expect(isOverdue(new Date(2026, 9, 5).toISOString(), NOW)).toBe(false);
  });
  it('toLocalIsoString saat dilimi ekler', () => {
    expect(toLocalIsoString(NOW)).toMatch(/^2026-10-01T10:00:00[+-]\d{2}:\d{2}$/);
  });
});
