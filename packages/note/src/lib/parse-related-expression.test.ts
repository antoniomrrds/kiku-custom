import { describe, expect, it } from "vitest";
import { parseRelatedExpression } from "./parse-related-expression";

describe("parseRelatedExpression", () => {
  it("should return an empty array for undefined or empty input", () => {
    expect(parseRelatedExpression(undefined)).toEqual([]);
    expect(parseRelatedExpression("")).toEqual([]);
  });

  it("should parse expressions separated by English commas", () => {
    expect(parseRelatedExpression("apple, banana, cherry")).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("should parse expressions separated by Japanese commas (ideographic)", () => {
    expect(parseRelatedExpression("りんご、ばなな、さくらんぼ")).toEqual([
      "りんご",
      "ばなな",
      "さくらんぼ",
    ]);
  });

  it("should parse expressions separated by semicolons (English and Fullwidth)", () => {
    expect(parseRelatedExpression("one;two；three")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("should handle mixed delimiters and varying whitespace", () => {
    expect(
      parseRelatedExpression("  word1 ,  word2； word3、word4 ; word5  "),
    ).toEqual(["word1", "word2", "word3", "word4", "word5"]);
  });

  it("should filter out empty results from consecutive delimiters", () => {
    expect(parseRelatedExpression("a,,b、　、c")).toEqual(["a", "b", "c"]);
  });

  it("should handle a single expression without delimiters", () => {
    expect(parseRelatedExpression("lonelyword")).toEqual(["lonelyword"]);
  });

  it("should handle &nbsp; and other HTML entities from Anki", () => {
    expect(
      parseRelatedExpression("捕まる、囚われる;&nbsp; &nbsp;捉える"),
    ).toEqual(["捕まる", "囚われる", "捉える"]);
  });
});
