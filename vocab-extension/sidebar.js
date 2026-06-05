// LexiSide — sidebar.js

// ─── Language list ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "none", label: "— None —" },
  { code: "en",   label: "English" },
  { code: "ar",   label: "Arabic (عربي)", rtl: true },
  { code: "ur",   label: "Urdu (اردو)", rtl: true },
  { code: "hi",   label: "Hindi (हिंदी)" },
  { code: "fr",   label: "French" },
  { code: "es",   label: "Spanish" },
  { code: "de",   label: "German" },
  { code: "it",   label: "Italian" },
  { code: "pt",   label: "Portuguese" },
  { code: "ru",   label: "Russian" },
  { code: "zh",   label: "Chinese (中文)" },
  { code: "ja",   label: "Japanese (日本語)" },
  { code: "ko",   label: "Korean (한국어)" },
  { code: "tr",   label: "Turkish" },
  { code: "fa",   label: "Persian (فارسی)", rtl: true },
  { code: "bn",   label: "Bengali (বাংলা)" },
  { code: "sw",   label: "Swahili" },
  { code: "nl",   label: "Dutch" },
  { code: "pl",   label: "Polish" },
  { code: "id",   label: "Indonesian" },
  { code: "vi",   label: "Vietnamese" },
  { code: "th",   label: "Thai (ภาษาไทย)" },
];

// ─── State ────────────────────────────────────────────────────────────────────
let settings = { baseLanguage: "en", targetLanguages: [] };
let words = [];
let currentFilter = "all";
let searchQuery = "";

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  populateAllLangSelects();

  if (settings.targetLanguages.length === 0) {
    showSetup();
  } else {
    showMain();
  }

  bindEvents();
  listenForContextWord();
});

async function loadData() {
  return new Promise(resolve => {
    chrome.storage.local.get(["lexiSettings", "lexiWords"], (data) => {
      if (data.lexiSettings) settings = data.lexiSettings;
      if (data.lexiWords) words = data.lexiWords;
      resolve();
    });
  });
}

async function saveData() {
  return new Promise(resolve => {
    chrome.storage.local.set({ lexiSettings: settings, lexiWords: words }, resolve);
  });
}

// ─── UI toggles ───────────────────────────────────────────────────────────────
function showSetup() {
  document.getElementById("setupScreen").classList.add("visible");
  document.getElementById("mainApp").style.display = "none";
}

function showMain() {
  document.getElementById("setupScreen").classList.remove("visible");
  document.getElementById("mainApp").style.display = "flex";
  renderStats();
  renderFilterChips();
  renderWords();
}

// ─── Language select population ──────────────────────────────────────────────
function populateAllLangSelects() {
  // Setup base
  populateSelect(document.getElementById("setupBase"), LANGUAGES.filter(l => l.code !== "none"), settings.baseLanguage);

  // Setup targets (slots 0–3)
  document.querySelectorAll("#setupTargets select").forEach((sel, i) => {
    populateSelect(sel, LANGUAGES, settings.targetLanguages[i] || "none");
  });

  // Settings base
  populateSelect(document.getElementById("settingsBase"), LANGUAGES.filter(l => l.code !== "none"), settings.baseLanguage);

  // Settings targets
  document.querySelectorAll("#settingsTargets select").forEach((sel, i) => {
    populateSelect(sel, LANGUAGES, settings.targetLanguages[i] || "none");
  });
}

function populateSelect(sel, langs, selectedCode) {
  sel.innerHTML = langs.map(l =>
    `<option value="${l.code}" ${l.code === selectedCode ? "selected" : ""}>${l.label}</option>`
  ).join("");
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  // Setup save
  document.getElementById("setupSaveBtn").addEventListener("click", saveSetup);

  // Search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderWords();
  });

  // Filter chips
  document.getElementById("filterRow").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderWords();
  });

  // Add panel
  document.getElementById("openAddBtn").addEventListener("click", openAddPanel);
  document.getElementById("closeAddBtn").addEventListener("click", closeAddPanel);
  document.getElementById("cancelAddBtn").addEventListener("click", closeAddPanel);
  document.getElementById("confirmAddBtn").addEventListener("click", addWordManually);
  document.getElementById("addWordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addWordManually();
  });

  // Settings
  document.getElementById("settingsBtn").addEventListener("click", toggleSettings);
  document.getElementById("closeSettingsBtn").addEventListener("click", toggleSettings);
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
async function saveSetup() {
  const base = document.getElementById("setupBase").value;
  const targets = [...document.querySelectorAll("#setupTargets select")]
    .map(s => s.value)
    .filter(v => v !== "none");

  if (targets.length === 0) {
    showToast("Please select at least 1 language to learn");
    return;
  }

  settings.baseLanguage = base;
  settings.targetLanguages = targets;
  await saveData();
  populateAllLangSelects();
  showMain();
  showToast("Settings saved ✓");
}

