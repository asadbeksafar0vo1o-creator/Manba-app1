/* Manba 6.0 — PDF bilan chat, rasm tahlili, ovozdan matn va matndan ovoz.
   AI sozlamalari app.js bilan bir xil localStorage kalitlaridan o‘qiladi. */
(function (root) {
  "use strict";
  var STORE_KEY = "manba.v2";
  var OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
  var VISION_MODEL = "google/gemma-3-27b-it:free";
  var MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  var IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
  var MAX_CONTEXT_CHARS = 9000;
  var STOP = ["bilan", "uchun", "yoki", "hamda", "qanday", "nima", "the", "and", "that", "this", "from", "with", "what", "which"];
  var PROMPTS = {
    describe: "Rasmni o‘zbek tilida batafsil tasvirlab bering: asosiy obyektlar, matnlar va kontekst.",
    ocr: "Rasmdagi barcha matnni aynan ko‘chirib yozing. Asl tilini saqlang. Hech narsa qo‘shmang.",
    chart: "Bu jadval yoki grafikni o‘zbek tilida tahlil qiling: sarlavha, o‘qlar, asosiy raqamlar va xulosa.",
    solve: "Rasmdagi masala yoki formulani bosqichma-bosqich yeching va oxirgi javobni alohida ajratib ko‘rsating."
  };

  function chunkText(text, size, overlap) {
    size = size || 1000; overlap = overlap || 120;
    var chunks = [], start = 0; text = String(text || "");
    while (start < text.length) {
      var end = Math.min(text.length, start + size);
      if (end < text.length) {
        var cut = text.lastIndexOf("\n", end), sent = text.lastIndexOf(". ", end), best = Math.max(cut, sent);
        if (best > start + size * 0.55) end = best + 1;
      }
      var piece = text.slice(start, end).trim();
      if (piece) chunks.push(piece);
      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlap);
    }
    return chunks;
  }

  function terms(text) {
    return (String(text).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []).filter(function (w) { return STOP.indexOf(w) === -1; });
  }

  // Savolga eng mos matn parchalarini topadi; mos kelmasa, hujjat boshidan namuna beradi.
  function retrieveFrom(query, sources, maxChars) {
    maxChars = maxChars || MAX_CONTEXT_CHARS;
    var q = terms(query), cands = [];
    sources.forEach(function (src) {
      chunkText(src.text).forEach(function (chunk, i) {
        var t = terms(chunk), counts = Object.create(null);
        t.forEach(function (w) { counts[w] = (counts[w] || 0) + 1; });
        var score = 0;
        q.forEach(function (w) { if (counts[w]) score += Math.log(1 + t.length / (1 + counts[w])) * (1 + Math.log(1 + counts[w])); });
        if (score > 0) cands.push({ score: score, src: src, chunk: chunk, i: i });
      });
    });
    cands.sort(function (a, b) { return b.score - a.score; });
    if (!cands.length) {
      sources.forEach(function (src) {
        chunkText(src.text).slice(0, 2).forEach(function (chunk, i) { cands.push({ score: 0, src: src, chunk: chunk, i: i }); });
      });
    }
    var out = "", used = 0;
    cands.slice(0, 8).forEach(function (c) {
      var piece = "[Manba: " + c.src.name + ", parcha " + (c.i + 1) + "]\n" + c.chunk + "\n\n";
      if (used + piece.length > maxChars) return;
      out += piece; used += piece.length;
    });
    return out.trim();
  }

  function buildPdfMessages(question, sources, history) {
    var context = retrieveFrom(question, sources);
    if (!context) throw new Error("Tanlangan hujjatda matn topilmadi. Skanerlangan PDF bo‘lishi mumkin.");
    var system = "Siz Manba nomli o‘zbekcha o‘quv ilovasidagi ustozsiz. Faqat quyidagi hujjat matniga tayanib o‘zbek tilida javob bering. Matnda javob bo‘lmasa, ochiq ayting va taxmin qilmang. Manba nomi va parcha raqamini ko‘rsating.\n\nMATERIAL:\n" + context;
    var past = (history || []).slice(-6).map(function (m) { return { role: m.role, content: m.content }; });
    return [{ role: "system", content: system }].concat(past, [{ role: "user", content: question }]);
  }

  function readConfig() {
    var ls = function (k) { try { return root.localStorage.getItem(k) || ""; } catch (e) { return ""; } };
    var ss = function (k) { try { return root.sessionStorage.getItem(k) || ""; } catch (e) { return ""; } };
    return {
      provider: ls("manba.provider") || "openrouter",
      apiKey: ss("manba.apiKey") || ls("manba.apiKey"),
      workerUrl: ls("manba.workerUrl"),
      model: ls("manba.model") || "openrouter/free"
    };
  }

  function endpointFor(cfg) {
    if (cfg.provider === "worker") {
      if (!/^https:\/\/.+workers\.dev(?:\/.*)?$/i.test(cfg.workerUrl)) throw new Error("Cloudflare Worker URL sozlamalarda to‘g‘ri kiritilmagan.");
      return cfg.workerUrl;
    }
    if (!cfg.apiKey) throw new Error("AI ishlashi uchun Sozlamalar bo‘limiga OpenRouter API kalitini kiriting.");
    return OPENROUTER;
  }

  function parseAnswer(data) {
    var answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("AI bo‘sh javob qaytardi. Boshqa urinish qilib ko‘ring.");
    return answer.trim();
  }

  function errorMessage(data, status) {
    if (data && data.error) {
      if (typeof data.error === "string") return data.error;
      if (typeof data.error.message === "string") return data.error.message;
    }
    return "AI server xatosi (" + status + ").";
  }

  async function callModel(messages, options, cfg) {
    options = options || {}; cfg = cfg || readConfig();
    var endpoint = endpointFor(cfg);
    var headers = { "Content-Type": "application/json" };
    if (cfg.provider !== "worker") { headers.Authorization = "Bearer " + cfg.apiKey; headers["X-Title"] = "Manba AI"; }
    var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 90000);
    try {
      var res = await fetch(endpoint, {
        method: "POST", headers: headers, signal: ctrl.signal,
        body: JSON.stringify({ model: options.model || cfg.model, messages: messages, temperature: options.temperature != null ? options.temperature : 0.3, max_tokens: options.max_tokens || 1500 })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(errorMessage(data, res.status));
      return parseAnswer(data);
    } catch (e) {
      if (e && e.name === "AbortError") throw new Error("AI javobi uzoq kutildi. Qayta urinib ko‘ring.");
      throw e;
    } finally { clearTimeout(timer); }
  }

  function loadSources(storage) {
    storage = storage || root.localStorage;
    try {
      var d = JSON.parse(storage.getItem(STORE_KEY) || "{}");
      return Array.isArray(d.sources) ? d.sources.filter(function (s) { return s && s.id && s.text; }) : [];
    } catch (e) { return []; }
  }

  async function pdfChat(question, sourceId, history) {
    var sources = loadSources().filter(function (s) { return !sourceId || s.id === sourceId; });
    if (!sources.length) throw new Error("Manba topilmadi. Manbalar bo‘limida PDF yoki DOCX yuklang.");
    return callModel(buildPdfMessages(question, sources, history), { max_tokens: 1500 });
  }

  function validateImage(file) {
    if (!file) throw new Error("Rasm tanlanmagan.");
    if (IMAGE_TYPES.indexOf(file.type) === -1) throw new Error("Faqat PNG, JPG yoki WEBP rasm yuklash mumkin.");
    if (!file.size) throw new Error("Rasm bo‘sh ko‘rinadi.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Rasm hajmi 8 MB dan oshmasligi kerak.");
    return true;
  }

  function buildVisionMessages(mode, dataUrl) {
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) throw new Error("Rasm o‘qilmadi.");
    var prompt = PROMPTS[mode] || PROMPTS.describe;
    return [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }];
  }

  // Rasmni kichraytirib JPEG qiladi: yuklash tez bo‘ladi va so‘rov hajmi kichik qoladi.
  async function prepareImage(file, maxSide) {
    maxSide = maxSide || 1024;
    var bitmap = await createImageBitmap(file);
    var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    var w = Math.max(1, Math.round(bitmap.width * scale)), h = Math.max(1, Math.round(bitmap.height * scale));
    var canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(bitmap, 0, 0, w, h);
    if (bitmap.close) bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function analyzeImage(file, mode, cfg) {
    validateImage(file);
    var dataUrl = await prepareImage(file);
    return callModel(buildVisionMessages(mode, dataUrl), { max_tokens: 1500, temperature: 0.2, model: VISION_MODEL }, cfg);
  }

  function joinTranscript(base, list) {
    var added = list.map(function (s) { return String(s).trim(); }).filter(Boolean).join(" ");
    return [String(base || "").trim(), added].filter(Boolean).join(" ");
  }

  function speechSupported() { return !!(root.SpeechRecognition || root.webkitSpeechRecognition); }

  function createRecognizer(lang) {
    var R = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!R) return null;
    var r = new R(); r.lang = lang || "uz-UZ"; r.continuous = true; r.interimResults = true;
    return r;
  }

  function speakText(text, lang) {
    var synth = root.speechSynthesis;
    if (!synth || !root.SpeechSynthesisUtterance) return { ok: false, uzVoice: false };
    synth.cancel();
    var u = new root.SpeechSynthesisUtterance(String(text).slice(0, 4000));
    u.lang = lang || "uz-UZ"; u.rate = 1;
    var voices = synth.getVoices ? synth.getVoices() : [];
    var uz = voices.filter(function (v) { return /^uz/i.test(v.lang); })[0];
    if (uz) u.voice = uz;
    synth.speak(u);
    return { ok: true, uzVoice: !!uz };
  }

  var api = {
    chunkText: chunkText, terms: terms, retrieveFrom: retrieveFrom, buildPdfMessages: buildPdfMessages,
    readConfig: readConfig, endpointFor: endpointFor, parseAnswer: parseAnswer, errorMessage: errorMessage,
    callModel: callModel, loadSources: loadSources, pdfChat: pdfChat, validateImage: validateImage,
    buildVisionMessages: buildVisionMessages, analyzeImage: analyzeImage, joinTranscript: joinTranscript,
    speechSupported: speechSupported, createRecognizer: createRecognizer, speakText: speakText,
    VISION_MODEL: VISION_MODEL
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  // ---- UI ----
  var pdfHistory = [], busy = false, visionFile = null, recognizer = null, voiceBase = "";
  function el(id) { return document.getElementById(id); }
  function addMsg(log, role, text) {
    var d = document.createElement("div"); d.className = "pdf-msg pdf-" + role; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function setStatus(t) { var s = el("voice-status"); if (s) s.textContent = t; }
  function refreshSources() {
    var sel = el("pdfchat-source"); if (!sel) return;
    var prev = sel.value, list = loadSources();
    sel.textContent = "";
    if (!list.length) {
      var o = document.createElement("option"); o.value = ""; o.textContent = "Avval manba yuklang"; sel.appendChild(o);
      sel.disabled = true; return;
    }
    sel.disabled = false;
    list.forEach(function (s) { var opt = document.createElement("option"); opt.value = s.id; opt.textContent = s.name; sel.appendChild(opt); });
    if (Array.prototype.some.call(sel.options, function (o) { return o.value === prev; })) sel.value = prev;
  }
  async function onPdfSend(e) {
    e.preventDefault();
    var input = el("pdfchat-input"), q = input.value.trim();
    if (!q || busy) return;
    var log = el("pdfchat-log"), btn = el("pdfchat-send");
    busy = true; btn.disabled = true; addMsg(log, "user", q); input.value = "";
    var wait = addMsg(log, "assistant", "Javob tayyorlanmoqda…");
    try {
      var answer = await pdfChat(q, el("pdfchat-source").value, pdfHistory);
      wait.textContent = answer;
      pdfHistory.push({ role: "user", content: q }, { role: "assistant", content: answer });
      if (pdfHistory.length > 8) pdfHistory.splice(0, pdfHistory.length - 8);
    } catch (err) {
      wait.textContent = "Xatolik: " + (err.message || "Javob tayyorlab bo‘lmadi."); wait.classList.add("pdf-error");
    } finally { busy = false; btn.disabled = false; }
  }
  function onVisionPick(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var out = el("vision-output");
    try { validateImage(f); } catch (err) { out.textContent = err.message; visionFile = null; el("vision-run").disabled = true; return; }
    visionFile = f;
    var img = el("vision-preview"); img.src = URL.createObjectURL(f); img.classList.remove("hidden");
    el("vision-run").disabled = false; out.textContent = "";
  }
  async function onVisionRun() {
    if (!visionFile) return;
    var out = el("vision-output"), btn = el("vision-run");
    out.textContent = "Tahlil qilinmoqda…"; btn.disabled = true;
    try { out.textContent = await analyzeImage(visionFile, el("vision-mode").value); }
    catch (err) { out.textContent = "Xatolik: " + (err.message || "Tahlil qilib bo‘lmadi."); }
    finally { btn.disabled = false; }
  }
  function onVoiceStart() {
    if (recognizer) return;
    var r = createRecognizer("uz-UZ");
    if (!r) { setStatus("Bu brauzer ovozli kiritishni qo‘llamaydi. Chrome, Edge yoki Safari’dan foydalaning."); return; }
    var box = el("voice-text");
    voiceBase = box.value.trim();
    r.onresult = function (ev) {
      var list = []; for (var i = 0; i < ev.results.length; i++) list.push(ev.results[i][0].transcript);
      box.value = joinTranscript(voiceBase, list);
    };
    r.onerror = function (ev) { setStatus(ev.error === "not-allowed" ? "Mikrofonga ruxsat berilmadi." : "Ovozni tanishda xatolik: " + ev.error); };
    r.onend = function () {
      recognizer = null; el("voice-start").disabled = false; el("voice-stop").disabled = true;
      setStatus("To‘xtatildi. Matnni tekshirib, kerak bo‘lsa tahrirlang.");
    };
    try { r.start(); } catch (err) { setStatus("Ovozni boshlab bo‘lmadi."); return; }
    recognizer = r; el("voice-start").disabled = true; el("voice-stop").disabled = false;
    setStatus("Tinglayapman… o‘zbek tilida gapiring.");
  }
  function onVoiceSpeak() {
    var text = el("voice-text").value.trim();
    if (!text) { setStatus("Avval matn kiriting yoki gapiring."); return; }
    var res = speakText(text, "uz-UZ");
    if (!res.ok) setStatus("Bu brauzer matndan ovozga o‘tkazishni qo‘llamaydi.");
    else if (!res.uzVoice) setStatus("Qurilmada o‘zbek ovozi topilmadi; standart ovoz ishlatildi.");
    else setStatus("O‘qilmoqda…");
  }
  function init() {
    refreshSources();
    document.querySelectorAll('[data-tab="tools"],[data-go="tools"]').forEach(function (b) { b.addEventListener("click", refreshSources); });
    if (el("pdfchat-form")) el("pdfchat-form").addEventListener("submit", onPdfSend);
    if (el("vision-input")) el("vision-input").addEventListener("change", onVisionPick);
    if (el("vision-run")) el("vision-run").addEventListener("click", onVisionRun);
    if (el("voice-start")) el("voice-start").addEventListener("click", onVoiceStart);
    if (el("voice-stop")) el("voice-stop").addEventListener("click", function () { if (recognizer) recognizer.stop(); });
    if (el("voice-speak")) el("voice-speak").addEventListener("click", onVoiceSpeak);
    if (el("voice-clear")) el("voice-clear").addEventListener("click", function () { el("voice-text").value = ""; setStatus(""); });
    if (!speechSupported()) setStatus("Ovozli kiritish bu brauzerda mavjud emas. Chrome, Edge yoki Safari’dan foydalaning.");
  }
  init();
})(typeof window !== "undefined" ? window : globalThis);
