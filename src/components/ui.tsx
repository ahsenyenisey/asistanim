import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Sayfa kabı: arka plan rengi + güvenli alan. */
export function Screen({ children, style, edges }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom')[] }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges ?? ['bottom']} style={[{ flex: 1, backgroundColor: t.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.card,
    borderColor: t.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.75 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 24, fontWeight: '700', color: t.text }, style]}>{children}</Text>;
}

export function Subtitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 16, fontWeight: '600', color: t.text }, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontSize: 15, color: t.text, lineHeight: 21 }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontSize: 13, color: t.textSecondary }, style]}>
      {children}
    </Text>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  icon,
  variant = 'primary',
  loading,
  style,
  ...rest
}: PressableProps & { title: string; icon?: IconName; variant?: ButtonVariant; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const bg = { primary: t.primary, secondary: t.primarySoft, danger: t.dangerSoft, ghost: 'transparent' }[variant];
  const fg = { primary: t.onPrimary, secondary: t.primary, danger: t.danger, ghost: t.primary }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || rest.disabled}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || rest.disabled ? 0.6 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, color, size = 22, ...rest }: PressableProps & { icon: IconName; color?: string; size?: number }) {
  const t = useTheme();
  return (
    <Pressable hitSlop={8} accessibilityRole="button" {...rest} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.5 : 1 }]}>
      <Ionicons name={icon} size={size} color={color ?? t.textSecondary} />
    </Pressable>
  );
}

export function Input({ label, style, ...rest }: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Muted style={{ fontWeight: '600' }}>{label}</Muted> : null}
      <TextInput
        placeholderTextColor={t.textSecondary}
        {...rest}
        style={[
          styles.input,
          { backgroundColor: t.inputBackground, borderColor: t.border, color: t.text },
          rest.multiline ? { minHeight: 110, textAlignVertical: 'top' } : null,
          style,
        ]}
      />
    </View>
  );
}

export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={t.textSecondary} />
      <Subtitle style={{ marginTop: Spacing.sm, textAlign: 'center' }}>{title}</Subtitle>
      {hint ? <Muted style={{ textAlign: 'center', marginTop: 4 }}>{hint}</Muted> : null}
    </View>
  );
}

export function Fab({ icon = 'add', onPress, label }: { icon?: IconName; onPress: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Ekle'}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: t.primary, opacity: pressed ? 0.8 : 1 }]}>
      <Ionicons name={icon} size={28} color={t.onPrimary} />
    </Pressable>
  );
}

export function Chip({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' }) {
  const t = useTheme();
  const bg = {
    neutral: t.border,
    success: t.successSoft,
    warning: t.warningSoft,
    danger: t.dangerSoft,
    primary: t.primarySoft,
  }[tone];
  const fg = { neutral: t.textSecondary, success: t.success, warning: t.warning, danger: t.danger, primary: t.primary }[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export function CheckRow({ checked, label, onToggle, onDelete }: { checked: boolean; label: string; onToggle: () => void; onDelete?: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.checkRow, { borderColor: t.border }]}>
      <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={checked ? t.success : t.textSecondary} />
        <Body style={{ flex: 1, textDecorationLine: checked ? 'line-through' : 'none', color: checked ? t.textSecondary : t.text }}>{label}</Body>
      </Pressable>
      {onDelete ? <IconButton icon="trash-outline" onPress={onDelete} color={t.danger} size={18} /> : null}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
