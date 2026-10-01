import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Body, Button, Card, Chip, IconButton, Muted, Row, Subtitle, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { countNotes, listNotes } from '@/db/notes';
import { countActiveProcesses, listProcesses } from '@/db/processes';
import { listOverdueReminders, listRemindersBetween, setReminderDone } from '@/db/reminders';
import { getSetting, SettingKeys } from '@/db/settings';
import type { Note, ProcessWithProgress, Reminder } from '@/db/types';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { cancelReminderNotification } from '@/services/notifications';
import { addDays, formatDate, formatDayName, formatRelative, formatTime, startOfDay } from '@/utils/date';

interface Dashboard {
  userName: string | null;
  today: Reminder[];
  overdue: Reminder[];
  processes: ProcessWithProgress[];
  notes: Note[];
  counts: { notes: number; processes: number };
}

const EMPTY: Dashboard = { userName: null, today: [], overdue: [], processes: [], notes: [], counts: { notes: 0, processes: 0 } };

export default function TodayScreen() {
  const db = useSQLiteContext();
  const t = useTheme();

  const loader = useCallback(async (): Promise<Dashboard> => {
    const now = new Date();
    const from = startOfDay(now).toISOString();
    const to = addDays(startOfDay(now), 1).toISOString();
    const [userName, today, overdue, processes, notes, nCount, pCount] = await Promise.all([
      getSetting(db, SettingKeys.userName),
      listRemindersBetween(db, from, to),
      listOverdueReminders(db, from),
      listProcesses(db, 'active'),
      listNotes(db),
      countNotes(db),
      countActiveProcesses(db),
    ]);
    return { userName, today, overdue, processes: processes.slice(0, 3), notes: notes.slice(0, 3), counts: { notes: nCount, processes: pCount } };
  }, [db]);

  const { data, reload, loading } = useRefreshOnFocus(loader, EMPTY);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  const complete = async (r: Reminder) => {
    await cancelReminderNotification(r.notification_id);
    await setReminderDone(db, r.id, true);
    await reload();
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={t.primary} />}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Title>{greeting}{data.userName ? `, ${data.userName}` : ''}</Title>
          <Muted>{formatDayName(now)}, {formatDate(now)}</Muted>
        </View>
        <IconButton icon="settings-outline" onPress={() => router.push('/ayarlar')} />
      </Row>

      <Row>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Title style={{ color: t.primary }}>{data.today.length}</Title>
          <Muted>Bugün</Muted>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Title style={{ color: data.overdue.length ? t.danger : t.success }}>{data.overdue.length}</Title>
          <Muted>Gecikmiş</Muted>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Title style={{ color: t.warning }}>{data.counts.processes}</Title>
          <Muted>Süreç</Muted>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Title>{data.counts.notes}</Title>
          <Muted>Not</Muted>
        </Card>
      </Row>

      <Card style={{ backgroundColor: t.primarySoft, borderColor: t.primarySoft }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Subtitle style={{ color: t.primary }}>Asistana sor</Subtitle>
            <Muted>{'"Yarın 15:00 dişçi" yaz, gerisini o halletsin.'}</Muted>
          </View>
          <Button title="Aç" icon="sparkles-outline" variant="primary" onPress={() => router.push('/asistan')} />
        </Row>
      </Card>

      {data.overdue.length ? (
        <View style={{ gap: Spacing.sm }}>
          <Subtitle style={{ color: t.danger }}>Gecikmiş</Subtitle>
          {data.overdue.map((r) => (
            <ReminderRow key={r.id} r={r} onDone={() => complete(r)} overdue />
          ))}
        </View>
      ) : null}

      <View style={{ gap: Spacing.sm }}>
        <Subtitle>Bugünün hatırlatmaları</Subtitle>
        {data.today.length === 0 ? (
          <Card>
            <Muted>Bugün için planlanmış hatırlatma yok.</Muted>
          </Card>
        ) : (
          data.today.map((r) => <ReminderRow key={r.id} r={r} onDone={() => complete(r)} />)
        )}
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Aktif süreçler</Subtitle>
          <Button title="Tümü" variant="ghost" onPress={() => router.push('/surecler')} />
        </Row>
        {data.processes.length === 0 ? (
          <Card>
            <Muted>Aktif süreç yok. Süreçler sekmesinden adım adım bir iş tanımlayabilirsin.</Muted>
          </Card>
        ) : (
          data.processes.map((p) => (
            <Card key={p.id} onPress={() => router.push({ pathname: '/surec/[id]', params: { id: String(p.id) } })}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body style={{ flex: 1, fontWeight: '600' }}>{p.title}</Body>
                <Chip text={`${p.done_steps}/${p.total_steps}`} tone={p.total_steps && p.done_steps === p.total_steps ? 'success' : 'primary'} />
              </Row>
              <ProgressBar value={p.total_steps ? p.done_steps / p.total_steps : 0} />
            </Card>
          ))
        )}
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Son notlar</Subtitle>
          <Button title="Tümü" variant="ghost" onPress={() => router.push('/notlar')} />
        </Row>
        {data.notes.length === 0 ? (
          <Card>
            <Muted>Henüz not yok.</Muted>
          </Card>
        ) : (
          data.notes.map((n) => (
            <Card key={n.id} onPress={() => router.push({ pathname: '/not/[id]', params: { id: String(n.id) } })}>
              <Body style={{ fontWeight: '600' }} numberOfLines={1}>{n.title}</Body>
              {n.content ? <Muted numberOfLines={2}>{n.content}</Muted> : null}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ReminderRow({ r, onDone, overdue }: { r: Reminder; onDone: () => void; overdue?: boolean }) {
  const t = useTheme();
  const d = new Date(r.due_at);
  return (
    <Card onPress={() => router.push({ pathname: '/hatirlatma/[id]', params: { id: String(r.id) } })}>
      <Row>
        <IconButton icon={r.done ? 'checkmark-circle' : 'ellipse-outline'} color={r.done ? t.success : t.textSecondary} onPress={onDone} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600', textDecorationLine: r.done ? 'line-through' : 'none' }}>{r.title}</Body>
          <Muted>{overdue ? formatRelative(r.due_at) : formatTime(d)}{r.body ? ` · ${r.body}` : ''}</Muted>
        </View>
        {overdue ? <Ionicons name="alert-circle" color={t.danger} size={20} /> : null}
      </Row>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const t = useTheme();
  return (
    <View style={{ height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, height: '100%', backgroundColor: t.success }} />
    </View>
  );
}
