import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatTime } from '@/utils/date';

import { Body, Muted } from './ui';

/**
 * Platforma göre tarih + saat seçici.
 * Android: sistem diyaloğu (imperatif API). iOS: satır içi (inline) seçici.
 */
export function DateTimeField({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) {
  const t = useTheme();
  const [iosMode, setIosMode] = useState<'date' | 'time' | null>(null);

  const openAndroid = (mode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      onValueChange: (_event, date) => {
        if (date) onChange(date);
      },
    });
  };

  const press = (mode: 'date' | 'time') => {
    if (Platform.OS === 'android') openAndroid(mode);
    else setIosMode((m) => (m === mode ? null : mode));
  };

  const box = {
    flex: 1,
    backgroundColor: t.inputBackground,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  } as const;

  return (
    <View style={{ gap: 6 }}>
      <Muted style={{ fontWeight: '600' }}>{label}</Muted>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Pressable onPress={() => press('date')} style={box} accessibilityRole="button">
          <Body>{formatDate(value)}</Body>
        </Pressable>
        <Pressable onPress={() => press('time')} style={[box, { flex: 0.6 }]} accessibilityRole="button">
          <Body>{formatTime(value)}</Body>
        </Pressable>
      </View>
      {Platform.OS === 'ios' && iosMode ? (
        <DateTimePicker
          value={value}
          mode={iosMode}
          display={iosMode === 'date' ? 'inline' : 'spinner'}
          locale="tr-TR"
          onValueChange={(_event, date) => {
            if (date) onChange(date);
          }}
          onDismiss={() => setIosMode(null)}
        />
      ) : null}
      {Platform.OS === 'web' ? (
        <Muted>{"Web'de tarih seçici sınırlıdır; mobil cihazda deneyin."}</Muted>
      ) : null}
    </View>
  );
}
