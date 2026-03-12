import { stat } from "node:fs/promises";
import { join } from "node:path";
import express from "express";
import type { PluginOption } from "vite";
import { ENV } from "./env.ts";

const TOOLS_DIR = import.meta.dirname;
const NOTE_PACKAGE_DIR = join(TOOLS_DIR, "..");

export function serveAnkiCollectionMedia(): PluginOption {
  return {
    name: "serve-anki-media-root",
    configureServer: async (server) => {
      const ANKI_MEDIA_DIR = ENV.ANKI_COLLECTION_MEDIA_PATH;
      const LOCAL_MEDIA_DIR = join(NOTE_PACKAGE_DIR, ".collection.media");

      for (const dir of [ANKI_MEDIA_DIR, LOCAL_MEDIA_DIR]) {
        try {
          await stat(dir);
          //@ts-expect-error idk but it works
          server.middlewares.use(express.static(dir));
        } catch (e) {
          // ignore
        }
      }
    },
  };
}
