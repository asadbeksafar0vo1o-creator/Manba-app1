# Manba — AI ustoz (yangilangan loyiha)

Manba — o‘zbek tilidagi o‘quv web-ilovasi. PDF/DOCX hujjatlarini brauzerda o‘qish, manba asosida savol-javob, test, flashcard, referat, slayd matni va o‘qish statistikasini qo‘llab-quvvatlaydi.

## Fayllar

- `index.html` — ilova interfeysi va sozlamalar bo‘limi
- `styles.css` — mobil va kompyuterga mos dizayn
- `app.js` — funksiyalar, manbadan matn izlash va AI ulanishi
- `worker.js` — ixtiyoriy Cloudflare Worker proxy
- `manifest.json`, `icon.svg`, `sw.js` — PWA/o‘rnatish, belgi va kesh

## Ishga tushirish

1. ZIP arxivni oching.
2. Fayllarni bir joyga saqlang; `index.html` qolgan fayllar bilan bir papkada bo‘lsin.
3. GitHub Pages, Cloudflare Pages yoki boshqa HTTPS statik hostingga joylang. PWA/service worker `file://` orqali to‘liq ishlamaydi.
4. Ilovada **Sozlamalar** bo‘limini oching va AI ulanish usulini tanlang.

## Variant A — shaxsiy OpenRouter API kaliti

1. [OpenRouter API Keys](https://openrouter.ai/settings/keys) sahifasidan API kaliti yarating. Kalitga xarajat limiti o‘rnatish tavsiya qilinadi.
2. Ilovada **Sozlamalar → OpenRouter — shaxsiy API kaliti** ni tanlang.
3. Kalitni kiriting, modelni tanlang va **Ulanishni tekshirish** tugmasini bosing.
4. **Kalitni ushbu qurilmada saqlash** belgisi o‘chiq bo‘lsa, kalit faqat joriy sahifa seansida saqlanadi. Belgilansa, u shu brauzerning `localStorage` xotirasiga yoziladi.

**Xavfsizlik:** to‘g‘ridan-to‘g‘ri brauzer rejimi shaxsiy foydalanishga qulay, lekin to‘liq maxfiylik kafolatlanmaydi — shu qurilmadagi sayt skriptlari va brauzerga kirish imkoniga ega odamlar kalitga yetishi mumkin. Umumiy kompyuterda kalitni saqlamang. Cheklangan xarajat limiti bilan API kaliti yarating. Kalit oshkor bo‘lganidan shubhalansangiz, provayder panelida bekor qiling.

## Variant B — Cloudflare Worker (tavsiya etiladigan nashr rejimi)

Worker API kalitini brauzerga bermasdan saqlaydi.

1. Cloudflare Dashboard → **Workers & Pages** → yangi Worker yarating.
2. `worker.js` ichidagi kodni Worker muharririga joylab, deploy qiling.
3. Worker sozlamalarida `OPENROUTER_KEY` nomli **Secret** yarating va OpenRouter kalitini shu yerga kiriting. Kalitni `app.js` yoki `index.html` ichiga yozmang.
4. **Settings → Variables** bo‘limida `ALLOWED_ORIGIN` qiymatini ilovangizning origin manziliga qo‘yish mumkin, masalan `https://username.github.io` yoki `https://your-site.pages.dev`. Bu CORS cheklovi bo‘lib, mustaqil autentifikatsiya o‘rnini bosmaydi.
5. Ixtiyoriy ravishda `RATE_KV` nomli KV namespace binding ulang: Worker bir IP manzil uchun daqiqalik so‘rovlar chegarasini qo‘llaydi.
6. Ixtiyoriy ravishda `APP_ORIGIN` o‘zgaruvchisida ilova manzilini belgilang.
7. Deploy qilingan `https://....workers.dev` manzilini nusxalang.
8. Ilovadagi **Sozlamalar → Cloudflare Worker** bo‘limiga URL-ni kiriting, modelni tanlang va ulanishni sinang.

Worker modeli faqat `worker.js` dagi `ALLOWED_MODELS` ro‘yxatida mavjud variantlarni qabul qiladi. Ro‘yxatga qo‘shgan modelni ilova tanloviga ham qo‘shish kerak.

## Maxfiylik va saqlash

- PDF/DOCX matni brauzerda ajratib olinadi va brauzerning lokal xotirasida saqlanadi.
- AI funksiyalaridan foydalanilganda mos matn bo‘laklari tanlangan provayderga yuboriladi. Maxfiy hujjatlar uchun tegishli maxfiylik talablarini tekshiring.
- API kaliti odatiy holatda brauzer xotirasiga doimiy yozilmaydi. Buning uchun foydalanuvchi maxsus **Kalitni ushbu qurilmada saqlash** belgisini yoqishi kerak.
- Manbalar, chat va statistika brauzer xotirasida saqlanadi. Brauzer xotirasi cheklangan bo‘lishi mumkin; juda katta hujjatlar `localStorage` sig‘imidan oshishi ehtimoli bor.

## Funksiyalar

- PDF (50 MB gacha) va DOCX (20 MB gacha) fayl yuklash, bir nechta faylni navbat bilan o‘qish
- Yuklangan matndan tegishli parchalarni qidirish va manba tayanchli AI suhbat
- 5 savolli variantli test va javob izohlari
- Flashcard yaratish, kartalarni ochish va takrorlash progressi
- Referat va slaydlar yaratish, `.txt` formatida yuklab olish
- Qorong‘i/yorug‘ mavzu, PWA o‘rnatish va haftalik statistika
- Sozlamalarni saqlash, API kalitini ko‘rsatish/yashirish, kalitni o‘chirish va AI ulanishini sinash

## Hozirgi chegaralar

- Google akkaunt orqali kirish yo‘q.
- Referat `.txt` formatida, slaydlar matnli reja sifatida eksport qilinadi; haqiqiy `.docx`/`.pptx` eksporti qo‘shilmagan.
- Skanerlangan, faqat rasm ko‘rinishidagi PDF uchun OCR kerak.
- Ilova qobig‘i keshdan ochilishi mumkin, ammo AI va PDF/DOCX kutubxonalari internet talab qilishi mumkin.

## Tezkor tekshiruv

- [ ] HTTPS orqali ochiladi
- [ ] Mobil va desktop navigatsiya ishlaydi
- [ ] Qorong‘i/yorug‘ mavzu almashtiriladi
- [ ] PDF/DOCX o‘qiladi va o‘chiriladi
- [ ] Sozlamalarda API kaliti yoki Worker URL saqlanadi
- [ ] Ulanishni tekshirish natija beradi
- [ ] Test javoblari tekshiriladi
- [ ] Flashcard ochilib keyingisiga o‘tadi
- [ ] Referat/slayd matni yuklab olinadi
- [ ] Service Worker yangi versiyani yangilaydi
