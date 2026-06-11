import type { PluginAPI } from "tailwindcss/plugin";
import daisyui from "daisyui";
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
        `#kiku-root[data-dark-mode][data-theme-dark="${themeName}"]`,
        //with #kiku-container #kiku-root
        `#kiku-container[data-theme="${themeName}"] #kiku-root`,
        `.nightMode #kiku-container[data-theme-dark="${themeName}"] #kiku-root`,
        //with #kiku-container #kiku-host::part(root)
        `#kiku-container[data-theme="${themeName}"] #kiku-host::part(root)`,
        `.nightMode #kiku-container[data-theme-dark="${themeName}"] #kiku-host::part(root)`,
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
      return handler({
        ...api,
        addBase: (rules) => api.addBase(adjustThemeSelectors(rules)),
      });
    },
    config,
  };
}
daisyuiShim.__isOptionsFunction = true;
export default daisyuiShim;
