import { katakanaToHiragana, romajiToHiragana } from "./kana";

function fuzzyMatch(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (query[qi] === target[ti]) {
      qi++;
    }
  }
  return qi === query.length;
}

const ASCII_RE = /^[a-zA-Z\s]+$/;

export function fuzzySearch(query: string, ...targets: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const candidates = targets.map((t) => katakanaToHiragana(t).toLowerCase());

  if (candidates.some((t) => fuzzyMatch(q, t))) return true;

  if (ASCII_RE.test(q)) {
    const hq = romajiToHiragana(q);
    if (candidates.some((t) => fuzzyMatch(hq, t))) return true;
  }

  return false;
}
