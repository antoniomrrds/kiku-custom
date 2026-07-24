---
outline: deep
---

# Related Expression

Related Expressions are displayed in the top-left corner of the card, allowing you to click them to jump to that card immediately.

![Related Expression](/media/related-expression.png)

:::info
On the front side, this section will show duplicate cards with different reading instead.
:::

## How to Use

<video controls>
  <source src="/media/related-expression.webm" type="video/webm" />
</video>

You can manually fill the **RelatedExpression** field with any comma- or semicolon-separated expressions.

This is incredibly useful for linking cards you frequently confuse, or words that naturally form a conceptual set. For example:

- **Synophones / Visual Confusions:**
  - Expression: 蕾 => RelatedExpression: 雷
  - Expression: 険悪 => RelatedExpression: 嫌悪
- **Antonyms / Conceptual Sets:**
  - Expression: 雄 => RelatedExpression: 雌
  - Expression: 中盤 => RelatedExpression: 序盤、終盤

:::tip

- Expressions explicitly defined in the **RelatedExpression** field will be underlined.
- You can use commas (`,` / `、`) or semicolons (`;` / `；`) as delimiters.
- New cards will have a status indicator. This status indicator feature only works on Anki desktop.

:::

## Fallback Behavior

If you leave the **RelatedExpression** field empty, the card automatically displays the **two most relevant items** from the kanji page based on the following priority:

1. Direct relationships (like Antonyms, Forms, and Referenced cards).
2. General matches (like cards with the same reading or expression).
3. The newest cards.
