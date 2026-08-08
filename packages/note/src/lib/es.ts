export function unique<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr));
}

export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
