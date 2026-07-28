function codePoint(char: string): number {
  return char.codePointAt(0) ?? 0;
}

function isHiragana(char: string): boolean {
  const code = codePoint(char);
  return code >= 0x3040 && code <= 0x309f;
}

function isKatakana(char: string): boolean {
  const code = codePoint(char);
  return code >= 0x30a0 && code <= 0x30ff;
}

const OFFSET = 0x60;

function convert(str: string, predicate: (c: string) => boolean, offset: number): string {
  return Array.from(str)
    .map((c) => (predicate(c) ? String.fromCodePoint(codePoint(c) + offset) : c))
    .join("");
}

export function hiraganaToKatakana(str: string): string {
  return convert(str, isHiragana, OFFSET);
}

export function katakanaToHiragana(str: string): string {
  return convert(str, isKatakana, -OFFSET);
}

export function toOppositeKana(str: string): string {
  if (Array.from(str).some(isKatakana)) {
    return katakanaToHiragana(str);
  }
  return hiraganaToKatakana(str);
}

export function extractKanji(str: string): string[] {
  const matches = str.match(/\p{Script=Han}/gu);
  return matches ? Array.from(new Set(matches)) : [];
}

const ROMAJI_MAP: [string, string][] = [
  ["sha", "しゃ"],
  ["shu", "しゅ"],
  ["sho", "しょ"],
  ["cha", "ちゃ"],
  ["chu", "ちゅ"],
  ["cho", "ちょ"],
  ["kya", "きゃ"],
  ["kyu", "きゅ"],
  ["kyo", "きょ"],
  ["gya", "ぎゃ"],
  ["gyu", "ぎゅ"],
  ["gyo", "ぎょ"],
  ["nya", "にゃ"],
  ["nyu", "にゅ"],
  ["nyo", "にょ"],
  ["hya", "ひゃ"],
  ["hyu", "ひゅ"],
  ["hyo", "ひょ"],
  ["bya", "びゃ"],
  ["byu", "びゅ"],
  ["byo", "びょ"],
  ["pya", "ぴゃ"],
  ["pyu", "ぴゅ"],
  ["pyo", "ぴょ"],
  ["mya", "みゃ"],
  ["myu", "みゅ"],
  ["myo", "みょ"],
  ["rya", "りゃ"],
  ["ryu", "りゅ"],
  ["ryo", "りょ"],
  ["ja", "じゃ"],
  ["ju", "じゅ"],
  ["jo", "じょ"],
  ["dya", "ぢゃ"],
  ["dyu", "ぢゅ"],
  ["dyo", "ぢょ"],
  ["fa", "ふぁ"],
  ["fi", "ふぃ"],
  ["fe", "ふぇ"],
  ["fo", "ふぉ"],
  ["ti", "ち"],
  ["di", "ぢ"],
  ["tu", "つ"],
  ["du", "づ"],
  ["shi", "し"],
  ["ji", "じ"],
  ["chi", "ち"],
  ["tsu", "つ"],
  ["fu", "ふ"],
  ["wi", "うぃ"],
  ["we", "うぇ"],
  ["wo", "を"],
  ["xa", "ぁ"],
  ["xi", "ぃ"],
  ["xu", "ぅ"],
  ["xe", "ぇ"],
  ["xo", "ぉ"],
  ["xtsu", "っ"],
  ["xtu", "っ"],
  ["xya", "ゃ"],
  ["xyu", "ゅ"],
  ["xyo", "ょ"],
  ["ka", "か"],
  ["ki", "き"],
  ["ku", "く"],
  ["ke", "け"],
  ["ko", "こ"],
  ["ga", "が"],
  ["gi", "ぎ"],
  ["gu", "ぐ"],
  ["ge", "げ"],
  ["go", "ご"],
  ["sa", "さ"],
  ["si", "し"],
  ["su", "す"],
  ["se", "せ"],
  ["so", "そ"],
  ["za", "ざ"],
  ["zi", "じ"],
  ["zu", "ず"],
  ["ze", "ぜ"],
  ["zo", "ぞ"],
  ["ta", "た"],
  ["ti", "ち"],
  ["tu", "つ"],
  ["te", "て"],
  ["to", "と"],
  ["da", "だ"],
  ["di", "ぢ"],
  ["du", "づ"],
  ["de", "で"],
  ["do", "ど"],
  ["na", "な"],
  ["ni", "に"],
  ["nu", "ぬ"],
  ["ne", "ね"],
  ["no", "の"],
  ["ha", "は"],
  ["hi", "ひ"],
  ["hu", "ふ"],
  ["he", "へ"],
  ["ho", "ほ"],
  ["ba", "ば"],
  ["bi", "び"],
  ["bu", "ぶ"],
  ["be", "べ"],
  ["bo", "ぼ"],
  ["pa", "ぱ"],
  ["pi", "ぴ"],
  ["pu", "ぷ"],
  ["pe", "ぺ"],
  ["po", "ぽ"],
  ["ma", "ま"],
  ["mi", "み"],
  ["mu", "む"],
  ["me", "め"],
  ["mo", "も"],
  ["ya", "や"],
  ["yu", "ゆ"],
  ["yo", "よ"],
  ["ra", "ら"],
  ["ri", "り"],
  ["ru", "る"],
  ["re", "れ"],
  ["ro", "ろ"],
  ["wa", "わ"],
  ["a", "あ"],
  ["i", "い"],
  ["u", "う"],
  ["e", "え"],
  ["o", "お"],
  ["n", "ん"],
];

export function romajiToHiragana(romaji: string): string {
  let result = "";
  let i = 0;
  while (i < romaji.length) {
    let matched = false;
    for (const [rom, hira] of ROMAJI_MAP) {
      if (romaji.slice(i, i + rom.length) === rom) {
        result += hira;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += romaji[i];
      i++;
    }
  }
  return result;
}
