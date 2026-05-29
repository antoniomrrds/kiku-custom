export const webFonts = [
  "Hina Mincho",
  "Klee One",
  "IBM Plex Sans JP",
] as const;

export type WebFont = (typeof webFonts)[number];
