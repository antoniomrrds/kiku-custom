import { join } from "node:path";

const TOOLS_DIR = import.meta.dirname;
const ROOT = join(TOOLS_DIR, "..");

const p = (path: string) => join(ROOT, path);

/**
 * Common paths used in the note package.
 * Keys starting with "@" represent the package root.
 * Directories end with "/", files do not.
 */
// biome-ignore format: this looks nicer
export const paths = {
  "@/":                                        `${ROOT}/`,
  "@/.env":                                    p(".env"),
  "@/package.json":                            p("package.json"),

  "@/src/":                                    p("src/"),
  "@/dist/":                                   p("dist/"),
  "@/preprocess/":                             p("preprocess/"),
  "@/script/":                                 p("script/"),
  "@/tools/":                                  p("tools/"),

  "@/src/index.tsx":                           p("src/index.tsx"),

  "@/src/templates/":                          p("src/templates/"),
  "@/src/templates/front.html":                p("src/templates/front.html"),
  "@/src/templates/back.html":                 p("src/templates/back.html"),
  "@/src/templates/style.css":                 p("src/templates/style.css"),
  "@/src/templates/_kiku_plugin.js":           p("src/templates/_kiku_plugin.js"),
  "@/src/templates/_kiku_plugin.css":          p("src/templates/_kiku_plugin.css"),

  "@/dist/_kiku_front.html":                   p("dist/_kiku_front.html"),
  "@/dist/_kiku_back.html":                    p("dist/_kiku_back.html"),
  "@/dist/_kiku_style.css":                    p("dist/_kiku_style.css"),
  "@/dist/_kiku.css":                          p("dist/_kiku.css"),
  "@/dist/_kiku_plugin.js":                    p("dist/_kiku_plugin.js"),
  "@/dist/_kiku_plugin.css":                   p("dist/_kiku_plugin.css"),

  "@/.collection.media/":                      p(".collection.media/"),

  "@/.db/":                                    p(".db/"),
  "@/.db/kiku_db_kanji.json":                  p(".db/kiku_db_kanji.json"),
  "@/.db/kiku_db_kanji_compact.json":          p(".db/kiku_db_kanji_compact.json"),
  "@/.db/kiku_db_kanji_compact.json.gz":       p(".db/kiku_db_kanji_compact.json.gz"),
  "@/.db/_kiku_db_main.tar":                   p(".db/_kiku_db_main.tar"),
  "@/.db/_kiku_db_main_manifest.json":         p(".db/_kiku_db_main_manifest.json"),

  "@/.dicts/":                                 p(".dicts/"),
  "@/.fonts/":                                 p(".fonts/"),
  "@/.release/":                               p(".release/"),

  "@/.jmdict/":                                p(".jmdict/"),
  "@/.jmdict/JMdict_e":                        p(".jmdict/JMdict_e"),
  "@/.jmdict/term.json":                       p(".jmdict/term.json"),
  "@/.jmdict/termMap.json":                    p(".jmdict/termMap.json"),

  "@/.jpdb/":                                  p(".jpdb/"),
  "@/.jpdb/kanji-by-frequency/":               p(".jpdb/kanji-by-frequency/"),
  "@/.jpdb/kanji-by-frequency/kyoiku.html":    p(".jpdb/kanji-by-frequency/kyoiku.html"),
  "@/.jpdb/kanji-by-frequency/joyo.html":      p(".jpdb/kanji-by-frequency/joyo.html"),
  "@/.jpdb/kanji-by-frequency/jinmeiyo.html":  p(".jpdb/kanji-by-frequency/jinmeiyo.html"),
  "@/.jpdb/kanji-by-frequency/hyogai.html":    p(".jpdb/kanji-by-frequency/hyogai.html"),
  "@/.jpdb/kanji-by-frequency/kyoiku.json":    p(".jpdb/kanji-by-frequency/kyoiku.json"),
  "@/.jpdb/kanji-by-frequency/joyo.json":      p(".jpdb/kanji-by-frequency/joyo.json"),
  "@/.jpdb/kanji-by-frequency/jinmeiyo.json":  p(".jpdb/kanji-by-frequency/jinmeiyo.json"),
  "@/.jpdb/kanji-by-frequency/hyogai.json":    p(".jpdb/kanji-by-frequency/hyogai.json"),
  "@/.jpdb/kanji/":                            p(".jpdb/kanji/"),
  "@/.jpdb/kanji.json":                        p(".jpdb/kanji.json"),
  "@/.jpdb/kanji-error.json":                  p(".jpdb/kanji-error.json"),
 
  "@/.kanjivg/":                               p(".kanjivg/"),
  "@/.kanjivg/kanjivg.zip":                    p(".kanjivg/kanjivg.zip"),
  "@/.kanjivg/kanji/":                         p(".kanjivg/kanji/"),
  "@/.kanjivg/kanji.json":                     p(".kanjivg/kanji.json"),

  "@/.wk/":                                    p(".wk/"),
  "@/.wk/pleasant.html":                       p(".wk/pleasant.html"),
  "@/.wk/painful.html":                        p(".wk/painful.html"),
  "@/.wk/death.html":                          p(".wk/death.html"),
  "@/.wk/hell.html":                           p(".wk/hell.html"),
  "@/.wk/paradise.html":                       p(".wk/paradise.html"),
  "@/.wk/reality.html":                        p(".wk/reality.html"),
  "@/.wk/vocab_pleasant.html":                 p(".wk/vocab_pleasant.html"),
  "@/.wk/vocab_painful.html":                  p(".wk/vocab_painful.html"),
  "@/.wk/vocab_death.html":                    p(".wk/vocab_death.html"),
  "@/.wk/vocab_hell.html":                     p(".wk/vocab_hell.html"),
  "@/.wk/vocab_paradise.html":                 p(".wk/vocab_paradise.html"),
  "@/.wk/vocab_reality.html":                  p(".wk/vocab_reality.html"),
  "@/.wk/all_kanji.json":                      p(".wk/all_kanji.json"),
  "@/.wk/kanji/":                              p(".wk/kanji/"),
  "@/.wk/failed_kanji.json":                   p(".wk/failed_kanji.json"),
  "@/.wk/wk_kanji_info.json":                  p(".wk/wk_kanji_info.json"),
  "@/.wk/vocab/":                              p(".wk/vocab/"),
  "@/.wk/all_vocab.json":                      p(".wk/all_vocab.json"),
  "@/.wk/failed_vocab.json":                   p(".wk/failed_vocab.json"),
} as const;
