import { cp, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { env } from "../tools/env.ts";
import { paths } from "../tools/paths.ts";

class Script {
  ANKI_MEDIA_DIR = env.ANKI_COLLECTION_MEDIA_PATH;

  async ensureAnkiDir() {
    await stat(this.ANKI_MEDIA_DIR);
  }

  async copyFiles(files: string[], srcDir: string) {
    for (const file of files) {
      const src = join(srcDir, file);
      await stat(src);
      const dest = join(this.ANKI_MEDIA_DIR, file);
      await cp(src, dest);
      console.log(`✅ Copied ${basename(src)}`);
    }
  }

  async copyDist() {
    const FILES = [
      "_kiku_front.html",
      "_kiku_back.html",
      "_kiku_style.css",
      "_kiku.css",
      "_kiku.js",
      "_kiku_lazy.js",
      "_kiku_libs.js",
      "_kiku_shared.js",
      "_kiku_worker.js",
      "_kiku_plugin.js",
      "_kiku_plugin.css",
    ];

    console.log("\n📁 Copying DIST files...");
    await this.copyFiles(FILES, paths["@/dist/"]);
  }

  async copyFonts() {
    const FONTS = [
      "_kiku_font_hina-mincho.woff2",
      "_kiku_font_klee-one.woff2",
      "_kiku_font_ibm-plex-sans-jp.woff2",
    ];

    console.log("\n📁 Copying FONTS...");
    await this.copyFiles(FONTS, paths["@/.fonts/"]);
  }

  async copyDatabases() {
    const DBS = ["_kiku_db_main.tar", "_kiku_db_main_manifest.json"];

    console.log("\n📁 Copying DATABASES...");
    await this.copyFiles(DBS, paths["@/.db/"]);
  }

  async run() {
    console.log(`🔍 Checking Anki collection at: ${this.ANKI_MEDIA_DIR}`);
    await this.ensureAnkiDir();
    await this.copyDist();
    await this.copyFonts();
    await this.copyDatabases();
    console.log("\n🎉 Done!");
  }
}

const script = new Script();
script.run();
