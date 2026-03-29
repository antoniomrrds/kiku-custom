type Token =
  | { type: "kanji"; value: string }
  | { type: "kana"; value: string }
  | { type: "furigana"; value: string }
  | { type: "space" };

const isKanji = (char: string) => /[\u4E00-\u9FFF\u3005]/.test(char);
const isKana = (char: string) => /[\u3040-\u30FF]/.test(char);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Furigana block
    if (char === "[") {
      let value = "";
      i++; // skip '['

      while (i < input.length && input[i] !== "]") {
        value += input[i];
        i++;
      }

      // skip ']'
      if (input[i] === "]") i++;

      tokens.push({ type: "furigana", value });
      continue;
    }

    if (char === " " || char === "　") {
      tokens.push({ type: "space" });
    } else if (isKanji(char)) {
      tokens.push({ type: "kanji", value: char });
    } else {
      // kana or fallback (latin, punctuation, etc.)
      tokens.push({ type: "kana", value: char });
    }

    i++;
  }

  return tokens;
}

type RenderItem =
  | { type: "ruby"; text: string; reading: string }
  | { type: "text"; text: string };

function tokensToRenderItems(tokens: Token[]): RenderItem[] {
  const result: RenderItem[] = [];

  let textBuffer = "";
  let kanjiBuffer = ""; // Accumulates consecutive kanji
  let mixedBuffer = ""; // Accumulates everything (kanji + kana) since last reset
  let lastTokenType: Token["type"] | null = null;
  let hasSpaceBefore = false;

  const flushText = () => {
    if (textBuffer) {
      result.push({ type: "text", text: textBuffer });
      textBuffer = "";
    }
  };

  const flushMixedAsText = () => {
    if (mixedBuffer) {
      textBuffer += mixedBuffer;
      mixedBuffer = "";
      kanjiBuffer = "";
      hasSpaceBefore = false;
    }
  };

  for (const token of tokens) {
    switch (token.type) {
      case "space": {
        flushMixedAsText();
        textBuffer += " ";
        hasSpaceBefore = true;
        break;
      }

      case "kanji": {
        kanjiBuffer += token.value;
        mixedBuffer += token.value;
        break;
      }

      case "kana": {
        kanjiBuffer = ""; // break consecutive kanji
        mixedBuffer += token.value;
        break;
      }

      case "furigana": {
        let base = "";

        if (hasSpaceBefore) {
          // Explicit space delimiter: take everything in mixedBuffer
          base = mixedBuffer;
          if (textBuffer.endsWith(" ")) {
            textBuffer = textBuffer.slice(0, -1);
          }
        } else if (lastTokenType === "kanji") {
          // Ends in Kanji: take only consecutive kanji
          base = kanjiBuffer;
          // Prepend the rest of mixedBuffer to textBuffer
          textBuffer += mixedBuffer.slice(0, -kanjiBuffer.length);
        } else if (lastTokenType === "kana") {
          // Ends in Kana: take everything in mixedBuffer (the "greedy" case)
          base = mixedBuffer;
        }

        if (base) {
          flushText();
          result.push({
            type: "ruby",
            text: base,
            reading: token.value,
          });
          mixedBuffer = "";
          kanjiBuffer = "";
          hasSpaceBefore = false;
        } else {
          // No base found, treat as literal brackets if desired (not implemented here)
        }
        break;
      }
    }
    lastTokenType = token.type;
  }

  flushMixedAsText();
  flushText();
  return result;
}

export function parseFurigana(input: string): RenderItem[] {
  return tokensToRenderItems(tokenize(input));
}
