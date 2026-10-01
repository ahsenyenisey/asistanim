import { useColorScheme } from 'react-native';

import { Palette, type Theme } from '@/constants/theme';

/** Cihazın açık/koyu moduna göre aktif paleti döndürür. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Palette.dark : Palette.light;
}
