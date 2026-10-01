import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Body, Button, Card, CheckRow, Chip, IconButton, Input, Muted, Row, Screen, Subtitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addStep, createProcess, deleteProcess, deleteStep, getProcess, listSteps, setProcessStatus, setStepDone, updateProcess } from '@/db/processes';
import type { Process, ProcessStep } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

export default function ProcessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'yeni';
  const db = useSQLiteContext();
  const t = useTheme();

  const [processId, setProcessId] = useState<number | null>(isNew ? null : Number(id));
  const [process, setProcess] = useState<Process | null>(null);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [draftSteps, setDraftSteps] = useState('');
  const [newStep, setNewStep] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (processId == null) return;
    const [p, s] = await Promise.all([getProcess(db, processId), listSteps(db, processId)]);
    if (p) {
      setProcess(p);
      setTitle(p.title);
      setDescription(p.description);
    }
    setSteps(s);
  }, [db, processId]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load]),
  );

  const create = async () => {
    if (!title.trim()) {
      Alert.alert('Başlık gerekli', 'Süreç için bir başlık yaz.');
      return;
    }
    setSaving(true);
    try {
      const stepsArr = draftSteps.split('\n').map((s) => s.trim()).filter(Boolean);
      const newId = await createProcess(db, { title: title.trim(), description: description.trim(), steps: stepsArr });
      setProcessId(newId);
      router.replace({ pathname: '/surec/[id]', params: { id: String(newId) } });
    } finally {
      setSaving(false);
    }
  };

  const saveMeta = async () => {
    if (processId == null) return;
    await updateProcess(db, processId, { title: title.trim() || 'Adsız süreç', description: description.trim() });
    await load();
  };

  const toggleStep = async (s: ProcessStep) => {
    if (processId == null) return;
    await setStepDone(db, s.id, !s.done);
    const fresh = await listSteps(db, processId);
    setSteps(fresh);
    const allDone = fresh.length > 0 && fresh.every((x) => x.done);
    if (allDone && process?.status === 'active') {
      await setProcessStatus(db, processId, 'done');
      await load();
    } else if (!allDone && process?.status === 'done') {
      await setProcessStatus(db, processId, 'active');
      await load();
    }
  };

  const add = async () => {
    if (processId == null || !newStep.trim()) return;
    await addStep(db, processId, newStep.trim());
    setNewStep('');
    await load();
  };

  const remove = () => {
    if (processId == null) return;
    Alert.alert('Süreci sil', 'Süreç ve adımları silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteProcess(db, processId); router.back(); } },
    ]);
  };

  const done = steps.filter((s) => s.done).length;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: processId == null ? 'Yeni Süreç' : 'Süreç',
          headerRight: () => (processId != null ? <IconButton icon="trash-outline" color={t.danger} onPress={remove} /> : null),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
          <Input label="Başlık" placeholder="Ör. Vize başvurusu" value={title} onChangeText={setTitle} onBlur={saveMeta} autoFocus={isNew} />
          <Input label="Açıklama" placeholder="Sürecin amacı, notlar..." value={description} onChangeText={setDescription} onBlur={saveMeta} multiline style={{ minHeight: 80 }} />

          {processId == null ? (
            <>
              <Input label="Adımlar (her satıra bir adım)" placeholder={'Pasaport fotokopisi\nFormu doldur\nRandevu al'} value={draftSteps} onChangeText={setDraftSteps} multiline style={{ minHeight: 120 }} />
              <Button title="Süreci oluştur" icon="add" onPress={create} loading={saving} />
            </>
          ) : (
            <>
              <Card>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Subtitle>Adımlar</Subtitle>
                  <Chip text={`${done}/${steps.length}`} tone={steps.length && done === steps.length ? 'success' : 'primary'} />
                </Row>
                <View style={{ marginTop: Spacing.sm }}>
                  {steps.length === 0 ? <Muted>Henüz adım yok.</Muted> : null}
                  {steps.map((s) => (
                    <CheckRow key={s.id} checked={!!s.done} label={s.title} onToggle={() => toggleStep(s)} onDelete={async () => { await deleteStep(db, s.id); await load(); }} />
                  ))}
                </View>
                <Row style={{ marginTop: Spacing.md }}>
                  <Input placeholder="Yeni adım ekle" value={newStep} onChangeText={setNewStep} onSubmitEditing={add} returnKeyType="done" style={{ flex: 1 }} />
                  <Button title="Ekle" icon="add" onPress={add} />
                </Row>
              </Card>

              <Card>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontWeight: '600' }}>Durum</Body>
                  <Chip text={process?.status === 'active' ? 'Aktif' : process?.status === 'done' ? 'Tamamlandı' : 'Arşiv'} tone={process?.status === 'active' ? 'primary' : process?.status === 'done' ? 'success' : 'neutral'} />
                </Row>
                <Row style={{ marginTop: Spacing.sm }}>
                  <Button title="Aktif" variant="secondary" onPress={async () => { await setProcessStatus(db, processId, 'active'); await load(); }} style={{ flex: 1 }} />
                  <Button title="Tamamlandı" variant="secondary" onPress={async () => { await setProcessStatus(db, processId, 'done'); await load(); }} style={{ flex: 1 }} />
                  <Button title="Arşivle" variant="secondary" onPress={async () => { await setProcessStatus(db, processId, 'archived'); await load(); }} style={{ flex: 1 }} />
                </Row>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
