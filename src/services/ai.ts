import { toLocalIsoString } from '@/utils/date';

/**
 * Claude Messages API istemcisi (doğrudan HTTPS / fetch).
 *
 * Resmî @anthropic-ai/sdk paketi React Native (Hermes) ortamında modül yükleme
 * sırasında çöktüğü için ("Cannot read property 'BetaToolRunner' of undefined")
 * API, React Native'in yerleşik fetch'i ile çağrılır.
 *
 * Kullanıcının mesajı yapılandırılmış JSON olarak (yanıt + uygulamanın
 * çalıştıracağı eylemler) döner.
 *
 * Not: Bu bir öğrenci/kişisel projedir; API anahtarı cihazda SecureStore'da
 * tutulur ve doğrudan istemciden çağrı yapılır. Üretim ortamında anahtarın
 * bir arka uç sunucusunda tutulması önerilir.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
/** Güvenlik sınıflandırıcısı bir isteği reddederse sunucu tarafında yedek modele yönlendirir. */
const BETA_FALLBACK = 'server-side-fallback-2026-07-01';

export const DEFAULT_MODEL = 'claude-opus-5';

export const MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 (varsayılan)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (hızlı)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (ekonomik)' },
];

export type AiActionType = 'create_note' | 'create_reminder' | 'create_process';

export interface AiAction {
  type: AiActionType;
  title: string;
  content: string;
  due_at: string | null;
  steps: string[];
}

export interface AiResult {
  reply: string;
  actions: AiAction[];
}

export interface AiContext {
  userName: string | null;
  todayReminders: string[];
  overdueReminders: string[];
  activeProcesses: string[];
  recentNotes: string[];
}

export interface AiTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** API'den dönen hata; durum koduna göre Türkçe mesaj üretmek için kullanılır. */
export class AiApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AiApiError';
  }
}

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'actions'],
  properties: {
    reply: {
      type: 'string',
      description: 'Kullanıcıya gösterilecek kısa, samimi Türkçe yanıt.',
    },
    actions: {
      type: 'array',
      description: 'Uygulamanın çalıştıracağı eylemler. Eylem gerekmiyorsa boş dizi.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'content', 'due_at', 'steps'],
        properties: {
          type: { type: 'string', enum: ['create_note', 'create_reminder', 'create_process'] },
          title: { type: 'string' },
          content: { type: 'string', description: 'Not içeriği, hatırlatma açıklaması veya süreç açıklaması.' },
          due_at: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
            description: 'Sadece create_reminder için: yerel saat dilimli ISO-8601 (örn. 2026-10-02T15:00:00+03:00).',
          },
          steps: { type: 'array', items: { type: 'string' }, description: 'Sadece create_process için adımlar.' },
        },
      },
    },
  },
};

export function buildSystemPrompt(ctx: AiContext, now: Date): string {
  const name = ctx.userName ? ` Kullanıcının adı ${ctx.userName}.` : '';
  const list = (arr: string[]) => (arr.length ? arr.map((s) => `- ${s}`).join('\n') : '- (yok)');
  return [
    `Sen "Asistanım" adlı kişisel sekreter uygulamasının yapay zekâ asistanısın.${name}`,
    'Görevin: kullanıcının günlük işleriyle ilgili not almak, hatırlatma kurmak, çok adımlı süreçler (iş akışları) oluşturmak ve gününü özetlemek.',
    'Her zaman Türkçe, kısa ve doğal yanıt ver. Gereksiz uzun açıklama yapma.',
    'Kullanıcı bir hatırlatma istiyorsa create_reminder eylemi üret ve due_at alanını, verilen şu anki zamana göre hesaplayıp yerel saat dilimli ISO-8601 biçiminde doldur.',
    'Saat verilmemişse 09:00 varsay. Geçmiş bir zaman çıkıyorsa bir sonraki uygun güne taşı.',
    'Kullanıcı bir şey not etmek istiyorsa create_note; birden fazla adımı olan bir iş tanımlıyorsa create_process (adımları steps dizisine yaz) üret.',
    'Sohbet, soru ya da özet isteği için eylem üretme; sadece reply doldur.',
    'Özet istenirse aşağıdaki bağlamı kullanarak günün planını anlat.',
    '',
    `Şu anki zaman: ${toLocalIsoString(now)}`,
    '',
    'Bugünün hatırlatmaları:',
    list(ctx.todayReminders),
    'Gecikmiş hatırlatmalar:',
    list(ctx.overdueReminders),
    'Aktif süreçler:',
    list(ctx.activeProcesses),
    'Son notlar:',
    list(ctx.recentNotes),
  ].join('\n');
}

interface MessagesResponse {
  content?: { type: string; text?: string }[];
  stop_reason?: string;
  error?: { type?: string; message?: string };
}

/** Yanıt gövdesindeki metin bloklarını birleştirip JSON'a çevirir. */
export function parseAiResponse(body: MessagesResponse): AiResult {
  if (body.stop_reason === 'refusal') {
    return { reply: 'Bu isteğe yanıt veremiyorum. Başka nasıl yardımcı olabilirim?', actions: [] };
  }
  const text = (body.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('');
  try {
    const parsed = JSON.parse(text) as Partial<AiResult>;
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply : 'Tamam.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    return { reply: text || 'Yanıt alınamadı.', actions: [] };
  }
}

export async function askAssistant(params: {
  apiKey: string;
  model: string;
  history: AiTurn[];
  message: string;
  context: AiContext;
}): Promise<AiResult> {
  const messages = [
    ...params.history.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: params.message },
  ];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-beta': BETA_FALLBACK,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 4096,
      fallbacks: 'default',
      system: buildSystemPrompt(params.context, new Date()),
      messages,
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
    }),
  });

  const body = (await res.json().catch(() => ({}))) as MessagesResponse;
  if (!res.ok) {
    throw new AiApiError(res.status, body.error?.message ?? `HTTP ${res.status}`);
  }
  return parseAiResponse(body);
}

/** Hata nesnesini kullanıcıya gösterilebilir Türkçe mesaja çevirir. */
export function describeAiError(error: unknown): string {
  if (error instanceof AiApiError) {
    if (error.status === 401) return 'API anahtarı geçersiz. Ayarlar sayfasından kontrol edin.';
    if (error.status === 429) return 'İstek sınırı aşıldı. Biraz sonra tekrar deneyin.';
    if (error.status === 400) return `İstek reddedildi: ${error.message}`;
    if (error.status >= 500) return 'Claude sunucusu geçici olarak yanıt vermiyor. Tekrar deneyin.';
    return `API hatası (${error.status}): ${error.message}`;
  }
  if (error instanceof TypeError) return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
  return error instanceof Error ? error.message : 'Bilinmeyen hata.';
}
