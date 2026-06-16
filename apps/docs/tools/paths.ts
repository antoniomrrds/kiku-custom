import { join } from "node:path";

const TOOLS_DIR = import.meta.dirname;
const ROOT = join(TOOLS_DIR, "..");
const NOTE = join(ROOT, "../../packages/note");

const p = (path: string) => join(ROOT, path);
const n = (path: string) => join(NOTE, path);

/**
 * Common paths used in the package.
 * Keys starting with "@" represent the package root.
 * Keys starting with "@note/" represent the note package root.
 * Directories end with "/", files do not.
 */
// oxfmt-ignore
export const paths = {
  "@/":                                       `${ROOT}/`,
  "@/tools/":                                 p("tools/"),
  "@/package.json":                           p("package.json"),
  "@/tsconfig.json":                          p("tsconfig.json"),
  "@/env":                                    p(".env"),

  "@/src/":                                   p("src/"),
  "@/src/lib/":                               p("src/lib/"),
  "@/src/components/":                        p("src/components/"),
  "@/src/styles/":                            p("src/styles/"),

  "@/mds/":                                   p("mds/"),
  "@/public/":                                p("public/"),

  "@/.vitepress/dist/":                       p(".vitepress/dist/"),

  "@note/dist/_kiku.css":                     n("dist/_kiku.css"),
  "@note/dist/_kiku.js":                      n("dist/_kiku.js"),
  "@note/dist/_kiku_lazy.js":                 n("dist/_kiku_lazy.js"),
  "@note/dist/_kiku_libs.js":                 n("dist/_kiku_libs.js"),
  "@note/dist/_kiku_shared.js":               n("dist/_kiku_shared.js"),
  "@note/dist/_kiku_worker.js":               n("dist/_kiku_worker.js"),
  "@note/.db/_kiku_db_main.tar":              n(".db/_kiku_db_main.tar"),
  "@note/.db/_kiku_db_main_manifest.json":    n(".db/_kiku_db_main_manifest.json"),
  "@note/template/_kiku_plugin.js":           n("template/_kiku_plugin.js"),
  "@note/template/_kiku_plugin.css":          n("template/_kiku_plugin.css"),
} as const;
