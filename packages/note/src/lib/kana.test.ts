import { describe, expect, it } from "vitest";
import {
  extractKanji,
  hiraganaToKatakana,
  katakanaToHiragana,
  romajiToHiragana,
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

describe("romajiToHiragana", () => {
  it("converts basic vowels", () => {
    expect(romajiToHiragana("aiueo")).toBe("あいうえお");
  });

  it("converts k-row", () => {
    expect(romajiToHiragana("kakikukeko")).toBe("かきくけこ");
  });

  it("converts s-row with shi", () => {
    expect(romajiToHiragana("sashisuseso")).toBe("さしすせそ");
  });

  it("converts t-row with chi and tsu", () => {
    expect(romajiToHiragana("tachitsuteto")).toBe("たちつてと");
  });

  it("converts n-row", () => {
    expect(romajiToHiragana("naninuneno")).toBe("なにぬねの");
  });

  it("converts h-row with fu", () => {
    expect(romajiToHiragana("hahifuheho")).toBe("はひふへほ");
  });

  it("converts m-row", () => {
    expect(romajiToHiragana("mamimumemo")).toBe("まみむめも");
  });

  it("converts y-row", () => {
    expect(romajiToHiragana("yayuyo")).toBe("やゆよ");
  });

  it("converts r-row", () => {
    expect(romajiToHiragana("rarirurero")).toBe("らりるれろ");
  });

  it("converts w-row", () => {
    expect(romajiToHiragana("wawon")).toBe("わをん");
  });

  it("converts g-row (dakuten)", () => {
    expect(romajiToHiragana("gagigugego")).toBe("がぎぐげご");
  });

  it("converts z-row with ji", () => {
    expect(romajiToHiragana("zajizuzezo")).toBe("ざじずぜぞ");
  });

  it("converts d-row with unusual mappings", () => {
    expect(romajiToHiragana("dadidudedo")).toBe("だぢづでど");
  });

  it("converts b-row", () => {
    expect(romajiToHiragana("babibubebo")).toBe("ばびぶべぼ");
  });

  it("converts p-row (handakuten)", () => {
    expect(romajiToHiragana("papipupepo")).toBe("ぱぴぷぺぽ");
  });

  it("converts palatalized syllables (yōon)", () => {
    expect(romajiToHiragana("kyakyukyo")).toBe("きゃきゅきょ");
    expect(romajiToHiragana("shashusho")).toBe("しゃしゅしょ");
    expect(romajiToHiragana("chachucho")).toBe("ちゃちゅちょ");
    expect(romajiToHiragana("nyanyunyo")).toBe("にゃにゅにょ");
    expect(romajiToHiragana("hyahyuhyo")).toBe("ひゃひゅひょ");
    expect(romajiToHiragana("myamyumyo")).toBe("みゃみゅみょ");
    expect(romajiToHiragana("ryaryuryo")).toBe("りゃりゅりょ");
    expect(romajiToHiragana("gyagyugyo")).toBe("ぎゃぎゅぎょ");
    expect(romajiToHiragana("jajujo")).toBe("じゃじゅじょ");
    expect(romajiToHiragana("byabyubyo")).toBe("びゃびゅびょ");
    expect(romajiToHiragana("pyapyupyo")).toBe("ぴゃぴゅぴょ");
  });

  it("passes through non-romaji characters unchanged", () => {
    expect(romajiToHiragana("a1b-こ")).toBe("あ1b-こ");
  });

  it("handles empty string", () => {
    expect(romajiToHiragana("")).toBe("");
  });

  it("converts full word: nihongo", () => {
    expect(romajiToHiragana("nihongo")).toBe("にほんご");
  });

  it("converts full word: konnichiha", () => {
    expect(romajiToHiragana("konnichiha")).toBe("こんにちは");
  });

  it("handles double consonants with xtsu", () => {
    expect(romajiToHiragana("gaxtsukou")).toBe("がっこう");
  });

  it("converts small kana with x-prefix", () => {
    expect(romajiToHiragana("xaxixuxexo")).toBe("ぁぃぅぇぉ");
  });
});
