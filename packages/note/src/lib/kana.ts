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
