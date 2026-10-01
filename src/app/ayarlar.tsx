import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Switch } from 'react-native';

import { Body, Button, Card, Input, Muted, Row, Screen, Subtitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getSetting, setSetting, SettingKeys } from '@/db/settings';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_MODEL, MODEL_OPTIONS } from '@/services/ai';
import { exportBackup, importBackup, pickAndReadBackup } from '@/services/backup';
import { ensureNotificationPermission } from '@/services/notifications';
import { getApiKey, setApiKey } from '@/services/secure';
import { speak } from '@/services/speech';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [name, setName] = useState('');
  const [apiKey, setKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [voice, setVoice] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setName((await getSetting(db, SettingKeys.userName)) ?? '');
      setKey((await getApiKey()) ?? '');
      setModel((await getSetting(db, SettingKeys.model)) ?? DEFAULT_MODEL);
      setVoice((await getSetting(db, SettingKeys.voiceReplies)) === '1');
    })();
  }, [db]);

  const saveProfile = async () => {
    await setSetting(db, SettingKeys.userName, name.trim());
    await setApiKey(apiKey.trim());
    await setSetting(db, SettingKeys.model, model);
    Alert.alert('Kaydedildi', 'Ayarlar güncellendi.');
  };

  const toggleVoice = async (v: boolean) => {
    setVoice(v);
    await setSetting(db, SettingKeys.voiceReplies, v ? '1' : '0');
    if (v) speak('Sesli yanıtlar açıldı.');
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await exportBackup(db);
    } catch (e) {
      Alert.alert('Dışa aktarma başarısız', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const payload = await pickAndReadBackup();
      if (!payload) return;
      const r = await importBackup(db, payload);
      Alert.alert('Geri yüklendi', `${r.notes} not, ${r.reminders} hatırlatma, ${r.processes} süreç eklendi.`);
    } catch (e) {
      Alert.alert('İçe aktarma başarısız', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const testPermission = async () => {
    const ok = await ensureNotificationPermission();
    Alert.alert('Bildirim izni', ok ? 'Verildi ✅' : 'Verilmedi ❌ Cihaz ayarlarından açabilirsin.');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: Spacing.md }}>
          <Subtitle>Profil</Subtitle>
          <Input label="Adın" placeholder="Asistan sana nasıl hitap etsin?" value={name} onChangeText={setName} />
        </Card>

        <Card style={{ gap: Spacing.md }}>
          <Subtitle>Yapay zekâ (Claude)</Subtitle>
          <Muted>Anahtar yalnızca bu cihazda, güvenli depoda (Keychain/Keystore) saklanır. Anahtar yoksa asistan çevrimdışı kural tabanlı modda çalışır.</Muted>
          <Input label="Anthropic API anahtarı" placeholder="sk-ant-..." value={apiKey} onChangeText={setKey} autoCapitalize="none" autoCorrect={false} secureTextEntry />
          <Muted style={{ fontWeight: '600' }}>Model</Muted>
          {MODEL_OPTIONS.map((m) => (
            <Button key={m.id} title={m.label} variant={model === m.id ? 'primary' : 'secondary'} onPress={() => setModel(m.id)} style={{ justifyContent: 'flex-start' }} />
          ))}
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>Yanıtları sesli oku</Body>
            <Switch value={voice} onValueChange={toggleVoice} trackColor={{ true: t.primary }} />
          </Row>
          <Button title="Kaydet" icon="checkmark" onPress={saveProfile} />
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <Subtitle>Bildirimler</Subtitle>
          <Button title="Bildirim iznini kontrol et" icon="notifications-outline" variant="secondary" onPress={testPermission} />
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <Subtitle>Yedekleme</Subtitle>
          <Muted>Tüm notlar, hatırlatmalar ve süreçler JSON olarak dışa aktarılır; başka bir cihazda geri yüklenebilir.</Muted>
          <Row>
            <Button title="Dışa aktar" icon="share-outline" variant="secondary" onPress={doExport} loading={busy} style={{ flex: 1 }} />
            <Button title="İçe aktar" icon="download-outline" variant="secondary" onPress={doImport} loading={busy} style={{ flex: 1 }} />
          </Row>
        </Card>

        <Card>
          <Subtitle>Hakkında</Subtitle>
          <Muted>Asistanım v{Constants.expoConfig?.version ?? '1.0.0'} · {Platform.OS} · Mobil Programlama dersi projesi (İÜC, 2026).</Muted>
          <Muted>Veriler cihazda SQLite ile saklanır. Bildirimler yerel olarak zamanlanır.</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
