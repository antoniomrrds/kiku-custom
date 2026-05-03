import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { extractPitchNumbers } from "./pitch";

beforeAll(() => {
  const dom = new JSDOM();
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.Node = dom.window.Node;
  globalThis.Element = dom.window.Element;
});

describe("extractPitchNumbers", () => {
  it("should extract unique pitch numbers from multiple items", () => {
    const html = `<ol><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li></ol>`;
    expect(extractPitchNumbers(html)).toEqual([0]);
  });

  it("should extract a single pitch number", () => {
    const html = `<span style="display:inline;"><span>[</span><span>2</span><span>]</span></span>`;
    expect(extractPitchNumbers(html)).toEqual([2]);
  });

  it("should extract pitch number from a group", () => {
    const html = `<div class="pa-positions__group" data-details="アクセント辞典"><div class="pa-positions__dictionary"><div class="pa-positions__dictionary-inner">アクセント辞典</div></div><ol><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li></ol></div>`;
    expect(extractPitchNumbers(html)).toEqual([0]);
  });

  it("should extract a different pitch number from a group", () => {
    const html = `<div class="pa-positions__group" data-details="アクセント辞典"><div class="pa-positions__dictionary"><div class="pa-positions__dictionary-inner">アクセント辞典</div></div><ol><li><span style="display:inline;"><span>[</span><span>3</span><span>]</span></span></li></ol></div>`;
    expect(extractPitchNumbers(html)).toEqual([3]);
  });

  it("should handle empty string", () => {
    expect(extractPitchNumbers("")).toEqual([]);
  });

  it("should handle multiple unique numbers", () => {
    const html = `
      <ol>
        <li><span>[</span><span>0</span><span>]</span></li>
        <li><span>[</span><span>2</span><span>]</span></li>
      </ol>
    `;
    // We expect both numbers because querySelectorAll("span") will find
    // nested spans and the filter(Number) will pick up '0' and '2'.
    // <span>[</span><span>0</span><span>]</span> -> innerText is "[0]" -> NaN
    // <span>[</span> -> innerText is "[" -> NaN
    // <span>0</span> -> innerText is "0" -> 0
    expect(extractPitchNumbers(html)).toEqual([0, 2]);
  });
});
