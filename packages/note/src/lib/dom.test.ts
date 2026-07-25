import { describe, expect, it } from "vitest";
import { applyBoldFormatting, removeBrInsideStyleTag } from "./dom";

describe("removeBrInsideStyleTag", () => {
  it("should normalize br tags inside style blocks without touching other html", () => {
    const html = `
      <div>
        <style id="a">
          .a{color:red;}<br>.b{display:block;}<br />
        </style>
        <style media="screen">.c{font-weight:bold;}<br>.d{font-style:italic;}</style>
        <p>Hello<br>world</p>
      </div>
    `;

    const normalized = removeBrInsideStyleTag(html);

    expect(normalized).toContain('<style id="a">');
    expect(normalized).toContain('<style media="screen">');
    expect(normalized).toContain(".a{color:red;}\n.b{display:block;}\n");
    expect(normalized).toContain(".c{font-weight:bold;}\n.d{font-style:italic;}");
    expect(normalized).toContain("<p>Hello<br>world</p>");
  });

  it("should leave html without style tags unchanged", () => {
    const html = "<div>Hello<br>world</div>";

    expect(removeBrInsideStyleTag(html)).toBe(html);
  });
});

describe("applyBoldFormatting", () => {
  it("should bold plain text from source in target", () => {
    expect(applyBoldFormatting("<b>拘る</b>", "拘る")).toBe("<b>拘る</b>");
  });

  it("should bold text within larger sentence in target", () => {
    const source = "「でも、あんまりそこに<b>拘る</b>と......変な暴走をしそうだから。ひとまず、キスが目標で」";
    const target = "「でも、あんまりそこに拘ると......変な暴走をしそうだから。ひとまず、キスが目標で」";
    const result = applyBoldFormatting(source, target);
    expect(result).toBe("「でも、あんまりそこに<b>拘る</b>と......変な暴走をしそうだから。ひとまず、キスが目標で」");
  });

  it("should bold text that spans <ruby> elements in target", () => {
    const source = "朝ご飯を食べようとしていたところで真昼が<b>襲来</b>してきた";
    const target = "朝ご飯を食べようとしていたところで真昼が<ruby>襲来<rt>しゅうらい</rt></ruby>してきた";
    const result = applyBoldFormatting(source, target);
    expect(result).toBe("朝ご飯を食べようとしていたところで真昼が<b><ruby>襲来<rt>しゅうらい</rt></ruby></b>してきた");
  });

  it("should bold text that spans <ruby> with trailing okurigana in target", () => {
    const source = "「でも、あんまりそこに<b>拘る</b>と......」";
    const target = "「でも、あんまりそこに<ruby>拘<rt>こだわ</rt></ruby>ると......」";
    const result = applyBoldFormatting(source, target);
    expect(result).toBe("「でも、あんまりそこに<b><ruby>拘<rt>こだわ</rt></ruby>る</b>と......」");
  });

  it("should handle multiple bold tags in source", () => {
    const source = "<b>abc</b> def <b>xyz</b>";
    const target = "abc def xyz";
    const result = applyBoldFormatting(source, target);
    expect(result).toBe("<b>abc</b> def <b>xyz</b>");
  });

  it("should skip text already bolded in target", () => {
    const source = "<b>hello</b> <b>world</b>";
    const target = "<b>hello</b> world";
    const result = applyBoldFormatting(source, target);
    expect(result).toBe("<b>hello</b> <b>world</b>");
  });

  it("should return target unchanged when source has no <b> tags", () => {
    const target = "hello world";
    expect(applyBoldFormatting("plain text", target)).toBe(target);
  });

  it("should return target unchanged when bold text not found in target", () => {
    expect(applyBoldFormatting("<b>abc</b>", "xyz")).toBe("xyz");
  });

  it("should return target unchanged when first is null", () => {
    expect(applyBoldFormatting(null, "<b>hello</b>")).toBe("<b>hello</b>");
  });

  it("should return empty string when target is null", () => {
    expect(applyBoldFormatting("<b>hello</b>", null)).toBe("");
  });

  it("should return empty string when target is undefined", () => {
    expect(applyBoldFormatting("<b>hello</b>", undefined)).toBe("");
  });

  it("should handle empty string inputs", () => {
    expect(applyBoldFormatting("", "")).toBe("");
    expect(applyBoldFormatting("<b>hello</b>", "")).toBe("");
    expect(applyBoldFormatting("", "world")).toBe("world");
  });

  it("should bold only the non-bolded occurrence when multiple exist", () => {
    expect(applyBoldFormatting("<b>def</b>", "abc<b>def</b>def")).toBe("abc<b>def</b><b>def</b>");
  });

  it("should bold text at the start of target", () => {
    expect(applyBoldFormatting("<b>Hello</b>", "Hello world")).toBe("<b>Hello</b> world");
  });

  it("should bold text at the end of target", () => {
    expect(applyBoldFormatting("<b>world</b>", "Hello world")).toBe("Hello <b>world</b>");
  });

  it("should handle special HTML characters in bold text", () => {
    expect(applyBoldFormatting("<b>a & b</b>", "a & b")).toBe("<b>a &amp; b</b>");
  });

  it("should extract text content from nested source <b> elements", () => {
    expect(applyBoldFormatting("<b><span>nested</span> text</b>", "nested text")).toBe("<b>nested text</b>");
  });

  it("should preserve internal whitespace inside bold text", () => {
    expect(applyBoldFormatting("<b>hello world</b>", "hello world")).toBe("<b>hello world</b>");
  });

  it("should not bold text that only appears inside <rt> elements", () => {
    const target = "<ruby>行<rt>い</rt></ruby>きます";
    expect(applyBoldFormatting("<b>い</b>", target)).toBe(target);
  });

  it("should handle same bold text twice in source with two target occurrences", () => {
    expect(applyBoldFormatting("<b>a</b> <b>a</b>", "a a")).toBe("<b>a</b> <b>a</b>");
  });

  it("should not double-bold when target already has the bold", () => {
    expect(applyBoldFormatting("<b>hello</b>", "<b>hello</b>")).toBe("<b>hello</b>");
  });

  it("should handle bold text that does not exist in target", () => {
    expect(applyBoldFormatting("<b>missing</b>", "hello world")).toBe("hello world");
  });
});
