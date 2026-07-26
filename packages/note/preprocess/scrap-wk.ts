import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { paths } from "#/tools/paths.ts";
import { sleep } from "#/tools/util.ts";

type WkKanji = {
  visuallySimilar: string[];
  primaryMeaning: string;
};

class WkScraper {
  WK_DIFFICULTY_URLS = [
    {
      difficulty: "pleasant",
      url: "https://www.wanikani.com/kanji?difficulty=pleasant",
      dest: paths["@/.wk/pleasant.html"],
    },
    {
      difficulty: "painful",
      url: "https://www.wanikani.com/kanji?difficulty=painful",
      dest: paths["@/.wk/painful.html"],
    },
    {
      difficulty: "death",
      url: "https://www.wanikani.com/kanji?difficulty=death",
      dest: paths["@/.wk/death.html"],
    },
    {
      difficulty: "hell",
      url: "https://www.wanikani.com/kanji?difficulty=hell",
      dest: paths["@/.wk/hell.html"],
    },
    {
      difficulty: "paradise",
      url: "https://www.wanikani.com/kanji?difficulty=paradise",
      dest: paths["@/.wk/paradise.html"],
    },
    {
      difficulty: "reality",
      url: "https://www.wanikani.com/kanji?difficulty=reality",
      dest: paths["@/.wk/reality.html"],
    },
  ];

  WK_VOCAB_LIST_URLS = [
    {
      difficulty: "pleasant",
      url: "https://www.wanikani.com/vocabulary?difficulty=pleasant",
      dest: paths["@/.wk/vocab_pleasant.html"],
    },
    {
      difficulty: "painful",
      url: "https://www.wanikani.com/vocabulary?difficulty=painful",
      dest: paths["@/.wk/vocab_painful.html"],
    },
    {
      difficulty: "death",
      url: "https://www.wanikani.com/vocabulary?difficulty=death",
      dest: paths["@/.wk/vocab_death.html"],
    },
    {
      difficulty: "hell",
      url: "https://www.wanikani.com/vocabulary?difficulty=hell",
      dest: paths["@/.wk/vocab_hell.html"],
    },
    {
      difficulty: "paradise",
      url: "https://www.wanikani.com/vocabulary?difficulty=paradise",
      dest: paths["@/.wk/vocab_paradise.html"],
    },
    {
      difficulty: "reality",
      url: "https://www.wanikani.com/vocabulary?difficulty=reality",
      dest: paths["@/.wk/vocab_reality.html"],
    },
  ];

  async ensureWkDir() {
    await mkdir(paths["@/.wk/"], { recursive: true });
    await mkdir(paths["@/.wk/kanji/"], { recursive: true });
    await mkdir(paths["@/.wk/vocab/"], { recursive: true });
  }

  async writeWkKanjiHtml() {
    for (const { difficulty, url, dest } of this.WK_DIFFICULTY_URLS) {
      const res = await fetch(url);
      const html = await res.text();
      await writeFile(dest, html);
    }
  }

  async writeAllKanji() {
    const kanjiSet = new Set<string>();

    for (const entry of this.WK_DIFFICULTY_URLS) {
      const html = await readFile(entry.dest, "utf-8");
      const $ = cheerio.load(html);

      // selector: each kanji appears inside .subject-character__characters-text (lang="ja")
      $(".subject-character__characters-text[lang='ja']").each((_, el) => {
        const raw = $(el).text().trim();
        if (kanjiSet.has(raw)) throw new Error(`Duplicate kanji: ${raw}`);
        kanjiSet.add(raw);
      });
    }

    // preserve insertion order by converting Set -> Array
    const result = Array.from(kanjiSet);
    await writeFile(paths["@/.wk/all_kanji.json"], JSON.stringify(result, null, 2));
  }

