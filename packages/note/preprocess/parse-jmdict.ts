import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { paths } from "#/tools/paths.ts";

type JmdictTerm = {
  kanji: string[];
  reading: string[];
  meanings: string[];
};

export class JmdictParser {
  //NOTE: download and extract JMdict_e from ftp://ftp.edrdg.org/pub/Nihongo//JMdict_e.gz

  async ensureDir() {
    await mkdir(paths["@/.jmdict/"], { recursive: true });
  }

  async load() {
    const xml = await readFile(paths["@/.jmdict/JMdict_e"], "utf8");
    return cheerio.load(xml, { xmlMode: true });
  }

  async parseAll() {
    const $ = await this.load();

    const entries: {
      kanji: string[];
      reading: string[];
      meanings: string[];
    }[] = [];

    $("entry").each((_, entry) => {
      const $entry = $(entry);

      const kanji = $entry
        .find("k_ele keb")
        .map((_, el) => $(el).text())
        .get();

      const reading = $entry
        .find("r_ele reb")
        .map((_, el) => $(el).text())
        .get();

      const meanings = $entry
        .find("sense gloss")
        .map((_, el) => $(el).text())
        .get();

      entries.push({ kanji, reading, meanings });
    });

    console.log(entries);
    return entries;
  }

  async writeTerm() {
    const terms = await this.parseAll();
    await writeFile(paths["@/.jmdict/term.json"], JSON.stringify(terms, null, 2));
  }

  async writeTermMap() {
    const terms = JSON.parse(await readFile(paths["@/.jmdict/term.json"], "utf8")) as JmdictTerm[];
    const termMap: Record<string, JmdictTerm> = {};
    terms.forEach((term) => {
      term.kanji.forEach((kanji) => {
        if (termMap[kanji]) {
          termMap[kanji] = {
            kanji: Array.from(new Set([...term.kanji, ...termMap[kanji].kanji])),
            meanings: Array.from(new Set([...term.meanings, ...termMap[kanji].meanings])),
            reading: Array.from(new Set([...term.reading, ...termMap[kanji].reading])),
          };
        } else {
          termMap[kanji] = term;
        }
      });
    });

    await writeFile(paths["@/.jmdict/termMap.json"], JSON.stringify(termMap, null, 2));
  }

  termMap: Record<string, JmdictTerm> | undefined = undefined;
  async lookup(term: string) {
    this.termMap =
      this.termMap || JSON.parse(await readFile(paths["@/.jmdict/termMap.json"], "utf8"));
    if (!this.termMap) throw new Error("termMap not found");
    return this.termMap[term];
  }
}

export const jmdictParser = new JmdictParser();

// step 1
// await jmdictParser.writeTerm();

// step 2
// await jmdictParser.writeTermMap();
