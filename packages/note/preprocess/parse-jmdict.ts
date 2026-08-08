import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { paths } from "#/tools/paths.ts";

export type JmdictTerm = {
  forms: string[];
  reading: string[];
  meanings: string[];
  antonym: string[];
  referenced: string[];
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

    const entries: JmdictTerm[] = [];

    $("entry").each((_, entry) => {
      const $entry = $(entry);

      const forms = $entry
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

      const antonym = $entry
        .find("sense ant")
        .map((_, el) => $(el).text().split("・")[0])
        .get();

      const referenced = $entry
        .find("sense xref")
        .map((_, el) => $(el).text().split("・")[0])
        .get();

      entries.push({ forms, reading, meanings, antonym, referenced });
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
      term.forms.forEach((form) => {
        if (termMap[form]) {
          const existing = termMap[form];
          const hasCommonReading = term.reading.some((r) => existing.reading.includes(r));
          if (hasCommonReading) {
            termMap[form] = {
              forms: existing.forms,
              reading: Array.from(new Set([...term.reading, ...existing.reading])),
              meanings: Array.from(new Set([...term.meanings, ...existing.meanings])),
              antonym: existing.antonym,
              referenced: existing.referenced,
            };
          }
        } else {
          termMap[form] = term;
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

// await jmdictParser.writeTerm();
// await jmdictParser.writeTermMap();
