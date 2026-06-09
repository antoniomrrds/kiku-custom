import { AnkiConnect } from "#/src/lib/anki-connect";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

export function useCheckAnkiConnect() {
  const { $general, $setGeneral } = useGeneralContext();

  async function $checkAnkiConnect(onFail?: () => void) {
    try {
      const version = await AnkiConnect.getVersion();
      if (version) {
        $general.logger.info("AnkiConnect version:", version);
        $setGeneral("isAnkiConnectAvailable", true);
      }
    } catch {
      $general.logger.warn("AnkiConnect is not available");
      $setGeneral("isAnkiConnectAvailable", false);
      onFail?.();
    }
  }

  return { $checkAnkiConnect };
}
