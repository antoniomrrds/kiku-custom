import { describe, expect, it } from "vitest";
import { fuzzySearch } from "./fuzzy";

describe("fuzzySearch", () => {
  it("returns true for empty query", () => {
    expect(fuzzySearch("", "にほんご")).toBe(true);
  });

  it("exact match on hiragana", () => {
    expect(fuzzySearch("にほんご", "にほんご")).toBe(true);
  });

  it("fuzzy match on hiragana - characters in order with gaps", () => {
    expect(fuzzySearch("にご", "にほんご")).toBe(true);
  });

  it("rejects when characters not in order", () => {
    expect(fuzzySearch("ごに", "にほんご")).toBe(false);
  });

  it("rejects when characters missing", () => {
    expect(fuzzySearch("にほんごう", "にほんご")).toBe(false);
  });

  it("matches romaji to hiragana", () => {
    expect(fuzzySearch("nihongo", "にほんご")).toBe(true);
  });

  it("partial romaji match works syllable by syllable", () => {
    expect(fuzzySearch("nihon", "にほんご")).toBe(true);
  });

  it("romaji - rejects wrong match", () => {
    expect(fuzzySearch("amerika", "にほんご")).toBe(false);
  });

  it("matches katakana in target", () => {
    expect(fuzzySearch("にほんご", "ニホンゴ")).toBe(true);
  });

  it("matches romaji to katakana target", () => {
    expect(fuzzySearch("nihongo", "ニホンゴ")).toBe(true);
  });

  it("matches against multiple targets", () => {
    expect(fuzzySearch("にほんご", "あいうえお", "にほんご")).toBe(true);
    expect(fuzzySearch("にほんご", "あいうえお", "かきくけこ")).toBe(false);
  });

  it("trims whitespace from query", () => {
    expect(fuzzySearch("  にほんご  ", "にほんご")).toBe(true);
  });

  it("case insensitive romaji", () => {
    expect(fuzzySearch("NIHONGO", "にほんご")).toBe(true);
  });

  it("partial romaji match", () => {
    expect(fuzzySearch("nihon", "にほんご")).toBe(true);
  });

  it("fuzzy with mixed query and target", () => {
    expect(fuzzySearch("読", "読む")).toBe(true);
  });

  it("fuzzy with kanji in target", () => {
    expect(fuzzySearch("nihon", "日本語", "にほんご")).toBe(true);
  });
});
