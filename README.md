# Word of the Day

**Learn a new word every day, right inside Obsidian.**

Word of the Day fetches Merriam-Webster's Word of the Day and saves it as a clean, structured note in your vault. Optionally generate spaced-repetition flashcards with [Osmosis](https://github.com/SawyerRensel/Osmosis) so you actually remember what you learn.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.10.0+-purple)](https://obsidian.md)

## Features

- **One-Click Fetch** — Grab today's Word of the Day from Merriam-Webster's RSS feed with a single click or command
- **Structured Notes** — Each word gets its own note with frontmatter, pronunciation, part of speech, definition, examples, and "Did you know?" sections
- **Osmosis Flashcards** — Optionally embed a spaced-repetition flashcard directly in the note. Choose from cloze, basic (front/back), or bidirectional card types
- **Deck Assignment** — Assign generated flashcards to a specific Osmosis deck via frontmatter
- **Callout Styles** — Use native Obsidian callouts or Admonitions plugin syntax for examples and "Did you know?" sections
- **Folder Auto-Suggest** — The destination folder setting suggests existing vault folders as you type
- **Insert Link** — Insert a link to today's word at your cursor position in any note

## Quick Start

### Fetch Today's Word

1. Click the quote icon in the ribbon (or use the command palette: **Fetch Word of the Day now**)
2. A new note appears in your destination folder, named after the word

### Example Note

````markdown
---
word: fiscal
definition: Fiscal is used to describe things relating to money...
source: https://www.merriam-webster.com/dictionary/fiscal
published: 2026-03-28
osmosis-deck: Vocab/Word of the Day
---

# fiscal

---

**fiscal** • \fi-skəl\ • *adjective*

Fiscal is used to describe things relating to money and especially
to the money a government, business, or organization earns, spends,
and owes.

> [!example] Examples
> The governor proposed a number of *fiscal* reforms.

> [!question] Did you know?
> Fiscal derives from the Latin word "fiscus," meaning "basket" or
> "treasury."

```osmosis
bidi: true

fiscal
***
Is used to describe things relating to money and especially to the
money a government, business, or organization earns, spends, and owes.
```
````

### Enable Osmosis Flashcards

1. Open **Settings** > **Word of the Day**
2. Toggle **Include Osmosis flashcard** on
3. Choose your preferred card type (cloze, basic, or bidirectional)
4. Optionally set a deck name (e.g., `Vocab/Word of the Day`)

## Commands

| Command | Description |
|---------|-------------|
| **Fetch Word of the Day now** | Fetches the WOTD and creates/updates the note |
| **Open today's WOTD note** | Fetches and opens the note in a new pane |
| **Insert link to today's WOTD at cursor** | Inserts a `[[link]]` to the WOTD note at your cursor |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Destination folder** | Where WOTD notes are saved (auto-suggests folders) | `WOTD` |
| **Include HTML from RSS** | Include full description from Merriam-Webster | On |
| **Callout format** | Native Obsidian callouts or Admonitions syntax | Callouts |
| **Include Osmosis flashcard** | Embed a flashcard in the note | Off |
| **Flashcard type** | Cloze, basic (front/back), or bidirectional | Bidirectional |
| **Deck** | Osmosis deck assignment via frontmatter | (none) |

## Installation

### From Community Plugins (Coming Soon)

1. Open **Settings** > **Community Plugins**
2. Click **Browse** and search for "Word of the Day"
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/SawyerRensel/WOTD/releases)
2. Extract `main.js`, `styles.css`, and `manifest.json` to your vault's `.obsidian/plugins/wotd/` directory
3. Enable the plugin in **Settings** > **Community Plugins**

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Platform | Obsidian Plugin API |
| Data Source | [Merriam-Webster WOTD RSS](https://www.merriam-webster.com/wotd/feed/rss2) |
| Testing | Vitest (unit), Playwright (E2E) |
| Linting | ESLint with TypeScript |

## Documentation

Full documentation is available at **[sawyerrensel.github.io/WOTD](https://sawyerrensel.github.io/WOTD/)**:

- **Getting Started** — [Installation](https://sawyerrensel.github.io/WOTD/getting-started/installation/) · [Quick Start](https://sawyerrensel.github.io/WOTD/getting-started/quick-start/)
- **Configuration** — [Settings](https://sawyerrensel.github.io/WOTD/configuration/settings/) · [Callout Styles](https://sawyerrensel.github.io/WOTD/configuration/callout-styles/)
- **Osmosis Integration** — [Flashcard Types](https://sawyerrensel.github.io/WOTD/osmosis/flashcard-types/) · [Decks](https://sawyerrensel.github.io/WOTD/osmosis/decks/)

## Development

```bash
# Clone the repository
git clone https://github.com/SawyerRensel/WOTD.git
cd WOTD

# Install dependencies
npm install

# Build for development (watches for changes)
npm run dev

# Build for production
npm run build
```

Build output goes to `vault/.obsidian/plugins/wotd/` for testing.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Obsidian](https://obsidian.md) — The incredible knowledge base application
- [Merriam-Webster](https://www.merriam-webster.com/) — Word of the Day content
- [Osmosis](https://github.com/SawyerRensel/Osmosis) — Spaced-repetition flashcards for Obsidian
- [Admonitions](https://github.com/ebullient/obsidian-admonition) — Callout/admonition plugin for Obsidian

---

**Author:** Sawyer Rensel ([@SawyerRensel](https://github.com/SawyerRensel))
