(() => {
"use strict";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const MAX_PDF = 50 * 1024 * 1024, MAX_DOCX = 20 * 1024 * 1024;
const STORE_KEY = "manba.v2";
const CONFIG = {
  // Deploy worker.js, then paste its URL here, e.g. https://manba-ai.<account>.workers.dev
  PROXY_URL: "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE",
  MODEL: "openrouter/free",
  MAX_CONTEXT_CHARS: 9000,
  MAX_SOURCE_CHARS: 180000
};
const state = {
  sources: [], chat: [], test: null, testAnswers: {}, cards: [], cardIndex: 0, cardRevealed: false,
  stats: { chats:0, tests:0, cards:0, docs:0, daily:{} }, installPrompt: null, busy: false
};
let toastTimer;
function toast(message) {
  const el = $("#toast"); if (!el) return;
  el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
function esc(s="") { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function formatBytes(n) { if (!n) return "0 B"; const units=["B","KB","MB","GB"]; const i=Math.min(3,Math.floor(Math.log(n)/Math.log(1024))); return `${(n/1024**i).toFixed(i?1:0)} ${units[i]}`; }
function localDay(date=new Date()) { const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({sources:state.sources.map(s=>({id:s.id,name:s.name,type:s.type,size:s.size,text:s.text,added:s.added})),chat:state.chat,stats:state.stats,cards:state.cards})); }
  catch(e) { console.warn("Saqlash cheklovi:",e); toast("Saqlash joyi to‘lib qolgan bo‘lishi mumkin."); }
}
function load() {
  try {
    const d=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");
    if (Array.isArray(d.sources)) state.sources=d.sources;
    if (Array.isArray(d.chat)) state.chat=d.chat;
    if (d.stats && typeof d.stats==="object") state.stats={...state.stats,...d.stats,daily:d.stats.daily||{}};
    if (Array.isArray(d.cards)) state.cards=d.cards;
  } catch(e) { console.warn("Saqlangan ma’lumot o‘qilmadi",e); }
}
function bump(key) {
  const day=localDay(); state.stats[key]=(state.stats[key]||0)+1;
  state.stats.daily ||= {}; state.stats.daily[day] ||= {chats:0,tests:0,cards:0,docs:0};
  state.stats.daily[day][key]=(state.stats.daily[day][key]||0)+1;
  const keys=Object.keys(state.stats.daily).sort(); while(keys.length>30) delete state.stats.daily[keys.shift()];
  save(); renderStats();
}
function showTab(name) {
  const tab = $(`.tab[data-tab="${name}"]`);
  if (!tab) return;
  $$(".tab").forEach(b=>{const active=b.dataset.tab===name;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  $$(".view").forEach(v=>v.classList.toggle("hidden",v.id!==`v-${name}`));
  if (name==="study") renderStats();
}
function renderInlineMarkdown(text) {
  // Escape all untrusted content first; then apply a small, deliberately limited markdown subset.
  let s=esc(text);
  s=s.replace(/```([\s\S]*?)```/g,(_,code)=>`<pre><code>${code}</code></pre>`);
  s=s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/(^|\n)### (.+)/g,"$1<h4>$2</h4>").replace(/(^|\n)## (.+)/g,"$1<h3>$2</h3>");
  s=s.replace(/(?:^|\n)- (.+)/g, (m,item)=>`<li>${item}</li>`);
  s=s.replace(/(<li>[\s\S]*?<\/li>)/g,"<ul>$1</ul>");
  return s.split(/\n{2,}/).map(part=>part.startsWith("<pre>")||part.startsWith("<h")||part.startsWith("<ul>")?part:`<p>${part.replace(/\n/g,"<br>")}</p>`).join("");
}
function renderSources() {
  const list=$("#source-list"); $("#source-count").textContent=`${state.sources.length} ta`;
  if (!state.sources.length) { list.innerHTML='<div class="empty-state">Hozircha manba yuklanmagan.</div>'; $("#chat-status").textContent="Avval PDF yoki DOCX manba yuklang. AI javoblari yuklangan materialga tayangan holda tuziladi."; return; }
  list.innerHTML=state.sources.map(s=>`<div class="source-item"><div class="source-file-icon">${s.type==="pdf"?"PDF":"DOCX"}</div><div class="source-info"><strong title="${esc(s.name)}">${esc(s.name)}</strong><small>${formatBytes(s.size)} · ${s.text.length.toLocaleString("uz-UZ")} belgi</small></div><button class="remove-source" data-remove-source="${esc(s.id)}" type="button" aria-label="${esc(s.name)} faylini o‘chirish">O‘chirish</button></div>`).join("");
  $("#chat-status").textContent=`${state.sources.length} ta manba tayyor. Savolingizga javob berishda ulardan tegishli matn izlanadi.`;
}
function renderChat() {
  const log=$("#chat-log");
  if (!state.chat.length) { log.innerHTML='<div class="welcome-card"><div class="welcome-icon">✦</div><h3>Birgalikda o‘rganamiz</h3><p>Manba yuklagach, savolingizni yozing. Javobda materialdan topilgan ma’lumotlar ajratib ko‘rsatiladi.</p></div>'; return; }
  log.innerHTML=state.chat.map(m=>`<div class="message ${m.role==="user"?"user":"assistant"}"><div class="avatar">${m.role==="user"?"S":"M"}</div><div class="bubble">${renderInlineMarkdown(m.content)}</div></div>`).join("");
  log.scrollTop=log.scrollHeight;
}
function chunkText(text, size=1000, overlap=120) {
  const chunks=[]; let start=0;
  while(start<text.length) {
    let end=Math.min(text.length,start+size);
    if(end<text.length) { const cut=text.lastIndexOf("\n",end); const sentence=text.lastIndexOf(". ",end); const best=Math.max(cut,sentence); if(best>start+size*.55) end=best+1; }
    const piece=text.slice(start,end).trim(); if(piece) chunks.push(piece);
    if(end>=text.length) break; start=Math.max(start+1,end-overlap);
  }
  return chunks;
}
function terms(text) { return (String(text).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).filter(w=>!["bilan","uchun","yoki","hamda","qanday","nima","the","and","that","this","from","with","what","which"].includes(w)); }
function retrieve(query) {
  const q=terms(query); const candidates=[];
  for(const source of state.sources) {
    const chunks=source.chunks||chunkText(source.text);
    for(let i=0;i<chunks.length;i++) {
      const t=terms(chunks[i]), counts={}; for(const w of t) counts[w]=(counts[w]||0)+1;
      let score=0; for(const w of q) if(counts[w]) score+=Math.log(1+t.length/(1+counts[w]))*(1+Math.log(1+counts[w]));
      if(score>0)candidates.push({score,source,chunk:chunks[i],index:i});
    }
  }
  candidates.sort((a,b)=>b.score-a.score);
  let out="", used=0;
  for(const c of candidates.slice(0,8)) { const piece=`[Manba: ${c.source.name}, parcha ${c.index+1}]\n${c.chunk}\n\n`; if(used+piece.length>CONFIG.MAX_CONTEXT_CHARS)continue;out+=piece;used+=piece.length; }
  return out.trim();
}
async function extractFile(file) {
  const ext=file.name.split(".").pop().toLowerCase();
  if(!["pdf","docx"].includes(ext)) throw new Error("Faqat PDF yoki DOCX fayl yuklash mumkin.");
  const limit=ext==="pdf"?MAX_PDF:MAX_DOCX;
  if(file.size>limit)throw new Error(`${ext.toUpperCase()} fayl hajmi ${formatBytes(limit)} dan oshmasligi kerak.`);
  if(!file.size)throw new Error("Fayl bo‘sh ko‘rinadi.");
  let text="";
  if(ext==="pdf") {
    if(!window.pdfjsLib) throw new Error("PDF o‘qish kutubxonasi yuklanmadi. Internetni tekshirib, sahifani yangilang.");
    pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    const doc=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
    const pageTexts=[];
    for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const content=await page.getTextContent();pageTexts.push(`[Bet ${p}]\n`+content.items.map(x=>x.str).join(" "));}
    text=pageTexts.join("\n\n");
  } else {
    if(!window.mammoth)throw new Error("DOCX o‘qish kutubxonasi yuklanmadi. Internetni tekshirib, sahifani yangilang.");
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}); text=result.value||"";
  }
  text=text.replace(/\u0000/g,"").trim();
  if(!text)throw new Error("Fayldan matn topilmadi. PDF skanerlangan rasm bo‘lishi mumkin; OCR kerak bo‘ladi.");
  if(text.length>CONFIG.MAX_SOURCE_CHARS)text=text.slice(0,CONFIG.MAX_SOURCE_CHARS);
  return {text,ext};
}
async function addFiles(fileList) {
  const files=[...fileList]; if(!files.length)return;
  for(const file of files) {
    try {
      toast(`${file.name} o‘qilmoqda…`);
      const {text,ext}=await extractFile(file);
      const source={id:crypto.randomUUID(),name:file.name,type:ext,size:file.size,text,added:Date.now()};
      source.chunks=chunkText(text);
      state.sources.push(source); bump("docs");
      toast(`${file.name} muvaffaqiyatli qo‘shildi.`);
    } catch(e) { toast(e.message||"Faylni o‘qib bo‘lmadi."); }
  }
  save();renderSources();renderStats();
}
function workerReady() { return /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev(?:\/.*)?$/i.test(CONFIG.PROXY_URL) || /^https:\/\/.+workers\.dev(?:\/.*)?$/i.test(CONFIG.PROXY_URL); }
async function askAI(messages, options={}) {
  if(!workerReady()) throw new Error("AI server hali ulanmagan. README.md dagi Cloudflare Worker sozlamasini bajaring va app.js ichidagi PROXY_URL qiymatini o‘zgartiring.");
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),90000);
  try {
    const response=await fetch(CONFIG.PROXY_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:CONFIG.MODEL,messages,temperature:options.temperature??0.3,max_tokens:options.max_tokens??1800}),signal:controller.signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.error?.message||data?.error||`AI server xatosi (${response.status}).`);
    const answer=data?.choices?.[0]?.message?.content;
    if(typeof answer!=="string"||!answer.trim())throw new Error("AI bo‘sh javob qaytardi. Boshqa urinish qilib ko‘ring.");
    return answer.trim();
  } catch(e) {
    if(e.name==="AbortError")throw new Error("AI javobi uzoq kutildi. Qayta urinib ko‘ring.");
    throw e;
  } finally { clearTimeout(timer); }
}
function getSourcePrompt(query) {
  const context=retrieve(query);
  if(!context)throw new Error("Savolga mos matn topilmadi. Manbani tekshiring yoki savolni boshqacha yozing.");
  return `Siz Manba nomli o‘zbekcha o‘quv ilovasidagi bilimli ustozsiz. Faqat quyidagi yuklangan materialga tayangan holda javob bering. Materialda javob bo‘lmasa, buni ochiq ayting va taxmin qilmang. Zarur bo‘lsa, manba nomi va bet/parcha raqamini ko‘rsating. Javobni o‘zbek tilida, tushunarli va tartibli yozing.\n\nMATERIAL:\n${context}`;
}
async function sendChat() {
  const input=$("#chat-input"), text=input.value.trim();
  if(!text||state.busy)return;
  if(!state.sources.length){toast("Avval Manbalar bo‘limida PDF yoki DOCX yuklang.");showTab("sources");return;}
  state.chat.push({role:"user",content:text});input.value="";renderChat();bump("chats");
  const log=$("#chat-log"), loading=document.createElement("div");loading.className="loading";loading.innerHTML='<span class="spinner"></span> Ustoz javob tayyorlamoqda…';log.appendChild(loading);log.scrollTop=log.scrollHeight;
  state.busy=true;$("#chat-send").disabled=true;
  try {
    const system=getSourcePrompt(text);
    const history=state.chat.slice(-8).map(m=>({role:m.role,content:m.content}));
    const answer=await askAI([{role:"system",content:system},...history],{max_tokens:1500});
    state.chat.push({role:"assistant",content:answer});save();
  } catch(e) { state.chat.push({role:"assistant",content:`**Xatolik:** ${e.message||"Javob tayyorlab bo‘lmadi."}`});save(); }
  finally { state.busy=false;$("#chat-send").disabled=false;renderChat(); }
}
function parseJSON(text) {
  const clean=text.replace(/```(?:json)?/gi,"").replace(/```/g,"").trim();
  const start=clean.indexOf("{"), arr=clean.indexOf("[");
  const i=start<0?arr:arr<0?start:Math.min(start,arr);
  if(i<0)throw new Error("AI javobida kerakli tuzilma topilmadi.");
  const endChar=clean[i]==="["?"]":"}";
  const end=clean.lastIndexOf(endChar);
  if(end<0)throw new Error("AI JSON javobi to‘liq emas.");
  return JSON.parse(clean.slice(i,end+1));
}
async function generateTest() {
  if(state.busy)return; const area=$("#test-area");
  try {
    const context=retrieve("asosiy tushunchalar, ta’riflar, faktlar va sabablar");
    if(!context)throw new Error("Avval manba yuklang.");
    state.busy=true;$("#test-gen").disabled=true;area.innerHTML='<div class="panel"><span class="loading"><span class="spinner"></span> Test tuzilmoqda…</span></div>';
    const raw=await askAI([{role:"system",content:"Faqat JSON qaytaring: {\"questions\":[{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer\":0,\"explanation\":\"...\"}]}. Aynan 5 savol. Har savolda 4 variant, answer 0-3 oralig‘idagi indeks. Savollar materialdan bo‘lsin, o‘zbek tilida."},{role:"user",content:context}],{max_tokens:1800});
    const data=parseJSON(raw), qs=data.questions;
    if(!Array.isArray(qs)||qs.length<3)throw new Error("Yetarli test savoli yaratilmadi.");
    state.test=qs.slice(0,5).map(q=>({question:String(q.question||"Savol"),options:Array.isArray(q.options)?q.options.slice(0,4).map(String):[],answer:Number(q.answer),explanation:String(q.explanation||"")}));
    if(state.test.some(q=>q.options.length!==4||q.answer<0||q.answer>3||!Number.isInteger(q.answer)))throw new Error("Test formatida xatolik. Qayta urinib ko‘ring.");
    state.testAnswers={};renderTest();bump("tests");
  } catch(e){area.innerHTML=`<div class="panel"><p class="muted">${esc(e.message)}</p></div>`;toast(e.message);}
  finally{state.busy=false;$("#test-gen").disabled=false;}
}
function renderTest() {
  const area=$("#test-area"); if(!state.test){area.innerHTML="";return;}
  area.innerHTML=state.test.map((q,i)=>`<div class="question-card" data-question="${i}"><h3>${i+1}. ${esc(q.question)}</h3>${q.options.map((op,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}" ${state.testAnswers[i]===j?"checked":""}><span>${esc(op)}</span></label>`).join("")}<div class="feedback hidden" id="feedback-${i}"></div></div>`).join("")+`<button class="btn btn-primary btn-block" id="check-test" type="button">Javoblarni tekshirish</button><div id="test-score"></div>`;
}
function checkTest() {
  if(!state.test)return;let score=0;
  state.test.forEach((q,i)=>{const fb=$(`#feedback-${i}`),chosen=state.testAnswers[i];fb.classList.remove("hidden","correct","wrong");if(chosen===q.answer){score++;fb.classList.add("correct");fb.textContent=`To‘g‘ri! ${q.explanation}`;}else{fb.classList.add("wrong");fb.textContent=`To‘g‘ri javob: ${q.options[q.answer]}. ${q.explanation}`;}});
  $("#test-score").innerHTML=`<p class="score-line">Natija: ${score} / ${state.test.length} (${Math.round(score/state.test.length*100)}%)</p>`;
}
async function generateCards() {
  if(state.busy)return;const area=$("#cards-area");
  try {
    const context=retrieve("asosiy atamalar, ta’riflar, tushunchalar");
    if(!context)throw new Error("Avval manba yuklang.");
    state.busy=true;$("#cards-gen").disabled=true;area.innerHTML='<div class="panel"><span class="loading"><span class="spinner"></span> Kartalar tayyorlanmoqda…</span></div>';
    const raw=await askAI([{role:"system",content:"Faqat JSON qaytaring: {\"cards\":[{\"front\":\"savol yoki atama\",\"back\":\"qisqa javob\"}]}. Aynan 10 ta ixcham karta. O‘zbek tilida, manbaga tayangan holda."},{role:"user",content:context}],{max_tokens:1300});
    const data=parseJSON(raw);if(!Array.isArray(data.cards)||!data.cards.length)throw new Error("Kartalar topilmadi.");
    state.cards=data.cards.slice(0,30).map(c=>({front:String(c.front||""),back:String(c.back||""),due:0,known:0,seen:0})).filter(c=>c.front&&c.back);
    state.cardIndex=0;state.cardRevealed=false;save();renderCards();toast(`${state.cards.length} ta karta tayyor.`); 
  } catch(e){area.innerHTML=`<div class="panel"><p class="muted">${esc(e.message)}</p></div>`;toast(e.message);}
  finally{state.busy=false;$("#cards-gen").disabled=false;}
}
function renderCards() {
  const area=$("#cards-area");
  if(!state.cards.length){area.innerHTML='<div class="empty-state">Hozircha karta yo‘q. Manba yuklab, “Kartalar yaratish” tugmasini bosing.</div>';return;}
  state.cardIndex=Math.min(state.cardIndex,state.cards.length-1);const c=state.cards[state.cardIndex];
  area.innerHTML=`<div class="panel"><div class="row-between"><span class="muted small">Karta ${state.cardIndex+1} / ${state.cards.length}</span><span class="counter">${c.seen||0} marta ko‘rilgan</span></div><div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Javobni ko‘rish"><div><div class="face-label">${state.cardRevealed?"JAVOB":"SAVOL"}</div><div class="face-text">${esc(state.cardRevealed?c.back:c.front)}</div><div class="muted small">${state.cardRevealed?"Keyingi kartaga o‘tish uchun pastdagi tugmalardan foydalaning":"Javobni ko‘rish uchun kartani bosing"}</div></div></div><div class="flashcard-actions">${state.cardRevealed?'<button class="btn btn-secondary" id="card-again" type="button">Yana takrorlayman</button><button class="btn btn-primary" id="card-known" type="button">Bilaman ✓</button>':'<button class="btn btn-primary" id="card-reveal" type="button">Javobni ko‘rish</button>'}<button class="btn btn-quiet" id="card-next" type="button">O‘tkazish →</button></div></div>`;
}
function nextCard(known=false) {
  const c=state.cards[state.cardIndex];if(c){c.seen=(c.seen||0)+1;if(known)c.known=(c.known||0)+1;state.stats.cards=(state.stats.cards||0)+1;state.stats.daily ||= {};const day=localDay();state.stats.daily[day] ||= {chats:0,tests:0,cards:0,docs:0};state.stats.daily[day].cards=(state.stats.daily[day].cards||0)+1;}
  state.cardIndex=(state.cardIndex+1)%state.cards.length;state.cardRevealed=false;save();renderCards();renderStats();
}
async function generateReferat() {
  const topic=$("#ref-topic").value.trim();if(!topic){toast("Referat mavzusini kiriting.");return;}if(state.busy)return;
  const area=$("#ref-area");state.busy=true;$("#ref-gen").disabled=true;area.innerHTML='<div class="result-card"><span class="loading"><span class="spinner"></span> Referat yozilmoqda…</span></div>';
  try {
    const context=retrieve(topic);
    const prompt=context?`Quyidagi materialdan foydalaning. Faktlar manbaga zid bo‘lmasin; manbada yo‘q joylarda buni taxmin sifatida ko‘rsatmang.\n${context}`:"Yuklangan materialdan mos ma’lumot topilmadi. Umumiy bilim asosida yozing va tekshirish kerak bo‘lgan faktlarni alohida belgilab qo‘ying.";
    const answer=await askAI([{role:"system",content:"O‘zbek tilida sifatli akademik referat yozuvchi yordamchisan. Tuzilma: sarlavha, reja, kirish, 3-5 asosiy bo‘lim, xulosa, foydalanilgan adabiyotlar bo‘yicha tekshirilishi kerak bo‘lgan tavsiyalar. Soxta kitoblar yoki manbalar uydirma. Aniq bilmasang, bibliografiyani tekshirish kerakligini yoz. Mazmunli, lekin keraksiz takrorlarsiz yoz."},{role:"user",content:`Mavzu: ${topic}\n${prompt}`}],{max_tokens:3000,temperature:.4});
    area.innerHTML=`<article class="result-card"><h3>${esc(topic)}</h3><div class="content">${renderInlineMarkdown(answer)}</div><button class="btn btn-secondary" id="download-ref" type="button">Matnni yuklab olish (.txt)</button></article>`;
    $("#download-ref").addEventListener("click",()=>downloadText(`${topic}\n\n${answer}`,`manba-referat-${safeName(topic)}.txt`));
  }catch(e){area.innerHTML=`<div class="result-card">${esc(e.message)}</div>`;toast(e.message);}
  finally{state.busy=false;$("#ref-gen").disabled=false;}
}
async function generateSlides() {
  const topic=$("#sl-topic").value.trim(), count=Number($("#sl-count").value)||8;
  const style=$("#sl-style")?.value||"creative", audience=$("#sl-audience")?.value||"Umumiy auditoriya";
  if(!topic){toast("Slayd mavzusini kiriting.");return;}if(state.busy)return;
  const area=$("#sl-area");state.busy=true;$("#sl-gen").disabled=true;
  area.innerHTML='<div class="result-card"><span class="loading"><span class="spinner"></span> Vizual taqdimot tayyorlanmoqda…</span></div>';
  try {
    const context=retrieve(topic);
    const raw=await askAI([{role:"system",content:`Faqat JSON qaytaring: {"slides":[{"title":"...","bullets":["...","..."],"speaker_notes":"...","visual":"diagramma yoki tasvir g‘oyasi"}]}. Aynan ${count} ta slayd. Birinchi slayd kuchli sarlavha va qisqa subtitr, oxirgisi xulosa va asosiy fikr. Har slaydda 2-4 ixcham punkt, har punkt qisqa bo‘lsin. Auditoriya: ${audience}. Dizayn uslubi: ${style}. Turli slaydlarda taqqoslash, bosqichlar, misol, raqamlar yoki diagramma g‘oyalarini aralashtiring. O‘zbek tilida. Haqiqiy bo‘lmagan statistikani uydirmang.`},{role:"user",content:`Mavzu: ${topic}\nMaterial:\n${context||"Mos yuklangan material topilmadi; umumiy bilimlardan foydalaning va tekshirilishi kerak bo‘lgan faktlarni bildiring."}`}],{max_tokens:3200,temperature:.4});
    const data=parseJSON(raw);if(!Array.isArray(data.slides)||data.slides.length<3)throw new Error("Slaydlar formati noto‘g‘ri.");
    const slides=data.slides.slice(0,count).map(s=>({title:String(s.title||"Slayd"),bullets:Array.isArray(s.bullets)?s.bullets.map(String).slice(0,5):[],speaker_notes:String(s.speaker_notes||""),visual:String(s.visual||"")}));
    window.manbaCurrentSlides={topic,slides,style,audience};
    area.innerHTML=`<div class="result-card slide-result"><div class="slide-result-head"><div><p class="eyebrow">TAQDIMOT TAYYOR</p><h3>${esc(topic)}</h3><p class="muted small">${slides.length} slayd · ${esc(audience)} · ${esc(styleLabel(style))}</p></div><span class="slide-count-badge">${slides.length} ta</span></div><div class="slide-preview-grid">${slides.map((s,i)=>`<article class="visual-slide slide-theme-${i%4}"><div class="visual-slide-top"><span>MANBA / ${String(i+1).padStart(2,"0")}</span><span>● ● ●</span></div><div class="visual-slide-content"><p class="visual-slide-kicker">${i===0?"TAQDIMOT":i===slides.length-1?"YAKUNIY XULOSA":"ASOSIY G‘OYA"}</p><h4>${esc(s.title)}</h4>${s.bullets.length?`<ul>${s.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}</div><div class="visual-slide-footer"><span>${esc(topic.slice(0,36))}</span><strong>${String(i+1).padStart(2,"0")}</strong></div></article>`).join("")}</div><div class="button-row slide-export-actions"><button class="btn btn-primary" id="export-pptx" type="button">↓ PowerPoint (.pptx)</button><button class="btn btn-secondary" id="export-pdf" type="button">↓ PDF</button><button class="btn btn-quiet" id="download-slides" type="button">Matn (.txt)</button></div><p class="muted small">Eksport kutubxonalari internet orqali yuklanadi. Slaydlar matni tahrirlanmagan holda eksport qilinadi; vizual shablonlar eksport fayliga qo‘llanadi.</p><div class="speaker-notes-list">${slides.map((s,i)=>s.speaker_notes?`<details><summary>${i+1}-slayd — ma’ruzachi izohi</summary><p>${esc(s.speaker_notes)}</p></details>`:"").join("")}</div></div>`;
    $("#download-slides").addEventListener("click",()=>downloadText(`${topic}\n\n`+slides.map((s,i)=>`SLAYD ${i+1}: ${s.title}\n${s.bullets.map(b=>"• "+b).join("\n")}\n\nVizual g‘oya: ${s.visual}\nMa’ruzachi izohi: ${s.speaker_notes}`).join("\n\n"),`manba-slayd-${safeName(topic)}.txt`));
    $("#export-pptx").addEventListener("click",()=>exportSlidesPptx(window.manbaCurrentSlides));
    $("#export-pdf").addEventListener("click",()=>exportSlidesPdf(window.manbaCurrentSlides));
  }catch(e){area.innerHTML=`<div class="result-card"><p>${esc(e.message||"Slaydlar yaratilmadi.")}</p><button class="btn btn-secondary" type="button" id="retry-slides">Qayta urinish</button></div>`;$("#retry-slides")?.addEventListener("click",generateSlides);toast(e.message||"Xatolik yuz berdi.");}
  finally{state.busy=false;$("#sl-gen").disabled=false;}
}
function styleLabel(style){return ({creative:"Kreativ va vizual",minimal:"Minimal va zamonaviy",academic:"Akademik"})[style]||"Kreativ va vizual";}
async function exportSlidesPptx(deck){
  if(!deck)return toast("Avval slayd yarating.");if(!window.pptxgen)return toast("PowerPoint eksport kutubxonasi yuklanmadi. Internetni tekshiring.");
  try{const pptx=new pptxgen();pptx.layout="LAYOUT_WIDE";pptx.author="Manba AI";pptx.subject=deck.topic;pptx.title=deck.topic;pptx.company="Manba AI";pptx.lang="uz-UZ";
    const palettes=[{bg:"10172A",accent:"62E6BF",text:"F4F7FF"},{bg:"18213A",accent:"80A8FF",text:"F4F7FF"},{bg:"21163D",accent:"D8A7FF",text:"FFFFFF"},{bg:"102C35",accent:"F4C76B",text:"FFFFFF"}];
    deck.slides.forEach((s,i)=>{const c=palettes[i%palettes.length],slide=pptx.addSlide();slide.background={color:c.bg};slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:.18,h:7.5,fill:{color:c.accent},line:{color:c.accent}});slide.addText(`MANBA AI  /  ${String(i+1).padStart(2,"0")}`,{x:.6,y:.35,w:5,h:.25,fontFace:"Aptos",fontSize:10,bold:true,color:c.accent,charSpacing:1});slide.addText(s.title,{x:.65,y:.95,w:11.8,h:1.05,fontFace:"Aptos Display",fontSize:i===0?34:29,bold:true,color:c.text,breakLine:false,fit:"shrink"});
      const bullets=s.bullets||[];if(bullets.length)slide.addText(bullets.map(t=>({text:t,options:{bullet:{indent:18},hanging:4,breakLine:true}})),{x:.85,y:2.25,w:10.9,h:3.7,fontFace:"Aptos",fontSize:21,color:c.text,paraSpaceAfterPt:16,breakLine:false,fit:"shrink",margin:.08,bullet:{indent:18}});
      if(s.visual)slide.addText(`VIZUAL G‘OYA  ·  ${s.visual}`,{x:.8,y:6.35,w:10.8,h:.42,fontSize:10,color:c.accent,italic:true,fit:"shrink"});slide.addText(`${deck.topic}   •   ${i+1} / ${deck.slides.length}`,{x:.8,y:7.05,w:11,h:.2,fontSize:9,color:"AAB6CF"});if(s.speaker_notes)slide.addNotes(s.speaker_notes);
    });await pptx.writeFile({fileName:`manba-${safeName(deck.topic)}.pptx`});toast("PowerPoint fayli tayyorlandi.");
  }catch(e){console.error(e);toast("PPTX eksportida xatolik: "+(e.message||"qayta urinib ko‘ring"));}
}
async function exportSlidesPdf(deck){
  if(!deck)return toast("Avval slayd yarating.");const JsPDF=window.jspdf?.jsPDF;if(!JsPDF)return toast("PDF eksport kutubxonasi yuklanmadi. Internetni tekshiring.");
  try{const doc=new JsPDF({orientation:"landscape",unit:"mm",format:"a4"});const palettes=[[16,23,42],[24,33,58],[33,22,61],[16,44,53]],accents=[[98,230,191],[128,168,255],[216,167,255],[244,199,107]];
    deck.slides.forEach((s,i)=>{if(i)doc.addPage();const c=palettes[i%4],a=accents[i%4];doc.setFillColor(...c);doc.rect(0,0,297,210,"F");doc.setFillColor(...a);doc.rect(0,0,4,210,"F");doc.setTextColor(...a);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(`MANBA AI  /  ${String(i+1).padStart(2,"0")}`,16,16);doc.setTextColor(255,255,255);doc.setFontSize(i===0?27:23);const title=doc.splitTextToSize(s.title,255);doc.text(title,17,35);let y=53+Math.max(0,title.length-1)*10;doc.setFont("helvetica","normal");doc.setFontSize(17);(s.bullets||[]).forEach(b=>{const lines=doc.splitTextToSize("•  "+b,250);if(y+lines.length*8>178)return;doc.text(lines,20,y);y+=lines.length*8+7;});if(s.visual){doc.setTextColor(...a);doc.setFontSize(10);doc.text(doc.splitTextToSize("VIZUAL G‘OYA: "+s.visual,250),17,190);}doc.setTextColor(190,200,220);doc.setFontSize(9);doc.text(`${deck.topic}  •  ${i+1}/${deck.slides.length}`,17,202);});doc.save(`manba-${safeName(deck.topic)}.pdf`);toast("PDF fayli tayyorlandi.");
  }catch(e){console.error(e);toast("PDF eksportida xatolik: "+(e.message||"qayta urinib ko‘ring"));}
}
function safeName(s){return String(s).toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,60)||"manba";}
function downloadText(text,filename) {
  const blob=new Blob(["\ufeff",text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderStats() {
  const area=$("#stats-area");if(!area)return;
  const stats=state.stats;const data=[["Suhbatlar",stats.chats||0],["Testlar",stats.tests||0],["Kartalar",stats.cards||0],["Manbalar",stats.docs||0]];
  area.innerHTML=data.map(([label,n])=>`<div class="stat-card"><div class="stat-number">${Number(n).toLocaleString("uz-UZ")}</div><div class="stat-label">${label}</div></div>`).join("");
  const chart=$("#weekly-chart");if(!chart)return;
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=localDay(d);const val=stats.daily?.[key]||{};days.push({key,label:["Ya","Du","Se","Cho","Pa","Ju","Sha"][d.getDay()],n:(val.chats||0)+(val.tests||0)+(val.cards||0)+(val.docs||0)});}
  const max=Math.max(1,...days.map(d=>d.n));
  chart.innerHTML=days.map(d=>`<div class="day-column"><span class="muted small">${d.n||""}</span><div class="bar-track"><div class="bar-fill" style="height:${Math.max(d.n?5:0,d.n/max*100)}%"></div></div><small>${d.label}</small></div>`).join("");
}
function setTheme(theme) {
  document.documentElement.dataset.theme=theme;localStorage.setItem("manba.theme",theme);
  $("#theme-btn").textContent=theme==="dark"?"☼":"☾";
  const meta=$('meta[name="theme-color"]');if(meta)meta.content=theme==="dark"?"#070b16":"#f2f6fb";
}
function initTheme() {
  let theme=localStorage.getItem("manba.theme");if(!["dark","light"].includes(theme))theme="dark";setTheme(theme);
  $("#theme-btn").addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
}
function updateConnection() {
  const el=$("#connection-status"),online=navigator.onLine;el.classList.toggle("online",online);el.classList.toggle("offline",!online);
  el.querySelector("span").textContent=online?"Internet bor":"Oflayn rejim";
}
function setupPWA() {
  if("serviceWorker" in navigator && location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").then(()=>console.info("Manba service worker tayyor")).catch(e=>console.warn("Service worker ro‘yxatdan o‘tmadi:",e));
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;$("#install-btn").classList.remove("hidden");});
  $("#install-btn").addEventListener("click",async()=>{if(!state.installPrompt){toast("Brauzer menyusidan “Ilovani o‘rnatish”ni tanlang.");return;}state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$("#install-btn").classList.add("hidden");});
}
function bindEvents() {
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>showTab(tab.dataset.tab)));
  $$("[data-home]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();showTab("chat");window.scrollTo({top:0,behavior:"smooth"});}));
  $("#chat-form").addEventListener("submit",e=>{e.preventDefault();sendChat();});
  $("#chat-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}});
  $("#chat-clear").addEventListener("click",()=>{state.chat=[];save();renderChat();toast("Suhbat tozalandi.");});
  const input=$("#file-input"),drop=$("#dropzone");
  input.addEventListener("change",()=>{addFiles(input.files);input.value="";});
  ["dragenter","dragover"].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add("dragover");}));
  ["dragleave","drop"].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove("dragover");}));
  drop.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
  drop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();input.click();}});
  $("#source-list").addEventListener("click",e=>{const btn=e.target.closest("[data-remove-source]");if(!btn)return;state.sources=state.sources.filter(s=>s.id!==btn.dataset.removeSource);save();renderSources();toast("Manba o‘chirildi.");});
  $("#clear-sources").addEventListener("click",()=>{if(!state.sources.length)return;state.sources=[];save();renderSources();toast("Barcha manbalar o‘chirildi.");});
  $("#test-gen").addEventListener("click",generateTest);
  $("#test-area").addEventListener("change",e=>{if(e.target.matches('input[type="radio"]'))state.testAnswers[Number(e.target.name.slice(1))]=Number(e.target.value);});
  $("#test-area").addEventListener("click",e=>{if(e.target.id==="check-test")checkTest();});
  $("#cards-gen").addEventListener("click",generateCards);
  $("#cards-reset").addEventListener("click",()=>{state.cards.forEach(c=>{c.known=0;c.seen=0;});state.cardIndex=0;state.cardRevealed=false;save();renderCards();toast("Karta progressi tiklandi.");});
  $("#cards-area").addEventListener("click",e=>{if(e.target.closest("#flashcard")||e.target.id==="card-reveal"){state.cardRevealed=true;renderCards();}else if(e.target.id==="card-known")nextCard(true);else if(e.target.id==="card-again")nextCard(false);else if(e.target.id==="card-next")nextCard(false);});
  $("#cards-area").addEventListener("keydown",e=>{if(e.target.id==="flashcard"&&(e.key==="Enter"||e.key===" ")){e.preventDefault();state.cardRevealed=true;renderCards();}});
  $("#ref-gen").addEventListener("click",generateReferat);$("#sl-gen").addEventListener("click",generateSlides);
  $("#stats-reset").addEventListener("click",()=>{if(confirm("Statistikani tiklashni xohlaysizmi?")){state.stats={chats:0,tests:0,cards:0,docs:0,daily:{}};save();renderStats();toast("Statistika tiklandi.");}});
  window.addEventListener("online",updateConnection);window.addEventListener("offline",updateConnection);
}
function init() {
  load();initTheme();bindEvents();setupPWA();updateConnection();renderSources();renderChat();renderCards();renderStats();
  if(window.pdfjsLib)window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  console.info("Manba ishga tushdi.");
}
document.addEventListener("DOMContentLoaded",init);
})();