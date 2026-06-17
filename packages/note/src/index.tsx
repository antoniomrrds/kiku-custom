/* @refresh reload */
import "./lib/polyfill.ts";
import { createSignal } from "solid-js";
import { hydrate, render } from "solid-js/web";
import { Back } from "./components/Back.tsx";
import { Front } from "./components/Front.tsx";
import { Layout } from "./components/Layout.tsx";
import {
  AnkiFieldContextProvider,
  RootAnkiFieldsContextProvider,
} from "./contexts/AnkiFieldsContext.tsx";
import { BreakpointContextProvider } from "./contexts/BreakpointContext.tsx";
import { CacheContextProvider } from "./contexts/CacheContext.tsx";
import { CardStoreContextProvider } from "./contexts/CardContext.tsx";
import { ConfigContextProvider } from "./contexts/ConfigContext.tsx";
import { CtxContextProvider } from "./contexts/CtxContext.tsx";
import { FieldGroupContextProvider } from "./contexts/FieldGroupContext.tsx";
import { GeneralContextProvider } from "./contexts/GeneralContext.tsx";
import {
  generateCssVars,
  generateCssVarsDark,
  getCssVar,
  getCssVarDark,
  type KikuConfig,
  type RootDataset,
  updateConfigState,
  validateConfig,
} from "./lib/config.ts";
import { constants } from "./lib/contants.ts";
import { defaultConfig } from "./lib/default-config.ts";
import { exampleFields } from "./lib/examples.ts";
import { isNsfw } from "./lib/util.ts";
import { Logger } from "./lib/logger.ts";
import {
  type AnkiDroidAPI,
  type AnkiFields,
  ankiFieldsSkeleton,
  type CacheStore,
} from "./lib/types.ts";
import "./styles/main.css";

export class KikuHost extends HTMLElement {
  shadow: ShadowRoot;
  side: "front" | "back";
  ssr: boolean;
  now: number;
  constructor() {
    super();
    this.now = performance.now();
    this.shadow = this.attachShadow({ mode: "open" });
    const side = this.getAttribute("side");
    this.side = side === "front" ? "front" : "back";
    this.ssr = this.hasAttribute("ssr");
  }

