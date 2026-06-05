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
        lexiSettings: {
          baseLanguage: "en",
          targetLanguages: []
        },
        lexiWords: []
      });
    }
  });
});

// Open sidebar when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Handle right-click "Save word" from context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lexi-save-word") {
    const word = info.selectionText.trim();
    if (!word) return;

    // Get page info and open sidebar, then send the word
    const pageUrl = tab.url || "";
    const pageTitle = tab.title || "";

    // Open sidebar first
    chrome.sidePanel.open({ tabId: tab.id }, () => {
      // Small delay to let sidebar load, then send word
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: "saveWordFromContext",
          word: word,
          source: pageTitle || pageUrl,
          sourceUrl: pageUrl
        });
      }, 600);
    });
  }
});

// Listen for messages from sidebar
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
      if (data.responseStatus === 200) {
        translations[lang] = data.responseData.translatedText;
      } else {
        translations[lang] = "—";
      }
    } catch {
      translations[lang] = "—";
    }
  });

  await Promise.all(promises);
  return translations;
}
