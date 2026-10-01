import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { DateTimeField } from '@/components/date-time-field';
import { Button, Card, IconButton, Input, Muted, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { createReminder, deleteReminder, getReminder, updateReminder } from '@/db/reminders';
import { useTheme } from '@/hooks/use-theme';
import { cancelReminderNotification, ensureNotificationPermission, scheduleReminderNotification } from '@/services/notifications';
import { addMs, isOverdue } from '@/utils/date';

const QUICK = [
  { label: '+1 saat', ms: 60 * 60 * 1000 },
  { label: '+3 saat', ms: 3 * 60 * 60 * 1000 },
  { label: 'Yarın 09:00', ms: -1 },
];

export default function ReminderEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'yeni';
  const reminderId = isNew ? null : Number(id);
  const db = useSQLiteContext();
  const t = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [due, setDue] = useState<Date>(() => new Date(Date.now() + 60 * 60 * 1000));
  const [existingNotification, setExistingNotification] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reminderId == null) return;
    getReminder(db, reminderId).then((r) => {
      if (!r) return;
      setTitle(r.title);
      setBody(r.body);
      setDue(new Date(r.due_at));
      setExistingNotification(r.notification_id);
    });
  }, [db, reminderId]);

  const quick = (ms: number) => {
    if (ms < 0) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      setDue(d);
    } else {
      setDue(addMs(new Date(), ms));
    }
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Başlık gerekli', 'Hatırlatma için kısa bir başlık yaz.');
      return;
    }
    setSaving(true);
    try {
      const granted = await ensureNotificationPermission();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert('Bildirim izni yok', 'Hatırlatma kaydedilecek ama bildirim gönderilemeyecek.');
      }
      await cancelReminderNotification(existingNotification);
      const notificationId = await scheduleReminderNotification(title.trim(), body.trim(), due);
      const payload = { title: title.trim(), body: body.trim(), due_at: due.toISOString(), notification_id: notificationId };
      if (reminderId == null) await createReminder(db, payload);
      else await updateReminder(db, reminderId, payload);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (reminderId == null) return;
    Alert.alert('Hatırlatmayı sil', 'Bu hatırlatma ve bildirimi silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await cancelReminderNotification(existingNotification);
          await deleteReminder(db, reminderId);
          router.back();
        },
      },
    ]);
  };

  const inPast = isOverdue(due.toISOString());

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: isNew ? 'Yeni Hatırlatma' : 'Hatırlatmayı Düzenle',
          headerRight: () => (reminderId != null ? <IconButton icon="trash-outline" color={t.danger} onPress={remove} /> : null),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
          <Input label="Başlık" placeholder="Ör. Dişçi randevusu" value={title} onChangeText={setTitle} autoFocus={isNew} />
          <Input label="Açıklama (isteğe bağlı)" placeholder="Adres, hazırlık notu..." value={body} onChangeText={setBody} multiline style={{ minHeight: 80 }} />
          <DateTimeField label="Ne zaman?" value={due} onChange={setDue} />
          <Row>
            {QUICK.map((q) => (
              <Button key={q.label} title={q.label} variant="secondary" onPress={() => quick(q.ms)} style={{ flex: 1, paddingVertical: 8 }} />
            ))}
          </Row>
          {inPast ? (
            <Card style={{ backgroundColor: t.warningSoft, borderColor: t.warningSoft }}>
              <Muted style={{ color: t.warning }}>Seçilen zaman geçmişte. Kayıt yapılır ama bildirim planlanmaz.</Muted>
            </Card>
          ) : null}
          <Button title="Kaydet" icon="alarm-outline" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
