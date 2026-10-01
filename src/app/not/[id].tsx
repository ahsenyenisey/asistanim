import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button, IconButton, Input, Muted, Row, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { createNote, deleteNote, getNote, updateNote } from '@/db/notes';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/utils/date';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'yeni';
  const noteId = isNew ? null : Number(id);
  const db = useSQLiteContext();
  const t = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [meta, setMeta] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (noteId == null) return;
    getNote(db, noteId).then((n) => {
      if (!n) return;
      setTitle(n.title);
      setContent(n.content);
      setImageUri(n.image_uri);
      setMeta(`Oluşturuldu: ${formatDateTime(n.created_at)} · Güncellendi: ${formatDateTime(n.updated_at)}`);
    });
  }, [db, noteId]);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin gerekli', fromCamera ? 'Kamera izni verilmedi.' : 'Galeri izni verilmedi.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const save = async () => {
    const cleanTitle = title.trim() || content.trim().split('\n')[0]?.slice(0, 60) || 'Adsız not';
    setSaving(true);
    try {
      if (noteId == null) await createNote(db, { title: cleanTitle, content: content.trim(), image_uri: imageUri });
      else await updateNote(db, noteId, { title: cleanTitle, content: content.trim(), image_uri: imageUri });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (noteId == null) return;
    Alert.alert('Notu sil', 'Bu not kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteNote(db, noteId); router.back(); } },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: isNew ? 'Yeni Not' : 'Notu Düzenle',
          headerRight: () => (noteId != null ? <IconButton icon="trash-outline" color={t.danger} onPress={remove} /> : null),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
          <Input label="Başlık" placeholder="Not başlığı" value={title} onChangeText={setTitle} autoFocus={isNew} />
          <Input label="İçerik" placeholder="Aklındakileri yaz..." value={content} onChangeText={setContent} multiline style={{ minHeight: 180 }} />

          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: Radius.md }} contentFit="cover" />
              <Button title="Görseli kaldır" variant="danger" icon="close" onPress={() => setImageUri(null)} style={{ marginTop: Spacing.sm }} />
            </View>
          ) : (
            <Row>
              <Button title="Fotoğraf çek" icon="camera-outline" variant="secondary" onPress={() => pickImage(true)} style={{ flex: 1 }} />
              <Button title="Galeriden seç" icon="image-outline" variant="secondary" onPress={() => pickImage(false)} style={{ flex: 1 }} />
            </Row>
          )}

          {meta ? <Muted>{meta}</Muted> : null}
          <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
