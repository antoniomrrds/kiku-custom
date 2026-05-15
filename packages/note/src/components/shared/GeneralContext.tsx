import { createContext, onMount, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import type { KikuPlugin } from "#/plugins/plugin-types";
import type { RootDataset } from "#/util/config";
import { createCompatPair } from "#/util/context-compat";
import type { Logger } from "#/util/logger";
import type { AnkiDroidAPI, KikuNotesManifest } from "#/util/types";
import type { NexApi } from "#/worker/client";
import { AnkiConnect } from "../_kiku_lazy/util/anki-connect";
import { useBreakpointContext } from "./BreakpointContext";

type GeneralStore = {
  logger: Logger;
  plugin: KikuPlugin | undefined;
  root: HTMLElement | undefined;
  isConfigOutOfSync: boolean;
  templateDataset: RootDataset;
  isAnkiWeb: boolean;
  isAnkiDesktop: boolean;
  workerPath: string | undefined;
  ankiDroidAPI: AnkiDroidAPI | undefined;
  startupTime: () => number;
  assetsPath: string;
  aborter: AbortController;
  isAnkiConnectAvailable: boolean;
  notesManifest: KikuNotesManifest | undefined;
  layoutRef: HTMLDivElement | undefined;
  contentRef: HTMLDivElement | undefined;
  toast: Toast;
  nex: PromiseWithResolvers<NexApi>;
  checkAnkiConnect: () => Promise<void>;
  useCheckAnkiConnect: () => void;
};

type Toast = {
  success: (message: string) => void;
  error: (message: string) => void;
  message: string | undefined;
  type: "success" | "error";
};

type GeneralContextValue = {
  $general: Store<GeneralStore>;
  $setGeneral: SetStoreFunction<GeneralStore>;
};

const GeneralContext = createContext<GeneralContextValue>();

export function GeneralContextProvider(props: {
  children: JSX.Element;
  isAnkiWeb: boolean;
  isAnkiDesktop: boolean;
  workerPath: string | undefined;
  templateDataset: RootDataset;
  ankiDroidAPI: AnkiDroidAPI | undefined;
  startupTime: () => number;
  assetsPath: string;
  aborter: AbortController;
  logger: Logger;
  root: HTMLElement | undefined;
}) {
  let timeout: ReturnType<typeof setTimeout>;
  const success = (message: string) => {
    if (timeout) clearTimeout(timeout);
    $setGeneral("toast", { message, type: "success" });
    timeout = setTimeout(() => {
      $setGeneral("toast", { message: undefined, type: "success" });
    }, 3000);
  };
  const error = (message: string) => {
    if (timeout) clearTimeout(timeout);
    $setGeneral("toast", { message, type: "error" });
    timeout = setTimeout(() => {
      $setGeneral("toast", { message: undefined, type: "error" });
    }, 3000);
  };

  async function checkAnkiConnect() {
    try {
      const version = await AnkiConnect.getVersion();
      if (version) {
        $general.logger.info("AnkiConnect version:", version);
        $setGeneral("isAnkiConnectAvailable", true);
      }
    } catch {
      $general.logger.warn("AnkiConnect is not available");
      $setGeneral("isAnkiConnectAvailable", false);
    }
  }

  function useCheckAnkiConnect() {
    const bp = useBreakpointContext();
    onMount(() => {
      if (!bp.isAtLeast("sm")) return;
      $general.checkAnkiConnect();
    });
  }

  const nex = Promise.withResolvers<NexApi>();

  const [$general, $setGeneral] = createStore<GeneralStore>({
    logger: props.logger,
    plugin: undefined,
    root: props.root,
    isConfigOutOfSync: false,
    templateDataset: props.templateDataset,
    isAnkiWeb: props.isAnkiWeb,
    isAnkiDesktop: props.isAnkiDesktop,
    workerPath: props.workerPath,
    ankiDroidAPI: props.ankiDroidAPI,
    startupTime: props.startupTime,
    assetsPath: props.assetsPath,
    aborter: props.aborter,
    isAnkiConnectAvailable: false,
    notesManifest: undefined,
    layoutRef: undefined,
    contentRef: undefined,
    toast: { success, error, message: undefined, type: "success" },
    nex,
    checkAnkiConnect,
    useCheckAnkiConnect,
  });

  return (
    <GeneralContext.Provider value={{ $general, $setGeneral }}>
      {props.children}
    </GeneralContext.Provider>
  );
}

export function useGeneralContext() {
  const generalContext = useContext(GeneralContext);
  if (!generalContext) throw new Error("Missing GeneralContext");
  return createCompatPair(
    "$general",
    "$setGeneral",
    generalContext.$general,
    generalContext.$setGeneral,
  );
}

export type UseGeneralContext = typeof useGeneralContext;
