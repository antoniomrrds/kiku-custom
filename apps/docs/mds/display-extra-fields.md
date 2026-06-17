---
outline: deep
---

# Display Extra Fields

Suppose you have an extra field called **ExtraInfo** and you want to display it under the **Sentence** section on the back side.

First, open the file named `_kiku_back.html` in your `collection.media` directory. The contents will look like this:

::: code-group

```html [_kiku_back.html]
<!-- Kiku Note v2.0.0
This file is auto-generated. Any manual changes will be lost on save.

... rest of the file
```

:::

Add **ExtraInfo** inside a template element:

```html
<template id="ExtraInfo">{{ExtraInfo}}</div>

<!-- Kiku Note v2.0.0
This file is auto-generated. Any manual changes will be lost on save.

... rest of the file
```

::: warning
Do not modify the rest of the file, even with code formatters (such as [Prettier](https://prettier.io/)).
The generated SSR template is sensitive to whitespaces and newlines.
:::

Now you can include the **ExtraInfo** field in the **Sentence** component with `_kiku_plugin.js`:

::: code-group

<!-- prettier-ignore -->
<<< ../../../packages/note/plugins/display-extra-fields/_kiku_plugin.js [_kiku_plugin.js]
:::

Finally, open the Kiku settings and click **Save**. This will update Kiku’s Back template using the modified `_kiku_back.html`.
