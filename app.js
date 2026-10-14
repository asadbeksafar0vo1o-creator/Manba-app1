"use strict";

/* =========================================
   MANBA — TA'LIM ILOVASI
   Asosiy boshqaruv va ma'lumotlar
========================================= */

const MANBA_KEY = "manba_v2";

const DEFAULT_STATE = {
  notes: [],
  flashcards: [],
  quizzes: [],
  settings: {
    theme: "light",
    accent: "#4f46e5",
    apiKey: "",
    model: "openai/gpt-4o-mini"
  },
  studyMinutes: 0,
  completedTasks: []
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const raw = localStorage.getItem(MANBA_KEY);

    if (!raw) return cloneDefaultState();

    const saved = JSON.parse(raw);

    return {
      ...cloneDefaultState(),
      ...saved,
      notes: Array.isArray(saved.notes) ? saved.notes : [],
      flashcards: Array.isArray(saved.flashcards)
        ? saved.flashcards : [],
      quizzes: Array.isArray(saved.quizzes)
        ? saved.quizzes : [],
      completedTasks: Array.isArray(saved.completedTasks)
        ? saved.completedTasks : [],
      settings: {
        ...DEFAULT_STATE.settings,
        ...(saved.settings || {})
      }
    };
  } catch (error) {
    console.error("Ma'lumotlarni yuklash xatosi:", error);
    return cloneDefaultState();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(MANBA_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Saqlash xatosi:", error);
    showMessage("Ma'lumotlarni saqlash imkonsiz!");
    return false;
  }
}

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  const chars = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(value ?? "").replace(
    /[&<>"']/g,
    char => chars[char]
  );
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function showMessage(message) {
  let toast = $("#manba-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "manba-toast";
    toast.setAttribute("role", "status");

    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      zIndex: "10000",
      padding: "12px 18px",
      borderRadius: "12px",
      background: "#222",
      color: "#fff",
      maxWidth: "90%",
      fontSize: "14px",
      boxShadow: "0 4px 20px #0003"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

/* =========================================
   MAVZULAR VA SAHIFALAR
========================================= */

const PAGE_TITLES = {
  home: "Bosh sahifa",
  notes: "Materiallar",
  ai: "AI yordamchi",
  quiz: "Testlar",
  cards: "Flashkartalar",
  timer: "Pomodoro taymer",
  settings: "Sozlamalar"
};

function getMainContainer() {
  return $("#app-content") ||
    $("#main-content") ||
    $("#content") ||
    $("main");
}

function navigateTo(page) {
  if (!PAGE_TITLES[page]) {
    page = "home";
  }

  $$(".nav-link, [data-page]").forEach(element => {
    const target = element.dataset.page ||
      element.dataset.target;

    element.classList.toggle(
      "active",
      target === page
    );
  });

  const container = getMainContainer();

  if (container) {
    container.dataset.currentPage = page;
    renderPage(page);
  }

  try {
    history.replaceState(null, "", "#" + page);
  } catch (_) {
    // Ayrim brauzerlarda tarix yangilanmasligi mumkin.
  }
}

function bindNavigation() {
  document.addEventListener("click", event => {
    const link = event.target.closest(
      "[data-page], [data-target]"
    );

    if (!link) return;

    const page = link.dataset.page ||
      link.dataset.target;

    if (!PAGE_TITLES[page]) return;

    event.preventDefault();
    navigateTo(page);
  });
}

/* =========================================
   SAHIFA CHIZISH
========================================= */

function renderPage(page) {
  switch (page) {
    case "home":
      renderDashboard();
      break;
    case "notes":
      renderNotes();
      break;
    case "ai":
      renderAI();
      break;
    case "quiz":
      renderQuizzes();
      break;
    case "cards":
      renderFlashcards();
      break;
    case "timer":
      renderTimer();
      break;
    case "settings":
      renderSettings();
      break;
    default:
      renderDashboard();
  }
}

function renderDashboard() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = 
    <section class="manba-dashboard">
      <h1>MANBA ga xush kelibsiz!</h1>
      <p>O'rganing, takrorlang va bilimingizni mustahkamlang.</p>

      <div class="manba-stats">
        <article class="manba-stat">
          <h3>${state.notes.length}</h3>
          <p>Materiallar</p>
        </article>

        <article class="manba-stat">
          <h3>${state.quizzes.length}</h3>
          <p>Testlar</p>
        </article>

        <article class="manba-stat">
          <h3>${state.flashcards.length}</h3>
          <p>Flashkartalar</p>
        </article>

        <article class="manba-stat">
          <h3>${Number(state.studyMinutes) || 0}</h3>
          <p>O'qilgan daqiqalar</p>
        </article>
      </div>

      <div class="manba-shortcuts">
        <button data-page="notes">Materiallar</button>
        <button data-page="ai">AI yordamchi</button>
        <button data-page="quiz">Testlar</button>
        <button data-page="cards">Flashkartalar</button>
        <button data-page="timer">Taymer</button>
      </div>
    </section>
  ;
}

/* =========================================
   MATERIAL QO'SHISH VA O'CHIRISH
========================================= */

function renderNotes() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = 
    <section>
      <h1>O'quv materiallari</h1>

      <form id="note-form">
        <label for="note-title">Material nomi</label>
        <input id="note-title" maxlength="150"
          required placeholder="Masalan: Ingliz tili">

        <label for="note-body">Matn yoki qayd</label>
        <textarea id="note-body" maxlength="20000"
          rows="5" placeholder="Material matnini kiriting..."></textarea>

        <button type="submit">Materialni saqlash</button>
      </form>

      <div id="notes-list">
        ${state.notes.length
          ? state.notes.map(note => 
            <article class="manba-note">
              <h3>${escapeHTML(note.title)}</h3>
              <p>${escapeHTML(note.body || "")}</p>
              <button data-delete-note="${escapeHTML(note.id)}">
                O'chirish
              </button>
            </article>
          ).join("")
          : "<p>Hali materiallar yo'q.</p>"
        }
      </div>
    </section>
  ;

  $("#note-form")?.addEventListener("submit", event => {
    event.preventDefault();

    const title = $("#note-title").value.trim();
    const body = $("#note-body").value.trim();

    if (!title) {
      showMessage("Material nomini kiriting.");
      return;
    }

    state.notes.unshift({
      id: makeId(),
      title,
      body,
      createdAt: new Date().toISOString()
    });

    if (saveState()) {
      renderNotes();
      showMessage("Material saqlandi!");
    }
  });

  $("#notes-list")?.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-note]");
    if (!button) return;

    const id = button.dataset.deleteNote;

    state.notes = state.notes.filter(note => note.id !== id);

    if (saveState()) {
      renderNotes();
      showMessage("Material o'chirildi.");
    }
  });
}

