---
outline: deep
---

# Display Extra Fields

Suppose you have an extra field called **SentenceTranslation** and you want to display it under the **Sentence** section on the back side.

First, open the file named `_kiku_back.html` in your `collection.media` directory. The contents will look like this:

```html
<!-- Kiku Note v1.1.1
This file is auto-generated. Any manual changes will be lost on save.




... rest of the file
```

Add **SentenceTranslation** inside a hidden element:

```html
<div style="display: none;" id="SentenceTranslation">{{SentenceTranslation}}</div>

<!-- Kiku Note v1.1.1
This file is auto-generated. Any manual changes will be lost on save.




... rest of the file
```

::: warning
Do not modify the rest of the file, even with code formatters (such as [Prettier](https://prettier.io/)).
:::

Now you can include the `SentenceTranslation` field in the `Sentence` component with `_kiku_plugin.js`:

<!-- prettier-ignore -->
<<< ../../../packages/note/plugins/display-extra-fields/_kiku_plugin.js

Finally, open the Kiku settings and click **Save**. This will update Kiku’s Back template using the modified `_kiku_back.html`.
