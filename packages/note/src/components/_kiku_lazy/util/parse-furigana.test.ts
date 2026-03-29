import { describe, expect, it } from "vitest";
import { parseFurigana } from "./parse-furigana";

describe("parseFurigana", () => {
  it("should handle plain text without furigana", () => {
    const input = "こんにちは";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "text", text: "こんにちは" }]);
  });

  it("should handle kanji with furigana", () => {
    const input = "漢字[かんじ]";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "ruby", text: "漢字", reading: "かんじ" }]);
  });

  it("should handle mixed text with multiple furigana", () => {
    const input = "私の名前は田中[たなか]です。";
    const result = parseFurigana(input);
    expect(result).toEqual([
      { type: "text", text: "私の名前は" },
      { type: "ruby", text: "田中", reading: "たなか" },
      { type: "text", text: "です。" },
    ]);
  });

  it("should handle kanji without furigana as plain text", () => {
    const input = "漢字のみ";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "text", text: "漢字のみ" }]);
  });

  it("should handle latin text and numbers", () => {
    const input = "Hello 123";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "text", text: "Hello 123" }]);
  });

  it("should handle empty string", () => {
    const input = "";
    const result = parseFurigana(input);
    expect(result).toEqual([]);
  });

  it("should handle multiple ruby blocks", () => {
    const input = "青[あお]い海[うみ]";
    const result = parseFurigana(input);
    expect(result).toEqual([
      { type: "ruby", text: "青", reading: "あお" },
      { type: "text", text: "い" },
      { type: "ruby", text: "海", reading: "うみ" },
    ]);
  });

  it("should handle furigana for punctuation/other characters if preceded by kanji", () => {
    // This tests the behavior of the current implementation where anything between [ ] 
    // is treated as furigana for the preceding kanji buffer.
    const input = "漢[ ]";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "ruby", text: "漢", reading: " " }]);
  });

  it("should handle consecutive kanji blocks with furigana", () => {
    const input = "漢字[かんじ]漢字[かんじ]";
    const result = parseFurigana(input);
    expect(result).toEqual([
      { type: "ruby", text: "漢字", reading: "かんじ" },
      { type: "ruby", text: "漢字", reading: "かんじ" },
    ]);
  });

  it("should ignore furigana if there is no preceding kanji", () => {
    const input = "[かんじ]漢字";
    const result = parseFurigana(input);
    expect(result).toEqual([{ type: "text", text: "漢字" }]);
  });
});
