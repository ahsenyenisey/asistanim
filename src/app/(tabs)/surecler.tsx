import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { Body, Button, Card, Chip, EmptyState, Fab, IconButton, Muted, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deleteProcess, listProcesses } from '@/db/processes';
import type { ProcessStatus, ProcessWithProgress } from '@/db/types';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatRelative } from '@/utils/date';

import { ProgressBar } from './index';

const FILTERS: { key: ProcessStatus | 'all'; label: string }[] = [
  { key: 'active', label: 'Aktif' },
  { key: 'done', label: 'Biten' },
  { key: 'all', label: 'Tümü' },
];

export default function ProcessesScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [filter, setFilter] = useState<ProcessStatus | 'all'>('active');

  const loader = useCallback(() => listProcesses(db, filter === 'all' ? undefined : filter), [db, filter]);
  const { data: processes, reload } = useRefreshOnFocus(loader, [] as ProcessWithProgress[]);

  const remove = (p: ProcessWithProgress) => {
    Alert.alert('Süreci sil', `"${p.title}" ve tüm adımları silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteProcess(db, p.id); await reload(); } },
    ]);
  };

  return (
    <Screen>
      <Row style={{ padding: Spacing.md, paddingBottom: Spacing.sm }}>
        {FILTERS.map((f) => (
          <Button key={f.key} title={f.label} variant={filter === f.key ? 'primary' : 'secondary'} onPress={() => setFilter(f.key)} style={{ paddingVertical: 8 }} />
        ))}
      </Row>
      <FlatList
        data={processes}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon="git-branch-outline" title="Süreç yok" hint="Çok adımlı bir işi (ör. vize başvurusu) adım adım takip et." />}
        renderItem={({ item: p }) => (
          <Card onPress={() => router.push({ pathname: '/surec/[id]', params: { id: String(p.id) } })}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>{p.title}</Body>
                {p.description ? <Muted numberOfLines={2}>{p.description}</Muted> : null}
                <Row style={{ marginTop: 6 }}>
                  <Chip text={p.status === 'active' ? 'Aktif' : p.status === 'done' ? 'Tamamlandı' : 'Arşiv'} tone={p.status === 'active' ? 'primary' : p.status === 'done' ? 'success' : 'neutral'} />
                  <Muted>{p.done_steps}/{p.total_steps} adım · {formatRelative(p.updated_at)}</Muted>
                </Row>
              </View>
              <IconButton icon="trash-outline" color={t.danger} onPress={() => remove(p)} />
            </Row>
            <ProgressBar value={p.total_steps ? p.done_steps / p.total_steps : 0} />
          </Card>
        )}
      />
      <Fab onPress={() => router.push({ pathname: '/surec/[id]', params: { id: 'yeni' } })} label="Yeni süreç" />
    </Screen>
  );
}
