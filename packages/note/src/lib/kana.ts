export function extractKanji(str: string): string[] {
  // Match all CJK Unified Ideographs (Kanji range)
  const matches = str.match(/\p{Script=Han}/gu);
  return matches ? Array.from(new Set(matches)) : [];
}
