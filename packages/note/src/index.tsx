/* @refresh reload */
import { createStore } from "solid-js/store";
import { hydrate, render } from "solid-js/web";
import { Back } from "./components/Back.tsx";
import { Front } from "./components/Front.tsx";
import { BreakpointContextProvider } from "./components/shared/BreakpointContext.tsx";
import {
  type KikuConfig,
  updateConfigState,
  validateConfig,
} from "./util/config.ts";
import { defaultConfig } from "./util/defaul-config";
import { constants } from "./util/general.ts";
import "./styles/tailwind.css";
import { Layout } from "./components/Layout.tsx";
import { AnkiFieldContextProvider } from "./components/shared/AnkiFieldsContext.tsx";
import { CardStoreContextProvider } from "./components/shared/CardContext.tsx";
import { ConfigContextProvider } from "./components/shared/ConfigContext.tsx";
import { CtxContextProvider } from "./components/shared/CtxContext.tsx";
import {
  FieldGroupContextProvider,
  RootFieldGroupContextProvider,
} from "./components/shared/FieldGroupContext.tsx";
import { GeneralContextProvider } from "./components/shared/GeneralContext.tsx";
import { debug } from "./util/debug.ts";
import { Logger } from "./util/logger.ts";

globalThis.KIKU_STATE = {
  logger: new Logger(),
  isAnkiDesktop: typeof pycmd !== "undefined",
  nexClient: globalThis.KIKU_STATE?.nexClient,
  aborter: globalThis.KIKU_STATE?.aborter ?? new AbortController(),
  debug,
};

export async function init({
  side,
  ssr,
}: {
  side: "front" | "back";
  ssr?: boolean;
}) {
  const now = performance.now();
  KIKU_STATE.aborter.abort();
  KIKU_STATE.aborter = new AbortController();
  KIKU_STATE.dispose?.();
  await setup({ aborter: KIKU_STATE.aborter, side, ssr });
  KIKU_STATE.startupTime = performance.now() - now;
}

