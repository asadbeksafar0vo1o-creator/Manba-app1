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
   1-QISM TAYYOR
   2-qism shu kodning oxiriga qo'shiladi.
========================================= */
