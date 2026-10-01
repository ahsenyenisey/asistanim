import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Chip, IconButton, Muted, Row, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { addChatMessage, clearChat, listChatMessages } from '@/db/chat';
import { listNotes } from '@/db/notes';
import { listProcesses } from '@/db/processes';
import { listOverdueReminders, listRemindersBetween } from '@/db/reminders';
import { getSetting, SettingKeys } from '@/db/settings';
import type { ChatMessage } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import { applyAiActions, intentToActions } from '@/services/actions';
import { askAssistant, DEFAULT_MODEL, describeAiError, type AiContext } from '@/services/ai';
import { getApiKey } from '@/services/secure';
import { speak } from '@/services/speech';
import { addDays, formatRelative, formatTime, startOfDay } from '@/utils/date';
import { parseIntent } from '@/utils/nlp';

const SUGGESTIONS = [
  'Yarın 15:00 dişçi randevusu hatırlat',
  'Not: Market listesi - süt, ekmek, yumurta',
  'Süreç: Vize başvurusu - pasaport fotokopisi, form doldur, randevu al',
  'Bugünümü özetle',
];

export default function AssistantScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    const [rows, key] = await Promise.all([listChatMessages(db), getApiKey()]);
    setMessages(rows);
    setHasKey(Boolean(key));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load]),
  );

  const buildContext = async (): Promise<AiContext> => {
    const now = new Date();
    const from = startOfDay(now).toISOString();
    const to = addDays(startOfDay(now), 1).toISOString();
    const [userName, today, overdue, processes, notes] = await Promise.all([
      getSetting(db, SettingKeys.userName),
      listRemindersBetween(db, from, to),
      listOverdueReminders(db, from),
      listProcesses(db, 'active'),
      listNotes(db),
    ]);
    return {
      userName,
      todayReminders: today.map((r) => `${formatTime(new Date(r.due_at))} ${r.title}${r.done ? ' (tamamlandı)' : ''}`),
      overdueReminders: overdue.map((r) => `${formatRelative(r.due_at)} ${r.title}`),
      activeProcesses: processes.map((p) => `${p.title} (${p.done_steps}/${p.total_steps} adım)`),
      recentNotes: notes.slice(0, 5).map((n) => n.title),
    };
  };

  const offlineReply = async (text: string): Promise<string> => {
    const intent = parseIntent(text);
    if (intent.type === 'summary') {
      const ctx = await buildContext();
      const lines = [
        ctx.todayReminders.length ? `Bugün ${ctx.todayReminders.length} hatırlatman var:\n${ctx.todayReminders.map((s) => `• ${s}`).join('\n')}` : 'Bugün için hatırlatman yok.',
        ctx.overdueReminders.length ? `Gecikmiş: ${ctx.overdueReminders.length}` : '',
        ctx.activeProcesses.length ? `Aktif süreçler:\n${ctx.activeProcesses.map((s) => `• ${s}`).join('\n')}` : '',
      ].filter(Boolean);
      return lines.join('\n\n');
    }
    const actions = intentToActions(intent);
    if (actions.length === 0) {
      return 'Bunu anlayamadım. "Yarın 15:00 dişçi hatırlat", "Not: ..." ya da "Süreç: Başlık - adım1, adım2" biçimini deneyebilirsin. Daha akıllı yanıtlar için Ayarlar\'dan Claude API anahtarı ekle.';
    }
    const done = await applyAiActions(db, actions);
    return done.join('\n');
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    try {
      await addChatMessage(db, 'user', text);
      setMessages(await listChatMessages(db));

      let reply: string;
      const apiKey = await getApiKey();
      if (apiKey) {
        try {
          const model = (await getSetting(db, SettingKeys.model)) ?? DEFAULT_MODEL;
          const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
          const result = await askAssistant({ apiKey, model, history, message: text, context: await buildContext() });
          const done = await applyAiActions(db, result.actions);
          reply = done.length ? `${result.reply}\n\n${done.join('\n')}` : result.reply;
        } catch (e) {
          reply = `⚠️ ${describeAiError(e)}\n\nÇevrimdışı moda geçiyorum:\n${await offlineReply(text)}`;
        }
      } else {
        reply = await offlineReply(text);
      }

      await addChatMessage(db, 'assistant', reply);
      setMessages(await listChatMessages(db));
      if ((await getSetting(db, SettingKeys.voiceReplies)) === '1') speak(reply.replace(/[📝⏰🗂️⚠️•]/g, ''));
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const reset = () => {
    Alert.alert('Sohbeti temizle', 'Tüm mesajlar silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: async () => { await clearChat(db); setMessages([]); } },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <Row style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.push('/ayarlar')}>
            <Chip text={hasKey ? 'Claude bağlı' : 'Çevrimdışı mod · anahtar ekle'} tone={hasKey ? 'success' : 'warning'} />
          </Pressable>
          <IconButton icon="trash-outline" onPress={reset} />
        </Row>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ gap: Spacing.sm, paddingTop: Spacing.lg }}>
              <Row style={{ justifyContent: 'center' }}>
                <Ionicons name="sparkles" size={36} color={t.primary} />
              </Row>
              <Muted style={{ textAlign: 'center' }}>Merhaba! Not alabilir, hatırlatma kurabilir ve süreçlerini yönetebilirim. Şunları deneyebilirsin:</Muted>
              {SUGGESTIONS.map((s) => (
                <Button key={s} title={s} variant="secondary" onPress={() => send(s)} style={{ justifyContent: 'flex-start' }} />
              ))}
            </View>
          }
          renderItem={({ item: m }) => <Bubble m={m} />}
        />
        <Row style={{ padding: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.card }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Asistana yaz..."
            placeholderTextColor={t.textSecondary}
            multiline
            style={{ flex: 1, color: t.text, backgroundColor: t.inputBackground, borderColor: t.border, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120, fontSize: 15 }}
            onSubmitEditing={() => send()}
          />
          <Pressable onPress={() => send()} disabled={busy || !input.trim()} style={{ backgroundColor: t.primary, borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}>
            <Ionicons name={busy ? 'hourglass-outline' : 'send'} size={20} color={t.onPrimary} />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const t = useTheme();
  const mine = m.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
      <View style={{ backgroundColor: mine ? t.primary : t.card, borderColor: t.border, borderWidth: mine ? 0 : 1, borderRadius: Radius.lg, borderBottomRightRadius: mine ? 4 : Radius.lg, borderBottomLeftRadius: mine ? Radius.lg : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ color: mine ? t.onPrimary : t.text, fontSize: 15, lineHeight: 21 }}>{m.content}</Text>
      </View>
      <Muted style={{ fontSize: 11, marginTop: 2, textAlign: mine ? 'right' : 'left' }}>{formatTime(new Date(m.created_at))}</Muted>
    </View>
  );
}
