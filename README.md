# Manba AI 3.2 — Cinematic Orbit

Manba AI is a responsive, local-first study workspace. The interface includes source upload, source-grounded AI chat (when configured), quiz generation, flashcards, referat/slides generation, Pomodoro, statistics, language preferences, and API/Worker settings.

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
