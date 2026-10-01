import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { Body, Button, Card, Chip, EmptyState, Fab, IconButton, Muted, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deleteReminder, listReminders, setReminderDone } from '@/db/reminders';
import type { Reminder } from '@/db/types';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { cancelReminderNotification } from '@/services/notifications';
import { formatRelative, isOverdue } from '@/utils/date';

export default function RemindersScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [showDone, setShowDone] = useState(false);

  const loader = useCallback(() => listReminders(db, showDone), [db, showDone]);
  const { data: reminders, reload } = useRefreshOnFocus(loader, [] as Reminder[]);

  const toggle = async (r: Reminder) => {
    if (!r.done) await cancelReminderNotification(r.notification_id);
    await setReminderDone(db, r.id, !r.done);
    await reload();
  };

  const remove = (r: Reminder) => {
    Alert.alert('Hatırlatmayı sil', `"${r.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await cancelReminderNotification(r.notification_id);
          await deleteReminder(db, r.id);
          await reload();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Row style={{ padding: Spacing.md, paddingBottom: Spacing.sm, justifyContent: 'space-between' }}>
        <Muted>{reminders.filter((r) => !r.done).length} bekleyen</Muted>
        <Button title={showDone ? 'Tamamlananları gizle' : 'Tamamlananları göster'} variant="ghost" onPress={() => setShowDone((v) => !v)} />
      </Row>
      <FlatList
        data={reminders}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon="alarm-outline" title="Hatırlatma yok" hint="+ ile ekle ya da Asistan'a 'yarın 9'da toplantı' yaz." />}
        renderItem={({ item: r }) => {
          const overdue = !r.done && isOverdue(r.due_at);
          return (
            <Card onPress={() => router.push({ pathname: '/hatirlatma/[id]', params: { id: String(r.id) } })}>
              <Row>
                <IconButton icon={r.done ? 'checkmark-circle' : 'ellipse-outline'} color={r.done ? t.success : t.textSecondary} onPress={() => toggle(r)} size={26} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '600', textDecorationLine: r.done ? 'line-through' : 'none' }}>{r.title}</Body>
                  {r.body ? <Muted numberOfLines={1}>{r.body}</Muted> : null}
                  <Row style={{ marginTop: 4 }}>
                    <Chip text={formatRelative(r.due_at)} tone={r.done ? 'success' : overdue ? 'danger' : 'primary'} />
                    {!r.done && !r.notification_id ? <Chip text="Bildirim yok" tone="warning" /> : null}
                  </Row>
                </View>
                <IconButton icon="trash-outline" color={t.danger} onPress={() => remove(r)} />
              </Row>
            </Card>
          );
        }}
      />
      <Fab onPress={() => router.push({ pathname: '/hatirlatma/[id]', params: { id: 'yeni' } })} label="Yeni hatırlatma" />
    </Screen>
  );
}
