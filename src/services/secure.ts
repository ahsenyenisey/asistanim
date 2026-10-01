import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_KEY = 'anthropic_api_key';

/** API anahtarı cihazın güvenli deposunda (Keychain / Keystore) saklanır. */
export async function getApiKey(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(API_KEY);
}

export async function setApiKey(value: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!value) {
    await SecureStore.deleteItemAsync(API_KEY);
    return;
  }
  await SecureStore.setItemAsync(API_KEY, value);
}