// ─── Settings ────────────────────────────────────────────────────────────────
function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  const wordList = document.getElementById("wordList");
  const filterRow = document.getElementById("filterRow");
  const searchWrap = document.querySelector(".search-wrap");
  const isVisible = panel.classList.contains("visible");
  panel.classList.toggle("visible");
  wordList.style.display = isVisible ? "" : "none";
  filterRow.style.display = isVisible ? "" : "none";
  searchWrap.style.display = isVisible ? "" : "none";
}

async function saveSettings() {
  const base = document.getElementById("settingsBase").value;
  const targets = [...document.querySelectorAll("#settingsTargets select")]
    .map(s => s.value)
    .filter(v => v !== "none");

  if (targets.length === 0) {
    showToast("Pick at least 1 language");
    return;
  }

  settings.baseLanguage = base;
  settings.targetLanguages = targets;
  await saveData();
  toggleSettings();
  renderStats();
  renderFilterChips();
  renderWords();
  showToast("Settings updated ✓");
}

// ─── Add word panel ───────────────────────────────────────────────────────────
function openAddPanel() {
  document.getElementById("addPanel").classList.add("open");
  setTimeout(() => document.getElementById("addWordInput").focus(), 300);
}

function closeAddPanel() {
  document.getElementById("addPanel").classList.remove("open");
  document.getElementById("addWordInput").value = "";
}

async function addWordManually() {
  const word = document.getElementById("addWordInput").value.trim();
  if (!word) return;
  closeAddPanel();
  await addWord(word, "Added manually");
}

// ─── Core: add word ───────────────────────────────────────────────────────────
async function addWord(word, source = "", sourceUrl = "") {
  // Avoid duplicate (case-insensitive)
  const existing = words.find(w => w.word.toLowerCase() === word.toLowerCase());
  if (existing) {
    showToast(`"${word}" is already in your list`);
    return;
  }

  const id = Date.now().toString();
  const entry = {
    id,
    word,
    source,
    sourceUrl,
    addedAt: new Date().toISOString(),
    translations: {},
    status: "new"
  };

  words.unshift(entry);
  await saveData();
  renderWords();
  renderStats();
  showToast(`Saved "${word}" — translating…`);

  // Fetch translations
  chrome.runtime.sendMessage({
    action: "translateWord",
    word,
    baseLanguage: settings.baseLanguage,
    targetLanguages: settings.targetLanguages
  }, async (response) => {
    if (response && response.success) {
      const idx = words.findIndex(w => w.id === id);
      if (idx !== -1) {
        words[idx].translations = response.translations;
        await saveData();
        renderWords();
        showToast(`Translations ready for "${word}" ✓`);
      }
    }
  });
}

// ─── Render words ─────────────────────────────────────────────────────────────
function renderWords() {
  const container = document.getElementById("wordList");
  const empty = document.getElementById("emptyState");

  let filtered = words;

  // Filter
  if (currentFilter === "new") {
    filtered = filtered.filter(w => w.status === "new");
  }

  // Search
  if (searchQuery) {
    filtered = filtered.filter(w => {
      if (w.word.toLowerCase().includes(searchQuery)) return true;
      for (const val of Object.values(w.translations)) {
        if (val && val.toLowerCase().includes(searchQuery)) return true;
      }
      return false;
    });
  }

  // Remove old cards
  container.querySelectorAll(".word-card").forEach(c => c.remove());
  const noResults = container.querySelector(".no-results");
  if (noResults) noResults.remove();

  if (words.length === 0) {
    empty.style.display = "";
    return;
  }

  empty.style.display = "none";

  if (filtered.length === 0) {
    const msg = document.createElement("div");
    msg.className = "no-results";
    msg.textContent = `No results for "${searchQuery}"`;
    container.appendChild(msg);
    return;
  }

  filtered.forEach(word => {
    container.appendChild(buildCard(word));
  });
}

