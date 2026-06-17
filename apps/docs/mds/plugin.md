---
outline: deep
---

# Plugin

A Kiku plugin is a JavaScript module named `_kiku_plugin.js` located in your `collection.media` directory.
This module must export a named variable called `plugin`.
The type definitions for this module are available [here](https://github.com/youyoumu/kiku/blob/main/packages/note/plugins/plugin-types.ts).

:::info
In addition to the JavaScript module, there is also `_kiku_plugin.css` for custom styling.
:::

<<< ../../../packages/note/plugins/plugin-types.ts

The plugin system is currently very basic, but more APIs will be added in the future.
Check out the [examples](https://github.com/youyoumu/kiku/tree/main/packages/note/plugins) for more advanced usage.
