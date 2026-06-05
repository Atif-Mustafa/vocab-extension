// Background service worker for LexiSide

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lexi-save-word",
    title: "Save \"%s\" to LexiSide",
    contexts: ["selection"]
  });

  // Set default settings if not exists
  chrome.storage.local.get("lexiSettings", (data) => {
    if (!data.lexiSettings) {
      chrome.storage.local.set({
        lexiSettings: { baseLanguage: "en", targetLanguages: [] },
        lexiWords: []
      });
    }
  });
});

// Open sidebar when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    console.warn("LexiSide: sidePanel API not available. Make sure 'sidePanel' is in permissions.");
  }
});

// Handle right-click "Save word" from context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "lexi-save-word") return;

  const word = (info.selectionText || "").trim();
  if (!word) return;

  const pageTitle = tab.title || "";
  const pageUrl = tab.url || "";

  // Store the pending word in storage — sidebar will pick it up when it opens
  chrome.storage.local.set({
    lexiPendingWord: { word, source: pageTitle || pageUrl, sourceUrl: pageUrl, ts: Date.now() }
  });

  // Try to open sidebar, then sidebar.js will read lexiPendingWord on load
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    console.warn("LexiSide: sidePanel API not available.");
  }
});

// Listen for messages from sidebar (translation requests)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "translateWord") {
    translateWord(msg.word, msg.targetLanguages, msg.baseLanguage)
      .then(translations => sendResponse({ success: true, translations }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async
  }
});

// Translation via MyMemory API (free, no key needed)
async function translateWord(word, targetLangs, baseLang) {
  const translations = {};
  const promises = targetLangs.map(async (lang) => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${baseLang}|${lang}`;
      const res = await fetch(url);
      const data = await res.json();
      translations[lang] = (data.responseStatus === 200)
        ? data.responseData.translatedText
        : "—";
    } catch {
      translations[lang] = "—";
    }
  });
  await Promise.all(promises);
  return translations;
}
