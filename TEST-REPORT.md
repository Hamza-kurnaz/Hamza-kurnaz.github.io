# Test Report

## Otomatik doğrulama

```
python3 tests/validate.py
OK: 26 ids, 37 links, 2 sources, 6 css files, 8 js modules validated
```

Kontrol edilenler: yinelenen `id`, kırık dahili anchor/asset bağlantıları, ES
modül `import` hedeflerinin varlığı, temel erişilebilirlik/SEO gereksinimleri
(`<main>`, `<header>`, `<footer>`, `aria-label`, `prefers-reduced-motion`,
`application/ld+json`) ve her JS modülünün Node ile söz dizimi kontrolü.

## Tarayıcı doğrulaması (Playwright + Chromium, bu ortamda çalıştırıldı)

- `index.html` ve `404.html` — konsolda hata yok, sayfa hatası yok.
- Açık/koyu tema geçişi: her iki temada da tüm sayfa (hero → footer) doğru
  renklerle render edildi, karışık/karma tema görünmedi.
- Mobil menü: açılıyor, `aria-expanded`/`hidden` doğru güncelleniyor, Escape
  ile kapanıyor.
- Scroll reveal: tüm `.reveal` öğeleri (37 adet) scroll ile sırayla
  görünür hale geliyor.
- Timeline ilerleme çizgisi: deneyim bölümü görünür olunca bir kez doluyor.
- E-posta kopyalama: `navigator.clipboard` başarıyla çağrılıyor, toast
  görünüyor.
- Liquid Ink canvas: fare hareketiyle iz bırakıyor, durunca birikip teknik
  grid deseni izin altından görünüyor.
- `prefers-reduced-motion: reduce` emülasyonunda: tüm `.reveal` öğeleri
  anında görünür (opacity 1), `#ink-canvas` `display:none`, hareket
  düğmesi `aria-pressed="true"` (kapalı) durumda.
- Yatay scroll kontrolü — test edilen genişlikler: 320, 360, 375, 390, 430,
  768, 1024, 1440, 1920px. Hepsinde `scrollWidth === clientWidth` (320px'te
  bulunan 5px taşma `code-card` içindeki satırın sarmaması yüzündendi;
  `white-space:pre-wrap` ile giderildi ve doğrulandı).

## Bilinen sınırlamalar

- Gerçek dokunmatik cihazda (fiziksel telefon/tablet) test edilmedi;
  dokunma jestleri (tap/kısa sürükleme/uzun basma) Playwright'in sentetik
  pointer olaylarıyla doğrulandı, gerçek cihaz davranışı bire bir garanti
  edilemez.
- Lighthouse, gerçek SSL/HTTP header taraması ve çok yavaş/düşük güçlü
  cihaz performans testi bu ortamda çalıştırılamadı (gerçek hosting
  gerektirir).
- `_headers` dosyası yalnızca Netlify/Cloudflare Pages tarafından işlenir;
  GitHub Pages'te otomatik uygulanmaz.
- Ekran okuyucu (VoiceOver/NVDA) ile uçtan uca dinleme yapılmadı; kontrol
  yalnızca statik ARIA/semantik doğrulama ile sınırlıdır.

## Durum

Kaynak kod ve statik production paketi teslim edilebilir durumdadır.
Alan adı: depo adı gereği `https://hamza-kurnaz.github.io/` varsayıldı
(bkz. README "Deployment" bölümü). Özel domain bağlanırsa canonical/OG/
sitemap/robots güncellenmelidir.
