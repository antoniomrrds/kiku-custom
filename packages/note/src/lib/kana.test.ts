import { describe, expect, it } from "vitest";
import { extractKanji } from "./kana";

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
