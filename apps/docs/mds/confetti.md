---
outline: deep
---

# Confetti

Press `2` `3` `4` to fire confetti that grows more intense with each press. Press `1` to shake the expression and reset.

<video controls playsinline width="100%">
  <source src="https://i.imgur.com/fNMrMLh.mp4" type="video/mp4">
</video>

## Setup

Copy the plugin files into your `collection.media` directory.

::: code-group

<!-- prettier-ignore -->
<<< ../../../packages/note/plugins/confetti/_kiku_plugin.js [_kiku_plugin.js]
<<< ../../../packages/note/plugins/confetti/_kiku_plugin.css [_kiku_plugin.css]
<<< ../../../packages/note/plugins/confetti/_kiku-plugin-confetti.js [_kiku-plugin-confetti.js]
:::

Audio files:

- [\_confetti.mp3](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/confetti/_confetti.mp3)
- [\_fail.mp3](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/confetti/_fail.mp3)
- [\_fail2.mp3](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/confetti/_fail2.mp3)
- [\_fireworks.mp3](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/confetti/_fireworks.mp3)

## Combo system

- Each success press increments the combo — particle count, velocity, gravity, and spread scale up to `maxCombo` (10)
- Reaching a `fireworksCheckpoints` milestone triggers a fireworks + star burst
- Four consecutive fails trigger a rose burst
