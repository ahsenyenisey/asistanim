# Asistanım – Kişisel Sekreter AI

> Mobil Programlama dersi dönem projesi (2026 Güz) · **Proje Yürütücüsü:** Ahsen Yenisey

Not alır, hatırlatır, çok adımlı süreçleri yürütür. Türkçe doğal dilde yazın; asistan (Claude AI ya da çevrimdışı ayrıştırıcı) bunu otomatik olarak nota, hatırlatmaya veya sürece dönüştürür. Veriler cihazda **SQLite** ile saklanır.

## Özellikler

| | Özellik | Mobil yetenek |
|---|---|---|
| 📝 | Notlar: arama, sabitleme, kameradan/galeriden fotoğraf | SQLite, Kamera, Galeri |
| ⏰ | Hatırlatmalar: tarih-saat seçici, **yerel bildirim**, gecikmiş uyarısı, hızlı erteleme | expo-notifications, DateTimePicker |
| 🗂️ | Süreçler: adım listesi, ilerleme çubuğu, otomatik tamamlanma | İlişkisel SQLite (FK, transaction) |
| ✨ | Asistan: "Yarın 15:00 dişçi hatırlat" → hatırlatma; "Not: …", "Süreç: … – adım, adım"; "Bugünümü özetle" | Claude Messages API – fetch (JSON şema çıktısı), SecureStore, TTS |
| 📅 | Bugün paneli: günün hatırlatmaları, gecikenler, aktif süreçler, son notlar | Odakta yenileme, pull-to-refresh |
| 💾 | JSON yedekleme / geri yükleme | expo-file-system, expo-sharing |
| 🌗 | Açık / koyu tema | useColorScheme |

## Kurulum ve Çalıştırma

```bash
npm install
npx expo start
```
Telefonunuza **Expo Go** uygulamasını kurup QR kodu okutun (Android: Expo Go, iOS: Kamera).

Diğer komutlar:
```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Jest birim testleri
```

### Claude API (isteğe bağlı)
Ayarlar → "Anthropic API anahtarı" alanına `sk-ant-…` anahtarınızı girin. Anahtar yalnızca cihazın güvenli deposunda (Keychain/Keystore) tutulur. Anahtar yoksa asistan çevrimdışı kural tabanlı modda çalışır.

> Bu bir öğrenci projesidir: API çağrısı doğrudan cihazdan yapılır. Üretim senaryosunda anahtarın bir arka uç sunucusunda tutulması önerilir.

## Proje Yapısı

```
src/app/            Expo Router ekranları ((tabs), not/[id], hatirlatma/[id], surec/[id], ayarlar)
src/components/     Ortak UI bileşenleri
src/db/             SQLite şema + repository fonksiyonları
src/services/       notifications · ai (Claude) · speech · secure · backup · actions
src/utils/          date · nlp (çevrimdışı Türkçe ayrıştırıcı)
src/__tests__/      Jest testleri
docs/               Kapsam & iş planı, organizasyon şeması, haftalık raporlar, sunumlar, tanıtım, final raporu
```

## Ders Teslim Dokümanları

- [01 – Proje Kapsam ve İş Planı](docs/01-Proje-Kapsam-ve-Is-Plani.md)
- [02 – Ekip Organizasyon Şeması](docs/02-Ekip-Organizasyon-Semasi.md)
- [03 – Final Raporu (taslak)](docs/03-Final-Raporu.md)
- [06 – Performans Takip](docs/06-Performans-Takip.md)
- [Haftalık İlerleme Raporları](docs/haftalik-raporlar/)
- [1. Tur Sunum](docs/sunumlar/01-Birinci-Tur-Sunum.md) (Marp uyumlu Markdown)
- [Tanıtım: Blog yazısı](docs/tanitim/blog-yazisi.md) · [YouTube senaryosu](docs/tanitim/youtube-video-senaryosu.md)

## Lisans
MIT
