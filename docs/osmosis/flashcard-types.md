# Flashcard Types

Word of the Day can generate three types of Osmosis flashcards. Choose your preferred type in **Settings** > **Word of the Day** > **Flashcard type**.

## Cloze

A fill-in-the-blank card. The word is wrapped in `==highlight markers==` within the definition. Osmosis blanks out the highlighted term during study.

````markdown
```osmosis
==fiscal== is used to describe things relating to money and especially
to the money a government, business, or organization earns, spends,
and owes.
```
````

**Best for:** Recognizing the word in context.

## Basic (Front / Back)

A simple question-and-answer card. The front asks "What does **word** mean?" and the back shows the definition.

````markdown
```osmosis
What does **fiscal** mean?
***
Is used to describe things relating to money and especially to the
money a government, business, or organization earns, spends, and owes.
```
````

**Best for:** Recall-based study -- can you produce the definition from memory?

## Bidirectional

Like a basic card, but Osmosis creates two cards: one from word to definition, and one from definition to word. The definition side does not contain the word itself, so it works cleanly in both directions.

````markdown
```osmosis
bidi: true

fiscal
***
Is used to describe things relating to money and especially to the
money a government, business, or organization earns, spends, and owes.
```
````

**Best for:** Full vocabulary mastery -- recognize the word *and* recall it from its meaning.

This is the default flashcard type.
