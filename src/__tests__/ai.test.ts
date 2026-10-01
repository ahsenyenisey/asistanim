import { AiApiError, askAssistant, buildSystemPrompt, describeAiError, parseAiResponse, type AiContext } from '@/services/ai';

const ctx: AiContext = { userName: 'Ahsen', todayReminders: ['15:00 Dişçi'], overdueReminders: [], activeProcesses: [], recentNotes: ['Market'] };

describe('parseAiResponse', () => {
  it('JSON metin bloğunu çözer', () => {
    const r = parseAiResponse({ content: [{ type: 'text', text: '{"reply":"Tamam","actions":[{"type":"create_note","title":"X","content":"","due_at":null,"steps":[]}]}' }] });
    expect(r.reply).toBe('Tamam');
    expect(r.actions[0].type).toBe('create_note');
  });
  it('refusal durumunda eylem üretmez', () => {
    expect(parseAiResponse({ stop_reason: 'refusal', content: [] }).actions).toEqual([]);
  });
  it('bozuk JSON\'da ham metni yanıt yapar', () => {
    expect(parseAiResponse({ content: [{ type: 'text', text: 'düz metin' }] })).toEqual({ reply: 'düz metin', actions: [] });
  });
});

describe('buildSystemPrompt', () => {
  it('bağlamı ve zamanı içerir', () => {
    const p = buildSystemPrompt(ctx, new Date(2026, 9, 1, 10, 0));
    expect(p).toContain('Ahsen');
    expect(p).toContain('15:00 Dişçi');
    expect(p).toContain('2026-10-01T10:00:00');
  });
});

describe('askAssistant', () => {
  it('doğru başlıklarla POST atar ve yanıtı çözer', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text: '{"reply":"Kuruldu","actions":[]}' }], stop_reason: 'end_turn' }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const r = await askAssistant({ apiKey: 'k', model: 'claude-opus-5', history: [], message: 'selam', context: ctx });
    expect(r.reply).toBe('Kuruldu');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('k');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('claude-opus-5');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'selam' });
  });
  it('HTTP hatasını AiApiError olarak fırlatır', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'invalid x-api-key' } }) })) as unknown as typeof fetch;
    await expect(askAssistant({ apiKey: 'k', model: 'm', history: [], message: 'x', context: ctx })).rejects.toBeInstanceOf(AiApiError);
  });
});

describe('describeAiError', () => {
  it('durum kodlarını Türkçe mesaja çevirir', () => {
    expect(describeAiError(new AiApiError(401, 'x'))).toContain('anahtarı geçersiz');
    expect(describeAiError(new AiApiError(429, 'x'))).toContain('sınırı');
    expect(describeAiError(new AiApiError(503, 'x'))).toContain('geçici');
    expect(describeAiError(new TypeError('Network request failed'))).toContain('bağlanılamadı');
  });
});
