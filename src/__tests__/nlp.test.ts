import { extractDay, extractTime, parseIntent } from '@/utils/nlp';

// Sabit referans zaman: 1 Ekim 2026 Perşembe, 10:00
const NOW = new Date(2026, 9, 1, 10, 0, 0);

describe('extractTime', () => {
  it('15:30 biçimini çözer', () => {
    expect(extractTime('yarın 15:30 toplantı')).toMatchObject({ hour: 15, minute: 30 });
  });
  it('"saat 9" biçimini çözer', () => {
    expect(extractTime('saat 9 kahvaltı')).toMatchObject({ hour: 9, minute: 0 });
  });
  it('"akşam 8" ifadesini 20:00 yapar', () => {
    expect(extractTime("akşam 8'de spor")).toMatchObject({ hour: 20, minute: 0 });
  });
  it('saat yoksa null döner', () => {
    expect(extractTime('market alışverişi')).toBeNull();
  });
});

describe('extractDay', () => {
  it('"yarın" bir gün sonrasını verir', () => {
    const r = extractDay('yarın dişçi', NOW);
    expect(r?.date.getDate()).toBe(2);
  });
  it('"cuma" bir sonraki cumayı verir', () => {
    const r = extractDay('cuma günü rapor teslimi', NOW);
    expect(r?.date.getDay()).toBe(5);
    expect(r?.date.getDate()).toBe(2);
  });
  it('"3 gün sonra" doğru hesaplanır', () => {
    const r = extractDay('3 gün sonra kargo', NOW);
    expect(r?.date.getDate()).toBe(4);
  });
});

describe('parseIntent', () => {
  it('hatırlatma niyetini tarih ve saatle çözer', () => {
    const r = parseIntent('yarın 15:00 dişçi randevusu hatırlat', NOW);
    expect(r.type).toBe('create_reminder');
    if (r.type === 'create_reminder') {
      expect(r.due.getDate()).toBe(2);
      expect(r.due.getHours()).toBe(15);
      expect(r.title.toLowerCase()).toContain('dişçi');
      expect(r.title.toLowerCase()).not.toContain('yarın');
    }
  });
  it('saat geçmişse ertesi güne taşır', () => {
    const r = parseIntent('saat 8 ilaç al', NOW);
    expect(r.type).toBe('create_reminder');
    if (r.type === 'create_reminder') expect(r.due.getDate()).toBe(2);
  });
  it('"Not:" ile başlayan metni not yapar', () => {
    const r = parseIntent('Not: Market listesi - süt, ekmek', NOW);
    expect(r).toMatchObject({ type: 'create_note', title: 'Market listesi - süt, ekmek' });
  });
  it('"Süreç:" ile süreç ve adımları çözer', () => {
    const r = parseIntent('Süreç: Vize başvurusu - pasaport fotokopisi, form doldur, randevu al', NOW);
    expect(r.type).toBe('create_process');
    if (r.type === 'create_process') {
      expect(r.title).toBe('Vize başvurusu');
      expect(r.steps).toEqual(['pasaport fotokopisi', 'form doldur', 'randevu al']);
    }
  });
  it('özet isteğini tanır', () => {
    expect(parseIntent('bugünümü özetle', NOW).type).toBe('summary');
  });
  it('anlaşılmayan metinde unknown döner', () => {
    expect(parseIntent('merhaba nasılsın', NOW).type).toBe('unknown');
  });
});
