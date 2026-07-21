# Hamza Kurnaz - Professional Developer Portfolio

Production odaklı, framework bağımsız, erişilebilir ve performanslı kişisel portfolyo.

## Teknoloji yığını
- Semantic HTML5
- Modern CSS
- Vanilla JavaScript
- Canvas API

## Yerel kurulum
Herhangi bir bağımlılık gerekmez.

```bash
python -m http.server 8080
```
Ardından `http://localhost:8080` adresini açın.

## İçerik güncelleme
- Ana içerik: `index.html`
- Tasarım sistemi: `styles.css`
- Davranışlar ve Developer Ink: `app.js`
- Profil fotoğrafı: `assets/images/`
- CV: `assets/cv/hamza-kurnaz-cv.pdf`

## Deployment
### Netlify
Klasörü sürükleyip Netlify Drop'a bırakın veya Git deposunu bağlayın. `_headers` otomatik uygulanır.

### Cloudflare Pages
Build command boş bırakılır, output directory `/` olarak ayarlanır.

### Vercel
Framework preset: Other. Build command boş, output directory `.`.

## Domain
`index.html`, `robots.txt`, `sitemap.xml` ve Open Graph URL'lerinde `hamzakurnaz.dev` kullanıldı. Farklı alan adı kullanılacaksa bu dört yerde güncelleyin.

## Güvenlik
- Harici JavaScript veya font bağımlılığı yoktur.
- `target=_blank` bağlantılarında `noopener noreferrer` vardır.
- `_headers` dosyasında CSP, Referrer Policy ve Permissions Policy bulunur.
- İletişim formu yerine güvenli `mailto:` akışı kullanılmıştır.

## Erişilebilirlik
- Semantik landmark yapısı
- Skip link
- Klavye ile erişilebilir menü
- Görünür focus stilleri
- Reduced motion desteği
- Tema seçimi ve kalıcı tercih

## Performans
- WebP/JPEG optimize görseller
- Sıfır framework ve sıfır üçüncü taraf script
- Etkileşim yokken duran Canvas render döngüsü
- DPR ve mobil parçacık sınırı

## Production notu
Alan adı kesinleştiğinde canonical, Open Graph, robots ve sitemap URL'lerini güncelleyin. Gerçek hosting üzerinde Lighthouse ve SSL/header kontrolü tekrar yapılmalıdır.
