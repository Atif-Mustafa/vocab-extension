# LexiSide — Vocabulary Sidebar Extension

A Chrome extension that lets you save words while browsing and see translations in up to 4 languages of your choice — all in a clean sidebar.

---

## Installation (Chrome / Edge)

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `vocab-extension` folder
5. The LexiSide icon will appear in your toolbar

---

## How to use

### Open the sidebar
- Click the **LexiSide icon** in your toolbar
- Or press `Ctrl+Shift+L` (Windows/Linux) / `Cmd+Shift+L` (Mac)

### Save a word while browsing
- **Right-click** any selected word on a webpage
- Click **"Save [word] to LexiSide"**
- Translations will appear automatically within a few seconds

### Add a word manually
- Click the **"+ Add"** button in the sidebar
- Type any word and press Enter or click "Translate & Save"

### First-time setup
- On first open, pick your **base language** (the language you know)
- Add up to **4 languages** you want to learn
- This can be changed anytime via the ⚙ Settings button

---

## Features

- ✦ Dynamic language selection — pick any combination from 20+ languages
- ✦ Right-click to save words directly from webpages
- ✦ Manual word entry
- ✦ Automatic translations via MyMemory API (free, no API key needed)
- ✦ Source tracking — remembers which page you found the word on
- ✦ Filter by All / New / Learned
- ✦ Search across words and translations
- ✦ Mark words as Learned
- ✦ Pronounce any word using your browser's built-in speech
- ✦ Export your full vocabulary list as CSV

---

## Supported Languages (translation)

English, Arabic, Urdu, Hindi, French, Spanish, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Turkish, Persian, Bengali, Swahili, Dutch, Polish, Indonesian, Vietnamese, Thai — and more via MyMemory.

---

## Translation API

Uses **MyMemory** (https://mymemory.translated.net) — free, no API key required.
- Free tier: ~1000 words/day per IP
- For heavier use, register a free account at MyMemory and add your email as a parameter

---

## Project structure

```
vocab-extension/
├── manifest.json       Extension configuration
├── background.js       Service worker (context menu, translation API calls)
├── sidebar.html        Sidebar UI
├── sidebar.js          Sidebar logic (state, rendering, storage)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
