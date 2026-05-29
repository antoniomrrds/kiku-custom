type Token =
  | { type: "kanji"; value: string }
  | { type: "kana"; value: string }
  | { type: "furigana"; value: string }
  | { type: "space" };

const isKanji = (char: string) => /[\u4E00-\u9FFF\u3005]/.test(char);
const trailingNumericKanjiPattern = /[0-9０-９]+[\u4E00-\u9FFF\u3005]+$/u;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === "[") {
      let value = "";
      i++;

      while (i < input.length && input[i] !== "]") {
        value += input[i];
        i++;
      }

      if (input[i] === "]") i++;

      tokens.push({ type: "furigana", value });
      continue;
    }

    if (char === " " || char === "　") {
      tokens.push({ type: "space" });
    } else if (isKanji(char)) {
      tokens.push({ type: "kanji", value: char });
    } else {
      tokens.push({ type: "kana", value: char });
    }

    i++;
  }

  return tokens;
}

export type FuriganaRenderItem =
  | { type: "ruby"; text: string; reading: string }
  | { type: "text"; text: string };

function tokensToRenderItems(tokens: Token[]): FuriganaRenderItem[] {
  const result: FuriganaRenderItem[] = [];

  let textBuffer = "";
  let kanjiBuffer = "";
  let mixedBuffer = "";
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
        kanjiBuffer = "";
        mixedBuffer += token.value;
        break;
      }

      case "furigana": {
        let base = "";

        if (hasSpaceBefore) {
          base = mixedBuffer;
          if (textBuffer.endsWith(" ")) {
            textBuffer = textBuffer.slice(0, -1);
          }
        } else if (lastTokenType === "kanji") {
          base = mixedBuffer.match(trailingNumericKanjiPattern)?.[0] ?? kanjiBuffer;
          textBuffer += mixedBuffer.slice(0, -base.length);
        } else if (lastTokenType === "kana") {
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

export function parseFurigana(input: string): FuriganaRenderItem[] {
  return tokensToRenderItems(tokenize(input));
}
