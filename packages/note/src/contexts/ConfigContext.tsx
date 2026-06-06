import { createContext, createEffect, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { type SetStoreFunction, type Store, unwrap } from "solid-js/store";
import { AnkiConnect } from "#/src/lib/anki-connect";
import { getRootDatasetConfig, type KikuConfig, updateConfigState } from "#/src/lib/config";
import { constants } from "#/src/lib/contants";
import { createCompatPair } from "#/src/lib/context-compat";
import { useGeneralContext } from "./GeneralContext";

type ConfigContextValue = {
  $config: Store<KikuConfig>;
  $setConfig: SetStoreFunction<KikuConfig>;
};

const ConfigContext = createContext<ConfigContextValue>();

export function ConfigContextProvider(props: { children: JSX.Element; value: ConfigContextValue }) {
  const { $config } = props.value;
  const { $general, $setGeneral } = useGeneralContext();

  createEffect(() => {
    const config = unwrap({ ...$config });
    $general.logger.debug("Updating config:", config);
    if (!$general.root) throw new Error("Missing root");
    if (!$general.host) throw new Error("Missing host");
    updateConfigState({
      host: $general.host,
      root: $general.root,
      config,
      updateDocument: !$general.isAnkiWeb,
    });
    AnkiConnect.changeAddress(config.ankiConnectAddress);
    $general.workerApi.promise.then((workerApi) => {
      workerApi.init({
        constants,
        config,
        assetsPath: import.meta.env.DEV ? "" : $general.assetsPath,
        preferAnkiConnect: config.preferAnkiConnect && $general.isAnkiDesktop,
      });
    });

    sessionStorage.setItem(constants.key["kiku-config"], JSON.stringify(config));
    const rootDataset = getRootDatasetConfig(config);
    const isConfigOutOfSync = Object.entries(rootDataset).some(([key, value]) => {
      return $general.templateDataset[key as keyof typeof rootDataset] !== value;
    });
    $setGeneral("isConfigOutOfSync", isConfigOutOfSync);
  });

  return <ConfigContext.Provider value={props.value}>{props.children}</ConfigContext.Provider>;
}

export function useConfigContext() {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("Missing ConfigContext");
  return createCompatPair("$config", "$setConfig", config.$config, config.$setConfig);
}

export type UseConfigContext = typeof useConfigContext;
