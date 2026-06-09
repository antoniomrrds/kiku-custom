import { AnkiConnect } from "#/src/lib/anki-connect";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

export function useCheckAnkiConnect() {
  const { $general, $setGeneral, logger } = useGeneralContext();

  async function $checkAnkiConnect(onFail?: () => void) {
    try {
      const version = await AnkiConnect.getVersion();
      if (version) {
        logger.info("AnkiConnect version:", version);
        $setGeneral("isAnkiConnectAvailable", true);
      }
    } catch {
      logger.warn("AnkiConnect is not available");
      $setGeneral("isAnkiConnectAvailable", false);
      onFail?.();
    }
  }

  return { $checkAnkiConnect };
}
