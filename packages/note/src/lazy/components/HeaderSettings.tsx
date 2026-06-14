import { useNavigationTransition } from "#/src/hooks/transition";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { HeaderLayout } from "./HeaderLayout";
import { ArrowLeftIcon, RefreshCwIcon } from "./Icons";
import { Match, Switch } from "solid-js";

export function HeaderSettings() {
  const { $general, $checkAnkiConnect, $$ankiConnect } = useGeneralContext();
  const { navigateBack } = useNavigationTransition();

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
        <Switch>
          <Match when={$$ankiConnect.loading}>
            <div class="text-sm text-base-content-calm">Checking AnkiConnect...</div>
          </Match>
          <Match when={$$ankiConnect.error}>
            <button
              on:click={async () => {
                await $checkAnkiConnect({
                  onFail: () => {
                    $general.toast.error("AnkiConnect is not available");
                  },
                });
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              <RefreshCwIcon class="size-4 cursor-pointer text-base-content-soft" />
            </button>
            <div class="text-sm text-base-content-calm">AnkiConnect is not available</div>
            <div class="status status-error animate-ping"></div>
          </Match>
          <Match when={$$ankiConnect.state === "ready"}>
            <div class="text-sm text-base-content-calm">AnkiConnect is available</div>
            <div class="status status-success"></div>
          </Match>
        </Switch>
      </div>
    </HeaderLayout>
  );
}
