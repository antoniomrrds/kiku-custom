import { describe, expect, it } from "vitest";
import { escapeRegex } from "./AnkiConnect";

describe("escapeRegex", () => {
  it("should not change plain alphanumeric strings", () => {
    expect(escapeRegex("hello")).toBe("hello");
    expect(escapeRegex("abc123")).toBe("abc123");
  });

  it("should escape dots", () => {
    expect(escapeRegex(".")).toBe("\\.");
    expect(escapeRegex("a.b")).toBe("a\\.b");
  });

  it("should escape asterisks", () => {
    expect(escapeRegex("*")).toBe("\\*");
    expect(escapeRegex("a*b")).toBe("a\\*b");
  });

  it("should escape plus signs", () => {
    expect(escapeRegex("+")).toBe("\\+");
  });

  it("should escape question marks", () => {
    expect(escapeRegex("?")).toBe("\\?");
  });

  it("should escape carets", () => {
    expect(escapeRegex("^")).toBe("\\^");
  });

  it("should escape dollar signs", () => {
    expect(escapeRegex("$")).toBe("\\$");
  });

  it("should escape curly braces", () => {
    expect(escapeRegex("{")).toBe("\\{");
    expect(escapeRegex("}")).toBe("\\}");
  });

  it("should escape parentheses", () => {
    expect(escapeRegex("(")).toBe("\\(");
    expect(escapeRegex(")")).toBe("\\)");
    expect(escapeRegex("()")).toBe("\\(\\)");
  });

  it("should escape pipe characters", () => {
    expect(escapeRegex("|")).toBe("\\|");
    expect(escapeRegex("a|b")).toBe("a\\|b");
  });

  it("should escape square brackets", () => {
    expect(escapeRegex("[")).toBe("\\[");
    expect(escapeRegex("]")).toBe("\\]");
    expect(escapeRegex("[]")).toBe("\\[\\]");
  });

  it("should escape backslashes", () => {
    expect(escapeRegex("\\")).toBe("\\\\");
  });

  it("should escape mixed special characters", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });

  it("should handle Japanese characters without escaping them", () => {
    expect(escapeRegex("食べる")).toBe("食べる");
    expect(escapeRegex("かく")).toBe("かく");
  });

  it("should escape special chars in Japanese text", () => {
    expect(escapeRegex("a(b)c")).toBe("a\\(b\\)c");
  });
});
