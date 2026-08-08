import { stat } from "node:fs/promises";
import serveStatic from "serve-static";
import type { PluginOption } from "vite";
import { env } from "./env.ts";
import { paths } from "./paths.ts";

export function serveAnkiCollectionMedia(): PluginOption {
  return {
    name: "serve-anki-media-root",
    configureServer: async (server) => {
      for (const dir of [env.ANKI_COLLECTION_MEDIA_PATH, paths["@/.collection.media/"]]) {
        try {
          await stat(dir);
          server.middlewares.use(serveStatic(dir, { maxAge: 60000 }));
        } catch {}
      }
    },
  };
}
