import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { DB_NAME, migrateDb } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';
import { configureNotifications } from '@/services/notifications';

function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
      <ActivityIndicator color={t.primary} size="large" />
    </View>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const t = useTheme();

  useEffect(() => {
    configureNotifications();
  }, []);

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...navTheme,
    colors: { ...navTheme.colors, background: t.background, card: t.card, text: t.text, primary: t.primary, border: t.border },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DB_NAME} onInit={migrateDb} useSuspense>
          <Stack
            screenOptions={{
              headerTintColor: t.primary,
              headerTitleStyle: { color: t.text },
              headerStyle: { backgroundColor: t.card },
              contentStyle: { backgroundColor: t.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="not/[id]" options={{ title: 'Not' }} />
            <Stack.Screen name="hatirlatma/[id]" options={{ title: 'Hatırlatma' }} />
            <Stack.Screen name="surec/[id]" options={{ title: 'Süreç' }} />
            <Stack.Screen name="ayarlar" options={{ title: 'Ayarlar' }} />
          </Stack>
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}
