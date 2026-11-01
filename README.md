# Manba AI 3.4 — Cinematic Orbit · Responsive

Manba AI is a responsive, local-first study workspace. The interface includes source upload, source-grounded AI chat (when configured), quiz generation, flashcards, referat/slides generation, Pomodoro, statistics, language preferences, and API/Worker settings.

## Responsive behavior

The interface uses desktop navigation on wider screens and a fixed, safe-area-aware five-item navigation bar on phones. Tablet, narrow phone, and landscape breakpoints adjust grids, inputs, and timer controls. The CSS honors `prefers-reduced-motion` and keeps form controls at a readable 16px on mobile to reduce unwanted browser zoom.

## Run locally

Open `index.html` in a modern browser. For the PWA service worker and PDF/DOCX libraries, use a local static server or GitHub Pages.

## Deploy to GitHub Pages

1. Upload all files in this folder to the root of your repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, branch `main`, folder `/(root)`.
4. Open the published URL and configure the AI provider in **Sozlamalar**.

## AI setup

- OpenRouter direct mode lets the user enter their own API key. A key stored in browser storage is not protected from someone who can access that browser; use a provider-side spend limit.
- Cloudflare Worker mode is safer for key handling. Deploy `worker.js`, set `OPENROUTER_KEY` as a Worker secret, and enter the Worker URL in the app settings.
- Free/Pro selector is a local demo preference only. It is not a real payment/subscription system, and client-side limits are not secure billing enforcement.

## Cinematic orbital scene

`orbit.js` draws a lightweight animated starfield, orbital paths, satellite silhouettes and occasional meteors using Canvas 2D. CSS animates the Earth, Moon and satellite orbit elements. The Earth and Moon use remote texture URLs when online; if those external image hosts are unavailable, gradient fallbacks remain visible. The visual is a cinematic educational illustration, **not a live NASA orbital simulation** and does not use live telemetry.

The Earth texture URL references NASA/GSFC Blue Marble imagery. Moon texture is loaded from the Three.js example texture host. Check the source pages and usage terms before redistributing texture assets separately.

## Local data and privacy

Study data is stored in the current browser using local storage. Clearing browser/site data may remove it. When AI is enabled, relevant source text and prompts are sent to the selected AI provider or configured Worker. Do not upload sensitive documents unless you are comfortable with that transfer.

## Browser checks

The JavaScript files were checked with `node --check`, HTML IDs were checked for duplicates, and the ZIP was checked for integrity. This does not replace real end-to-end testing of AI provider credentials, PDF/DOCX parsing, or all screen sizes.


## Version 3.3 improvements

- Dedicated five-item bottom navigation on narrow/mobile screens; desktop keeps the full tab bar.
- Improved tap feedback, focus visibility, safe-area spacing and compact-screen layout.
- Kept existing local-first study features and animated orbit illustration.

This is still a static front-end app. Real Pro payments, secure subscription enforcement, live NASA telemetry, and production-grade account/cloud sync are not included. AI tools require a valid provider key or configured Worker.


## 4.0 yangilanish
- Yer va Oy uchun tashqi rasmga bog‘liq bo‘lmagan CSS tekstura qatlamlari qo‘shildi.
- Kompyuterda keng boshqaruv paneli, telefonda pastki navigatsiya va asosiy amallar uchun ikki ustunli tugmalar joylashuvi.
- Yulduzlar va orbital animatsiya `orbit.js` orqali ishlaydi; `prefers-reduced-motion` sozlamasi hurmat qilinadi.
- Sozlamalarda OpenRouter API kaliti yoki Cloudflare Worker URL tanlanadi; API ulanishini tekshirish tugmasi mavjud.
- API kalitini brauzerda saqlash xavfsizlik jihatidan tavsiya etilmaydi. Eng xavfsiz variant — Cloudflare Worker Secret.


## 4.1 Cosmic Challenge
- Updated Earth and Moon visual textures bundled locally for consistent loading.
- Added user-defined daily goal/challenge with target, unit, progress controls, and local-day reset.
- Improved small-screen planetary hero layout and goal form.


### Version 4.2 updates
The home screen now has animated full-screen planetary texture layers, glass-style action tiles, and configurable daily/ongoing/deadline goals. Goals are stored locally in the browser. Deadline goals require a date today or later.
