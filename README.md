# Manba AI 6.0.1 — Cosmic Education

O‘zbek tilidagi kosmik dizaynli, responsive ta’lim PWA. Talaba va o‘qituvchi uchun bir sahifali ilova.

## Paket tarkibi
- `index.html` — asosiy interfeys
- `styles.css`, `design-6.css` — dizayn va responsive uslublar
- `app.js` — manbalar, AI ustoz, test, flashcard, referat/slayd, maqsadlar, Pomodoro, statistika va sozlamalar
- `ai-tools-6.js` — PDF chat, rasm tahlili va ovoz vositalari
- `extras-6.js`, `orbit.js` — kalendar va kosmik animatsiya
- `earth-texture.jpg`, `moon-texture.jpg`, `icon.svg` — vizual aktivlar
- `manifest.json`, `sw.js` — PWA
- `worker.js` — ixtiyoriy Cloudflare Worker AI proxy

## Ishga tushirish

### GitHub Pages
1. ZIP ichidagi **barcha fayllarni** repository root’iga chiqaring. `index.html` root darajada bo‘lishi kerak.
2. GitHub → **Settings → Pages** → `Deploy from a branch` → branch (`main`) va `/(root)` ni tanlang.
3. Deploy bo‘lgan URL’ni oching. Eski versiya ko‘rinsa, brauzer/site cache’ni tozalang yoki private tab’da tekshiring.

### Lokal sinov
`file://` orqali emas, HTTP server bilan oching:
```bash
python -m http.server 8000
```
Keyin `http://localhost:8000/` ga kiring.

## AI sozlash

**Sozlamalar → AI provayder** bo‘limida quyidagilardan birini tanlang:

- **OpenRouter API key:** kalitni kiriting va “Sozlamalarni saqlash”ni bosing. Kalitni brauzerda saqlash ixtiyoriy. Bu qulay, ammo umumiy qurilmada xavfsiz emas.
- **Cloudflare Worker:** `worker.js` faylini Cloudflare Workers’ga deploy qiling; Worker Secrets ichida `OPENROUTER_KEY` nomi bilan kalit qo‘shing. Worker URL’ni ilovaga kiriting.

Worker uchun `OPENROUTER_KEY` majburiy. `RATE_KV` KV binding ixtiyoriy (so‘rovlarni cheklash uchun). Worker’da CORS hozir `*`; production’da imkon bo‘lsa faqat o‘z saytingiz domeniga ruxsat berib sozlang.

## Mavjud funksiyalar va cheklovlar

- PDF/DOCX manba yuklash va manba asosida AI savol-javob
- Test generatori (5–50 savol), flashkartalar
- Referat/konspekt va slayd **matn rejasi** yaratish
- PDF chat, rasm tahlili, OCR/masala, ovozdan matn va matnni ovozda o‘qish (brauzer imkoniyatlariga bog‘liq)
- Talaba/o‘qituvchi vositalari, maqsadlar, Pomodoro, kalendar va lokal statistika
- Ma’lumotlar asosan joriy brauzer qurilmasida saqlanadi; login, sinxronlash, server bazasi va haqiqiy to‘lov tizimi yo‘q.
- Free/Pro tanlovi demo/local rejim; real obuna yoki billing emas.
- **PPTX/PDF eksporti hozircha yo‘q.** Referat, slayd va o‘qituvchi materiallari TXT ko‘rinishida yuklanadi.
- PDF/DOCX parserlari CDN orqali yuklanadi; dastlabki ishga tushirishda internet kerak bo‘lishi mumkin.
- AI ishlatilganda so‘rov va tegishli manba matni tanlangan AI provayderiga yuboriladi. Maxfiy hujjatlarni yuborishdan oldin tekshiring.

## Sinov

Paket tayyorlashda quyidagilar tekshirildi:
- JavaScript fayllarining sintaksisi (`node --check`)
- HTML’da ko‘rsatilgan lokal fayllarning mavjudligi
- ZIP arxiv yaxlitligi

AI ulanishi, PDF/DOCX parserlari va Worker deployment’i foydalanuvchining API kaliti, interneti va hostingiga bog‘liq; ular bu ZIP ichida real hisob bilan tasdiqlanmagan.
