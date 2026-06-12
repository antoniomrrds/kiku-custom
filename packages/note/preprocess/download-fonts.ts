import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import { join, resolve } from "node:path";
import unzipper from "unzipper";

import { paths } from "../tools/paths.ts";

type FontMeta = {
  id: string;
  family: string;
};

class Script {
  GOOGLE_FONTS = ["Hina Mincho", "Klee One", "IBM Plex Sans JP"];
  API_BASE = "https://gwfh.mranftl.com/api/fonts";
  allFonts: FontMeta[] = [];

  ensureOutputDir = async () => {
    await fs.mkdir(paths["@/.fonts/"], { recursive: true });
  };

  fetchFontMetadata = async () => {
    console.log("📡 Fetching font metadata...");
    this.allFonts = await fetch(this.API_BASE).then((r) => r.json());
  };

  findFontId = (name: string) => {
    return this.allFonts.find(
      (f) => f.family.toLowerCase() === name.toLowerCase(),
    )?.id;
  };

  buildDownloadUrl = (id: string) => {
    return `${this.API_BASE}/${id}?download=zip&subsets=latin,japanese&formats=woff2&variants=regular`;
  };

  downloadAndExtractFont = async (name: string): Promise<boolean> => {
    try {
      const id = this.findFontId(name);
      if (!id) {
        console.error(`❌ Font not found in API: ${name}`);
        return false;
      }

      const fontsDir = resolve(paths["@/.fonts/"]);
      const zipPath = resolve(join(paths["@/.fonts/"], `${id}.zip`));
      const url = this.buildDownloadUrl(id);

      console.log(`📦 Downloading ${name} (${id})...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      await fs.writeFile(zipPath, Buffer.from(buffer));

      console.log(`📂 Extracting ${id}...`);

      await new Promise<void>((resolvePromise, rejectPromise) => {
        createReadStream(zipPath)
          .pipe(unzipper.Parse())
          .on("entry", (entry) => {
            const fileName = entry.path as string;

            if (fileName.endsWith(".woff2")) {
              const dest = join(fontsDir, `_kiku_font_${id}.woff2`);

              entry
                .pipe(createWriteStream(dest))
                .on("finish", () => {
                  console.log(`🎨 Extracted → ${dest}`);
                })
                .on("error", rejectPromise);
            } else {
              entry.autodrain();
            }
          })
          .on("finish", resolvePromise)
          .on("error", rejectPromise);
      });

      await fs.rm(zipPath, { force: true });
      return true;
    } catch (err) {
      console.error(
        `❌ Failed for ${name}:`,
        err instanceof Error ? err.message : err,
      );
      return false;
    }
  };

  renameWoff2 = async (dir: string, id: string) => {
    const files = await fs.readdir(dir);
    const woff2Files = files.filter((f) => f.endsWith(".woff2"));
    if (woff2Files.length === 0) {
      throw new Error(`No .woff2 found is extracted dir for ${id}`);
    }

    for (const file of woff2Files) {
      const src = resolve(join(dir, file));
      const dest = resolve(join(paths["@/.fonts/"], `_kiku_font_${id}.woff2`));
      await fs.rename(src, dest);
      console.log(`🎨 Renamed → ${dest}`);
    }
  };

  run = async () => {
    console.log("📁 fonts dir:", paths["@/.fonts/"]);
    await this.ensureOutputDir();
    await this.fetchFontMetadata();

    const results: boolean[] = [];
    for (const name of this.GOOGLE_FONTS) {
      results.push(await this.downloadAndExtractFont(name));
    }

    if (results.some((r) => !r)) {
      console.error("❌ Some fonts failed. Aborting.");
      process.exit(1);
    }

    console.log("\n🎉 All fonts downloaded and renamed!");
  };
}

const script = new Script();
script.run();
