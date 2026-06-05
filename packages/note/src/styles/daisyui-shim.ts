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
        `#kiku-shadow-parent[data-theme="${themeName}"] #kiku-root`,
        `.nightMode #kiku-shadow-parent[data-theme-dark="${themeName}"] #kiku-root`,
        `:host([data-theme="${themeName}"])`,
        `:host([data-theme-dark="${themeName}"])`,
        `#kiku-shadow-parent[data-theme="${themeName}"]::part(root)`,
        `.nightMode #kiku-shadow-parent[data-theme-dark="${themeName}"]::part(root)`,
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
