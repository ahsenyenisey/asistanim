import * as Speech from 'expo-speech';

/** Asistan yanıtlarını Türkçe sesli okur. */
export function speak(text: string): void {
  Speech.stop();
  Speech.speak(text, { language: 'tr-TR', rate: 1.0 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
