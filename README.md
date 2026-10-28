# Manba — AI ustoz

Manba — o‘zbek tilidagi o‘quv web-ilovasi. U PDF/DOCX matnini qurilmada o‘qib, materialdan qidirish, AI suhbat, test, flashcard, referat, slayd matni va lokal statistika imkoniyatlarini beradi.

## Fayllar

- `index.html` — ilova tuzilishi
- `styles.css` — telefon va kompyuter uchun dizayn
- `app.js` — ilova funksiyalari
- `manifest.json`, `icon.svg`, `sw.js` — PWA/o‘rnatish va ilova qobig‘ini keshga olish
- `worker.js` — Cloudflare Worker orqali OpenRouter AI proxy

## GitHub Pages'ga joylash

1. GitHub repository ichidagi eski ilova fayllarini zaxiralang.
2. ZIP ichidagi fayllarni repository ildiziga yuklang (`index.html` ildizda bo‘lishi kerak).
3. GitHub Pages sozlamasida kerakli branch/folder tanlanganini tekshiring.
4. Sayt ochilishini tekshiring. HTTPS orqali oching; `file://` orqali PWA ishlamaydi.

## AI'ni ulash

AI ishlashi uchun Cloudflare Worker va OpenRouter kaliti talab qilinadi.

1. Cloudflare Dashboard → Workers & Pages → Create Worker.
2. `worker.js` mazmunini Worker kodiga joylang va deploy qiling.
3. Worker Settings → Variables and Secrets bo‘limida `OPENROUTER_KEY` nomli **Secret** yarating. Kalitni HTML yoki `app.js` ichiga yozmang.
4. Xohlasangiz `RATE_KV` nomli KV namespace binding ulang. Ulanmasa, qo‘shimcha KV rate limit ishlamaydi.
5. Deploy qilingan `https://....workers.dev` manzilini nusxalang.
6. `app.js` boshidagi `CONFIG.PROXY_URL` qiymatini o‘sha manzilga almashtiring va GitHub'ga qayta yuklang.
7. Worker kodidagi `ALLOWED_MODELS` ro‘yxati ruxsat berilgan modellardir. OpenRouter'da mavjud bepul model identifikatorlari o‘zgarishi mumkin; kerak bo‘lsa ro‘yxatni o‘zingizning OpenRouter katalogingizga moslang.

> API kalitini hech qachon GitHub repository yoki foydalanuvchi brauzeridagi kodga joylamang.

## Maxfiylik

PDF/DOCX matni brauzerda ajratib olinadi va lokal brauzer xotirasida saqlanadi. AI so‘rovi yuborilganda tanlangan materialdan olingan matn bo‘laklari Cloudflare Worker orqali OpenRouter'ga uzatiladi. Maxfiy hujjatlarni faqat bunday uzatishga rozilik bo‘lsa ishlating. Lokal saqlangan ma’lumotlar shu brauzer/profil bilan bog‘liq.

## Hozirgi cheklovlar

- Bu demo versiyada Google akkaunt orqali kirish yo‘q.
- Referat `.txt` ko‘rinishida, slaydlar esa matnli reja sifatida eksport qilinadi; haqiqiy `.docx`/`.pptx` eksporti hali qo‘shilmagan.
- Skanerlangan, faqat rasm ko‘rinishidagi PDF uchun OCR kerak.
- Oflayn rejim ilova qobig‘ini ochishga yordam beradi; AI va CDN orqali yuklanadigan PDF/DOCX kutubxonalari internet talab qilishi mumkin.
- `localStorage` uchun brauzer xotirasi cheklangan. Juda katta hujjatlarni doimiy saqlashga mos emas.

## Sinov ro‘yxati

- [ ] Sayt HTTPS orqali ochiladi
- [ ] Telefon va kompyuterda navigatsiya ishlaydi
- [ ] Mavzu tugmasi ishlaydi
- [ ] PDF va DOCX matni o‘qiladi
- [ ] Manbani o‘chirish va qayta yuklash ishlaydi
- [ ] Worker URL sozlangach AI javob qaytaradi
- [ ] Test javoblari tekshiriladi
- [ ] Flashcard oldi/orqasi almashadi
- [ ] Referat/slayd matni yuklab olinadi
- [ ] Oflayn holatda keshdagi ilova ochiladi
