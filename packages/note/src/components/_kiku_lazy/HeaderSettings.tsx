import { useNavigationTransition } from "#/util/hooks";
import { useGeneralContext } from "../shared/GeneralContext";
import HeaderLayout from "./HeaderLayout";
import { ArrowLeftIcon, RefreshCwIcon } from "./Icons";

export default function HeaderSettings() {
  const [$general, $setGeneral] = useGeneralContext();
  const { navigateBack } = useNavigationTransition();

  $general.useCheckAnkiConnect();

  return (
    <HeaderLayout>
      <button
        on:click={() => {
          navigateBack();
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <ArrowLeftIcon class="size-5 cursor-pointer text-base-content-soft" />
      </button>
      <div class="flex flex-row gap-2 items-center">
        {$general.isAnkiConnectAvailable && (
          <>
            <div class="text-sm text-base-content-calm">
              AnkiConnect is available
            </div>
            <div class="status status-success"></div>
          </>
        )}
        {!$general.isAnkiConnectAvailable && (
          <>
            <button
              on:click={async () => {
                try {
                  await $general.checkAnkiConnect();
                } catch {
                  $general.toast.error("AnkiConnect is not available");
                }
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              <RefreshCwIcon class="size-4 cursor-pointer text-base-content-soft" />
            </button>
            <div class="text-sm text-base-content-calm">
              AnkiConnect is not available
            </div>
            <div class="status status-error animate-ping"></div>
          </>
        )}
      </div>
    </HeaderLayout>
  );
}
