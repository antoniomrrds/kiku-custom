import { isServer } from "solid-js/web";
import { type AnkiFields, ankiFieldsSkeleton } from "#/util/types";
import { exampleFields } from "./examples";

const version: string =
  // @ts-expect-error: injected by vite
  typeof __VERSION__ !== "undefined" ? __VERSION__ : "unknown";

const assets = {
  "_kiku_config.json": "_kiku_config.json",
  "_kiku_front.html": "_kiku_front.html",
  "_kiku_back.html": "_kiku_back.html",
  "_kiku_style.css": "_kiku_style.css",
  "_kiku_notes_manifest.json": "_kiku_notes_manifest.json",
  "_kiku_db_main.tar": "_kiku_db_main.tar",
  "_kiku_db_main_manifest.json": "_kiku_db_main_manifest.json",
  "_kiku_plugin.js": "_kiku_plugin.js",

  "_kiku.js": "_kiku.js",
  "_kiku_libs.js": "_kiku_libs.js",
  "_kiku_shared.js": "_kiku_shared.js",
  "_kiku_lazy.js": "_kiku_lazy.js",
  "_kiku_worker.js": "_kiku_worker.js",
  "_kiku_plugin.css": "_kiku_plugin.css",
  "_kiku.css": "_kiku.css",

  "_kiku_font_hina-mincho.woff2": "_kiku_font_hina-mincho.woff2",
  "_kiku_font_ibm-plex-sans-jp.woff2": "_kiku_font_ibm-plex-sans-jp.woff2",
  "_kiku_font_klee-one.woff2": "_kiku_font_klee-one.woff2",
};

// biome-ignore format: this looks nicer
export const constants = {
  KIKU_VERSION: version,
  KIKU_NOTE_TYPE: "Kiku",
  KIKU_CARD_TYPE: "Mining",
  key: {
    "kiku-config": "kiku-config",
    "kiku-is-theme-changed": "kiku-is-theme-changed",
  },
  assets,
  tar: {
    "kiku_db_kanji_compact.json.gz": "kiku_db_kanji_compact.json.gz",
  },
  KIKU_IMPORTANT_FILES: [
    assets["_kiku.js"],
    assets["_kiku_libs.js"],
    assets["_kiku_shared.js"],
    assets["_kiku_lazy.js"],
    assets["_kiku_worker.js"],
    assets["_kiku_plugin.js"],
    assets["_kiku_plugin.css"],

    assets["_kiku_front.html"],
    assets["_kiku_back.html"],
    assets["_kiku_style.css"],
    assets["_kiku.css"],

    assets["_kiku_font_hina-mincho.woff2"],
    assets["_kiku_font_ibm-plex-sans-jp.woff2"],
    assets["_kiku_font_klee-one.woff2"],

    assets["_kiku_db_main.tar"],
    assets["_kiku_db_main_manifest.json"],
    assets["_kiku_notes_manifest.json"],
  ]
};

export type Constants = typeof constants;

export function extractKanji(str: string): string[] {
  // Match all CJK Unified Ideographs (Kanji range)
  const matches = str.match(/\p{Script=Han}/gu);
  return matches ? Array.from(new Set(matches)) : [];
}

export function getAnkiFields() {
  let divs: NodeListOf<Element> | Element[] | undefined = isServer
    ? undefined
    : document.querySelectorAll("#anki-fields > div");
  if (import.meta.env.DEV && !isServer) {
    divs = Object.entries(exampleFields).map(([key, value]) => {
      const div = document.createElement("div");
      div.dataset.field = key;
      div.innerHTML = value;
      return div;
    });
  }
  const ankiFields = divs
    ? Object.fromEntries(
        Array.from(divs).map((el) => [
          (el as HTMLDivElement).dataset.field,
          el.innerHTML.trim(),
        ]),
      )
    : ankiFieldsSkeleton;
  return ankiFields as AnkiFields;
}

export function isHtmlEffectivelyEmpty(html: string): boolean {
  if (!html || html.trim() === "") return true;
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove elements that never count as content
  doc.querySelectorAll("script, style, template").forEach((el) => {
    el.remove();
  });

  // Check for meaningful text
  const text = doc.body.textContent
    ?.replace(/\u00a0/g, "") // nbsp
    .trim();

  if (text && text.length > 0) return false;

  // Check for meaningful non-text content
  const meaningfulSelectors = [
    "img",
    "video",
    "audio",
    "svg",
    "iframe",
    "canvas",
  ];

  return !meaningfulSelectors.some((sel) => doc.body.querySelector(sel));
}

export function isSvg(src: string | null) {
  if (!src) return false;
  const s = src.toLowerCase();
  return s.endsWith(".svg") || s.startsWith("data:image/svg+xml");
}

export function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

export function nodesToString(nodes: Node[]) {
  return nodes
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).outerHTML;
      }
      return node.textContent ?? "";
    })
    .join("");
}

export function unique<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr));
}

export function collectGlossaryImgs(glossaryHtml: string) {
  if (isServer) return [];

  const doc = parseHtml(glossaryHtml);

  return Array.from(doc.querySelectorAll("img"))
    .filter((img) => {
      const src = img.getAttribute("src");
      return (
        src &&
        !isSvg(src) &&
        (img.height === 0 || img.height > 100) &&
        (img.width === 0 || img.width > 100) &&
        !img.closest('span[data-sc-pixiv="read-more-link"] a')
      );
    })
    .map((img) => {
      const src = img.getAttribute("src") ?? "";
      const newImg = document.createElement("img");
      newImg.setAttribute("src", src);
      return {
        src,
        html: newImg.outerHTML,
      };
    });
}
