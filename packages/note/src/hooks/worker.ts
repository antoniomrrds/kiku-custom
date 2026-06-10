import { unwrap } from "solid-js/store";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { createWorkerApi } from "#/src/worker/client";
import { constants } from "#/src/lib/contants";

export function useWorker() {
  const { $config } = useConfigContext();
  const {
    logger,
    assetsPath,
    isAnkiDesktop,
    workerPath,
    workerApi: workerApiContainer,
  } = useGeneralContext();
  const cacheStore = useCacheContext();

  let resolved = false;
  async function getWorker() {
    const opts = {
      constants,
      config: unwrap($config),
      assetsPath: import.meta.env.DEV ? "" : assetsPath,
      preferAnkiConnect: $config.preferAnkiConnect && isAnkiDesktop,
      workerPath,
    };
    const workerApi = await createWorkerApi(opts, logger, cacheStore?.workerApi);
    if (!resolved) {
      workerApiContainer.resolve(workerApi);
      resolved = true;
    }
    if (cacheStore && !cacheStore.workerApi) {
      cacheStore.workerApi = workerApi;
    }
    return workerApi;
  }

  return { getWorker };
}