  init({
    root,
    ankiFields,
    config = defaultConfig,
    aborter = new AbortController(),
    ankiDroidAPI,
    logger = new Logger(),
    cacheStore = {},
    assetsPath = window.location.origin,
    workerPath,
    rootDataset,
    styleTags = [],
    initialDarkMode = document.body?.classList.contains("nightMode"),
    isAnkiWeb = false,
    isAnkiDesktop = typeof pycmd !== "undefined",
    isAnkiDroidOldStudyScreen = false,
    isAnkiDroidNewStudyScreen = false,
    isAnkiDroid = false,
  }: {
    root: HTMLElement;
    ankiFields: AnkiFields;
    config?: KikuConfig | ((defaultConfig: KikuConfig) => KikuConfig);
    aborter?: AbortController;
    ankiDroidAPI?: AnkiDroidAPI;
    logger?: Logger;
    cacheStore?: CacheStore;
    assetsPath?: string;
    workerPath?: string;
    rootDataset?: RootDataset;
    styleTags?: HTMLStyleElement[];
    initialDarkMode?: boolean;
    isAnkiWeb?: boolean;
    isAnkiDesktop?: boolean;
    isAnkiDroidOldStudyScreen?: boolean;
    isAnkiDroidNewStudyScreen?: boolean;
    isAnkiDroid?: boolean;
  }) {
    const [$preStartupTime] = createSignal(performance.now() - this.now);
    const [$startupTime, $setStartupTime] = createSignal(0);
    const now = performance.now();

    logger.info("[init] start", {
      side: this.side,
      expression: ankiFields.Expression,
      ssr: this.ssr,
      isAnkiWeb,
      isAnkiDesktop,
    });

    config = typeof config === "function" ? config(defaultConfig) : config;
    updateConfigState({ root, host: this, config, styleTags });

    const App = () => (
      <BreakpointContextProvider>
        <CacheContextProvider cacheStore={cacheStore}>
          <GeneralContextProvider
            aborter={aborter}
            isAnkiWeb={isAnkiWeb}
            isAnkiDesktop={isAnkiDesktop}
            workerPath={workerPath}
            templateDataset={rootDataset ?? {}}
            ankiDroidAPI={ankiDroidAPI}
            $preStartupTime={$preStartupTime}
            $startupTime={$startupTime}
            assetsPath={assetsPath}
            logger={logger}
            root={root}
            host={this}
            styleTags={styleTags}
            initialDarkMode={initialDarkMode}
            isAnkiDroidOldStudyScreen={isAnkiDroidOldStudyScreen ?? false}
            isAnkiDroidNewStudyScreen={isAnkiDroidNewStudyScreen ?? false}
            isAnkiDroid={isAnkiDroid ?? false}
          >
            <ConfigContextProvider initialConfig={config}>
              <AnkiFieldContextProvider initialAnkiFields={ankiFields} isRoot>
                <RootAnkiFieldsContextProvider>
                  <CardStoreContextProvider
                    initialSide={this.side}
                    initialNsfw={isNsfw(ankiFields.Tags)}
                  >
                    <FieldGroupContextProvider>
                      <CtxContextProvider>
                        <Layout>{this.side === "front" ? <Front /> : <Back />}</Layout>
                      </CtxContextProvider>
                    </FieldGroupContextProvider>
                  </CardStoreContextProvider>
                </RootAnkiFieldsContextProvider>
              </AnkiFieldContextProvider>
            </ConfigContextProvider>
          </GeneralContextProvider>
        </CacheContextProvider>
      </BreakpointContextProvider>
    );

    const dispose = this.ssr ? hydrate(App, root) : render(App, root);
    $setStartupTime(performance.now() - now);
    logger.info(
      "[init] done, startup:",
      `${$preStartupTime().toFixed(1)}+${$startupTime().toFixed(1)}ms`,
    );
    return { dispose, logger };
  }
}

export class KikuHostAnki extends KikuHost {
  logger: Logger;
  aborter: AbortController;
  constructor() {
    super();
    this.logger = globalThis.KIKU?.logger ?? new Logger();
    if (globalThis.KIKU?.aborter) globalThis.KIKU.aborter.abort();
    if (globalThis.KIKU?.dispose) globalThis.KIKU.dispose();
    this.aborter = new AbortController();

    globalThis.KIKU ??= {};
    globalThis.KIKU.aborter = this.aborter;
    globalThis.KIKU.logger = this.logger;
  }

  async connectedCallback() {
    try {
      await this.$connectedCallback();
    } catch (e) {
      window.renderErrorFallback?.(e);
    }
  }

  async $connectedCallback() {
    globalThis.KIKU ??= {};
    const { logger, aborter, shadow } = this;

    const config = await this.getConfig();
    if (aborter.signal.aborted) return;

    const {
      isAnkiDesktop,
      isAnkiWeb,
      isAnkiDroidOldStudyScreen,
      isAnkiDroidNewStudyScreen,
      isAnkiDroid,
    } = this.getEnv();

    if (isAnkiDesktop) this.setupUnload();
    //TODO: enable when AnkiDroidAPI is ready on new study screen https://github.com/youyoumu/kiku/issues/30
    if (isAnkiDroidOldStudyScreen) this.setupAnkiDroidAPI();
    if (isAnkiWeb) this.removeKikuCss();

    const assetsPath = this.getAssetsPath(isAnkiWeb);

    const qa = document.querySelector("#qa") as HTMLElement;
    const root = document.querySelector("#kiku-root") as HTMLElement;
    if (!qa || !root) throw new Error("#qa or #kiku-root not found");

    const rootDataset = this.getRootDataSet(root);
    const styleTags = this.setupStyleTags(qa);

    if (import.meta.env.DEV) {
      this.setupDevCss(styleTags, config);
    } else {
      const css = await this.getKikuCSSStyleSheet();
      if (!isAnkiWeb) this.setupKikuCSSStyleSheet(qa, css);
      shadow.adoptedStyleSheets = [css];
    }

    this.setupKikuPluginCss();
    const ankiFields = this.getAnkiFields();

    shadow.appendChild(root);
    if (aborter.signal.aborted) return;

    const res = this.init({
      root,
      ankiFields,
      config,
      aborter,
      ankiDroidAPI: globalThis.KIKU.ankiDroidAPI,
      logger,
      cacheStore: globalThis.KIKU,
      assetsPath,
      isAnkiWeb,
      rootDataset,
      styleTags,
      isAnkiDroidOldStudyScreen,
      isAnkiDroidNewStudyScreen,
      isAnkiDroid,
    });

    Object.assign(globalThis.KIKU, res);
    if (import.meta.env.DEV) root.dataset.side = this.side;
  }

