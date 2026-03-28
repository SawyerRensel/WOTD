import {
  App,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  requestUrl,
  AbstractInputSuggest,
} from "obsidian";

// ----------------------------- Types & defaults -----------------------------

type FlashcardType = "cloze" | "basic" | "bidi";
type CalloutStyle = "callout" | "admonition";

interface WOTDSettings {
  destinationFolder: string;
  includeHtmlFromRSS: boolean;
  calloutStyle: CalloutStyle;
  includeOsmosisFlashcard: boolean;
  osmosisFlashcardType: FlashcardType;
  osmosisDeck: string;
}

const DEFAULT_SETTINGS: WOTDSettings = {
  destinationFolder: "WOTD",
  includeHtmlFromRSS: true,
  calloutStyle: "callout",
  includeOsmosisFlashcard: false,
  osmosisFlashcardType: "bidi",
  osmosisDeck: "",
};

interface WotdData {
  word: string;
  title: string;
  link: string;
  pubDate: string;
  descriptionHtml: string;
}

interface WotdSections {
  pron: string;
  pos: string;
  definitionMd: string;
  definitionPlain: string;
  slashExampleMd: string;
  seeEntryMd: string;
  examplesMd: string;
  didYouKnowMd: string;
}

// Merriam-Webster WOTD RSS feed
const WOTD_RSS_URL = "https://www.merriam-webster.com/wotd/feed/rss2";

// ----------------------------- Folder suggest -----------------------------

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  getSuggestions(inputStr: string): TFolder[] {
    const lowerInput = inputStr.toLowerCase();
    const folders: TFolder[] = [];
    const rootFolder = this.app.vault.getRoot();

    // Walk the vault tree for folders
    const walk = (folder: TFolder): void => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          if (child.path.toLowerCase().includes(lowerInput)) {
            folders.push(child);
          }
          walk(child);
        }
      }
    };
    walk(rootFolder);

    return folders.slice(0, 20);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.close();
  }
}

// ----------------------------- Utilities -----------------------------

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  if (!folderPath || folderPath === "/") return;
  const parts = folderPath.split("/").filter(Boolean);
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const maybe = app.vault.getAbstractFileByPath(currentPath);
    if (!maybe) {
      await app.vault.createFolder(currentPath);
    } else if (!(maybe instanceof TFolder)) {
      throw new Error(`Path exists but is not a folder: ${currentPath}`);
    }
  }
}

