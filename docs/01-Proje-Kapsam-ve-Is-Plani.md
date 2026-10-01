# Asistanım – Kişisel Sekreter AI
## Proje Başlığı, Kapsam ve İş Planı Dokümanı

| | |
|---|---|
| **Ders** | Mobil Programlama (2026 Güz) |
| **Proje adı** | Asistanım – Kişisel Sekreter AI |
| **Seçilen konu** | "Kişisel Sekreter: AI destekli, kişinin günlük yaptığı işlerle alakalı not alan, hatırlatma yapan ve prosesleri yürüten uygulama" |
| **Proje yürütücüsü** | Ahsen Yenisey |
| **GitHub** | https://github.com/ahsenyenisey/asistanim |
| **Platform** | Android + iOS (React Native / Expo SDK 57, TypeScript) |
| **Doküman sürümü** | v1.0 – 1 Ekim 2026 |

---

## 1. Projenin Amacı

Günlük hayatta "yarın saat 15'te dişçi", "vize başvurusu için şu adımları yapmalıyım", "market listesi" gibi dağınık bilgiler akılda, kağıtlarda ve farklı uygulamalarda kaybolmaktadır. **Asistanım**, bu bilgileri tek bir yerde toplayan, kullanıcının doğal dilde yazdığı cümleyi anlayıp otomatik olarak **not**, **hatırlatma** veya **süreç (çok adımlı iş akışı)** kaydına dönüştüren ve zamanı gelince kullanıcıyı uyaran bir kişisel sekreter uygulamasıdır.

Uygulamanın temel değer önerisi: *"Düşündüğün gibi yaz, gerisini asistan halletsin."*

## 2. Hedef Kullanıcı

- Yoğun programı olan üniversite öğrencileri ve çalışanlar
- Çok adımlı bürokratik süreçleri (başvuru, kayıt, evrak) takip etmek isteyenler
- Hatırlatma uygulamalarını "elle doldurmak" zahmetli bulanlar

## 3. Kapsam

### 3.1 Kapsam İçi (Yapılacaklar)

| # | Modül | Açıklama | Kullanılan mobil özellik |
|---|---|---|---|
| F1 | **Notlar** | Başlık + içerik, sabitleme, arama, kamera/galeriden fotoğraf ekleme | SQLite, Kamera, Galeri, FlatList |
| F2 | **Hatırlatmalar** | Tarih-saat seçimi, yerel bildirim, gecikmiş/tamamlandı durumu, hızlı seçenekler (+1 saat, yarın 09:00) | SQLite, Yerel Bildirimler (expo-notifications), DateTimePicker |
| F3 | **Süreçler** | Çok adımlı iş akışı; adım ekleme/silme/işaretleme, ilerleme çubuğu, otomatik "tamamlandı" durumu | SQLite (ilişkili tablolar, transaction) |
| F4 | **Asistan (AI)** | Doğal dil → eylem. Claude API ile yapılandırılmış JSON çıktısı; anahtar yoksa **çevrimdışı kural tabanlı Türkçe ayrıştırıcı** | REST/SDK (Anthropic SDK), SecureStore, sohbet geçmişi (SQLite) |
| F5 | **Bugün paneli** | Günün hatırlatmaları, gecikenler, aktif süreçler, son notlar, sayaçlar | Odak-yenileme, Pull-to-refresh |
| F6 | **Ayarlar** | Ad, API anahtarı (güvenli depo), model seçimi, sesli yanıt (TTS), bildirim izni kontrolü | SecureStore, expo-speech, izin yönetimi |
| F7 | **Yedekleme** | Tüm verinin JSON olarak dışa aktarımı (paylaşım menüsü) ve geri yükleme | expo-file-system, expo-sharing, dosya seçici |
| F8 | **Tema** | Sistem açık/koyu temasına otomatik uyum | useColorScheme |

### 3.2 Kapsam Dışı (Bu dönem yapılmayacak)

- Çoklu kullanıcı / hesap sistemi ve bulut senkronizasyonu (yedekleme dosyası ile manuel aktarım yeterli görülmüştür)
- Sesli komut (konuşma → metin); yalnızca metin → konuşma (TTS) vardır
- Takvim uygulamalarıyla iki yönlü entegrasyon
- Widget / saat uygulaması

### 3.3 Depolama Kararı

Ders gereksinimi "SQLite ve/veya uzak sunucu" idi. **SQLite** (expo-sqlite, WAL modu, `PRAGMA user_version` ile şema sürümleme) ana depolama olarak seçilmiştir; çünkü:
1. Kişisel veriler cihazda kalır (gizlilik),
2. Çevrimdışı çalışır,
3. Hatırlatma/süreç ilişkileri (1-N) için ilişkisel model doğaldır.