  async getConfig() {
    const { logger } = this;
    let config: KikuConfig | undefined;
    try {
      const cache = sessionStorage.getItem(constants.key["kiku-config"]);
      if (cache) {
        config = validateConfig(JSON.parse(cache));
        logger.info("[init] config loaded from sessionStorage");
      } else {
        const res = await fetch(constants.assets["_kiku_config.json"], { cache: "no-store" });
        const json = await res.json();
        config = validateConfig(json);
        sessionStorage.setItem(constants.key["kiku-config"], JSON.stringify(config));
        logger.info("[init] config fetched and cached");
      }
    } catch (e) {
      logger.warn("[init] config load failed:", e instanceof Error ? e.message : e);
    }
    return config;
  }

  getEnv() {
    const isAnkiDesktop = typeof pycmd !== "undefined";
    const isAnkiWeb = window.location.origin.includes("ankiuser.net");
    const isAnkiDroidOldStudyScreen =
      typeof AnkiDroidJS !== "undefined" &&
      document.documentElement.classList.contains("android") &&
      !!document.querySelector("body > div#content > #qa");
    const isAnkiDroidNewStudyScreen =
      typeof AnkiDroidJS !== "undefined" &&
      document.documentElement.classList.contains("android") &&
      !!document.querySelector("body > div#qa");
    const isAnkiDroid = document.documentElement.classList.contains("android");
    return {
      isAnkiDesktop,
      isAnkiWeb,
      isAnkiDroidOldStudyScreen,
      isAnkiDroidNewStudyScreen,
      isAnkiDroid,
    };
  }

  setupUnload() {
    if (globalThis.KIKU && !globalThis.KIKU?.unload && !import.meta.env.DEV) {
      globalThis.KIKU.unload = () => {
        sessionStorage.clear();
      };
      window.addEventListener("unload", globalThis.KIKU.unload);
    }
  }

  setupAnkiDroidAPI() {
    const { logger } = this;
    if (globalThis.KIKU && !globalThis.KIKU.ankiDroidAPI && typeof AnkiDroidJS !== "undefined") {
      globalThis.KIKU.ankiDroidAPI = new AnkiDroidJS({
        version: "0.0.3",
        developer: "youyoumu",
      });
      logger.info("[init] AnkiDroidAPI initialized");
    }
  }

  getAssetsPath(isAnkiWeb: boolean) {
    const { logger } = this;
    let assetsPath = window.location.origin;
    if (isAnkiWeb) {
      assetsPath = `${window.location.origin}/study/media`;
      logger.info("[init] AnkiWeb mode, assetsPath:", assetsPath);
    }
    return assetsPath;
  }

  removeKikuCss() {
    document.querySelector("#kiku-css")?.remove();
  }

  getRootDataSet(root: HTMLElement) {
    const { logger } = this;
    const rootDataset: RootDataset = {
      theme: root.dataset.theme,
      themeDark: root.dataset.themeDark,
      blurNsfw: root.dataset.blurNsfw,
      pictureOnFront: root.dataset.pictureOnFront,
      modVertical: root.dataset.modVertical,
    };
    logger.debug("[init] rootDataset:", rootDataset);
    return rootDataset;
  }

