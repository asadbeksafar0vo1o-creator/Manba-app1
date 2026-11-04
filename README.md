# Manba AI 6.0 — Cosmic Learning

O‘zbek tilidagi shaxsiy AI o‘quv platformasi. GitHub Pages’da statik frontend sifatida ishlaydi; fayllar va o‘quv statistikasi foydalanuvchi qurilmasida saqlanadi.

## Platforma imkoniyatlari
- Kosmik interfeys, animatsiyali orbitlar va responsiv mobil/desktop layout.
- Manba yuklash va manba asosida AI ustoz bilan suhbat.
- Testlar, flashcard/kartalar, referat, slaydlar, Pomodoro va o‘qish statistikasi.
- TXT, PPTX (PptxGenJS CDN talab qilishi mumkin) hamda brauzer Print → Save as PDF eksporti.
- PWA manifest va offline shell cache.

## Ishga tushirish
1. Repozitoriyga fayllarni yuklang va GitHub Pages’ni `main` branch / root papkadan yoqing.
2. Saytni HTTPS orqali oching.
3. AI uchun **Sozlamalar** bo‘limida OpenRouter API kalitini kiriting yoki Cloudflare Worker rejimini tanlang.
4. API kalitni GitHub fayllariga, HTML/JS kodiga yoki chatga yozmang.

## Cloudflare Worker (tavsiya etilgan xavfsizroq variant)
1. `worker.js` ni Cloudflare Workers’ga deploy qiling.
2. Worker Settings → Variables and Secrets bo‘limida `OPENROUTER_KEY` nomli **Secret** yarating.
3. `ALLOWED_ORIGINS` (oddiy text variable, ixtiyoriy) ni quyidagicha belgilang:
   `https://asadbeksafar0vo1o-creator.github.io`
   Bir nechta origin bo‘lsa, vergul bilan ajrating.
4. Worker URL’ini Manba AI → Sozlamalar → Worker URL maydoniga kiriting va Worker rejimini tanlang.
5. `RATE_KV` KV binding ulansa, IP bo‘yicha limit ishlaydi. KV ulanmagan bo‘lsa, bu qo‘shimcha limit ishlamaydi.

Worker CORS’ni default holatda GitHub Pages origin va lokal test origin’lari bilan cheklaydi. O‘z domeningiz bo‘lsa, `ALLOWED_ORIGINS` ga uni qo‘shing.

## Maxfiylik va cheklovlar
- API kalitni ilovada to‘g‘ridan-to‘g‘ri kiritish qulay, lekin brauzerda saqlangan kalit qurilma/browser profiliga bog‘liq; umumiy qurilmada ishlatmang.
- Worker’da API kalit Cloudflare Secret sifatida saqlanadi; u client-side kodga chiqarilmaydi.
- Manbalar va statistika shu brauzerning localStorage xotirasida. Browser ma’lumotlari tozalansa, ular ham o‘chishi mumkin.
- AI javoblari model/provayderga bog‘liq; muhim ma’lumotlarni manba bilan tekshiring.

## 5.3 texnik yaxshilanishlar
- Test generatori tanlangan savol sonini aniq talab qiladi; AI yetarli savol bermasa, foydalanuvchiga tushunarli xato ko‘rsatadi.
- Worker CORS allowlist bilan himoyalandi; `ALLOWED_ORIGINS` orqali domenlar boshqariladi.
- Worker request body hajmi JSON parse’dan oldin ham tekshiriladi.
- PWA cache versiyasi yangilandi, eski Manba shell cache avtomatik tozalanadi.

## Tekshirish
- JavaScript syntax: `node --check app.js`, `node --check orbit.js`, `node --check worker.js`
- HTML/CSS: GitHub Pages preview’da mobil va desktop ekranlarda tekshirish tavsiya etiladi.
- AI, PPTX va PDF eksportini real API/browser bilan alohida sinash kerak; ushbu ZIP ichida API kalit yoki Worker URL kiritilmagan.

## 6.0 yangilanishi
- Test, flashcard va slayd generatsiyasida AI qaytargan son hamda bo‘sh maydonlar tekshiriladi.
- Service Worker cache versiyasi yangilandi: eski 5.3 cache yangi fayllarni to‘sib qolmasligi kerak.
- Cloudflare Worker’da qo‘shimcha ALLOWED_ORIGINS domenlari kiritilganda GitHub Pages origin saqlanib qoladi.
- OpenRouter referer GitHub Pages manziliga moslashtirildi.

**Eslatma:** Free/Pro tanlovi interfeysdagi demo rejimidir; haqiqiy to‘lov yoki obuna tizimi mavjud emas. PDF eksporti brauzerning Chop etish → PDF saqlash funksiyasidan foydalanadi. Worker’ni alohida Cloudflare’da deploy qilish va `OPENROUTER_KEY` secretini sozlash kerak.


## AI ulash (Cloudflare shart emas)
1. Sozlamalar → OpenRouter API kalitini kiriting.
2. Modelni tanlang va sozlamalarni saqlang.
3. API kalitni GitHub repozitoriyga yoki kod ichiga yozmang. Kalit brauzerda saqlansa, shu qurilma xavfsizligini ta’minlang.

Worker fayli ixtiyoriy eski backend namunasi; ilovaning asosiy ishlashi uchun deploy qilish talab qilinmaydi.
