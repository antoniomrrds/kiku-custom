import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { PluginOption } from "vite";
import { paths } from "./paths";

const MIME: Record<string, string> = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".tar": "application/x-tar",
  ".html": "text/html",
};

const URL_MAP: Record<string, string> = {
  "/_kiku.css": paths["@note/dist/_kiku.css"],
  "/_kiku_db_main.tar": paths["@note/.db/_kiku_db_main.tar"],
  "/_kiku_db_main_manifest.json": paths["@note/.db/_kiku_db_main_manifest.json"],
  "/_kiku_plugin.js": paths["@note/template/_kiku_plugin.js"],
  "/_kiku_plugin.css": paths["@note/template/_kiku_plugin.css"],
};

export function vitePluginServeKikuAssets() {
  const plugin = {
    name: "vite-plugin-serve-kiku-assets",
    configureServer: async (server) => {
      server.middlewares.use("/", async (req, res, next) => {
        const filePath = URL_MAP[req.url ?? ""];
        if (!filePath) return next();

        const ext = extname(filePath);
        try {
          const data = await readFile(filePath);
          res.setHeader("Content-Type", MIME[ext] ?? "application/octet-stream");
          res.setHeader("Cache-Control", "public, max-age=60");
          res.end(data);
        } catch {
          next();
        }
      });
    },
  } satisfies PluginOption;
  return plugin;
}
