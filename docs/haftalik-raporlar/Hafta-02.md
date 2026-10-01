# Haftalık İlerleme Raporu – Hafta 2 (28 Eylül – 4 Ekim 2026)

**Proje:** Asistanım – Kişisel Sekreter AI  
**Hazırlayan:** Ahsen Yenisey (Proje Yürütücüsü)

## Bu hafta yapılanlar
- `docs/01-Proje-Kapsam-ve-Is-Plani.md` ve `docs/02-Ekip-Organizasyon-Semasi.md` yazıldı.
- Public GitHub reposu açıldı: https://github.com/ahsenyenisey/asistanim
- Expo SDK 57 ile proje iskeleti kuruldu; Expo Router sekmeli navigasyon, açık/koyu tema.
- SQLite şeması (`notes`, `reminders`, `processes`, `process_steps`, `chat_messages`, `settings`) ve `PRAGMA user_version` tabanlı migrasyon yazıldı.
- Tüm modüllerin ilk sürümü kodlandı: Notlar (kamera/galeri), Hatırlatmalar (yerel bildirim), Süreçler (adım listesi), Asistan (Claude API + çevrimdışı Türkçe ayrıştırıcı), Bugün paneli, Ayarlar, JSON yedekleme, TTS.
- 29 birim testi (Jest) yazıldı; `typecheck`, `lint`, `test` ve Metro paketlemesi hatasız.

## Karşılaşılan sorunlar ve çözümler
- JavaScript regex'inde `\b` Türkçe karakterlerle çalışmadığı için "bugünümü özetle" yakalanamıyordu → sınır kontrolü kaldırıldı, test eklendi.
- React Compiler lint kuralları `Date.now()`'ın render içinde kullanımını reddetti → yardımcı fonksiyonlara taşındı.
- Web hedefinde `output: static` (sunucu taraflı render) expo-sqlite worker'ını yükleyemedi → `output: single` ve Metro'ya `.wasm` asset desteği eklendi. Web desteği expo-sqlite tarafında alfa; birincil hedef Android/iOS.

## Gelecek hafta planı
- Gerçek Android ve iOS cihazda Expo Go ile test; bildirimlerin arka planda gelmesinin doğrulanması.
- Ekran görüntülerinin alınması (`docs/gorseller/`).

## Tanıtım faaliyetleri
- Blog yazısı taslağı hazırlandı (`docs/tanitim/blog-yazisi.md`).
