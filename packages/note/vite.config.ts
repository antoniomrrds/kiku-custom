import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import circularDpendency from "vite-plugin-circular-dependency";
import dts from "vite-plugin-dts";
import solid from "vite-plugin-solid";
import { paths } from "./tools/paths.js";
import { getVersion } from "./tools/util.js";
import { serveAnkiCollectionMedia } from "./tools/vite-plugin-serve-anki-collection.media.js";

const fastBuild = process.env.FAST_BUILD === "true";
const plugins: PluginOption[] = [solid({ ssr: true }), tailwindcss()];
if (!fastBuild) {
  plugins.push(serveAnkiCollectionMedia());
  plugins.push(
    circularDpendency({ outputFilePath: "./.circularDependency.json" }),
  );
  plugins.push(
    dts({ tsconfigPath: "./tsconfig.app.json", outDirs: "./dist/types" }),
  );
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "#/plugins": paths["@/plugins/"],
      "#": paths["@/src/"],
    },
  },
  define: {
    __VERSION__: JSON.stringify(await getVersion()),
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
      external: [
        "_kiku_font_hina-mincho.woff2",
        "_kiku_font_klee-one.woff2",
        "_kiku_font_ibm-plex-sans-jp.woff2",
      ],
      output: {
        codeSplitting: {
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