Uzak sunucu olarak **Anthropic Claude API** (HTTPS) kullanılmaktadır: doğal dil anlama bulutta, veri saklama cihazda.

## 4. Teknik Mimari

```
src/
├── app/                 # Expo Router ekranları (dosya tabanlı yönlendirme)
│   ├── (tabs)/          # Bugün · Notlar · Hatırlatmalar · Süreçler · Asistan
│   ├── not/[id].tsx     # Not editörü (kamera/galeri)
│   ├── hatirlatma/[id]  # Hatırlatma editörü (tarih-saat, bildirim)
│   ├── surec/[id].tsx   # Süreç detayı (adım listesi)
│   └── ayarlar.tsx
├── components/          # Ortak UI (Card, Button, Input, DateTimeField, …)
├── db/                  # SQLite şema + repository fonksiyonları
├── services/            # notifications, ai (Claude), speech, secure, backup, actions
├── utils/               # date, nlp (çevrimdışı ayrıştırıcı)
└── __tests__/           # Jest birim testleri
```

**Veri modeli (SQLite):** `notes`, `reminders`, `processes` ⟶ `process_steps` (FK, cascade), `chat_messages`, `settings`.

**AI akışı:** Kullanıcı mesajı + bağlam (bugünün hatırlatmaları, aktif süreçler) → Claude (`output_config.format = json_schema`) → `{reply, actions[]}` → `applyAiActions()` veritabanına yazar, bildirimi zamanlar.

## 5. İş Planı (14 Hafta)

| Hafta | Tarih | İş Kalemi | Çıktı | Sorumlu |
|---|---|---|---|---|
| 1 | 21–27 Eyl | Konu seçimi, gereksinim analizi, rakip inceleme | Fikir notu | PY |
| 2 | 28 Eyl–4 Ekim | Kapsam & iş planı, organizasyon şeması, GitHub reposu | Bu doküman, repo | PY |
| 3 | 5–11 Ekim | Proje iskeleti (Expo), tema, navigasyon, SQLite şeması | Çalışan iskelet | Geliştirme |
| 4 | 12–18 Ekim | Notlar modülü (CRUD, arama, kamera) | F1 | Geliştirme |
| 5 | 19–25 Ekim | Hatırlatmalar + yerel bildirimler | F2 | Geliştirme |
| 6 | 26 Ekim–1 Kas | **1. tur sunum** (amaç, kapsam, görseller); Süreçler modülü | Sunum, F3 | PY + Geliştirme |
| 7 | 2–8 Kas | Asistan: çevrimdışı ayrıştırıcı + birim testleri | F4 (offline) | Geliştirme + Test |
| 8 | 9–15 Kas | **Vize haftası: ön prototip sunumu** | Prototip | Tüm ekip |
| 9 | 16–22 Kas | Claude API entegrasyonu, yapılandırılmış çıktı, hata yönetimi | F4 (online) | Geliştirme |
| 10 | 23–29 Kas | Bugün paneli, Ayarlar, TTS | F5, F6 | Geliştirme |
| 11 | 30 Kas–6 Ara | Yedekleme, koyu tema, erişilebilirlik | F7, F8 | Geliştirme |
| 12 | 7–13 Ara | Tanıtım: blog yazısı, YouTube videosu; hata düzeltme | Tanıtım materyali | Halkla İlişkiler |
| 13 | 14–20 Ara | **Nihai uygulama sunumu** (son ders), final videosu | Sunum + video | Tüm ekip |
| 14 | 21–27 Ara | Final raporu, performans raporu, (ops.) mağaza yayını | Rapor | PY |

PY = Proje Yürütücüsü. Tek kişilik ekipte tüm roller proje yürütücüsündedir (bkz. 02-Ekip-Organizasyon-Semasi.md).

## 6. Riskler ve Önlemler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| API anahtarı/ücret sorunu | Orta | Orta | Anahtar olmadan da çalışan çevrimdışı ayrıştırıcı |
| Expo Go'da native modül kısıtı | Düşük | Orta | Yalnızca Expo Go'da desteklenen modüller seçildi; gerekirse EAS dev build |
| Bildirimlerin cihazda gelmemesi | Orta | Yüksek | İzin kontrolü, Android bildirim kanalı, test ekranı |
| Zaman darlığı | Orta | Yüksek | Modüller bağımsız; önce F1–F3 (çekirdek), sonra F4–F8 |

## 7. Başarı Ölçütleri

- F1–F7 modüllerinin tamamı gerçek cihazda çalışır.
- `npm run typecheck`, `npm run lint`, `npm test` hatasız.
- Haftalık ilerleme raporları eksiksiz (docs/haftalik-raporlar).
- Tanıtım: en az 1 blog yazısı + 1 YouTube videosu.
