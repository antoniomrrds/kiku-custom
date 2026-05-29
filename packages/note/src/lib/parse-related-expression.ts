export function parseRelatedExpression(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/&nbsp;/g, " ")
    .trim()
    .split(/\s*[,、;\uFF1B]\s*/)
    .filter(Boolean);
}
