/* @refresh reload */
import "./lib/polyfill.ts";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
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

export async function init({
  root,
  host,
  side,
  ankiFields,
  ssr,
  config = defaultConfig,
  aborter = new AbortController(),
  ankiDroidAPI,
  logger = new Logger(),
  cacheStore = {},
  assetsPath = window.location.origin,
  isAnkiWeb = false,
  isAnkiDesktop = typeof pycmd !== "undefined",
  workerPath,
  rootDataset,
  styleTags = [],
  initialDarkMode = document.body?.classList.contains("nightMode"),
  isAnkiDroidOldStudyScreen = false,
  isAnkiDroidNewStudyScreen = false,
  isAnkiDroid = false,
}: {
  root: HTMLElement;
  host: HTMLElement;
  side: "front" | "back";
  ankiFields: AnkiFields;
  ssr?: boolean;
  config?: KikuConfig | ((defaultConfig: KikuConfig) => KikuConfig);
  aborter?: AbortController;
  ankiDroidAPI?: AnkiDroidAPI;
  logger?: Logger;
  cacheStore?: CacheStore;
  assetsPath?: string;
  isAnkiWeb?: boolean;
  isAnkiDesktop?: boolean;
  workerPath?: string;
  rootDataset?: RootDataset;
  styleTags?: HTMLStyleElement[];
  initialDarkMode?: boolean;
  isAnkiDroidOldStudyScreen?: boolean;
  isAnkiDroidNewStudyScreen?: boolean;
  isAnkiDroid?: boolean;
}) {
  const [$startupTime, $setStartupTime] = createSignal(0);
  const now = performance.now();

  logger.info("[init] start", {
    side,
    expression: ankiFields.Expression,
    ssr: !!ssr,
    isAnkiWeb,
    isAnkiDesktop,
  });

  config = typeof config === "function" ? config(defaultConfig) : config;
  updateConfigState({ host, root, config, styleTags, updateDocument: !isAnkiWeb });
  const [$config, $setConfig] = createStore(config);

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
          $startupTime={$startupTime}
          assetsPath={assetsPath}
          logger={logger}
          root={root}
          host={host}
          styleTags={styleTags}
          initialDarkMode={initialDarkMode}
          isAnkiDroidOldStudyScreen={isAnkiDroidOldStudyScreen ?? false}
          isAnkiDroidNewStudyScreen={isAnkiDroidNewStudyScreen ?? false}
          isAnkiDroid={isAnkiDroid ?? false}
        >
          <ConfigContextProvider value={{ $config, $setConfig }}>
            <AnkiFieldContextProvider initialAnkiFields={ankiFields} isRoot>
              <RootAnkiFieldsContextProvider>
                <CardStoreContextProvider initialSide={side} initialNsfw={isNsfw(ankiFields.Tags)}>
                  <FieldGroupContextProvider>
                    <CtxContextProvider>
                      <Layout>{side === "front" ? <Front /> : <Back />}</Layout>
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

  const dispose = ssr ? hydrate(App, root) : render(App, root);
  $setStartupTime(performance.now() - now);
  logger.info("[init] done, startup:", `${$startupTime().toFixed(1)}ms`);
  return { dispose, logger };
}

