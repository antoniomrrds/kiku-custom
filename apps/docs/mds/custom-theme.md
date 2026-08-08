---
outline: deep
---

# Custom Theme

Open `_kiku_style.css` in your `collection.media` directory. you will find the following section:

::: code-group

```css [_kiku_style.css]
/* the rest of the file ... */

/* Custom theme here */
@layer custom {
  /* Customize "light" theme here  */
  .card:has(> #qa, #content > #qa),
  #kiku-root[data-theme="light"],
  :host([data-dark-mode]) #kiku-root[data-theme-dark="light"],
  .nightMode #kiku-root[data-theme-dark="light"],
  #kiku-host[data-theme="light"]::part(root),
  .nightMode #kiku-host[data-theme-dark="light"]::part(root),
  [data-theme-preview="light"] {
    color-scheme: light;
    --color-base-100: oklch(100% 0 0);
    --color-base-200: oklch(98% 0 0);
    --color-base-300: oklch(95% 0 0);
    --color-base-content: oklch(21% 0.006 285.885);
    --color-primary: oklch(45% 0.24 277.023);
    --color-primary-content: oklch(93% 0.034 272.788);
    --color-secondary: oklch(65% 0.241 354.308);
    --color-secondary-content: oklch(94% 0.028 342.258);
    --color-accent: oklch(77% 0.152 181.912);
    --color-accent-content: oklch(38% 0.063 188.416);
    --color-neutral: oklch(14% 0.005 285.823);
    --color-neutral-content: oklch(92% 0.004 286.32);
    --color-info: oklch(74% 0.16 232.661);
    --color-info-content: oklch(29% 0.066 243.157);
    --color-success: oklch(76% 0.177 163.223);
    --color-success-content: oklch(37% 0.077 168.94);
    --color-warning: oklch(82% 0.189 84.429);
    --color-warning-content: oklch(41% 0.112 45.904);
    --color-error: oklch(71% 0.194 13.428);
    --color-error-content: oklch(27% 0.105 12.094);
    --radius-selector: 0.5rem;
    --radius-field: 0.25rem;
    --radius-box: 0.5rem;
    --size-selector: 0.25rem;
    --size-field: 0.25rem;
    --border: 1px;
    --depth: 1;
    --noise: 0;

    /* don't forget this extra color */
    --color-base-content-primary: var(--color-primary);
  }

  /* Customize "dark" theme here  */
  .card:has(> #qa, #content > #qa).nightMode,
  #kiku-root[data-theme="dark"],
  :host([data-dark-mode]) #kiku-root[data-theme-dark="dark"],
  .nightMode #kiku-root[data-theme-dark="dark"],
  #kiku-host[data-theme="dark"]::part(root),
  .nightMode #kiku-host[data-theme-dark="dark"]::part(root),
  [data-theme-preview="dark"] {
    color-scheme: dark;
    --color-base-100: oklch(25.33% 0.016 252.42);
    --color-base-200: oklch(23.26% 0.014 253.1);
    --color-base-300: oklch(21.15% 0.012 254.09);
    --color-base-content: oklch(97.807% 0.029 256.847);
    --color-primary: oklch(58% 0.233 277.117);
    --color-primary-content: oklch(96% 0.018 272.314);
    --color-secondary: oklch(65% 0.241 354.308);
    --color-secondary-content: oklch(94% 0.028 342.258);
    --color-accent: oklch(77% 0.152 181.912);
    --color-accent-content: oklch(38% 0.063 188.416);
    --color-neutral: oklch(14% 0.005 285.823);
    --color-neutral-content: oklch(92% 0.004 286.32);
    --color-info: oklch(74% 0.16 232.661);
    --color-info-content: oklch(29% 0.066 243.157);
    --color-success: oklch(76% 0.177 163.223);
    --color-success-content: oklch(37% 0.077 168.94);
    --color-warning: oklch(82% 0.189 84.429);
    --color-warning-content: oklch(41% 0.112 45.904);
    --color-error: oklch(71% 0.194 13.428);
    --color-error-content: oklch(27% 0.105 12.094);
    --radius-selector: 0.5rem;
    --radius-field: 0.25rem;
    --radius-box: 0.5rem;
    --size-selector: 0.25rem;
    --size-field: 0.25rem;
    --border: 1px;
    --depth: 1;
    --noise: 0;

    /* don't forget this extra color */
    --color-base-content-primary: color-mix(
      in srgb,
      var(--color-primary) 50%,
      var(--color-base-content)
    );
  }
}

/* the rest of the file ... */
```

:::

These are the default value for "light" and "dark" theme. You can customize them as you like.
After saving the file, open the Kiku settings and click **Save**. This will update Kiku’s style template using the new modified `_kiku_style.css`.

::: tip
You can generate your own theme using the [daisyUI Theme Generator](https://daisyui.com/theme-generator/).
:::
