---
outline: deep
---

# Japanese Prefectures

Renders a map of Japan when the card's `Expression` or `ExpressionReading` is a Japanese prefecture.

## Setup

Copy the plugin files into your `collection.media` directory.

::: code-group

<!-- prettier-ignore -->
<<< ../../../packages/note/plugins/japanese-prefectures/_kiku_plugin.js [_kiku_plugin.js]
<<< ../../../packages/note/plugins/japanese-prefectures/_kiku_plugin.css [_kiku_plugin.css]
<<< ../../../packages/note/plugins/japanese-prefectures/_kiku-plugin-kanji-prefectures.js [_kiku-plugin-kanji-prefectures.js]
:::

Map file:

- [\_japanese-prefectures-map-mobile.svg](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/japanese-prefectures/_japanese-prefectures-map-mobile.svg)

## Features

- The matched prefecture blinks to draw attention. Set `matchFill` in `CONFIG` to tint it, or `null` to keep its region color
- Hovering a prefecture adjusts its brightness and shows the prefecture name and its region
- Clicking a prefecture opens a dialog with links to various websites
