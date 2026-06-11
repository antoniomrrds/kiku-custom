import { createContext, useContext, type Accessor } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import type { RootDataset } from "#/src/lib/config";
import { createCompatPair } from "#/src/lib/context-compat";
import type { Logger } from "#/src/lib/logger";
import type { AnkiDroidAPI, KikuNotesManifest } from "#/src/lib/types";
import type { KikuPlugin } from "#/plugins/plugin-types";
import type { WorkerApi } from "#/src/worker/client";

type GeneralStore = {
  plugin: KikuPlugin | undefined;
  root: HTMLElement | undefined;
  container: HTMLElement | undefined;
  isAnkiConnectAvailable: boolean;
  notesManifest: KikuNotesManifest | undefined;
  layoutRef: HTMLDivElement | undefined;
  contentRef: HTMLDivElement | undefined;
  toast: Toast;
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
  $startupTime: Accessor<number>;
  aborter: AbortController;
  workerPath: string | undefined;
  assetsPath: string;
  isAnkiWeb: boolean;
  isAnkiDesktop: boolean;
  isAnkiDroid: boolean;
  isAnkiDroidOldStudyScreen: boolean;
  isAnkiDroidNewStudyScreen: boolean;
  initialDarkMode: boolean;
  workerApi: PromiseWithResolvers<WorkerApi>;
  styleTags: HTMLStyleElement[];
  ankiDroidAPI: AnkiDroidAPI | undefined;
  logger: Logger;
  templateDataset: RootDataset;
};

const GeneralContext = createContext<GeneralContextValue>();

export function GeneralContextProvider(props: {
  children: JSX.Element;
  isAnkiWeb: boolean;
  isAnkiDesktop: boolean;
  workerPath: string | undefined;
  templateDataset: RootDataset;
  ankiDroidAPI: AnkiDroidAPI | undefined;
  $startupTime: Accessor<number>;
  assetsPath: string;
  aborter: AbortController;
  logger: Logger;
  root: HTMLElement | undefined;
  container: HTMLElement | undefined;
  styleTags: HTMLStyleElement[];
  initialDarkMode: boolean;
  isAnkiDroidOldStudyScreen: boolean;
  isAnkiDroidNewStudyScreen: boolean;
  isAnkiDroid: boolean;
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

  const workerApi = Promise.withResolvers<WorkerApi>();

  const [$general, $setGeneral] = createStore<GeneralStore>({
    plugin: undefined,
    root: props.root,
    container: props.container,
    isAnkiConnectAvailable: false,
    notesManifest: undefined,
    layoutRef: undefined,
    contentRef: undefined,
    toast: { success, error, message: undefined, type: "success" },
  });

  return (
    <GeneralContext.Provider
      value={{
        $general,
        $setGeneral,
        $startupTime: props.$startupTime,
        aborter: props.aborter,
        workerPath: props.workerPath,
        assetsPath: props.assetsPath,
        isAnkiWeb: props.isAnkiWeb,
        isAnkiDesktop: props.isAnkiDesktop,
        isAnkiDroid: props.isAnkiDroid,
        isAnkiDroidOldStudyScreen: props.isAnkiDroidOldStudyScreen,
        isAnkiDroidNewStudyScreen: props.isAnkiDroidNewStudyScreen,
        initialDarkMode: props.initialDarkMode,
        workerApi,
        styleTags: props.styleTags,
        ankiDroidAPI: props.ankiDroidAPI,
        logger: props.logger,
        templateDataset: props.templateDataset,
      }}
    >
      {props.children}
    </GeneralContext.Provider>
  );
}

export function useGeneralContext() {
  const generalContext = useContext(GeneralContext);
  if (!generalContext) throw new Error("Missing GeneralContext");
  return Object.assign(
    createCompatPair(
      "$general",
      "$setGeneral",
      generalContext.$general,
      generalContext.$setGeneral,
    ),
    { ...generalContext },
  );
}

export type UseGeneralContext = typeof useGeneralContext;
