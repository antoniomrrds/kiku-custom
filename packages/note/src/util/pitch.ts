import { parseHtml, unique } from "./general";

export function extractPitchNumbers(html: string) {
  if (!html) return [];
  const pitchPositionDoc = parseHtml(html);
  const numbers = Array.from(pitchPositionDoc.querySelectorAll("span"))
    .map((el) => Number(el.textContent))
    .filter((value) => !Number.isNaN(value));
  const uniqueNumbers = unique(numbers);
  return uniqueNumbers;
}
