export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const EXCEPTIONS = new Set(["of", "and", "to", "in", "on", "for", "with", "a", "an", "the"]);

function capitalizeSmart(word: string, isFirst: boolean, isLast: boolean): string {
  const firstAlpha = word.search(/[a-zA-Z]/);
  const lastAlpha = word.search(/[a-zA-Z][^a-zA-Z]*$/);
  if (firstAlpha === -1) return word;

  const prefix = word.slice(0, firstAlpha);
  const suffix = word.slice(lastAlpha + 1);
  const core = word.slice(firstAlpha, lastAlpha + 1);
  const lower = core.toLowerCase();

  if (!isFirst && !isLast && EXCEPTIONS.has(lower)) {
    return prefix + lower + suffix;
  }

  return prefix + core.charAt(0).toUpperCase() + lower.slice(1) + suffix;
}

export function capitalizeSentence(sentence?: string) {
  if (!sentence) return sentence;
  const words = sentence.split(" ").filter(Boolean);
  return words.map((word, i) => capitalizeSmart(word, i === 0, i === words.length - 1)).join(" ");
}