/* =========================================
   SOZLAMALAR
========================================= */

function applySettings() {
  document.documentElement.dataset.theme =
    state.settings.theme || "light";

  document.documentElement.style.setProperty(
    "--accent",
    state.settings.accent || "#4f46e5"
  );
}

function renderSettings() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = 
    <section>
      <h1>Sozlamalar</h1>

      <label for="manba-theme">Mavzu</label>
      <select id="manba-theme">
        <option value="light">Yorug'</option>
        <option value="dark">Qorong'i</option>
      </select>

      <label for="manba-accent">Asosiy rang</label>
      <input id="manba-accent" type="color"
        value="${escapeHTML(state.settings.accent || "#4f46e5")}">

      <button id="save-settings">Saqlash</button>
      <hr>

      <button id="export-data">Zaxira nusxa olish</button>

      <label for="import-data">Zaxira nusxani tiklash</label>
      <input id="import-data" type="file" accept=".json,application/json">

      <button id="reset-data">Barcha ma'lumotlarni o'chirish</button>
    </section>
  ;

  $("#manba-theme").value = state.settings.theme || "light";

  $("#save-settings").addEventListener("click", () => {
    state.settings.theme = $("#manba-theme").value;
    state.settings.accent = $("#manba-accent").value;

    if (saveState()) {
      applySettings();
      showMessage("Sozlamalar saqlandi.");
    }
  });

  $("#export-data").addEventListener("click", exportBackup);

  $("#import-data").addEventListener("change", importBackup);

  $("#reset-data").addEventListener("click", () => {
    if (!confirm("Barcha saqlangan ma'lumotlarni o'chiraymi?")) {
      return;
    }

    state = cloneDefaultState();

    if (saveState()) {
      applySettings();
      renderDashboard();
      showMessage("Ma'lumotlar tozalandi.");
    }
  });
}

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
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Fayl hajmi 5 MB dan oshmasligi kerak.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);

      if (!imported  typeof imported !== "object" 
          Array.isArray(imported)) {
        throw new Error("Noto'g'ri format");
      }

      if (!confirm("Joriy ma'lumotlar zaxira nusxa bilan almashtirilsinmi?")) {
        return;
      }

      state = {
        ...cloneDefaultState(),
        ...imported,
        settings: {
          ...DEFAULT_STATE.settings,
          ...(imported.settings || {})
        }
      };

      if (saveState()) {
        applySettings();
        renderDashboard();
        showMessage("Zaxira nusxa tiklandi.");
      }
    } catch (error) {
      showMessage("Zaxira fayli noto'g'ri yoki buzilgan.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}
/* =========================================
   AI YORDAMCHI
========================================= */

function renderAI() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = 
    <section>
      <h1>AI yordamchi</h1>
      <p>AI bilan savol-javob qilish uchun OpenRouter API kalitini kiriting.</p>

      <label for="ai-key">API kaliti</label>
      <input id="ai-key" type="password"
        autocomplete="off" placeholder="API kalitingiz">

      <label for="ai-model">Model</label>
      <input id="ai-model"
        value="${escapeHTML(state.settings.model || "openai/gpt-4o-mini")}">

      <button id="ai-save">Kalit va modelni saqlash</button>

      <div id="ai-messages" aria-live="polite"></div>

      <form id="ai-form">
        <textarea id="ai-question" rows="3"
          maxlength="5000" required
          placeholder="Savolingizni yozing..."></textarea>
        <button id="ai-send" type="submit">Yuborish</button>
      </form>
    </section>
  ;

  $("#ai-key").value = state.settings.apiKey || "";

  $("#ai-save").addEventListener("click", () => {
    state.settings.apiKey = $("#ai-key").value.trim();
    state.settings.model =
      $("#ai-model").value.trim() || "openai/gpt-4o-mini";

    if (saveState()) {
      showMessage("AI sozlamalari saqlandi.");
    }
  });

  $("#ai-form").addEventListener("submit", async event => {
    event.preventDefault();

    const question = $("#ai-question").value.trim();
    if (!question) return;

    const apiKey = $("#ai-key").value.trim();
    const model = $("#ai-model").value.trim();

    if (!apiKey || !model) {
      showMessage("Avval API kaliti va modelni kiriting.");
      return;
    }

    const messages = $("#ai-messages");
    const sendButton = $("#ai-send");

    const userMessage = document.createElement("p");
    userMessage.textContent = "Siz: " + question;
    messages.appendChild(userMessage);

    $("#ai-question").value = "";
    sendButton.disabled = true;
    sendButton.textContent = "Javob tayyorlanmoqda...";

    const answer = document.createElement("p");
    answer.textContent = "AI: Javob kutilmoqda...";
    messages.appendChild(answer);

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
                content: "Sen MANBA ta'lim ilovasining yordamchisisan. O'zbek tilida aniq, tushunarli va foydali javob ber."
              },
              { role: "user", content: question }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "API so'rovi bajarilmadi."
        );
      }

      answer.textContent =
        "AI: " +
        (data.choices?.[0]?.message?.content ||
          "Javob olinmadi.");
    } catch (error) {
      answer.textContent =
        "Xatolik: " + error.message +
        ". Internet, API kaliti va modelni tekshiring.";
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Yuborish";
    }
  });
}

