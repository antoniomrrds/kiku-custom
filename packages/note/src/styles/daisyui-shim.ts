import type { PluginAPI } from "tailwindcss/plugin";
import daisyui from "daisyui";
import { daisyUIThemes, type DaisyUITheme } from "#/src/lib/theme";
type CssInJs = Parameters<PluginAPI["addBase"]>[0];

const themeSelectorPattern = /\[data-theme=([^\]\s,]+)\]/g;

function getThemeNames(selector: string): string[] {
  const names: string[] = [];
  for (const match of selector.matchAll(themeSelectorPattern)) {
    const name = match[1].replace(/^["']|["']$/g, "");
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function adjustThemeSelectors(rules: CssInJs): CssInJs {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) return rules;

  const output: CssInJs = { ...rules };

  for (const [selector, value] of Object.entries(rules)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;

    if (selector.startsWith("@")) {
      output[selector] = adjustThemeSelectors(value as CssInJs);
      continue;
    }

    if (!selector.includes("[data-theme=") || selector.includes("[data-theme-dark=")) continue;

    let newSelector: string = selector;
    for (const themeName of getThemeNames(selector)) {
      newSelector = [
        //with #kiku-root
        `#kiku-root[data-theme="${themeName}"]`,
        `.dark #kiku-root[data-theme-dark="${themeName}"]`,
        `.nightMode #kiku-root[data-theme-dark="${themeName}"]`,
        //with #kiku-host::part(root)
        `#kiku-host[data-theme="${themeName}"]::part(root)`,
        `.dark #kiku-host[data-theme-dark="${themeName}"]::part(root)`,
        `.nightMode #kiku-host[data-theme-dark="${themeName}"]::part(root)`,
        //preview
        `[data-theme-preview="${themeName}"]`,
      ].join(", ");
    }

    if (newSelector !== selector) {
      delete output[selector];
      output[newSelector] = value;
    }
  }

  return output;
}

function daisyuiShim(options: Record<string, unknown> = {}) {
  const { handler, config } = daisyui(options);
  return {
    handler: (api: PluginAPI) => {
      handler({
        ...api,
        addBase: (rules) => {
          api.addBase(adjustThemeSelectors(rules));
        },
      });

      const themeWithDarkerValue: DaisyUITheme[] = [
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "synthwave",
        "retro",
        "cyberpunk",
        "garden",
        "pastel",
        "wireframe",
        "black",
        "business",
        "acid",
      ];

      const createSelector = (theme: DaisyUITheme) => {
        const selectorList = [
          `#kiku-root[data-theme="${theme}"]`,
          `.dark #kiku-root[data-theme-dark="${theme}"]`,
          `.nightMode #kiku-root[data-theme-dark="${theme}"]`,
          // with #kiku-host::part(root)
          `#kiku-host[data-theme="${theme}"]::part(root)`,
          `.dark #kiku-host[data-theme-dark="${theme}"]::part(root)`,
          `.nightMode #kiku-host[data-theme-dark="${theme}"]::part(root)`,
          // preview
          `[data-theme-preview="${theme}"]`,
        ];
        return selectorList;
      };
      const defaultValueSelectorList = [];
      const darkerValueSelectorList = [];
      for (const theme of daisyUIThemes) {
        const selector = createSelector(theme);
        if (themeWithDarkerValue.includes(theme)) {
          darkerValueSelectorList.push(...selector);
        } else {
          defaultValueSelectorList.push(...selector);
        }
      }

      const defaultValueSelector = defaultValueSelectorList.join(", ");
      const darkerValueSelector = darkerValueSelectorList.join(", ");

      api.addBase({
        [defaultValueSelector]: {
          "--color-base-content-primary": "var(--color-primary)",
        },
        [darkerValueSelector]: {
          "--color-base-content-primary":
            "color-mix(in srgb, var(--color-primary) 50%, var(--color-base-content))",
        },
      });
    },
    config,
  };
}
daisyuiShim.__isOptionsFunction = true;
export default daisyuiShim;