  setupStyleTags(qa: HTMLElement) {
    const { shadow } = this;
    const style = qa.querySelector<HTMLStyleElement>("style");
    const shadowStyle = style?.cloneNode(true) as HTMLStyleElement | undefined;
    if (shadowStyle) shadow.appendChild(shadowStyle);
    const styleTags = [style, shadowStyle].filter(Boolean) as HTMLStyleElement[];
    return styleTags;
  }

  async getKikuCSSStyleSheet() {
    const { aborter } = this;
    let css = globalThis.KIKU?.kikuCSSStyleSheet;
    if (css) return css;

    const res = await fetch("./_kiku.css", { signal: aborter.signal });
    const text = await res.text();
    css = new CSSStyleSheet();
    css.replaceSync(text);
    if (globalThis.KIKU) globalThis.KIKU.kikuCSSStyleSheet = css;

    return css;
  }

  setupKikuCSSStyleSheet(qa: HTMLElement, css: CSSStyleSheet) {
    const { logger } = this;
    if (document.adoptedStyleSheets.includes(css)) {
      logger.debug("[init] kiku CSSStyleSheet already added");
      return;
    }
    logger.debug("[init] adding kiku CSSStyleSheet");
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, css];
    if (qa && globalThis.KIKU && !globalThis.KIKU.kikuCSSStyleSheetObserver) {
      const observer = new MutationObserver(() => {
        queueMicrotask(() => {
          if (!document.querySelector("#kiku-host")) {
            logger.debug("[init] removing kiku CSSStyleSheet");
            document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
              (sheet) => sheet !== css,
            );
          }
        });
      });
      observer.observe(qa, { childList: true });
      globalThis.KIKU.kikuCSSStyleSheetObserver = observer;
    }
  }

  getAnkiFields() {
    const ankiFieldsTemplate = document.querySelector("#anki-fields");
    let templates: NodeListOf<HTMLTemplateElement> | HTMLTemplateElement[] | undefined =
      ankiFieldsTemplate instanceof HTMLTemplateElement
        ? ankiFieldsTemplate.content.querySelectorAll("template[data-field]")
        : undefined;
    if (import.meta.env.DEV) {
      templates = Object.entries(exampleFields).map(([key, value]) => {
        const fieldTemplate = document.createElement("template");
        fieldTemplate.dataset.field = key;
        fieldTemplate.innerHTML = value.toString();
        return fieldTemplate;
      });
    }
    const ankiFields = templates
      ? Object.fromEntries(
          Array.from(templates).map((el) => [el.dataset.field, el.innerHTML.trim()]),
        )
      : ankiFieldsSkeleton;
    return ankiFields;
  }

  setupDevCss(styleTags: HTMLStyleElement[], config: KikuConfig | undefined) {
    const { shadow } = this;
    const mainCss = document.querySelector('style[type="text/css"][data-vite-dev-id$="main.css"]');
    if (!mainCss) throw new Error("main.css not found");
    shadow.appendChild(mainCss.cloneNode(true));
    const ankiCss = document.querySelector('link[href="/anki.css"]');
    if (ankiCss) shadow.appendChild(ankiCss.cloneNode(true));
    const style = document.createElement("style");
    style.innerHTML = `${generateCssVars(getCssVar(config ?? defaultConfig))}\n\n${generateCssVarsDark(getCssVarDark(config ?? defaultConfig))}`;
    document.head.appendChild(style);
    const shadowStyle = style?.cloneNode(true) as HTMLStyleElement;
    shadow.appendChild(shadowStyle);
    styleTags.push(shadowStyle);
    styleTags.push(style);
  }

  setupKikuPluginCss() {
    const { shadow } = this;
    const kikuPluginCss = document.createElement("link");
    kikuPluginCss.rel = "stylesheet";
    kikuPluginCss.href = "./_kiku_plugin.css";
    shadow.prepend(kikuPluginCss);
  }
}

customElements.define("kiku-host-anki", KikuHostAnki);