export async function initAnki({ side, ssr }: { side: "front" | "back"; ssr?: boolean }) {
  const logger = globalThis.KIKU?.logger ?? new Logger();
  logger.info("[initAnki] start, side:", side, "ssr:", !!ssr);

  if (globalThis.KIKU?.aborter) globalThis.KIKU.aborter.abort();
  if (globalThis.KIKU?.dispose) globalThis.KIKU.dispose();

  const aborter = new AbortController();

  globalThis.KIKU ??= {};
  globalThis.KIKU.aborter = aborter;
  globalThis.KIKU.relax = false;
  globalThis.KIKU.logger = logger;

  if (!globalThis.KIKU.unload && !import.meta.env.DEV) {
    globalThis.KIKU.unload = () => {
      if (typeof pycmd !== "undefined") sessionStorage.clear();
    };
    window.addEventListener("unload", globalThis.KIKU.unload);
  }

  const isAnkiDroidOldStudyScreen =
    typeof AnkiDroidJS !== "undefined" &&
    document.documentElement.classList.contains("android") &&
    !!document.querySelector("body > div#content > #qa");
  const isAnkiDroidNewStudyScreen =
    typeof AnkiDroidJS !== "undefined" &&
    document.documentElement.classList.contains("android") &&
    !!document.querySelector("body > div#qa");
  const isAnkiDroid = document.documentElement.classList.contains("android");

  //TODO: enable when AnkiDroidAPI is ready on new study screen https://github.com/youyoumu/kiku/issues/30
  if (
    !globalThis.KIKU.ankiDroidAPI &&
    typeof AnkiDroidJS !== "undefined" &&
    isAnkiDroidOldStudyScreen
  ) {
    globalThis.KIKU.ankiDroidAPI = new AnkiDroidJS({
      version: "0.0.3",
      developer: "youyoumu",
    });
    logger.info("[initAnki] AnkiDroidAPI initialized");
  }

  let assetsPath = window.location.origin;
  const isAnkiWeb = window.location.origin.includes("ankiuser.net");
  if (isAnkiWeb) {
    assetsPath = `${window.location.origin}/study/media`;
    const kikuCss = document.getElementById("kiku-css");
    kikuCss?.remove();
    logger.info("[initAnki] AnkiWeb mode, assetsPath:", assetsPath);
  }

  try {
    const qa = document.querySelector("#qa");
    if (!qa) throw new Error("#qa not found");
    const host = document.querySelector<HTMLElement>("#kiku-host");
    if (!host) throw new Error("#kiku-host not found");

    let root = document.getElementById("kiku-root");
    if (!root) {
      const existingRoot = host.shadowRoot?.querySelector("#kiku-root") as
        | HTMLElement
        | undefined
        | null;
      if (existingRoot && existingRoot.innerHTML.trim() === "") {
        root = existingRoot;
      } else {
        logger.debug("[initAnki] no #kiku-root with content, skipping");
        return;
      }
    }
    const rootDataset = {
      theme: root.dataset.theme,
      themeDark: root.dataset.themeDark,
      blurNsfw: root.dataset.blurNsfw,
      pictureOnFront: root.dataset.pictureOnFront,
      modVertical: root.dataset.modVertical,
    } satisfies RootDataset;
    logger.debug("[initAnki] rootDataset:", rootDataset);

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

    const style = qa.querySelector<HTMLStyleElement>("style");
    const shadowStyle = style?.cloneNode(true) as HTMLStyleElement | undefined;
    if (shadowStyle) shadow.appendChild(shadowStyle);
    if (isAnkiWeb) style?.remove();
    const styleTags = [style, shadowStyle].filter(Boolean) as HTMLStyleElement[];

    let config: KikuConfig | undefined;
    try {
      const cache = sessionStorage.getItem(constants.key["kiku-config"]);
      if (cache) {
        config = validateConfig(JSON.parse(cache));
        logger.info("[initAnki] config loaded from sessionStorage");
      } else {
        const res = await fetch(constants.assets["_kiku_config.json"], {
          cache: "no-store",
        });
        const json = await res.json();
        config = validateConfig(json);
        if (aborter.signal.aborted) return;
        sessionStorage.setItem(constants.key["kiku-config"], JSON.stringify(config));
        logger.info("[initAnki] config fetched and cached");
      }
    } catch (e) {
      logger.warn("[initAnki] config load failed:", e instanceof Error ? e.message : e);
    }

    if (import.meta.env.DEV) {
      const mainCss = document.querySelector(
        'style[type="text/css"][data-vite-dev-id$="main.css"]',
      );
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
    } else {
      const kikuCss = document.createElement("link");
      kikuCss.rel = "stylesheet";
      kikuCss.href = "./_kiku.css";
      shadow.prepend(kikuCss);
      if (!isAnkiWeb && !document.head.querySelector("#kiku-css-head")) {
        logger.debug("[initAnki] appending #kiku-css-head");
        const kikuCssHead = kikuCss.cloneNode(true) as HTMLLinkElement;
        kikuCssHead.id = "kiku-css-head";
        document.head.appendChild(kikuCssHead);
      }
      if (!isAnkiWeb && qa && !globalThis.KIKU.kikuCssHeadObserver) {
        const observer = new MutationObserver(() => {
          queueMicrotask(() => {
            if (!document.querySelector("#kiku-host")) {
              logger.debug("[initAnki] removing #kiku-css-head");
              document.getElementById("kiku-css-head")?.remove();
            }
          });
        });
        observer.observe(qa, { childList: true });
        globalThis.KIKU.kikuCssHeadObserver = observer;
      }
    }

    const kikuPluginCss = document.createElement("link");
    kikuPluginCss.rel = "stylesheet";
    kikuPluginCss.href = "./_kiku_plugin.css";
    shadow.prepend(kikuPluginCss);
    shadow.appendChild(root);

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

    //NOTE: AnkiMobile kanji tooltip hack https://github.com/youyoumu/kiku/issues/12#issuecomment-4216160200
    const kanjiToolTipSyle = document.createElement("style");
    kanjiToolTipSyle.innerHTML = `[data-kanji-tooltip] { display: none !important; }`;
    shadow.appendChild(kanjiToolTipSyle);
    const resetKanjiTooltip = () => {
      const kanjiTooltips = root?.querySelectorAll<HTMLSpanElement>("[data-kanji-tooltip]");
      Array.from(kanjiTooltips ?? []).forEach((el) => {
        el.style.display = "none";
      });
      kanjiToolTipSyle.remove();
    };

    const res = await init({
      root,
      host,
      side,
      ankiFields,
      ssr,
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
    setTimeout(resetKanjiTooltip, 50);

    Object.assign(globalThis.KIKU, res);
    if (import.meta.env.DEV) root.dataset.side = side;
  } catch (e) {
    sessionStorage.clear();
    window.renderErrorFallback?.(e);
  }
}
