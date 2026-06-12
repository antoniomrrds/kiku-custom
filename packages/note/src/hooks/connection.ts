import { AnkiConnect } from "#/src/lib/anki-connect";
import { type Accessor, createResource } from "solid-js";
import type { Logger } from "#/src/lib/logger";

export function useAnkiConnectConnection({
  $enable,
  logger,
  onFail,
}: {
  $enable: Accessor<boolean>;
  logger: Logger;
  onFail?: Set<() => void>;
}) {
  const [$$ankiConnect, { refetch }] = createResource($enable, async () => {
    try {
      const version = await AnkiConnect.getVersion();
      if (version) logger.info("AnkiConnect version:", version);
      return true;
    } catch (e) {
      logger.warn("AnkiConnect is not available");
      onFail?.forEach((cb) => cb());
      onFail?.clear();
      throw e;
    }
  });

  return { $$ankiConnect, refetch };
}