  async writeWkKanjiInfoHtml() {
    const allKanji = JSON.parse(await readFile(paths["@/.wk/all_kanji.json"], "utf8")) as string[];

    let failedKanji: string[] = [];
    try {
      const text = await readFile(paths["@/.wk/failed_kanji.json"], "utf8");
      const failedKanjiJson = JSON.parse(text);
      failedKanji = failedKanjiJson;
    } catch {
      console.error("Failed to read failed kanji");
    }
    for (let i = 0; i < allKanji.length; i++) {
      const kanji = allKanji[i];
      try {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `Fetching ${kanji} -- ${i + 1}/${allKanji.length} -- Error: ${failedKanji.length}`,
        );
        const res = await fetch(`https://www.wanikani.com/kanji/${encodeURIComponent(kanji)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        await writeFile(join(paths["@/.wk/kanji/"], `${kanji}.html`), html);
      } catch (e) {
        console.error(`Failed to write kanji info for ${kanji}:`, e);
        failedKanji.push(kanji);
      }
      await sleep(200);
    }
    await writeFile(
      paths["@/.wk/failed_kanji.json"],
      JSON.stringify(Array.from(new Set(failedKanji)), null, 2),
    );
  }

  parseWkKanjiInfo(html: string): WkKanji {
    const $ = cheerio.load(html);

    const visuallySimilar: string[] = [];
    let primaryMeaning: string = "";

    // --- 1. Extract visually similar kanji ---
    const section = $(".subject-section--similar-subjects");
    if (section.length !== 0) {
      section
        .find(".subject-character-grid__item .subject-character__characters-text[lang='ja']")
        .each((_, el) => {
          const text = $(el).text().trim();
          if (text) visuallySimilar.push(text);
        });
    }

    // --- 2. Extract primary meaning ---
    const primary = $(".subject-section__meanings--primary .subject-section__meanings-items")
      .first()
      .text()
      .trim();

    if (primary) {
      primaryMeaning = primary;
    }

    return {
      visuallySimilar,
      primaryMeaning,
    };
  }

  async writeParsedKanjiJson() {
    const allKanji = JSON.parse(await readFile(paths["@/.wk/all_kanji.json"], "utf8")) as string[];

    const result: Record<string, WkKanji> = {};

    for (const kanji of allKanji) {
      const htmlPath = join(paths["@/.wk/kanji/"], `${kanji}.html`);
      const html = await readFile(htmlPath, "utf8");

      const data = this.parseWkKanjiInfo(html);
      result[kanji] = data;
    }

    await writeFile(paths["@/.wk/wk_kanji_info.json"], JSON.stringify(result, null, 2));
  }

  async writeWkVocabHtml() {
    for (const { url, dest } of this.WK_VOCAB_LIST_URLS) {
      const res = await fetch(url);
      const html = await res.text();
      await writeFile(dest, html);
    }
  }

  async writeAllVocab() {
    const vocabItems: string[] = [];

    for (const entry of this.WK_VOCAB_LIST_URLS) {
      const html = await readFile(entry.dest, "utf8");
      const $ = cheerio.load(html);
      $("a.subject-character--vocabulary").each((_, el) => {
        const $el = $(el);
        const vocab = $el.find(".subject-character__characters-text[lang='ja']").text().trim();
        if (!vocab) throw new Error(`Failed to parse vocab`);
        vocabItems.push(vocab);
      });
    }

    await writeFile(
      paths["@/.wk/all_vocab.json"],
      JSON.stringify(Array.from(new Set(vocabItems)), null, 2),
    );
  }

  async writeWkVocabInfoHtml() {
    const allVocab = JSON.parse(await readFile(paths["@/.wk/all_vocab.json"], "utf8")) as string[];

    let failedVocab: string[] = [];
    try {
      const text = await readFile(paths["@/.wk/failed_vocab.json"], "utf8");
      const json = JSON.parse(text);
      failedVocab = json;
    } catch {
      console.error("Failed to read failed_vocab");
    }
    for (let i = 0; i < allVocab.length; i++) {
      const vocab = allVocab[i];
      try {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `Fetching ${vocab} -- ${i + 1}/${allVocab.length} -- Error: ${failedVocab.length}`,
        );
        const res = await fetch(`https://www.wanikani.com/vocabulary/${encodeURIComponent(vocab)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        await writeFile(join(paths["@/.wk/vocab/"], `${vocab}.html`), html);
      } catch (e) {
        console.error(`Failed to write vocab info for ${vocab}:`, e);
        failedVocab.push(vocab);
      }
      await sleep(50);
    }
    await writeFile(
      paths["@/.wk/failed_vocab.json"],
      JSON.stringify(Array.from(new Set(failedVocab)), null, 2),
    );
  }

  async readWkKanjiInfoJson() {
    return JSON.parse(await readFile(paths["@/.wk/wk_kanji_info.json"], "utf8")) as Record<
      string,
      WkKanji
    >;
  }
}

export const wkScraper = new WkScraper();
await wkScraper.ensureWkDir();

// await wkScraper.writeWkKanjiHtml();
// await wkScraper.writeAllKanji();
// await wkScraper.writeWkKanjiInfoHtml();
// await wkScraper.writeParsedKanjiJson();
// await wkScraper.writeWkVocabHtml();
// await wkScraper.writeAllVocab();
// await wkScraper.writeWkVocabInfoHtml();
