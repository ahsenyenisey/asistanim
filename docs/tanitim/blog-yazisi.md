# "Düşündüğün gibi yaz, gerisini asistan halletsin": Asistanım'ı nasıl geliştirdim?

*Halkla ilişkiler sorumlusu: Ahsen Yenisey · Yayın hedefi: Medium / dev.to / kişisel blog · Taslak tarihi: 1 Ekim 2026*

Mobil Programlama dersinde dönem projesi olarak **Asistanım** adında bir kişisel sekreter uygulaması geliştiriyorum. Bu yazıda uygulamanın ne yaptığını, hangi teknolojileri neden seçtiğimi ve yolda öğrendiklerimi anlatacağım.

## Sorun

Hepimizin aklında "yarın 15'te dişçi", "vize için şu üç evrak", "market: süt, ekmek" gibi küçük parçalar dolaşıyor. Bunları bir uygulamaya girmek için önce doğru uygulamayı açmak, sonra formu doldurmak, tarih seçiciyle boğuşmak gerekiyor. Çoğu zaman bu zahmete girmiyoruz ve unutuyoruz.

## Fikir

Peki ya tek bir sohbet kutusuna aklımızdan geçeni yazsak ve uygulama bunu kendisi doğru yere koysa?

- "Yarın 15:00 dişçi randevusu" → ⏰ hatırlatma + bildirim
- "Not: market listesi – süt, ekmek" → 📝 not
- "Süreç: vize başvurusu – evrak, form, randevu" → 🗂️ adım adım takip edilen iş akışı
- "Bugünümü özetle" → günün planı

## Teknoloji seçimleri

**React Native + Expo.** Tek kod tabanıyla hem Android hem iOS. Expo Go sayesinde telefonda QR kod okutup saniyeler içinde test edebiliyorum.

**SQLite.** Kişisel veriler cihazda kalmalı. `expo-sqlite` ile WAL modunda, `PRAGMA user_version` tabanlı migrasyonlarla ilişkisel bir şema kurdum: süreçler ve adımları ayrı tablolarda, foreign key ile bağlı.

**Claude API.** Doğal dili anlamak için Anthropic'in Claude modelini kullandım. İşin püf noktası *yapılandırılmış çıktı*: modele bir JSON şeması veriyorum, o da `{reply, actions[]}` biçiminde cevap veriyor. Uygulama eylemleri doğrudan veritabanına uyguluyor. Model, "şu anki zaman" ve "bugünün planı" bağlamını da aldığı için "cuma 10'da" gibi ifadeleri doğru tarihe çeviriyor.

**Çevrimdışı yedek.** API anahtarı olmayan kullanıcı için küçük bir Türkçe kural tabanlı ayrıştırıcı yazdım: "yarın", "öbür gün", "cuma", "3 gün sonra", "15:30", "akşam 8'de" gibi kalıpları tanıyor. Bu kısım Jest ile test edilen en sevdiğim modül oldu.

## Öğrendiklerim

1. **JavaScript regex'inde `\b` Türkçe karakterleri tanımıyor.** "bugünümü özetle" cümlesini yakalayamadığımda bunu fark ettim; çözüm sınır kontrolünü kaldırıp niyet sırasını değiştirmek oldu.
2. **React Compiler kuralları ciddi.** `Date.now()`'ı render içinde çağırmak lint hatası; "şu an"ı yardımcı fonksiyonlara taşımak gerekiyor.
3. **Bildirim izni akışı** kullanıcı deneyiminin parçası: izin verilmediyse hatırlatma yine kaydediliyor ama kullanıcıya "bildirim gelmeyecek" uyarısı gösteriliyor.

## Sırada ne var?

Gerçek cihaz testleri, ekran görüntüleri ve bir YouTube tanıtım videosu. Kodun tamamı açık: **github.com/ahsenyenisey/asistanim**

*Yıldız bırakırsanız sevinirim ⭐*