function buildCard(entry) {
  const card = document.createElement("div");
  card.className = "word-card";
  card.dataset.id = entry.id;

  const baseLangLabel = LANGUAGES.find(l => l.code === settings.baseLanguage)?.label || "English";

  // Header
  const header = document.createElement("div");
  header.className = "card-header";
  header.innerHTML = `
    <div>
      <div class="word-title-row">
        <span class="word-title">${escHtml(entry.word)}</span>
        <span class="word-base-lang">${baseLangLabel}</span>
      </div>
    </div>
    <div class="card-badges">
      <span class="badge ${entry.status === 'new' ? 'badge-new' : 'badge-saved'}">
        ${entry.status === 'new' ? 'New' : 'Saved'}
      </span>
    </div>
  `;

  // Translations grid
  const transDiv = document.createElement("div");
  transDiv.className = "translations";

  const hasTranslations = Object.keys(entry.translations).length > 0;

  settings.targetLanguages.forEach(langCode => {
    const lang = LANGUAGES.find(l => l.code === langCode);
    const val = entry.translations[langCode];
    const row = document.createElement("div");
    row.className = "trans-row";

    const isRtl = lang?.rtl || false;
    const valClass = `trans-val${isRtl ? " rtl" : ""}${!hasTranslations ? " loading" : ""}`;
    const displayVal = val || (hasTranslations ? "—" : "Translating…");

    row.innerHTML = `
      <span class="trans-lang">${lang?.label?.split(" ")[0] || langCode}</span>
      <span class="${valClass}">${escHtml(displayVal)}</span>
    `;
    transDiv.appendChild(row);
  });

  // Source
  let sourceEl = "";
  if (entry.source) {
    sourceEl = `<div class="source-line">
      <a class="source-chip" href="${escHtml(entry.sourceUrl || '#')}" target="_blank" title="${escHtml(entry.source)}">
        🔗 ${escHtml(truncate(entry.source, 30))}
      </a>
    </div>`;
  }

  // Actions
  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.innerHTML = `
    <button class="card-action" data-action="pronounce">🔊 Pronounce</button>
    <button class="card-action" data-action="toggle">${entry.status === 'new' ? '✓ Mark learned' : '↩ Mark new'}</button>
    <button class="card-action danger" data-action="delete">✕ Remove</button>
  `;

  card.appendChild(header);
  card.appendChild(transDiv);
  if (entry.source) {
    const sourceDiv = document.createElement("div");
    sourceDiv.className = "source-line";
    const link = document.createElement("a");
    link.className = "source-chip";
    link.href = entry.sourceUrl || "#";
    link.target = "_blank";
    link.title = entry.source;
    link.textContent = "🔗 " + truncate(entry.source, 30);
    sourceDiv.appendChild(link);
    card.appendChild(sourceDiv);
  }
  card.appendChild(actions);

  // Action events
  actions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "delete") deleteWord(entry.id);
    else if (action === "toggle") toggleStatus(entry.id);
    else if (action === "pronounce") pronounceWord(entry.word);
  });

  return card;
}

async function deleteWord(id) {
  words = words.filter(w => w.id !== id);
  await saveData();
  renderWords();
  renderStats();
  showToast("Word removed");
}

async function toggleStatus(id) {
  const idx = words.findIndex(w => w.id === id);
  if (idx === -1) return;
  words[idx].status = words[idx].status === "new" ? "learned" : "new";
  await saveData();
  renderWords();
  showToast(words[idx]?.status === "learned" ? "Marked as learned ✓" : "Moved back to new");
}

function pronounceWord(word) {
  if ('speechSynthesis' in window) {
    const lang = settings.baseLanguage;
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  } else {
    showToast("Speech not supported in this browser");
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  document.getElementById("statTotal").textContent = words.length;
  const langLabels = settings.targetLanguages
    .map(c => LANGUAGES.find(l => l.code === c)?.label?.split(" ")[0] || c)
    .join(", ");
  document.getElementById("statLangs").innerHTML = langLabels
    ? `<strong>${settings.targetLanguages.length}</strong> languages: ${langLabels}`
    : "No languages set";
}

function renderFilterChips() {
  const row = document.getElementById("filterRow");
  const newCount = words.filter(w => w.status === "new").length;
  const learnedCount = words.filter(w => w.status === "learned").length;

  row.innerHTML = `
    <span class="chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All <span class="word-count-badge">${words.length}</span></span>
    <span class="chip ${currentFilter === 'new' ? 'active' : ''}" data-filter="new">New <span class="word-count-badge">${newCount}</span></span>
    <span class="chip ${currentFilter === 'learned' ? 'active' : ''}" data-filter="learned">Learned <span class="word-count-badge">${learnedCount}</span></span>
  `;

  // Re-bind chip events after re-render
  row.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderWords();
  });
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV() {
  const langHeaders = settings.targetLanguages
    .map(c => LANGUAGES.find(l => l.code === c)?.label?.split(" ")[0] || c);
  const headers = ["Word", "Base Language", ...langHeaders, "Source", "Status", "Added"];

  const rows = words.map(w => [
    w.word,
    settings.baseLanguage,
    ...settings.targetLanguages.map(c => w.translations[c] || ""),
    w.source || "",
    w.status,
    w.addedAt.split("T")[0]
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lexiside-vocabulary.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported as CSV ✓");
}

// ─── Context menu word (from background) ─────────────────────────────────────
function listenForContextWord() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "saveWordFromContext") {
      addWord(msg.word, msg.source || "From webpage", msg.sourceUrl || "");
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
