"use strict";

/* =========================================
   MANBA — 1-QISM
   Ma'lumotlar, navigatsiya, manbalar,
   sozlamalar va zaxira nusxasi
========================================= */

const STORAGE_KEY = "manba_v2";

const DEFAULT_STATE = {
  sources: [],
  quizzes: [],
  flashcards: [],
  studyMinutes: 0,
  goal: "",
  settings: {
    apiKey: "",
    model: "openai/gpt-4o-mini",
    accent: "violet",
    theme: "dark"
  },
  quizResults: 0
};

function newDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return newDefaultState();

    const saved = JSON.parse(raw);

    return {
      ...newDefaultState(),
      ...saved,
      sources: Array.isArray(saved.sources) ? saved.sources : [],
      quizzes: Array.isArray(saved.quizzes) ? saved.quizzes : [],
      flashcards: Array.isArray(saved.flashcards) ? saved.flashcards : [],
      settings: {
        ...DEFAULT_STATE.settings,
        ...(saved.settings || {})
      }
    };
  } catch (error) {
    console.error("MANBA ma'lumotlarini o'qib bo'lmadi:", error);
    return newDefaultState();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Saqlash xatosi:", error);
    toast("Saqlash amalga oshmadi. Xotira to'lgan bo'lishi mumkin.");
    return false;
  }
}

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(value ?? "").replace(/[&<>"']/g, ch => entities[ch]);
}

function byId(id) {
  return document.getElementById(id);
}

function toast(message) {
  const element = byId("toast");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timeout);

  toast.timeout = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

/* =========================================
   SAHIFALAR VA NAVIGATSIYA
========================================= */

function showPage(pageId) {
  const target = byId(pageId);

  if (!target || !target.classList.contains("page")) {
    pageId = "home";
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll("[data-go]").forEach(button => {
    const selected = button.dataset.go === pageId;

    if (button.closest("nav")) {
      button.classList.toggle("active", selected);
      button.setAttribute("aria-current", selected ? "page" : "false");
    }
  });

  try {
    history.replaceState(null, "", "#" + pageId);
  } catch (_) {}

  if (pageId === "home") renderDashboard();
  if (pageId === "library") renderSources();
  if (pageId === "stats") renderStats();
  if (pageId === "settings") loadSettingsForm();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initNavigation() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (!button) return;

    event.preventDefault();
    showPage(button.dataset.go);
  });

  const initial = location.hash.slice(1);
  showPage(byId(initial)?.classList.contains("page") ? initial : "home");
}

/* =========================================
   BOSH SAHIFA VA STATISTIKA
========================================= */

function updateCounters() {
  if (byId("nSources")) {
    byId("nSources").textContent = state.sources.length;
  }

  if (byId("nCards")) {
    byId("nCards").textContent = state.flashcards.length;
  }

  if (byId("nMinutes")) {
    byId("nMinutes").textContent = Number(state.studyMinutes) || 0;
  }

  if (byId("minutesStats")) {
    byId("minutesStats").textContent = Number(state.studyMinutes) || 0;
  }

  if (byId("quizStats")) {
    byId("quizStats").textContent = Number(state.quizResults) || 0;
  }
}

function renderDashboard() {
  updateCounters();
}

/* =========================================
   MANBALAR KUTUBXONASI
========================================= */

function renderSources() {
  const list = byId("sourceList");
  if (!list) return;

  if (!state.sources.length) {
    list.innerHTML = "<p>Hozircha manbalar yo'q. Birinchi manbangizni qo'shing.</p>";
    updateCounters();
    return;
  }

  list.innerHTML = state.sources.map(source => 
    <article class="source-item">
      <h3>${escapeHTML(source.title)}</h3>
      <p>${escapeHTML(source.note || "Izoh kiritilmagan.")}</p>
      ${source.fileName
        ? <p>Biriktirilgan fayl: ${escapeHTML(source.fileName)}</p>
        : ""}
      <small>${escapeHTML(source.date || "")}</small>
      <div>
        <button type="button" data-source-delete="${escapeHTML(source.id)}">
          O'chirish
        </button>
      </div>
    </article>
  ).join("");

  updateCounters();
}

