# Callout Styles

Word of the Day uses callout blocks for the "Examples" and "Did you know?" sections. You can choose between two formats.

## Callouts (Built-in)

Obsidian's native callout syntax. No additional plugins required.

```markdown
> [!example] Examples
> The governor proposed a number of *fiscal* reforms.

> [!question] Did you know?
> Fiscal derives from the Latin word "fiscus," meaning "basket"
> or "treasury."
```

This is the default setting.

## Admonitions (Plugin)

Uses the code fence syntax from the [Admonitions](https://github.com/ebullient/obsidian-admonition) community plugin. Choose this if you already use Admonitions in your vault.

````markdown
```ad-example
title: Examples
The governor proposed a number of *fiscal* reforms.
```

```ad-question
title: Did you know?
Fiscal derives from the Latin word "fiscus," meaning "basket"
or "treasury."
```
````

!!! note
    The Admonitions plugin must be installed and enabled for this syntax to render correctly.

## Changing the Style

1. Open **Settings** > **Word of the Day**
2. Under **Callout Style**, select your preferred format
3. Fetch a new word (or re-fetch the current one) to see the change

Existing notes are not automatically updated when you change this setting. Re-fetch a word to regenerate its note with the new style.
