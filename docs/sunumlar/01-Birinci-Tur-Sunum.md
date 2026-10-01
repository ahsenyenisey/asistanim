---
marp: true
theme: default
paginate: true
---

# Asistanım
## Kişisel Sekreter AI

Mobil Programlama – 1. Tur Sunumu (6. Hafta)
**Ahsen Yenisey** · Proje Yürütücüsü
github.com/ahsenyenisey/asistanim

---

## Problem

- Notlar, randevular ve "yapılacak adımlar" farklı yerlerde dağınık
- Hatırlatma uygulamalarını elle doldurmak zahmetli
- Çok adımlı işler (başvuru, evrak, kayıt) takip edilemiyor

> "Yarın 15'te dişçi" diye düşünüyoruz ama bunu 5 dokunuşla forma giriyoruz.

---

## Çözüm: Asistanım

**Düşündüğün gibi yaz, gerisini asistan halletsin.**

- 📝 **Notlar** – fotoğraflı, aranabilir, sabitlenebilir
- ⏰ **Hatırlatmalar** – yerel bildirimle tam zamanında
- 🗂️ **Süreçler** – adım adım iş akışı, ilerleme çubuğu
- ✨ **Asistan** – Türkçe doğal dil → otomatik kayıt (Claude AI)
- 📅 **Bugün** – günün özeti tek ekranda

---

## Kapsam

| Modül | Mobil Özellik |
|---|---|
| Notlar | SQLite, Kamera, Galeri |
| Hatırlatmalar | Yerel bildirimler, Tarih-saat seçici |
| Süreçler | İlişkisel SQLite (FK, transaction) |
| Asistan | REST API (Claude), SecureStore, TTS |
| Yedekleme | Dosya sistemi, paylaşım menüsü |
| Tema | Açık / koyu otomatik |

**Depolama:** SQLite (cihazda) + Claude API (bulutta yalnızca anlama)

---

## Teknoloji

- **React Native + Expo SDK 57**, TypeScript
- **Expo Router** (dosya tabanlı navigasyon, sekmeler)
- **expo-sqlite** (WAL, `user_version` migrasyonu)
- **expo-notifications**, **expo-image-picker**, **expo-speech**, **expo-secure-store**
- **Claude Messages API** (fetch) – yapılandırılmış JSON çıktı (`json_schema`)
- **Jest** – 36 birim testi · ESLint · tsc

---

## Asistan nasıl çalışıyor?

```
Kullanıcı: "Cuma 10:00 proje toplantısı hatırlat"
      │
      ▼
Claude (bağlam: bugünün planı + şu anki zaman)
      │  {"reply": "...", "actions": [{"type":"create_reminder", "due_at": "2026-10-02T10:00:00+03:00", ...}]}
      ▼
applyAiActions() → SQLite'a yaz → bildirimi zamanla
```

API anahtarı yoksa: **çevrimdışı Türkçe ayrıştırıcı** ("yarın", "cuma", "15:30", "akşam 8") aynı işi yapar.

---

## Ekip ve Plan

**Ekip:** 1 kişi – tüm roller proje yürütücüsünde
(Geliştirme · Test · Halkla İlişkiler · Dokümantasyon)

| Hafta | Kilometre taşı |
|---|---|
| 2 | Kapsam dokümanı, repo, iskelet ✅ |
| 6 | 1. tur sunum, Notlar/Hatırlatma/Süreç ✅ |
| 8 | Vize: ön prototip |
| 12 | Blog + YouTube tanıtımı |
| 13 | Nihai sunum + final videosu |

---

## Örnek Ekranlar

> Ekran görüntüleri `docs/gorseller/` klasöründe tutulur.
> (Bugün paneli · Notlar · Hatırlatma editörü · Süreç detayı · Asistan sohbeti)

---

## Teşekkürler

**Soru & Cevap**

🔗 github.com/ahsenyenisey/asistanim
