# Hamza Kurnaz — Professional Developer Portfolio

Production odaklı, framework bağımsız, erişilebilir ve performanslı kişisel
portfolyo. Tasarım dili: **Developer Ink** — teknik, editoryal, premium.

## Teknoloji yığını

- Semantic HTML5
- Modern CSS (custom properties tabanlı token sistemi)
- Vanilla JavaScript (ES modules, bundler gerektirmez)
- Canvas API (Liquid Ink imza animasyonu)

## Dosya yapısı

```
index.html            Ana sayfa
404.html              Hata sayfası
css/
  tokens.css          Renk, tipografi, spacing, radius, gölge, easing, z-index token'ları
  base.css            Reset, global dekoratif katmanlar, motion-off kuralları
  components.css      Header, butonlar, linkler, chip'ler, toast
  sections.css        Hero, hakkımda, projeler, deneyim, yetkinlikler, eğitim, iletişim, footer
  animations.css       Scroll reveal, view-transition, reduced-motion geçersiz kılmaları
  responsive.css       Breakpoint'ler ve pointer/hover bazlı geçersiz kılmalar
js/
  main.js              Giriş noktası, diğer modülleri başlatır
  theme.js             Açık/koyu tema
  navigation.js        Header scroll durumu, mobil menü, aktif section takibi
  reveal.js            IntersectionObserver tabanlı scroll reveal
  interactions.js       Timeline ilerleme çizgisi, magnetic CTA, proje kartı tilt/border-follow, e-posta kopyalama
  liquid-ink.js         İmza Canvas animasyonu (Code Ink / Liquid Trace)
  motion-preferences.js Hareket aç/kapat tercihi (localStorage + prefers-reduced-motion)
assets/
  images/              Profil fotoğrafı ve Open Graph görseli
  cv/                  İndirilebilir CV
tests/
  validate.py          Statik doğrulama testi
```

## Yerel kurulum

Herhangi bir bağımlılık veya build adımı gerekmez. JS modülleri ES modül
olarak yüklendiği için `file://` üzerinden değil, basit bir HTTP sunucusu
üzerinden açılmalıdır:

```bash
python -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın.

## Testler

```bash
python3 tests/validate.py
```

Kontrol eder: yinelenen `id`, kırık dahili anchor/asset bağlantıları, ES
modül import'larının varlığı, temel erişilebilirlik/SEO gereksinimleri ve
(Node mevcutsa) her JS modülünün söz dizimi.

## İçerik güncelleme

- Ana içerik: `index.html`
- Tasarım token'ları: `css/tokens.css`
- Davranışlar: `js/` altındaki ilgili modül
- Profil fotoğrafı: `assets/images/`
- CV: `assets/cv/hamza-kurnaz-cv.pdf`

## Deployment

### GitHub Pages

Bu depo `hamza-kurnaz.github.io` adıyla oluşturulduğu için Pages
etkinleştirildiğinde site otomatik olarak `https://hamza-kurnaz.github.io/`
adresinde yayınlanır. `canonical`, Open Graph ve `sitemap.xml`/`robots.txt`
şu an bu adrese göre ayarlıdır.

Özel bir alan adı bağlanırsa (`CNAME` dosyası ile) aşağıdaki dört yeri
güncelleyin:
- `index.html` içindeki `canonical`, `og:url`, `og:image`, `twitter:image` ve JSON-LD `url`/`image`
- `robots.txt`
- `sitemap.xml`

### Netlify / Cloudflare Pages / Vercel

Klasörü sürükleyip bırakabilir veya Git deposunu bağlayabilirsiniz. Build
command boş, output directory `.` (kök dizin). `_headers` dosyası yalnızca
Netlify ve Cloudflare Pages tarafından otomatik uygulanır; GitHub Pages bu
dosyayı işlemez.

## Güvenlik

- Harici JavaScript, font veya analytics bağımlılığı yoktur.
- `target="_blank"` bağlantılarında `noopener noreferrer` vardır.
- `_headers` dosyasında CSP, Referrer Policy ve Permissions Policy bulunur (Netlify/Cloudflare Pages'te aktif olur).
- İletişim formu yerine güvenli `mailto:` akışı kullanılmıştır.

## Erişilebilirlik

- Semantik landmark yapısı, skip link, doğru heading sırası
- Klavye ile erişilebilir menü, görünür `:focus-visible` stilleri
- `prefers-reduced-motion` desteği + uygulama içi "Hareketi aç/kapat" düğmesi
- Canvas animasyonu `aria-hidden`, `pointer-events:none`, içeriği hiçbir zaman kapatmaz

## Performans

- WebP/JPEG optimize görseller, `width`/`height` attribute'ları
- Sıfır framework, sıfır üçüncü taraf script
- Etkileşim yokken tamamen duran Canvas render döngüsü (`requestAnimationFrame`, Visibility API)
- DPR sınırı: masaüstünde 2, mobilde 1.5

## Production notu

Alan adı kesinleştiğinde (özel domain bağlanırsa) yukarıdaki dört dosyayı
güncelleyin. Gerçek hosting üzerinde Lighthouse ve SSL/header kontrolü
tekrar yapılmalıdır — bu depo içinde tarayıcı otomasyonu ile ölçülmemiştir.
