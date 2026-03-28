# Settings

Open **Settings** > **Word of the Day** to configure the plugin.

## General

### Destination Folder

The folder where WOTD notes are created. The folder is created automatically if it doesn't exist. As you type, existing vault folders are suggested.

- **Default:** `WOTD`

### Include HTML from RSS

When enabled, the full Merriam-Webster description is parsed and included in the note body -- definition, usage examples, "Did you know?" section, and a link to the dictionary entry.

When disabled, only the frontmatter and heading are generated.

- **Default:** On

## Callout Style

Choose how the "Examples" and "Did you know?" sections are formatted. See [Callout Styles](callout-styles.md) for details.

- **Default:** Callouts (built-in)

## Osmosis Flashcards

Optional integration with [Osmosis](https://github.com/SawyerRensel/Osmosis) for spaced-repetition study. See [Flashcard Types](../osmosis/flashcard-types.md) and [Decks](../osmosis/decks.md).

### Include Osmosis Flashcard

Toggle this on to embed a flashcard at the bottom of each WOTD note.

- **Default:** Off

### Flashcard Type

Choose the type of flashcard to generate. Only visible when flashcards are enabled.

| Type | Description |
|------|-------------|
| Cloze | Fill-in-the-blank -- the word is highlighted with `==markers==` |
| Basic | Front/back -- "What does **word** mean?" on the front, definition on the back |
| Bidirectional | Study in both directions -- word on one side, definition on the other |

- **Default:** Bidirectional

### Deck

Assign generated flashcards to an Osmosis deck by adding `osmosis-deck` to the note's frontmatter. Leave blank for no deck assignment.

- **Default:** (none)
- **Example:** `Vocab/Word of the Day`

## Test

### Test Fetch

A button that runs the full fetch-and-create workflow immediately. Useful for verifying your settings are correct.