/* =========================================
   TESTLAR
========================================= */

function renderQuizzes() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = `
    <section>
      <h1>Testlar</h1>

      <form id="quiz-form">
        <label for="quiz-question">Savol</label>
        <input id="quiz-question" required maxlength="1000">

        <label for="quiz-a">A varianti</label>
        <input id="quiz-a" required maxlength="500">

        <label for="quiz-b">B varianti</label>
        <input id="quiz-b" required maxlength="500">

        <label for="quiz-c">C varianti</label>
        <input id="quiz-c" required maxlength="500">

        <label for="quiz-d">D varianti</label>
        <input id="quiz-d" required maxlength="500">

        <label for="quiz-correct">To'g'ri javob</label>
        <select id="quiz-correct">
          <option value="0">A</option>
          <option value="1">B</option>
          <option value="2">C</option>
          <option value="3">D</option>
        </select>

        <button type="submit">Test qo'shish</button>
      </form>

      <div id="quiz-list"></div>
      <div id="quiz-play"></div>
    </section>
  ;

  $("#quiz-form").addEventListener("submit", event => {
    event.preventDefault();

    const question = $("#quiz-question").value.trim();
    const options = ["a", "b", "c", "d"].map(letter =>
      $("#quiz-" + letter).value.trim()
    );

    if (!question || options.some(option => !option)) {
      showMessage("Savol va barcha variantlarni to'ldiring.");
      return;
    }

    state.quizzes.push({
      id: makeId(),
      question,
      options,
      correct: Number($("#quiz-correct").value)
    });

    if (saveState()) {
      renderQuizzes();
      showMessage("Test qo'shildi.");
    }
  });

  const list = $("#quiz-list");

  function drawList() {
    list.innerHTML = state.quizzes.length
      ? state.quizzes.map((quiz, index) => 
          <article>
            <p>${index + 1}. ${escapeHTML(quiz.question)}</p>
            <button data-start-quiz="${escapeHTML(quiz.id)}">
              Testni ishlash
            </button>
            <button data-remove-quiz="${escapeHTML(quiz.id)}">
              O'chirish
            </button>
          </article>
        ).join("")
      : "<p>Hali testlar yo'q.</p>";
  }

  drawList();

  list.addEventListener("click", event => {
    const start = event.target.closest("[data-start-quiz]");
    const remove = event.target.closest("[data-remove-quiz]");

    if (remove) {
      state.quizzes = state.quizzes.filter(
        quiz => quiz.id !== remove.dataset.removeQuiz
      );

      if (saveState()) {
        renderQuizzes();
        showMessage("Test o'chirildi.");
      }

      return;
    }

    if (start) {
      playQuiz(start.dataset.startQuiz);
    }
  });
}

function playQuiz(id) {
  const quiz = state.quizzes.find(item => item.id === id);
  const area = $("#quiz-play");

  if (!quiz || !area) return;

  area.innerHTML = 
    <hr>
    <h3>${escapeHTML(quiz.question)}</h3>

    <form id="quiz-answer-form">
      ${quiz.options.map((option, index) => 
        <label>
          <input type="radio" name="quiz-answer"
            value="${index}" required>
          ${String.fromCharCode(65 + index)}.
          ${escapeHTML(option)}
        </label>
        <br>
      ).join("")}

      <button type="submit">Javobni tekshirish</button>
    </form>
    <p id="quiz-result"></p>
  ;

  $("#quiz-answer-form").addEventListener("submit", event => {
    event.preventDefault();

    const selected = Number(
      new FormData(event.currentTarget).get("quiz-answer")
    );

    const result = $("#quiz-result");

    if (selected === quiz.correct) {
      result.textContent = "To'g'ri javob! Barakalla!";
    } else {
      result.textContent =
        "Noto'g'ri. To'g'ri javob: " +
        String.fromCharCode(65 + quiz.correct);
    }
  });

  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================================
   FLASHKARTALAR
========================================= */

function renderFlashcards() {
  const container = getMainContainer();
  if (!container) return;

  container.innerHTML = 
    <section>
      <h1>Flashkartalar</h1>

      <form id="card-form">
        <label for="card-front">Savol yoki atama</label>
        <input id="card-front" required maxlength="1000">

        <label for="card-back">Javob yoki izoh</label>
        <textarea id="card-back" required maxlength="5000"></textarea>

        <button type="submit">Kartochka qo'shish</button>
      </form>

      <div id="cards-list"></div>
    </section>
  `;

  $("#card-form").addEventListener("submit", event => {
    event.preventDefault();

    state.flashcards.push({
      id: makeId(),
      front: $("#card-front").value.trim(),
      back: $("#card-back").value.trim(),
      known: false
    });

    if (saveState()) {
      renderFlashcards();
      showMessage("Kartochka saqlandi.");
    }
  });

  const list = $("#cards-list");

  function drawCards() {
    list.innerHTML = state.flashcards.length
      ? state.flashcards.map((card, index) => 
        <article class="manba-card">
          <h3>Kartochka ${index + 1}</h3>
          <p><strong>Savol:</strong> ${escapeHTML(card.front)}</p>
          <details>
            <summary>Javobni ko'rish</summary>
            <p>${escapeHTML(card.back)}</p>
          </details>
          <label>
            <input type="checkbox" data-known-card="${escapeHTML(card.id)}"
              ${card.known ? "checked" : ""}>
            O'rgandim
          </label>
          <button data-delete-card="${escapeHTML(card.id)}">
            O'chirish
          </button>
        </article>
      ).join("")
      : "<p>Hali kartochkalar yo'q.</p>";
  }

  drawCards();

  list.addEventListener("change", event => {
    const checkbox = event.target.closest("[data-known-card]");
    if (!checkbox) return;

    const card = state.flashcards.find(
      item => item.id === checkbox.dataset.knownCard
    );

    if (card) {
      card.known = checkbox.checked;
      saveState();
    }
  });

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-card]");
    if (!button) return;

    state.flashcards = state.flashcards.filter(
      card => card.id !== button.dataset.deleteCard
    );

    if (saveState()) {
      renderFlashcards();
      showMessage("Kartochka o'chirildi.");
    }
  });
}

