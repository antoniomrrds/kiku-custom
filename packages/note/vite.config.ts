import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import circularDpendency from "vite-plugin-circular-dependency";
import solid from "vite-plugin-solid";
import { paths } from "./tools/paths.js";
import { serveAnkiCollectionMedia } from "./tools/vite-plugin-serve-anki-collection.media.js";

const nodeRequire = createRequire(import.meta.url);
const packageJson = nodeRequire("./package.json");
const version = packageJson.version;
if (typeof version !== "string") throw Error("version is not a string");

export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    tailwindcss(),
    serveAnkiCollectionMedia(),
    circularDpendency({
      outputFilePath: "./.circularDependency.json",
      circleImportThrowErr: true,
    }),
  ],
  resolve: {
    alias: {
      "#": paths["@/src/"],
    },
  },
  define: {
    __VERSION__: JSON.stringify(version),
  },
  build: {
    lib: {
      entry: paths["@/src/index.tsx"],
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
