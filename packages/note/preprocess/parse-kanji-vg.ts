import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import extract from "extract-zip";
import { paths } from "#/tools/paths.ts";

export type KanjiComposition = Record<
  string,
  {
    composedOf: string[];
    usedIn: string[];
  }
>;

class KanjiVgParser {
  DOWNLOAD_URL =
    "https://github.com/KanjiVG/kanjivg/releases/download/r20250816/kanjivg-20250816-main.zip";

  async fetchAndExtractKanjiVG(): Promise<void> {
    await mkdir(paths["@/.kanjivg/"], { recursive: true });

    console.log("Fetching ZIP from", this.DOWNLOAD_URL);
    const resp = await fetch(this.DOWNLOAD_URL);
    if (!resp.ok || !resp.body) {
      throw new Error(`Failed to download: ${resp.status} ${resp.statusText}`);
    }

    console.log("Writing ZIP to", paths["@/.kanjivg/kanjivg.zip"]);
    const buffer = await resp.arrayBuffer();
    await writeFile(paths["@/.kanjivg/kanjivg.zip"], Buffer.from(buffer));

    console.log("Download complete, extracting...");

    await extract(paths["@/.kanjivg/kanjivg.zip"], {
      dir: paths["@/.kanjivg/"],
    });
    console.log("Extraction complete.");
  }

  parseKanjiVG(svgContent: string) {
    const $ = cheerio.load(svgContent, { xmlMode: true });
    const rootGroup = $("g[kvg\\:element]").first();
    const kanji = rootGroup.attr("kvg:element");

    const composedOf = new Set<string>();
    const children = rootGroup.children();
    type El = (typeof children)[number];

    const getTopLevel = (_: unknown, child: El) => {
      const $child = $(child);
      const direct = $child.attr("kvg:element");
      if (direct && direct !== kanji) {
        composedOf.add(direct);
        return;
      }
      $child.children().each(getTopLevel);
    };

    children.each(getTopLevel);
    return {
      kanji,
      composedOf: Array.from(composedOf),
    };
  }

  async writeKanjiVgJson() {
    const files = await readdir(paths["@/.kanjivg/kanji/"]);
    const kanjiComposition: KanjiComposition = {};
    for (let i = 0; i < files.length; i++) {
      // if (i > 1) break;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Processing ${i + 1}/${files.length}`);
      const file = files[i];
      const svgContent = await readFile(join(paths["@/.kanjivg/kanji/"], file), "utf8");
      const { kanji, composedOf } = this.parseKanjiVG(svgContent);
      if (!kanji) throw new Error(`Failed to parse ${file}`);
      kanjiComposition[kanji] = { composedOf, usedIn: [] };
    }

    for (const [kanji, data] of Object.entries(kanjiComposition)) {
      for (const part of data.composedOf) {
        if (kanjiComposition[part]) {
          kanjiComposition[part].usedIn.push(kanji);
        }
      }
    }

    await writeFile(paths["@/.kanjivg/kanji.json"], JSON.stringify(kanjiComposition, null, 2));
  }

  async readKanjiVgJson() {
    return JSON.parse(await readFile(paths["@/.kanjivg/kanji.json"], "utf8")) as KanjiComposition;
  }
}

export const kanjiVgParser = new KanjiVgParser();

// await kanjiVgParser.fetchAndExtractKanjiVG();
// await kanjiVgParser.writeKanjiVgJson();
