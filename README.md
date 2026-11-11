# Manba AI

O‘zbek tilidagi shaxsiy ta’lim platformasi: AI ustoz, manba asosida testlar, flashkartalar, referat, slaydlar va boshqalar. Oddiy statik sayt: server, baza yoki build kerak emas.

## GitHub Pages’ga joylash
1. Barcha fayllarni repozitoriyning asosiy (root) papkasiga yuklang. Eski fayllarni o‘chirib, shularni qo‘ying.
2. **Settings → Pages**: branch `main`, papka `/ (root)`.
3. Sayt manzilini oching → **Sozlamalar** → OpenRouter API kalitini kiriting (https://openrouter.ai/keys).

> Kalitni hech qachon GitHub’ga, kodga yoki chatga yozmang. U faqat brauzerda saqlanadi.

## Bo‘limlar
Bosh sahifa · AI Ustoz · Manbalar (PDF/DOCX/TXT) · Testlar · Flashkartalar (intervalli takrorlash) · Referat · Mustaqil ish (titul varag‘i, amaliy/tahliliy qism, himoya savollari) · Slaydlar (.pptx) · Maqsadlar va Challenge · Pomodoro · Kalendar · Eslatmalar · Statistika · Vositalar (konspekt, tarjima, tahlil, formula, rasm tahlili, ovoz) · O‘qituvchi rejimi · Sozlamalar.

## Tezkor boshqaruv
- **Ctrl+K** (yoki yuqoridagi qidiruv paneli): bo‘lim, amal yoki manbani qidirish; yozgan savolingizni AI Ustozga yuborish.
- Bosh sahifada rol tanlovi (Talaba / O‘qituvchi / Tadqiqotchi) va AI modelini tanlash.

## Navigatsiya
- Yuqoridagi qidiruv paneli yoki **Ctrl + K**: bo‘lim, amal yoki savol yozing.
- Bosh sahifada “Siz kim sifatida foydalanasiz?” (talaba / o‘qituvchi / tadqiqotchi) AI javob uslubiga ta’sir qiladi, “AI modellari” orqali model almashtiriladi.
- Kompyuter: chap menyu ("Yig‘ish" tugmasi bilan ixcham qilish mumkin).
- Planshet: avtomatik ixcham menyu (faqat ikonkalar).
- Telefon: pastki panel va "Bo‘limlar" oynasi (barcha 15 bo‘lim), o‘rtadagi yulduzcha — AI Ustoz.
- Qorong‘i va yorug‘ mavzu: yuqoridagi tugma yoki Sozlamalar.

## Kosmik fon va sifat
Yer va Oy butun saytning doimiy orqa fonida: Yer qiyaligi bilan aylanadi, tun tomonida shahar chiroqlari, okeanda Quyosh akslanishi, atmosfera nuri; kursor va scroll bilan parallaks. Tezlik past qurilmada sifat avtomatik pasayadi.
Hozirgi `earth.webp` past aniqlikda (887 px). Yanada kinematik ko‘rinish uchun yuqori sifatli (4096×2048) teksturalarni shu nomlar bilan almashtiring: `earth.webp` (kunduzgi xarita), `moon.webp` va ixtiyoriy `earth-night.webp` (tungi chiroqlar xaritasi, NASA Black Marble). Kod ularni o‘zi taniydi. `earth-night.webp` bo‘lmasa, chiroqlar protsedural yaratiladi.

## Cheklovlar
- Ma’lumotlar (manbalar, kartalar, statistika) shu brauzerda saqlanadi; Sozlamalardan eksport qilib turing.
- Eslatmalar sayt butunlay yopiq bo‘lsa ishlamaydi.
- Ovozli funksiyalar brauzerga bog‘liq (Chrome/Edge); o‘zbek ovozi bo‘lmasa, standart ovoz ishlatiladi.
- Rasm tahlili uchun rasm ko‘ra oladigan model kerak.
- Hamkorlik (guruh) va to‘lovli Pro obuna yo‘q: ular server talab qiladi.
- AI xato qilishi mumkin; muhim ma’lumotni manbadan tekshiring.

## Fayllar
`index.html`, `styles.css`, `app.js` — ilova · `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png` — PWA · `earth.webp`, `moon.webp` — Yer va Oy.
