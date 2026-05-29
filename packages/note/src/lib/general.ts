export function extractKanji(str: string): string[] {
  // Match all CJK Unified Ideographs (Kanji range)
  const matches = str.match(/\p{Script=Han}/gu);
  return matches ? Array.from(new Set(matches)) : [];
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

export function isNsfw(tags: string) {
  return tags
    .split(" ")
    .map((tag) => tag.toLowerCase())
    .includes("nsfw");
}
