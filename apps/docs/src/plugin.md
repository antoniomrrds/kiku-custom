---
outline: deep
---

# Plugin

A Kiku plugin is a JavaScript module named `_kiku_plugin.js`.
This module must export a named variable called `plugin`.
The type definitions for this module are available [here](https://github.com/youyoumu/kiku/blob/main/packages/note/src/plugins/plugin-types.ts).

:::info
In addition to the JavaScript module, you may include a `_kiku_plugin.css` file for custom plugin styling.
:::

<<< ../../../packages/note/src/plugins/plugin-types.ts

The plugin system is currently very basic, but more APIs will be added in the future.
Check out the [examples](https://github.com/youyoumu/kiku/tree/main/packages/note/src/plugins/examples) for more advanced usage.
