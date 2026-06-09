import { describe, expect, it } from "vitest";
import { capitalizeSentence } from "./text";

describe("capitalizeSentence", () => {
  it("capitalizes the first letter of each word", () => {
    expect(capitalizeSentence("hello world")).toBe("Hello World");
  });

  it("lowercases words and capitalize first letter", () => {
    expect(capitalizeSentence("HELLO WORLD")).toBe("Hello World");
  });

  it("does not capitalize exception words (lowercase articles, prepositions, conjunctions)", () => {
    expect(capitalizeSentence("the cat and the dog")).toBe("The Cat and the Dog");
  });

  it("always capitalizes the first word even if it's an exception", () => {
    expect(capitalizeSentence("the cat")).toBe("The Cat");
  });

  it("always capitalizes the last word even if it's an exception", () => {
    expect(capitalizeSentence("cat of")).toBe("Cat Of");
  });

  it("returns undefined for undefined", () => {
    expect(capitalizeSentence(undefined)).toBeUndefined();
  });

  it("returns empty string for empty string", () => {
    expect(capitalizeSentence("")).toBe("");
  });

  it("normalizes multiple spaces", () => {
    expect(capitalizeSentence("hello   world")).toBe("Hello World");
  });

  it("trims leading and trailing spaces", () => {
    expect(capitalizeSentence("  hello world  ")).toBe("Hello World");
  });

  it("handles single word", () => {
    expect(capitalizeSentence("hello")).toBe("Hello");
  });

  it("handles single exception word", () => {
    expect(capitalizeSentence("the")).toBe("The");
  });

  it("preserves case for non-exception words", () => {
    expect(capitalizeSentence("hello OF world")).toBe("Hello of World");
  });

  it("works with kanji keywords from .jpdb/kanji.json", () => {
    const cases = [
      // single word
      ["one", "One"],
      ["not yet", "Not Yet"],
      ["standing up", "Standing Up"],
      ["jump around", "Jump Around"],
      ["go back", "Go Back"],
      ["one hundred", "One Hundred"],
      // exceptions in middle
      ["same kind", "Same Kind"],
      ["sort of thing", "Sort of Thing"],
      ["part of speech", "Part of Speech"],
      ["day of the week", "Day of the Week"],
      ["on the verge of", "On the Verge Of"],
      ["look down on", "Look Down On"],
      ["very old woman", "Very Old Woman"],
      // first word is exception
      ["to award", "To Award"],
      ["a type of evergreen tree", "A Type of Evergreen Tree"],
      ["an hour ago", "An Hour Ago"],
      // parentheses – word after ( should be capitalized
      ["to be (animate object)", "To Be (Animate Object)"],
      ["kind (of something)", "Kind (of Something)"],
      ["me (boyish)", "Me (Boyish)"],
      ["me (ceremonial)", "Me (Ceremonial)"],
      ["sweet (to the taste)", "Sweet (to the Taste)"],
      // bracket annotations
      ["one yen coin [old]", "One Yen Coin [Old]"],
      ["state of mind [old]", "State of Mind [Old]"],
      ["lie [alt]", "Lie [Alt]"],
      ["lose weight [old]", "Lose Weight [Old]"],
      // multi-word with mixed features
      ["one more time", "One More Time"],
      // punctuation attached to word
      ["ka!", "Ka!"],
    ];
    for (const [input, expected] of cases) {
      expect(capitalizeSentence(input)).toBe(expected);
    }
  });
});
