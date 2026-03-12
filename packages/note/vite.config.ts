import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import express from "express";
import { defineConfig, type PluginOption } from "vite";
import circularDpendency from "vite-plugin-circular-dependency";
import solid from "vite-plugin-solid";

const nodeRequire = createRequire(import.meta.url);
const packageJson = nodeRequire("./package.json");
const version = packageJson.version;
if (typeof version !== "string") throw Error("version is not a string");

const ROOT_DIR = join(import.meta.dirname);

function serveAnkiCollectionMediaPlugin(): PluginOption {
  return {
    name: "serve-anki-media-root",
    configureServer: async (server) => {
      const BASE_DIR =
        process.platform === "win32"
          ? (process.env.APPDATA ?? "")
          : join(process.env.HOME ?? "", ".local/share");
      const USER = "yym";
      // const USER = "User 1";
      const ANKI_MEDIA_DIR = join(BASE_DIR, `Anki2/${USER}/collection.media`);
      const LOCAL_MEDIA_DIR = join(import.meta.dirname, ".collection.media");

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

export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    tailwindcss(),
    serveAnkiCollectionMediaPlugin(),
    circularDpendency({
      outputFilePath: "./.circularDependency.json",
      circleImportThrowErr: true,
    }),
  ],
  resolve: {
    alias: {
      "#": join(import.meta.dirname, "src"),
    },
  },
  define: {
    __VERSION__: JSON.stringify(version),
  },
  build: {
    lib: {
      entry: join(ROOT_DIR, "src/index.tsx"),
      fileName: "_kiku",
      formats: ["es"],
    },
    copyPublicDir: false,
    cssCodeSplit: false,
    cssMinify: false,
    minify: false,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              test: (id) => {
                const result = /node_modules/.test(id);
                return result;
              },
              // _kiku_libs contains modules that is imported from node_modules
              name: "_kiku_libs",
            },
            {
              test: (id) => {
                const result =
                  /src\/util/.test(id) || /src\/components\/shared/.test(id);
                return result;
              },
              // _kiku_shared is module that is used by _kiku.js and _kiku_lazy.js
              name: "_kiku_shared",
            },
          ],
        },
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        minify: false,
      },
    },
  },
  worker: {
    format: "es",
    rolldownOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