function sanitizeFileComponent(s: string): string {
  return s.replace(/[\\/#%&{}<>*?$!'":@+`|=]/g, "").trim();
}

// ----------------------------- HTML → Markdown -----------------------------

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  function escapeMd(text: string): string {
    return (text || "").replace(/([\\*_`[\]#>])/g, "\\$1");
  }

  function walk(node: Node, ctx: { ol: number } = { ol: 0 }): string {
    if (node.nodeType === Node.TEXT_NODE) return escapeMd(node.nodeValue ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const kids = Array.from(el.childNodes)
      .map((n) => walk(n, ctx))
      .join("");

    switch (tag) {
      case "strong":
      case "b":
        return kids.trim() ? `**${kids}**` : "";
      case "em":
      case "i":
        return kids.trim() ? `*${kids}*` : "";
      case "a": {
        const href = el.getAttribute("href") ?? "";
        const text = kids || href;
        return href ? `[${text}](${href})` : text;
      }
      case "br":
        return "  \n";
      case "p":
        return kids.trim() ? `${kids.trim()}\n\n` : "";
      case "ul": {
        const items = Array.from(el.children)
          .filter(
            (li) => li.tagName && li.tagName.toLowerCase() === "li",
          )
          .map((li) => `- ${walk(li, ctx).trim()}`)
          .join("\n");
        return items ? `${items}\n\n` : "";
      }
      case "ol": {
        const subctx = { ...ctx, ol: (ctx.ol || 0) + 1 };
        const items = Array.from(el.children)
          .filter(
            (li) => li.tagName && li.tagName.toLowerCase() === "li",
          )
          .map((li, i) => `${String(i + 1)}. ${walk(li, subctx).trim()}`)
          .join("\n");
        return items ? `${items}\n\n` : "";
      }
      case "li":
        return kids.replace(/\n{3,}/g, "\n\n").trim();
      case "blockquote":
        return (
          kids
            .split("\n")
            .map((l) => (l ? `> ${l}` : ""))
            .join("\n") + "\n\n"
        );
      case "code":
      case "kbd":
        return `\`${kids}\``;
      case "pre":
        return `\`\`\`\n${kids.replace(/\n+$/, "")}\n\`\`\`\n\n`;
      case "font":
      case "span":
      case "div":
        return kids;
      default:
        return kids;
    }
  }

  return walk(doc.body || doc)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSpaces(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim();
}

// ----------------------------- RSS fetch & parse -----------------------------

async function fetchWotd(): Promise<WotdData> {
  const res = await requestUrl({ url: WOTD_RSS_URL, method: "GET" });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to fetch WOTD RSS: ${String(res.status)}`);
  }

  const xml = res.text;
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  const item = doc.querySelector("channel > item");
  if (!item) throw new Error("No WOTD <item> found.");

  const title = (item.querySelector("title")?.textContent ?? "").trim();
  const link = (item.querySelector("link")?.textContent ?? "").trim();
  const pubDate = (item.querySelector("pubDate")?.textContent ?? "").trim();
  const descriptionHtml = (
    item.querySelector("description")?.textContent ?? ""
  ).trim();

  let word = title;
  if (title.includes(":")) word = title.split(":")[1]?.trim() ?? title;
  word = word.replace(/\s+/g, " ").trim();
  if (!word) throw new Error("Failed to parse WOTD word from RSS title.");

  return { word, title, link, pubDate, descriptionHtml };
}

function parseWotdSections(descriptionHtml: string, word: string): WotdSections {
  const doc = new DOMParser().parseFromString(descriptionHtml || "", "text/html");
  const ps = Array.from(doc.querySelectorAll("p"));

  const norm = normalizeSpaces;

  // Find the line that contains the word, pronunciation, and part of speech
  const wordLineP = ps.find((p) => {
    const strong = p.querySelector("strong");
    return (
      strong !== null &&
      norm(strong.textContent ?? "").toLowerCase() === (word || "").toLowerCase()
    );
  });

  let pron = "";
  let pos = "";
  if (wordLineP) {
    const t = norm(wordLineP.textContent ?? "");
    const m1 = t.match(/\\([^\\]+)\\/);
    const m2 = !m1 ? t.match(/\/([^/]+)\//) : null;
    pron = m1?.[1] ?? m2?.[1] ?? "";
    const mpos = t.match(
      /\b(adjective|noun|verb|adverb|interjection|conjunction|preposition|pronoun|article|proper noun|plural noun|combining form)\b/i,
    );
    pos = mpos ? mpos[1].toLowerCase() : "";
  }

  // Definition = first substantial paragraph after the word line
  let defP: Element | undefined;
  if (wordLineP) {
    const startIdx = ps.indexOf(wordLineP);
    for (let i = startIdx + 1; i < ps.length; i++) {
      const t = norm(ps[i]?.textContent ?? "");
      if (!t) continue;
      if (/^examples?:\s*$/i.test(t)) continue;
      if (/^did you know\??\s*$/i.test(t)) continue;
      if (/^\/\//.test(t)) continue;
      if (t.length >= 30) {
        defP = ps[i];
        break;
      }
    }
  }
  const definitionMd = defP ? htmlToMarkdown(defP.outerHTML).trim() : "";
  const definitionPlain = defP ? norm(defP.textContent ?? "") : "";

  // Inline // example
  const slashExampleP = ps.find((p) => /^\s*\/\//.test(p.textContent ?? ""));
  const slashExampleMd = slashExampleP
    ? htmlToMarkdown(slashExampleP.outerHTML).trim()
    : "";

  // "See the entry" link
  const seeEntryA = doc.querySelector('a[href*="/dictionary/"]');
  const seeEntryMd = seeEntryA
    ? `[See the entry >](${seeEntryA.getAttribute("href") ?? ""})`
    : "";

  // Examples section
  let examplesMd = "";
  const examplesStrong = Array.from(doc.querySelectorAll("strong")).find((s) =>
    /^examples?:\s*$/i.test(norm(s.textContent ?? "")),
  );

  if (examplesStrong) {
    const headerP = examplesStrong.closest("p") ?? examplesStrong.parentElement;
    const startIdx = headerP ? ps.indexOf(headerP as HTMLParagraphElement) : -1;
    const parts: string[] = [];

    for (let i = startIdx + 1; i < ps.length; i++) {
      const p = ps[i];
      if (!p) continue;
      const t = norm(p.textContent ?? "");
      const strongEl = p.querySelector("strong");
      const strongTxt = strongEl ? norm(strongEl.textContent ?? "") : "";
      if (/^(examples?:|did you know\??)$/i.test(strongTxt)) break;
      if (!t) continue;
      parts.push(htmlToMarkdown(p.outerHTML).trim());
    }

    examplesMd = parts.join("\n\n").trim();
  }

  // Did you know section
  let didYouKnowMd = "";
  const dykStrong = Array.from(doc.querySelectorAll("strong")).find((s) =>
    /^did you know\??\s*$/i.test(norm(s.textContent ?? "")),
  );
  if (dykStrong) {
    const headerP = dykStrong.closest("p") ?? dykStrong.parentElement;
    let i = headerP ? ps.indexOf(headerP as HTMLParagraphElement) + 1 : ps.length;
    const parts: string[] = [];
    while (i < ps.length) {
      const p = ps[i];
      if (!p) break;
      const strongEl = p.querySelector("strong");
      const strongTxt = strongEl ? norm(strongEl.textContent ?? "") : "";
      if (/^(examples?:|did you know\??)$/i.test(strongTxt)) break;
      const t = norm(p.textContent ?? "");
      if (t) parts.push(htmlToMarkdown(p.outerHTML).trim());
      i++;
    }
    didYouKnowMd = parts.join("\n\n").trim();
  }

  return {
    pron,
    pos,
    definitionMd,
    definitionPlain,
    slashExampleMd,
    seeEntryMd,
    examplesMd,
    didYouKnowMd,
  };
}

// ----------------------------- Osmosis flashcard -----------------------------

function escapeRegExpStr(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildClozeText(word: string, definitionPlain: string): string {
  // Replace the word inline with a cloze marker.
  const wordRe = new RegExp(`\\b${escapeRegExpStr(word)}\\b`, "i");
  if (wordRe.test(definitionPlain)) {
    return definitionPlain.replace(wordRe, `==${word}==`);
  }
  return `==${word}==: ${definitionPlain}`;
}

function stripWordFromDefinition(word: string, definitionPlain: string): string {
  // Remove the word from the definition (e.g. "Fiscal is used to..." → "is used to...")
  // and capitalise the first remaining letter.
  const wordRe = new RegExp(`^\\s*${escapeRegExpStr(word)}\\s*`, "i");
  const stripped = definitionPlain.replace(wordRe, "");
  if (!stripped) return definitionPlain;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function buildOsmosisFlashcard(
  word: string,
  definitionPlain: string,
  flashcardType: FlashcardType,
): string {
  if (!definitionPlain) return "";

  switch (flashcardType) {
    case "cloze":
      return (
        "```osmosis\n" +
        `${buildClozeText(word, definitionPlain)}\n` +
        "```"
      );
    case "basic":
      return (
        "```osmosis\n" +
        `What does **${word}** mean?\n` +
        "***\n" +
        `${stripWordFromDefinition(word, definitionPlain)}\n` +
        "```"
      );
    case "bidi":
      return (
        "```osmosis\n" +
        "bidi: true\n\n" +
        `${word}\n` +
        "***\n" +
        `${stripWordFromDefinition(word, definitionPlain)}\n` +
        "```"
      );
  }
}

// ----------------------------- Note building -----------------------------

function buildNoteContent(w: WotdData, settings: WOTDSettings): string {
  const sec = parseWotdSections(w.descriptionHtml, w.word);

  const dateISO = window.moment(w.pubDate).isValid()
    ? window.moment(w.pubDate).format("YYYY-MM-DD")
    : window.moment().format("YYYY-MM-DD");

  // Frontmatter
  let out =
    "---\n" +
    `word: ${w.word}\n` +
    (sec.definitionPlain ? `definition: ${sec.definitionPlain}\n` : "") +
    `source: ${w.link}\n` +
    `published: ${dateISO}\n` +
    (settings.includeOsmosisFlashcard && settings.osmosisDeck
      ? `osmosis-deck: ${settings.osmosisDeck}\n`
      : "") +
    "---\n\n";

  // Header
  out += `# ${w.word}\n\n`;
  out += "---\n\n";

  // Lexeme line: **word** • \pron\ • *pos*
  const lexParts: string[] = [];
  lexParts.push(`**${w.word}**`);
  if (sec.pron) lexParts.push(`\\${sec.pron}\\`);
  if (sec.pos) lexParts.push(`*${sec.pos}*`);
  out += `${lexParts.join(" • ")}\n\n`;

  // Definition
  if (sec.definitionMd) out += `${sec.definitionMd}\n\n`;

  // Inline example
  if (sec.slashExampleMd) out += `${sec.slashExampleMd}\n\n`;

  // See the entry link
  if (sec.seeEntryMd) out += `${sec.seeEntryMd}\n\n`;

  // Examples
  if (sec.examplesMd) {
    if (settings.calloutStyle === "admonition") {
      out += "```ad-example\n";
      out += "title: Examples\n";
      out += `${sec.examplesMd.trim()}\n`;
      out += "```\n\n";
    } else {
      out += "> [!example] Examples\n";
      out += `${sec.examplesMd.trim().split("\n").map((l) => `> ${l}`).join("\n")}\n\n`;
    }
  }

  // Did you know
  if (sec.didYouKnowMd) {
    if (settings.calloutStyle === "admonition") {
      out += "```ad-question\n";
      out += "title: Did you know?\n";
      out += `${sec.didYouKnowMd.trim()}\n`;
      out += "```\n\n";
    } else {
      out += "> [!question] Did you know?\n";
      out += `${sec.didYouKnowMd.trim().split("\n").map((l) => `> ${l}`).join("\n")}\n\n`;
    }
  }

  // Osmosis flashcard
  if (settings.includeOsmosisFlashcard && sec.definitionPlain) {
    out += buildOsmosisFlashcard(
      w.word,
      sec.definitionPlain,
      settings.osmosisFlashcardType,
    );
    out += "\n";
  }

  return out.trim() + "\n";
}

// ----------------------------- Note creation -----------------------------

async function createOrUpdateWotdNote(
  app: App,
  settings: WOTDSettings,
): Promise<{ w: WotdData; filePath: string; file: TFile }> {
  const w = await fetchWotd();

  const destFolder = settings.destinationFolder.replace(/\/+$/, "");
  if (destFolder) await ensureFolder(app, destFolder);

  const fileName = `${sanitizeFileComponent(w.word)}.md`;
  const filePath = destFolder ? `${destFolder}/${fileName}` : fileName;

  const content = buildNoteContent(w, settings);

  const existing = app.vault.getAbstractFileByPath(filePath);
  let file: TFile;
  if (existing instanceof TFile) {
    await app.vault.modify(existing, content);
    file = existing;
  } else {
    file = await app.vault.create(filePath, content);
  }

  return { w, filePath, file };
}

// ----------------------------- Plugin class -----------------------------

export default class WOTDPlugin extends Plugin {
  settings: WOTDSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<WOTDSettings> | null,
    );

    this.addSettingTab(new WOTDSettingTab(this.app, this));

    this.addCommand({
      id: "wotd-fetch-now",
      name: "Fetch Word of the Day now",
      callback: async () => {
        try {
          const { w } = await createOrUpdateWotdNote(this.app, this.settings);
          new Notice(`WOTD saved: ${w.word}`);
        } catch (e: unknown) {
          console.error(e);
          new Notice(`WOTD error: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    });

    this.addCommand({
      id: "wotd-open-today",
      name: "Open today's WOTD note",
      callback: async () => {
        try {
          const { file } = await createOrUpdateWotdNote(this.app, this.settings);
          const leaf = this.app.workspace.getLeaf(true);
          await leaf.openFile(file);
        } catch (e: unknown) {
          console.error(e);
          new Notice(`WOTD error: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    });

    this.addCommand({
      id: "wotd-insert-link-here",
      name: "Insert link to today's WOTD at cursor",
      editorCallback: async (editor) => {
        try {
          const { w, filePath } = await createOrUpdateWotdNote(
            this.app,
            this.settings,
          );
          editor.replaceSelection(`[[${filePath}|${w.word}]]`);
        } catch (e: unknown) {
          console.error(e);
          new Notice(`WOTD error: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    });

    this.addRibbonIcon("message-square-quote", "Fetch WOTD", async () => {
      try {
        const { w } = await createOrUpdateWotdNote(this.app, this.settings);
        new Notice(`WOTD saved: ${w.word}`);
      } catch (e: unknown) {
        console.error(e);
        new Notice(`WOTD error: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

// ----------------------------- Settings Tab -----------------------------

class WOTDSettingTab extends PluginSettingTab {
  plugin: WOTDPlugin;

  constructor(app: App, plugin: WOTDPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Word of the Day – Settings" });

    // Destination folder with auto-suggest
    new Setting(containerEl)
      .setName("Destination folder")
      .setDesc(
        "Folder where WOTD notes will be created. Created if it doesn't exist.",
      )
      .addText((t) => {
        new FolderSuggest(this.app, t.inputEl);
        t.setPlaceholder("WOTD")
          .setValue(this.plugin.settings.destinationFolder)
          .onChange(async (v) => {
            this.plugin.settings.destinationFolder = (v || "").trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Include HTML from RSS in note body")
      .setDesc(
        "If enabled, includes Merriam-Webster's full description (definition, examples, etc.).",
      )
      .addToggle((tg) =>
        tg
          .setValue(this.plugin.settings.includeHtmlFromRSS)
          .onChange(async (val) => {
            this.plugin.settings.includeHtmlFromRSS = val;
            await this.plugin.saveSettings();
          }),
      );

    // Callout style section
    containerEl.createEl("h3", { text: "Callout Style" });

    const calloutDesc = containerEl.createEl("p", {
      cls: "setting-item-description",
    });
    calloutDesc.setText(
      "Obsidian has built-in callouts. Admonitions is a community plugin that provides an alternative syntax. ",
    );
    calloutDesc.createEl("a", {
      text: "View Admonitions documentation",
      href: "https://github.com/ebullient/obsidian-admonition",
    });

    new Setting(containerEl)
      .setName("Callout format")
      .setDesc("Choose between native Obsidian callouts or Admonitions plugin syntax.")
      .addDropdown((dd) =>
        dd
          .addOption("callout", "Callouts (built-in)")
          .addOption("admonition", "Admonitions (plugin)")
          .setValue(this.plugin.settings.calloutStyle)
          .onChange(async (val) => {
            this.plugin.settings.calloutStyle = val as CalloutStyle;
            await this.plugin.saveSettings();
          }),
      );

    // Osmosis flashcard section
    containerEl.createEl("h3", { text: "Osmosis Flashcards" });

    const osmosisDesc = containerEl.createEl("p", {
      cls: "setting-item-description",
    });
    osmosisDesc.setText("Osmosis is a unified note-taking, mind-mapping, and flashcard plugin for Obsidian. ");
    osmosisDesc.createEl("a", {
      text: "View Osmosis documentation",
      href: "https://sawyerrensel.github.io/Osmosis/",
    });

    new Setting(containerEl)
      .setName("Include Osmosis flashcard")
      .setDesc("Add a spaced-repetition flashcard to the WOTD note.")
      .addToggle((tg) =>
        tg
          .setValue(this.plugin.settings.includeOsmosisFlashcard)
          .onChange(async (val) => {
            this.plugin.settings.includeOsmosisFlashcard = val;
            await this.plugin.saveSettings();
            // Re-render to show/hide flashcard type dropdown
            this.display();
          }),
      );

    if (this.plugin.settings.includeOsmosisFlashcard) {
      new Setting(containerEl)
        .setName("Flashcard type")
        .setDesc("Choose the type of Osmosis flashcard to generate.")
        .addDropdown((dd) =>
          dd
            .addOption("cloze", "Cloze (fill-in-the-blank)")
            .addOption("basic", "Basic (front / back)")
            .addOption("bidi", "Bidirectional")
            .setValue(this.plugin.settings.osmosisFlashcardType)
            .onChange(async (val) => {
              this.plugin.settings.osmosisFlashcardType = val as FlashcardType;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Deck")
        .setDesc(
          'Assign flashcards to an Osmosis deck via frontmatter (e.g., "Vocab/Word of the Day"). Leave blank for automatic deck assignment.',
        )
        .addText((t) =>
          t
            .setPlaceholder("Vocab/Word of the Day")
            .setValue(this.plugin.settings.osmosisDeck)
            .onChange(async (v) => {
              this.plugin.settings.osmosisDeck = (v || "").trim();
              await this.plugin.saveSettings();
            }),
        );
    }

    // Test fetch button
    containerEl.createEl("h3", { text: "Test" });

    new Setting(containerEl)
      .setName("Test fetch")
      .setDesc("Fetches the current WOTD and creates/updates the note.")
      .addButton((btn) =>
        btn.setButtonText("Run").onClick(async () => {
          try {
            const { w } = await createOrUpdateWotdNote(
              this.app,
              this.plugin.settings,
            );
            new Notice(`WOTD saved: ${w.word}`);
          } catch (e: unknown) {
            console.error(e);
            new Notice(
              `WOTD error: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }),
      );
  }
}
