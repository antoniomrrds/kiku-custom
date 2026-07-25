import { describe, expect, it } from "vitest";
import {
  extractKanji,
  hiraganaToKatakana,
  katakanaToHiragana,
  toOppositeKana,
} from "./kana";

describe("hiraganaToKatakana", () => {
  it("converts hiragana to katakana", () => {
    expect(hiraganaToKatakana("あいうえお")).toBe("アイウエオ");
  });

  it("leaves non-hiragana characters unchanged", () => {
    expect(hiraganaToKatakana("あa1カ")).toBe("アa1カ");
  });

  it("handles empty string", () => {
    expect(hiraganaToKatakana("")).toBe("");
  });
});

describe("katakanaToHiragana", () => {
  it("converts katakana to hiragana", () => {
    expect(katakanaToHiragana("アイウエオ")).toBe("あいうえお");
  });

  it("leaves non-katakana characters unchanged", () => {
    expect(katakanaToHiragana("カa1あ")).toBe("かa1あ");
  });

  it("handles empty string", () => {
    expect(katakanaToHiragana("")).toBe("");
  });
});

describe("toOppositeKana", () => {
  it("converts katakana to hiragana when input contains katakana", () => {
    expect(toOppositeKana("アイウエオ")).toBe("あいうえお");
    expect(toOppositeKana("aカキ")).toBe("aかき");
  });

  it("converts hiragana to katakana when input contains no katakana", () => {
    expect(toOppositeKana("あいうえお")).toBe("アイウエオ");
    expect(toOppositeKana("aあいう")).toBe("aアイウ");
  });

  it("handles mixed strings with only hiragana", () => {
    expect(toOppositeKana("漢字あ")).toBe("漢字ア");
  });

  it("handles empty string", () => {
    expect(toOppositeKana("")).toBe("");
  });
});

describe("extractKanji", () => {
  it("should extract unique kanji characters in order of first appearance", () => {
    const input = "私は漢字と漢字が好きです";

    expect(extractKanji(input)).toEqual(["私", "漢", "字", "好"]);
  });

  it("should return an empty array when there are no kanji characters", () => {
    expect(extractKanji("こんにちは 123 ABC")).toEqual([]);
  });

  it("should include kanji from mixed text and ignore duplicates", () => {
    const input = "東京2024年に東京へ行く";

    expect(extractKanji(input)).toEqual(["東", "京", "年", "行"]);
  });

  it("should extract rare kanji outside the BMP", () => {
    const input = "𬵪𩶗𫒼𣶏と𬵪𩶗𫒼𣶏";

    expect(extractKanji(input)).toEqual(["𬵪", "𩶗", "𫒼", "𣶏"]);
  });
});
