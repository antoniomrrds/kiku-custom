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
  const meaningfulSelectors = ["img", "video", "audio", "svg", "iframe", "canvas"];

  return !meaningfulSelectors.some((sel) => doc.body.querySelector(sel));
}

export function removeBrInsideStyleTag(html: string): string {
  if (!html) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const styles = doc.querySelectorAll("style");

  for (const style of styles) {
    const normalizedContent = (style.textContent ?? "").replace(/<br\s*\/?>/gi, "\n");
    style.textContent = normalizedContent;
  }

  return doc.body.innerHTML;
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
    .join("")
    .trim();
}

export function preloadImages(pictureHtml: string) {
  if (typeof DOMParser === "undefined" || !pictureHtml) return;
  const doc = new DOMParser().parseFromString(pictureHtml, "text/html");
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src) new Image().src = src;
  });
}
