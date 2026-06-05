type CssInJs = {
  [key: string]: string | string[] | CssInJs | CssInJs[];
};

type DaisyuiApi = {
  addBase(base: CssInJs): void;
  addVariant(name: string, variant: string | string[] | CssInJs): void;
  addUtilities(
    utilities: Record<string, CssInJs | CssInJs[]> | Record<string, CssInJs | CssInJs[]>[],
    options?: Record<string, unknown>,
  ): void;
  addComponents(
    utilities: Record<string, CssInJs> | Record<string, CssInJs>[],
    options?: Record<string, unknown>,
  ): void;
  theme(path: string, defaultValue?: unknown): unknown;
  config(path?: string, defaultValue?: unknown): unknown;
  prefix(className: string): string;
};

declare module "daisyui" {
  const daisyui: (options?: Record<string, unknown>) => {
    handler: (api: DaisyuiApi) => void;
    config?: unknown;
  };
  export default daisyui;
}