async function setup({
  aborter,
  side,
  ssr,
}: {
  aborter: AbortController;
  side: "front" | "back";
  ssr?: boolean;
}) {
  try {
    if (!side) throw new Error("Side not set");

    if (!KIKU_STATE.unload) {
      KIKU_STATE.unload = () => {
        console.log("unload");
        if (KIKU_STATE.isAnkiDesktop) sessionStorage.clear();
      };
      window.addEventListener("unload", KIKU_STATE.unload);
    }

    const isAnkiWeb = window.location.origin.includes("ankiuser.net");
    let assetsPath = window.location.origin;

    if (isAnkiWeb) {
      KIKU_STATE.logger.info("AnkiWeb detected");
      document.documentElement.setAttribute("data-theme", "none");
      assetsPath = `${window.location.origin}/study/media`;
      const kikuCss = document.getElementById("kiku-css");
      kikuCss?.remove();
    }

    let root = document.getElementById("kiku-root");
    if (!root) {
      if (aborter.signal.aborted) return;
      const shadowParent = document.querySelector("#kiku-shadow-parent");
      if (shadowParent) {
        const existingRoot = shadowParent.shadowRoot?.querySelector(
          "#kiku-root",
        ) as HTMLElement | undefined | null;
        if (existingRoot && existingRoot.innerHTML.trim() === "") {
          root = existingRoot;
        } else {
          return;
        }
      } else {
        throw new Error("root not found");
      }
    }
    root.part.add("root-part");
    KIKU_STATE.root = root;
    KIKU_STATE.logger.debug("rootDataset", root.dataset);

    const qa = document.querySelector("#qa");
    const shadowParent = document.createElement("div");
    shadowParent.setAttribute("id", "kiku-shadow-parent");
    qa?.appendChild(shadowParent);
    const shadow = shadowParent.attachShadow({ mode: "open" });
    const style = qa?.querySelector("style");
    if (style) shadow?.appendChild(style.cloneNode(true));
    const tailwind = document.querySelector(
      'style[type="text/css"][data-vite-dev-id$="tailwind.css"]',
    );
    if (tailwind) {
      shadow?.appendChild(tailwind.cloneNode(true));
    } else {
      const kikuCss = document.createElement("link");
      kikuCss.rel = "stylesheet";
      kikuCss.href = "./_kiku.css";
      shadow?.prepend(kikuCss);
    }
    const kikuPluginCss = document.createElement("link");
    kikuPluginCss.rel = "stylesheet";
    kikuPluginCss.href = "./_kiku_plugin.css";
    shadow?.prepend(kikuPluginCss);
    shadow?.appendChild(root);

    let config$: KikuConfig;
    try {
      const cache = sessionStorage.getItem(
        constants.key["kiku-config"],
      );
      if (cache) {
        KIKU_STATE.logger.info("config cache hit:", cache);
        config$ = validateConfig(JSON.parse(cache));
      } else {
        KIKU_STATE.logger.info("config cache miss");
        config$ = validateConfig(
          await (
            await fetch(constants.assets["_kiku_config.json"], { cache: "no-store" })
          ).json(),
        );
        if (aborter.signal.aborted) return;
        sessionStorage.setItem(
          constants.key["kiku-config"],
          JSON.stringify(config$),
        );
      }
    } catch {
      KIKU_STATE.logger.warn("Failed to load config, using default config");
      config$ = defaultConfig;
    }

    updateConfigState(root, config$);

    const [config, setConfig] = createStore(config$);
    KIKU_STATE.relax = false;

    let dispose: (() => void) | undefined;

    if (side === "front") {
      const App = () => (
        <BreakpointContextProvider>
          <GeneralContextProvider
            aborter={aborter}
            isAnkiWeb={isAnkiWeb}
            assetsPath={assetsPath}
          >
            <AnkiFieldContextProvider>
              <CardStoreContextProvider side="front">
                <ConfigContextProvider value={[config, setConfig]}>
                  <FieldGroupContextProvider>
                    <RootFieldGroupContextProvider>
                      <CtxContextProvider>
                        <Layout>
                          <Front />
                        </Layout>
                      </CtxContextProvider>
                    </RootFieldGroupContextProvider>
                  </FieldGroupContextProvider>
                </ConfigContextProvider>
              </CardStoreContextProvider>
            </AnkiFieldContextProvider>
          </GeneralContextProvider>
        </BreakpointContextProvider>
      );
      if (ssr) {
        dispose = hydrate(App, root);
      } else {
        dispose = render(App, root);
      }
    } else if (side === "back") {
      const App = () => (
        <GeneralContextProvider
          aborter={aborter}
          isAnkiWeb={isAnkiWeb}
          assetsPath={assetsPath}
        >
          <AnkiFieldContextProvider>
            <CardStoreContextProvider side="back">
              <BreakpointContextProvider>
                <ConfigContextProvider value={[config, setConfig]}>
                  <FieldGroupContextProvider>
                    <RootFieldGroupContextProvider>
                      <CtxContextProvider>
                        <Layout>
                          <Back />
                        </Layout>
                      </CtxContextProvider>
                    </RootFieldGroupContextProvider>
                  </FieldGroupContextProvider>
                </ConfigContextProvider>
              </BreakpointContextProvider>
            </CardStoreContextProvider>
          </AnkiFieldContextProvider>
        </GeneralContextProvider>
      );
      if (ssr) {
        dispose = hydrate(App, root);
      } else {
        dispose = render(App, root);
      }
    }
    KIKU_STATE.dispose = dispose;
  } catch (e) {
    sessionStorage.clear();
    Object.assign(document.body.style, {
      margin: 0,
      padding: 0,
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
      color: "#f00",
      textAlign: "center",
    });

    const isError = e instanceof Error;

    document.body.innerHTML = isError
      ? `
        <span>Failed to render card.</span>
        <span><b>Error Name:</b> ${e.name}</span>
        <span><b>Error Message:</b> ${e.message}</span>
        <span><b>Error Cause:</b> ${e.cause ?? "N/A"}</span>
        <span><b>Error Stack:</b><br>
          <pre style="white-space: pre-wrap; background: #f3f4f6; padding: 8px;">
            ${e.stack}
          </pre>
        </span>
      `
      : `<span>Something went wrong.</span>`;
  }
}