function initSourceForm() {
  const form = byId("sourceForm");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = byId("sourceTitle").value.trim();
    const note = byId("sourceNote").value.trim();
    const fileInput = byId("sourceFile");
    const file = fileInput?.files?.[0] || null;

    if (!title) {
      toast("Manba nomini kiriting.");
      return;
    }

    if (file && file.size > 1024 * 1024) {
      toast("Fayl hajmi 1 MB dan oshmasligi kerak.");
      return;
    }

    let fileData = "";

    if (file) {
      try {
        fileData = await readFileAsDataURL(file);
      } catch (error) {
        toast("Faylni o'qib bo'lmadi.");
        return;
      }
    }

    state.sources.unshift({
      id: makeId(),
      title,
      note,
      fileName: file ? file.name : "",
      fileType: file ? file.type : "",
      fileData,
      date: new Date().toLocaleDateString("uz-UZ")
    });

    if (saveState()) {
      form.reset();
      renderSources();
      updateCounters();
      toast("Manba saqlandi!");
    }
  });

  const list = byId("sourceList");

  list?.addEventListener("click", event => {
    const button = event.target.closest("[data-source-delete]");
    if (!button) return;

    const id = button.dataset.sourceDelete;

    if (!confirm("Ushbu manbani o'chirmoqchimisiz?")) return;

    state.sources = state.sources.filter(source => source.id !== id);

    if (saveState()) {
      renderSources();
      toast("Manba o'chirildi.");
    }
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

/* =========================================
   MAQSADNI SAQLASH
========================================= */

function initGoalForm() {
  const form = byId("goalForm");
  if (!form) return;

  const input = byId("goal");
  const output = byId("goalText");

  if (input) input.value = state.goal || "";
  if (output && state.goal) {
    output.textContent = "Bugungi maqsad: " + state.goal;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    state.goal = input.value.trim();

    if (saveState()) {
      if (output) {
        output.textContent = state.goal
          ? "Bugungi maqsad: " + state.goal
          : "Maqsad hali belgilanmagan.";
      }

      toast("Maqsad saqlandi!");
    }
  });
}

/* =========================================
   MAVZU VA RANG SOZLAMALARI
========================================= */

function applySettings() {
  document.body.classList.toggle(
    "light",
    state.settings.theme === "light"
  );

  document.body.classList.toggle(
    "accent-blue",
    state.settings.accent === "blue"
  );

  document.body.classList.toggle(
    "accent-green",
    state.settings.accent === "green"
  );
}

function loadSettingsForm() {
  const key = byId("apiKey");
  const model = byId("model");
  const accent = byId("accent");

  if (key) key.value = state.settings.apiKey || "";
  if (model) model.value =
    state.settings.model || "openai/gpt-4o-mini";
  if (accent) accent.value = state.settings.accent || "violet";
}

function initSettings() {
  loadSettingsForm();

  byId("saveSettings")?.addEventListener("click", () => {
    state.settings.apiKey = byId("apiKey")?.value.trim() || "";
    state.settings.model =
      byId("model")?.value.trim() || "openai/gpt-4o-mini";
    state.settings.accent = byId("accent")?.value || "violet";

    if (saveState()) {
      applySettings();
      toast("Sozlamalar saqlandi!");
    }
  });

  byId("theme")?.addEventListener("click", () => {
    state.settings.theme =
      state.settings.theme === "light" ? "dark" : "light";

    applySettings();
    saveState();

    toast(
      state.settings.theme === "light"
        ? "Yorug' mavzu yoqildi."
        : "Qorong'i mavzu yoqildi."
    );
  });
}

/* =========================================
   ZAXIRA NUSXASI
========================================= */

function exportBackup() {
  const blob = new Blob(
    [JSON.stringify(state, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "manba-zaxira.json";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast("Zaxira nusxasi tayyorlandi.");
}

function initBackup() {
  byId("export")?.addEventListener("click", exportBackup);

  byId("import")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("Zaxira fayli 5 MB dan katta.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);

        if (!imported  typeof imported !== "object" 
            Array.isArray(imported)) {
          throw new Error("Noto'g'ri zaxira fayli");
        }

        if (!confirm("Hozirgi ma'lumotlar zaxira bilan almashtirilsinmi?")) {
          return;
        }

        state = {
          ...newDefaultState(),
          ...imported,
          sources: Array.isArray(imported.sources) ? imported.sources : [],
          quizzes: Array.isArray(imported.quizzes) ? imported.quizzes : [],
          flashcards: Array.isArray(imported.flashcards)
            ? imported.flashcards : [],
          settings: {
            ...DEFAULT_STATE.settings,
            ...(imported.settings || {})
          }
        };

        if (saveState()) {
          applySettings();
          updateCounters();
          renderSources();
          toast("Zaxira nusxasi tiklandi.");
        }
      } catch (_) {
        toast("Zaxira fayli noto'g'ri yoki buzilgan.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  });

  byId("reset")?.addEventListener("click", () => {
    if (!confirm("Barcha MANBA ma'lumotlari o'chirilsinmi?")) {
      return;
    }

    state = newDefaultState();

    if (saveState()) {
      applySettings();
      updateCounters();
      renderSources();
      loadSettingsForm();
      toast("Ma'lumotlar tozalandi.");
    }
  });
}
/* =========================================
   MANBA — 2-QISM
   AI, testlar, flashkartalar va taymer
========================================= */

/* =========================================
   AI YORDAMCHI
========================================= */

function initAI() {
  const form = byId("chatForm");
  const input = byId("chatInput");
  const messages = byId("chatMessages");

  if (!form  !input  !messages) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    const apiKey = state.settings.apiKey;
    const model = state.settings.model;

    if (!apiKey) {
      toast("Avval Sozlamalardan API kalitini kiriting.");
      return;
    }

    const userMessage = document.createElement("div");
    userMessage.className = "source-item";
    userMessage.textContent = "Siz: " + question;
    messages.appendChild(userMessage);

    input.value = "";

    const answer = document.createElement("div");
    answer.className = "source-item";
    answer.textContent = "AI javob tayyorlamoqda...";
    messages.appendChild(answer);

    const sendButton = form.querySelector('button[type="submit"], button');
    if (sendButton) sendButton.disabled = true;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "Sen MANBA ta'lim ilovasining yordamchisisan. O'zbek tilida tushunarli va foydali javob ber."
              },
              {
                role: "user",
                content: question
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "API so'rovida xatolik."
        );
      }

      answer.textContent =
        "AI: " +
        (data.choices?.[0]?.message?.content || "Javob olinmadi.");
    } catch (error) {
      answer.textContent =
        "Xatolik: " + error.message +
        ". Internet, API kaliti va modelni tekshiring.";
    } finally {
      if (sendButton) sendButton.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  });
}

/* =========================================
   TESTLAR
========================================= */

function initQuizzes() {
  const form = byId("quizForm");
  const list = byId("quizList");

  if (!form || !list) return;

  function renderQuizList() {
    if (!state.quizzes.length) {
      list.innerHTML = "<p>Hali test savollari yo'q.</p>";
      return;
    }

    list.innerHTML = state.quizzes.map((quiz, index) => 
      <article class="quiz-item">
        <h3>${index + 1}. ${escapeHTML(quiz.question)}</h3>

        ${quiz.options.map((option, i) => 
          <p>${String.fromCharCode(65 + i)}.
            ${escapeHTML(option)}</p>
        ).join("")}

        <button type="button" data-play-quiz="${escapeHTML(quiz.id)}">
          Testni ishlash
        </button>

        <button type="button" data-delete-quiz="${escapeHTML(quiz.id)}">
          O'chirish
        </button>

        <div id="quiz-answer-${escapeHTML(quiz.id)}"></div>
      </article>
    ).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const question = byId("question").value.trim();
    const fields = $$(".opt", form);
    const options = fields.map(field => field.value.trim());
    const correct = Number(byId("correct").value);

    if (!question  !options[0]  !options[1]) {
      toast("Savol, A va B variantlarini kiriting.");
      return;
    }

    // Bo'sh C/D variantlari sababli javob indekslari siljimasin.
    if (!options[correct]) {
      toast("Tanlangan to'g'ri javob variantini to'ldiring.");
      return;
    }

    state.quizzes.push({
      id: makeId(),
      question,
      options,
      correct
    });

    if (saveState()) {
      form.reset();
      renderQuizList();
      toast("Test savoli qo'shildi!");
    }
  });

  list.addEventListener("click", event => {
    const play = event.target.closest("[data-play-quiz]");
    const remove = event.target.closest("[data-delete-quiz]");

    if (remove) {
      state.quizzes = state.quizzes.filter(
        quiz => quiz.id !== remove.dataset.deleteQuiz
      );

      if (saveState()) {
        renderQuizList();
        updateCounters();
        toast("Test o'chirildi.");
      }

      return;
    }

    if (!play) return;

    const quiz = state.quizzes.find(
      item => item.id === play.dataset.playQuiz
    );

    if (!quiz) return;

    const answerBox = byId("quiz-answer-" + quiz.id);
    if (!answerBox) return;

    answerBox.innerHTML = 
      <form data-answer-form="${escapeHTML(quiz.id)}">
        <label>Javobingizni tanlang
          <select name="answer" required>
            <option value="">Tanlang</option>
            ${quiz.options.map((option, i) => 
              <option value="${i}">
                ${String.fromCharCode(65 + i)} — ${escapeHTML(option)}
              </option>
            ).join("")}
          </select>
        </label>
        <button type="submit">Tekshirish</button>
      </form>
      <p data-result></p>
    ;
  });

  list.addEventListener("submit", event => {
    const formElement = event.target.closest("[data-answer-form]");
    if (!formElement) return;

    event.preventDefault();

    const id = formElement.dataset.answerForm;
    const quiz = state.quizzes.find(item => item.id === id);
    if (!quiz) return;

    const selected = Number(new FormData(formElement).get("answer"));
    const result = formElement.parentElement.querySelector("[data-result]");

    if (!Number.isInteger(selected) ||
        !quiz.options[selected]) {
      result.textContent = "Javobni tanlang.";
      return;
    }

    if (selected === quiz.correct) {
      result.textContent = "To'g'ri javob! Barakalla!";
      state.quizResults = (Number(state.quizResults) || 0) + 1;
      saveState();
      updateCounters();
    } else {
      result.textContent =
        "Noto'g'ri. To'g'ri javob: " +
        String.fromCharCode(65 + quiz.correct);
    }
  });

  renderQuizList();
}

/* =========================================
   FLASHKARTALAR
========================================= */

let currentFlashcard = 0;
let flashRevealed = false;

function initFlashcards() {
  const form = byId("flashForm");
  const list = byId("flashList");
  const study = byId("flashStudy");

  if (!form || !list) return;

  function renderCards() {
    if (!state.flashcards.length) {
      list.innerHTML = "<p>Hali flash-kartalar yo'q.</p>";
      if (study) study.hidden = true;
      updateCounters();
      return;
    }

    currentFlashcard = Math.min(
      currentFlashcard,
      state.flashcards.length - 1
    );

    list.innerHTML = state.flashcards.map((card, index) => 
      <article class="flash-item">
        <h3>${index + 1}. ${escapeHTML(card.front)}</h3>
        <details>
          <summary>Javobni ko'rish</summary>
          <p>${escapeHTML(card.back)}</p>
        </details>
        <button type="button" data-delete-card="${escapeHTML(card.id)}">
          O'chirish
        </button>
      </article>
    ).join("");

    if (study) study.hidden = false;
    renderStudyCard();
    updateCounters();
  }

  function renderStudyCard() {
    const button = byId("flashCard");
    if (!button || !state.flashcards.length) return;

    const card = state.flashcards[currentFlashcard];
    button.textContent = flashRevealed
      ? card.back
      : card.front;

    button.setAttribute("aria-label", "Kartani aylantirish");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const front = byId("front").value.trim();
    const back = byId("back").value.trim();

    if (!front || !back) {
      toast("Savol va javobni to'ldiring.");
      return;
    }
state.flashcards.push({
      id: makeId(),
      front,
      back
    });

    if (saveState()) {
      form.reset();
      currentFlashcard = state.flashcards.length - 1;
      flashRevealed = false;
      renderCards();
      toast("Flash-karta qo'shildi!");
    }
  });

  byId("flashCard")?.addEventListener("click", () => {
    if (!state.flashcards.length) return;
    flashRevealed = !flashRevealed;
    renderStudyCard();
  });

  byId("nextCard")?.addEventListener("click", () => {
    if (!state.flashcards.length) return;

    currentFlashcard =
      (currentFlashcard + 1) % state.flashcards.length;

    flashRevealed = false;
    renderStudyCard();
  });

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-card]");
    if (!button) return;

    state.flashcards = state.flashcards.filter(
      card => card.id !== button.dataset.deleteCard
    );

    currentFlashcard = 0;
    flashRevealed = false;

    if (saveState()) {
      renderCards();
      toast("Flash-karta o'chirildi.");
    }
  });

  renderCards();
}