/* =========================================
   POMODORO TAYMER
========================================= */

let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes).padStart(2, "0") +
    ":" + String(seconds).padStart(2, "0");
}

function renderTimer() {
  const container = getMainContainer();
  if (!container) return;

  stopTimer();

  timerSeconds = 25 * 60;
  timerRunning = false;

  container.innerHTML = 
    <section>
      <h1>Pomodoro taymer</h1>
      <p>Diqqat bilan o'qing, so'ng tanaffus qiling.</p>

      <label for="timer-minutes">Daqiqa</label>
      <input id="timer-minutes" type="number"
        min="1" max="180" value="25">

      <h2 id="timer-display">25:00</h2>

      <button id="timer-start">Boshlash</button>
      <button id="timer-pause">Pauza</button>
      <button id="timer-reset">Qayta boshlash</button>
    </section>
  ;

  $("#timer-start").addEventListener("click", startTimer);
  $("#timer-pause").addEventListener("click", pauseTimer);
  $("#timer-reset").addEventListener("click", () => {
    stopTimer();
    const minutes = Math.max(
      1,
      Math.min(180, Number($("#timer-minutes").value) || 25)
    );

    timerSeconds = minutes * 60;
    updateTimerDisplay();
  });

  $("#timer-minutes").addEventListener("change", () => {
    if (timerRunning) return;

    const minutes = Math.max(
      1,
      Math.min(180, Number($("#timer-minutes").value) || 25)
    );

    timerSeconds = minutes * 60;
    updateTimerDisplay();
  });

  updateTimerDisplay();
}

function updateTimerDisplay() {
  const display = $("#timer-display");
  if (display) display.textContent = formatTime(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;

  if (timerSeconds <= 0) {
    timerSeconds = 25 * 60;
  }

  timerRunning = true;

  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      stopTimer();

      state.studyMinutes =
        (Number(state.studyMinutes) || 0) + 25;

      saveState();
      showMessage("Taymer tugadi! Tanaffus qiling.");
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = null;
  timerRunning = false;
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = null;
  timerRunning = false;
}

/* =========================================
   ILOVANI ISHGA TUSHIRISH
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  bindNavigation();

  const initialPage = location.hash.slice(1);

  if (PAGE_TITLES[initialPage]) {
    navigateTo(initialPage);
  } else {
    renderDashboard();
  }

  // Service Worker: GitHub Pages va HTTPS talab qilinadi.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.warn("Service Worker ro'yxatdan o'tmadi:", error);
      });
  }
});
