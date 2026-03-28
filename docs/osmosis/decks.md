# Decks

You can assign WOTD flashcards to a specific Osmosis deck. This keeps your vocabulary cards organized alongside your other study material.

## Setting a Deck

1. Open **Settings** > **Word of the Day**
2. Toggle **Include Osmosis flashcard** on
3. Enter a deck name in the **Deck** field (e.g., `Vocab/Word of the Day`)

When a deck is set, Word of the Day adds an `osmosis-deck` field to the note's frontmatter:

```yaml
---
word: fiscal
definition: Fiscal is used to describe things...
source: https://www.merriam-webster.com/dictionary/fiscal
published: 2026-03-28
osmosis-deck: Vocab/Word of the Day
---
```

Osmosis reads this frontmatter to assign all cards in the note to the specified deck.

## Nested Decks

Osmosis supports nested decks using `/` as a separator. For example:

- `Vocab` -- a top-level deck
- `Vocab/Word of the Day` -- a sub-deck under Vocab
- `Vocab/Word of the Day/2026` -- a further sub-deck

## No Deck

Leave the **Deck** field blank to skip deck assignment. Cards will appear in the default deck (or be organized by whatever rules you've configured in Osmosis).

## Learn More

See the [Osmosis deck documentation](https://sawyerrensel.github.io/Osmosis/flashcards/decks/) for more on how decks work.
