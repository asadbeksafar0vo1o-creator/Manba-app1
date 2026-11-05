# Manba AI

O‘zbek tilidagi shaxsiy ta’lim platformasi: AI ustoz, manba asosida testlar, flashkartalar, referat, slaydlar va boshqalar. Oddiy statik sayt: server, baza yoki build kerak emas.

## GitHub Pages’ga joylash
1. Barcha fayllarni repozitoriyning asosiy (root) papkasiga yuklang. Eski fayllarni o‘chirib, shularni qo‘ying.
2. **Settings → Pages**: branch `main`, papka `/ (root)`.
3. Sayt manzilini oching → **Sozlamalar** → OpenRouter API kalitini kiriting (https://openrouter.ai/keys).

> Kalitni hech qachon GitHub’ga, kodga yoki chatga yozmang. U faqat brauzerda saqlanadi.

## Bo‘limlar
Bosh sahifa · AI Ustoz · Manbalar (PDF/DOCX/TXT) · Testlar · Flashkartalar (intervalli takrorlash) · Referat · Slaydlar (.pptx) · Maqsadlar va Challenge · Pomodoro · Kalendar · Eslatmalar · Statistika · Vositalar (konspekt, tarjima, tahlil, formula, rasm tahlili, ovoz) · O‘qituvchi rejimi · Sozlamalar.

## Cheklovlar
- Ma’lumotlar (manbalar, kartalar, statistika) shu brauzerda saqlanadi; Sozlamalardan eksport qilib turing.
- Eslatmalar sayt butunlay yopiq bo‘lsa ishlamaydi.
- Ovozli funksiyalar brauzerga bog‘liq (Chrome/Edge); o‘zbek ovozi bo‘lmasa, standart ovoz ishlatiladi.
- Rasm tahlili uchun rasm ko‘ra oladigan model kerak.
- Hamkorlik (guruh) va to‘lovli Pro obuna yo‘q: ular server talab qiladi.
- AI xato qilishi mumkin; muhim ma’lumotni manbadan tekshiring.

## Fayllar
`index.html`, `styles.css`, `app.js` — ilova · `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png` — PWA · `earth-texture.jpg`, `moon-texture.jpg` — Yer va Oy.
