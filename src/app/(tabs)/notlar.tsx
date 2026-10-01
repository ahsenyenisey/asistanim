import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { Body, Card, EmptyState, Fab, IconButton, Input, Muted, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deleteNote, listNotes, togglePinNote } from '@/db/notes';
import type { Note } from '@/db/types';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatRelative } from '@/utils/date';

export default function NotesScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [search, setSearch] = useState('');

  const loader = useCallback(() => listNotes(db, search), [db, search]);
  const { data: notes, reload } = useRefreshOnFocus(loader, [] as Note[]);

  const remove = (n: Note) => {
    Alert.alert('Notu sil', `"${n.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteNote(db, n.id); await reload(); } },
    ]);
  };

  return (
    <Screen>
      <View style={{ padding: Spacing.md, paddingBottom: Spacing.sm }}>
        <Input placeholder="Notlarda ara..." value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={reload} />
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="Henüz not yok" hint="Sağ alttaki + ile ilk notunu ekle." />}
        renderItem={({ item: n }) => (
          <Card onPress={() => router.push({ pathname: '/not/[id]', params: { id: String(n.id) } })}>
            <Row style={{ alignItems: 'flex-start' }}>
              {n.image_uri ? <Image source={{ uri: n.image_uri }} style={{ width: 56, height: 56, borderRadius: 8 }} contentFit="cover" /> : null}
              <View style={{ flex: 1 }}>
                <Row>
                  {n.pinned ? <Ionicons name="pin" size={14} color={t.warning} /> : null}
                  <Body style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>{n.title}</Body>
                </Row>
                {n.content ? <Muted numberOfLines={2}>{n.content}</Muted> : null}
                <Muted style={{ marginTop: 4, fontSize: 12 }}>{formatRelative(n.updated_at)}</Muted>
              </View>
              <IconButton icon={n.pinned ? 'pin' : 'pin-outline'} color={n.pinned ? t.warning : t.textSecondary} onPress={async () => { await togglePinNote(db, n.id); await reload(); }} />
              <IconButton icon="trash-outline" color={t.danger} onPress={() => remove(n)} />
            </Row>
          </Card>
        )}
      />
      <Fab onPress={() => router.push({ pathname: '/not/[id]', params: { id: 'yeni' } })} label="Yeni not" />
    </Screen>
  );
}
