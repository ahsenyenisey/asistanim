import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Yerel bildirim servisi. Hatırlatmalar cihaz üzerinde zamanlanır;
 * uzak sunucu veya push token gerekmez.
 */

let configured = false;

export function configureNotifications(): void {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('reminders', {
      name: 'Hatırlatmalar',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleReminderNotification(
  title: string,
  body: string,
  dueAt: Date,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (dueAt.getTime() <= Date.now()) return null;
  const ok = await ensureNotificationPermission();
  if (!ok) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body || 'Hatırlatma zamanı geldi.',
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
    },
  });
}

export async function cancelReminderNotification(id: string | null | undefined): Promise<void> {
  if (!id || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Bildirim zaten tetiklenmiş ya da silinmiş olabilir; sessizce geç.
  }
}