/* =========================================
   POMODORO TAYMER
========================================= */

let timerInterval = null;
let timerRemaining = 25 * 60;
let timerMode = "study";
let timerEndAt = 0;

function formatTimer(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return String(min).padStart(2, "0") +
    ":" + String(sec).padStart(2, "0");
}

function displayTimer() {
  const element = byId("timer");
  if (element) {
    element.textContent = formatTimer(timerRemaining);
  }
}

function stopTimerInterval() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
  }

  timerInterval = null;
  timerEndAt = 0;
}

function startTimer() {
  if (timerInterval !== null) return;

  timerEndAt = Date.now() + timerRemaining * 1000;

  timerInterval = setInterval(() => {
    timerRemaining = Math.max(
      0,
      Math.ceil((timerEndAt - Date.now()) / 1000)
    );

    displayTimer();

    if (timerRemaining <= 0) {
      stopTimerInterval();

      if (timerMode === "study") {
        state.studyMinutes =
          (Number(state.studyMinutes) || 0) + 25;

        saveState();
        updateCounters();
      }

      toast(
        timerMode === "study"
          ? "O'qish tugadi! Biroz tanaffus qiling."
          : "Tanaffus tugadi! O'qishni davom ettiring."
      );
    }
  }, 250);
}

function resetTimer(mode = "study") {
  stopTimerInterval();

  timerMode = mode;
  timerRemaining = mode === "break" ? 5 * 60 : 25 * 60;

  displayTimer();
}

function initTimer() {
  byId("timerStart")?.addEventListener("click", startTimer);

  byId("timerReset")?.addEventListener("click", () => {
    resetTimer("study");
  });

  byId("timerBreak")?.addEventListener("click", () => {
    resetTimer("break");
    toast("5 daqiqalik tanaffus tayyor.");
  });

  displayTimer();
}

/* =========================================
   ILOVANI ISHGA TUSHIRISH
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  initNavigation();
  initSourceForm();
  initGoalForm();
  initSettings();
  initBackup();
  initAI();
  initQuizzes();
  initFlashcards();
  initTimer();

  renderDashboard();
  updateCounters();

  // Service Worker faqat HTTPS orqali ro'yxatdan o'tadi.
  if ("serviceWorker" in navigator &&
      location.protocol === "https:") {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.warn("Service Worker xatosi:", error);
      });
  }
});
