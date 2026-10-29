# Manba AI 3.0 — shaxsiy AI o‘quv platformasi

Manba AI — mobil va kompyuterga mos, kosmik bosh sahifali, akkauntsiz ishlaydigan o‘quv web-ilovasi. Ma’lumotlar odatiy holatda shu brauzer/qurilma xotirasida saqlanadi.

## Fayllar

- `index.html` — barcha bo‘limlar va interfeys
- `styles.css` — responsiv dizayn, mobil ko‘rinish va animatsiyalar
- `app.js` — manbalarni o‘qish, AI ulanishi, testlar, flashkartalar, limitlar, statistika va Pomodoro
- `worker.js` — ixtiyoriy Cloudflare Worker proxy
- `manifest.json`, `icon.svg`, `sw.js` — PWA/o‘rnatish, ilova belgisi va oflayn shell
- `CHANGELOG.md` — versiya o‘zgarishlari

## Ishga tushirish

1. ZIP faylni oching. **Barcha fayllar bir papkada qolishi kerak.**
2. Papkani GitHub Pages, Cloudflare Pages yoki boshqa statik HTTPS hostingga joylang. `file://` orqali ochilganda PWA va ayrim brauzer imkoniyatlari ishlamasligi mumkin.
3. Sayt ochilgach `Sozlamalar` bo‘limiga kiring va AI ulanishini sozlang.

## AI ulanishi

### Variant A — OpenRouter API kaliti

1. `https://openrouter.ai/settings/keys` sahifasida API kaliti yarating.
2. Manba AI → **Sozlamalar → AI provayderi** bo‘limida `OpenRouter — shaxsiy API kaliti` tanlang.
3. Kalitni kiriting, modelni tanlang va `Ulanishni tekshirish` tugmasini bosing.
4. `Kalitni ushbu qurilmada saqlash` belgisi o‘chiq bo‘lsa, kalit faqat shu sahifa seansida xotirada qoladi. Belgilansa, shu brauzerning lokal xotirasiga yoziladi.

**Xavfsizlik:** brauzerga kiritilgan kalit sayt kodidan to‘liq himoyalanmaydi. Shaxsiy qurilmada foydalaning, provayder panelida xarajat limitini belgilang va umumiy kompyuterda kalitni saqlamang. AI ishlatilganda yuborilgan material parchalari tanlangan AI provayderiga boradi.

### Variant B — Cloudflare Worker

1. Cloudflare Dashboard → Workers & Pages orqali Worker yarating.
2. `worker.js` kodini Worker’ga joylang.
3. Worker’da `OPENROUTER_KEY` nomli Secret yarating va kalitni shu yerga kiriting.
4. Worker’ni deploy qiling va hosil bo‘lgan HTTPS URL’ni nusxalang.
5. Ilova sozlamalarida `Cloudflare Worker`ni tanlab, URL’ni kiriting va ulanishni tekshiring.

Worker’ning ruxsat etilgan modellari `worker.js` ichidagi ro‘yxat bilan cheklanishi mumkin. Tanlangan model ushbu ro‘yxatga mos bo‘lishi kerak.

## Mavjud funksiyalar

- Kosmik bosh sahifa, moslashuvchan mobil interfeys va pastki/yuqori bo‘lim navigatsiyasi
- PDF (50 MB gacha) va DOCX (20 MB gacha) fayllarni brauzerda matnga ajratish
- Manbaga asoslangan AI savol-javob
- 5–50 savolli AI test yaratish, javoblarni tekshirish va natijani ko‘rish
- Flashkartalar yaratish va o‘rganish progressi
- Referat va slayd matnlarini yaratish, `.txt` formatida yuklab olish
- Pomodoro: 25 daqiqa fokus, 5 daqiqa qisqa tanaffus, 15 daqiqa uzun tanaffus
- O‘qish statistikasi va lokal kunlik vazifalar
- AI natijalari uchun 10 til: o‘zbek, ingliz, rus, turk, arab, qozoq, koreys, nemis, fransuz va ispan
- Qorong‘i/yorug‘ mavzu va PWA shell kesh
- Lokal Free/Pro rejim tanlovi va asosiy kunlik limitlar

## Free va Pro haqida muhim eslatma

Hozirgi `Free`/`Pro` tanlovi — **mahalliy demo rejimi**. U foydalanuvchi qurilmasidagi limitlarni boshqaradi, lekin haqiqiy obuna, to‘lov yoki serverda tekshiriladigan Pro huquqini yaratmaydi. Foydalanuvchi brauzer xotirasini o‘zgartirib lokal limitlarni chetlab o‘tishi mumkin. Haqiqiy tijoriy tarif uchun server tomonida foydalanuvchi/litsenziya va to‘lov tekshiruvi zarur.

Boshlang‘ich limitlar:

| Amal | Free | Pro demo |
|---|---:|---:|
| Yangi manba yuklash | 3 ta/kun | 20 ta/kun |
| AI savol-javob | 10 ta/kun | 100 ta/kun |
| Yangi test | 3 ta/kun | 20 ta/kun |
| Yangi flashkarta | 30 ta/kun | 200 ta/kun |
| Pomodoro | Cheklovsiz | Cheklovsiz |

AI provayderining o‘z narxlari va kvotalari alohida qo‘llanadi. Ilovada `Pro`ni tanlash AI xarajatlarini to‘lamaydi va serverda obuna sifatida tekshirilmaydi.

## Ma’lumotlar va cheklovlar

- Manbalar, chat, kartalar, statistika va vazifalar `localStorage` orqali shu brauzerda saqlanadi. Brauzer ma’lumotlarini tozalash ularni o‘chirishi mumkin.
- Katta fayllar brauzer xotirasi limitidan oshishi mumkin.
- Pomodoro taymeri sahifa ochiq turganida ishlaydi; hozircha fon rejimida kafolatlangan bildirishnoma yo‘q.
- Slaydlar hozircha tahrirlanadigan matn ko‘rinishida yaratiladi va `.txt` sifatida eksport qilinadi; tayyor `.pptx` eksporti mavjud emas.
- Interfeysning asosiy matnlari hozircha o‘zbek tilida; til sozlamasi AI yaratadigan javoblar va materiallar tilini tanlaydi.
- Ovozli dars, ovoz orqali Speaking tahlili, bulutli sinxronlash va haqiqiy to‘lov tizimi bu paketga kiritilmagan.
