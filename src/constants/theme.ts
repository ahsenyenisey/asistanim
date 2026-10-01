/**
 * Asistanım renk paleti ve boşluk sabitleri.
 * Açık ve koyu tema için aynı anahtarlar kullanılır.
 */
export const Palette = {
  light: {
    background: '#F5F6FA',
    card: '#FFFFFF',
    text: '#14151A',
    textSecondary: '#6B7280',
    border: '#E4E6EC',
    primary: '#4F46E5',
    primarySoft: '#EEF0FF',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    inputBackground: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#0F1117',
    card: '#1A1D27',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#2A2E3B',
    primary: '#818CF8',
    primarySoft: '#26294A',
    onPrimary: '#0F1117',
    danger: '#F87171',
    dangerSoft: '#3B1F1F',
    success: '#4ADE80',
    successSoft: '#1B3324',
    warning: '#FBBF24',
    warningSoft: '#3A2E12',
    inputBackground: '#12141C',
    tabBar: '#161922',
  },
} as const;

export type Theme = { [K in keyof typeof Palette.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;
