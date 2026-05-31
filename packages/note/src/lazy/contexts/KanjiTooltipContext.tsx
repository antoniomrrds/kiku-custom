import { createContext, onCleanup, Show, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { computePosition, offset, flip, shift, arrow } from "@floating-ui/dom";
import { createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { extractKanji } from "#/src/lib/kana";
import { useBreakpointContext } from "#/src/contexts/BreakpointContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { XIcon } from "#/src/lazy/components/Icons";
import { KanjiContextProvider } from "./KanjiContext";
import { KanjiInfo, KanjiInfoExtra } from "#/src/lazy/components/KanjiInfo";

type KanjiTooltipStore = {
  kanji: string;
  show: boolean;
  anchor: HTMLElement | null;
};

type KanjiTooltipContextValue = {
  $kanjiTooltip: Store<KanjiTooltipStore>;
  $setKanjiTooltip: SetStoreFunction<KanjiTooltipStore>;
  onActive: (event: MouseEvent | TouchEvent | FocusEvent, kanji?: string) => void;
  onInactive: (event: MouseEvent | TouchEvent | FocusEvent) => void;
  onActiveTooltip: (event: MouseEvent | TouchEvent | FocusEvent) => void;
  onInactiveTooltip: (event: MouseEvent | TouchEvent | FocusEvent) => void;
};

const KanjiTooltipContext = createContext<KanjiTooltipContextValue>();

export function KanjiTooltipContextProvider(props: { children: JSX.Element }) {
  const [$kanjiTooltip, $setKanjiTooltip] = createStore<KanjiTooltipStore>({
    kanji: "",
    show: false,
    anchor: null,
  });

  let timeout: ReturnType<typeof setTimeout> | undefined;

  function clearHideTimeout() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  }

  function scheduleHide() {
    clearHideTimeout();
    timeout = setTimeout(() => {
      $setKanjiTooltip("show", false);
      $setKanjiTooltip("kanji", "");
      $setKanjiTooltip("anchor", null);
    }, 100);
  }

  function onActive(event: MouseEvent | TouchEvent | FocusEvent, kanji: string = "") {
    if (!kanji) return;
    if (!extractKanji(kanji).length) return;
    if (!(event.currentTarget instanceof Element)) return;
    clearHideTimeout();
    $setKanjiTooltip("show", true);
    $setKanjiTooltip("kanji", kanji);
    $setKanjiTooltip("anchor", event.currentTarget as HTMLElement);
  }

  function onInactive(event: MouseEvent | TouchEvent | FocusEvent) {
    if (!(event.currentTarget instanceof Element)) return;
    scheduleHide();
  }

  function onActiveTooltip() {
    clearHideTimeout();
  }

  function onInactiveTooltip() {
    scheduleHide();
  }

  onCleanup(() => {
    clearHideTimeout();
  });

  return (
    <KanjiTooltipContext.Provider
      value={{
        $kanjiTooltip,
        $setKanjiTooltip,
        onActive,
        onInactive,
        onActiveTooltip,
        onInactiveTooltip,
      }}
    >
      {props.children}
      <KanjiTooltip />
    </KanjiTooltipContext.Provider>
  );
}

export function useKanjiTooltipContext() {
  const context = useContext(KanjiTooltipContext);
  if (!context) throw new Error("Missing KanjiTooltipContext");
  return context;
}

export type UseKanjiTooltipContext = typeof useKanjiTooltipContext;

function KanjiTooltip() {
  const { $general } = useGeneralContext();
  const [$tooltipRef, $setTooltipRef] = createSignal<HTMLDivElement>();
  const [$arrowRef, $setArrowRef] = createSignal<HTMLDivElement>();
  const { $kanjiTooltip, onActiveTooltip, onInactiveTooltip } = useKanjiTooltipContext();

  const [$position, $setPosition] = createStore({
    x: 0,
    y: 0,
    arrowX: 0,
    arrowY: 0,
    staticSide: "",
  });

  const bp = useBreakpointContext();

  createEffect(() => {
    const tooltip = $tooltipRef();
    const arrowEl = $arrowRef();
    if ($kanjiTooltip.show && $kanjiTooltip.anchor && tooltip && arrowEl) {
      computePosition($kanjiTooltip.anchor, tooltip, {
        placement: bp.isAtLeast("sm") ? "bottom-start" : "bottom",
        middleware: [
          offset({ mainAxis: -5, crossAxis: 0 }),
          flip(),
          shift({ padding: 5 }),
          arrow({
            element: arrowEl,
          }),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {};
        const staticSide =
          {
            top: "bottom",
            right: "left",
            bottom: "top",
            left: "right",
          }[placement.split("-")[0]] ?? "";

        $setPosition({
          x,
          y,
          arrowX: arrowX ?? 0,
          arrowY: arrowY ?? 0,
          staticSide,
        });
      });
    }
  });

  return (
    <Portal mount={$general.layoutRef}>
      <div
        ref={$setTooltipRef}
        class="absolute z-10 overflow-hidden rounded-lg horizontal-tb text-start tooltip tappable shadow-lg"
        tabindex={0}
        on:mouseenter={onActiveTooltip}
        on:mouseleave={onInactiveTooltip}
        on:focus={onActiveTooltip}
        on:blur={onInactiveTooltip}
        on:touchstart={onActiveTooltip}
        style={{
          display: $kanjiTooltip.show ? "block" : "none",
          left: `${$position.x}px`,
          top: `${$position.y}px`,
        }}
      >
        <div
          ref={$setArrowRef}
          class="absolute bg-base-content-faint size-8 rotate-45 z-20 -translate-y-6"
          style={{
            left: `${$position.arrowX}px`,
            top: `${$position.arrowY}px`,
            right: "",
            bottom: "",
            ...($position.staticSide ? { [$position.staticSide]: "-4px" } : {}),
          }}
        ></div>

        <button
          data-anki-mobile-only="block"
          class="absolute z-20 top-2 right-2"
          on:click={onActiveTooltip}
          on:touchend={(e) => e.stopPropagation()}
        >
          <XIcon class="size-5 cursor-pointer text-base-content-soft" />
        </button>
        <div
          class="relative text-base bg-base-200/97 z-10 p-2 sm:p-4 border border-base-300 rounded-lg font-primary w-xs sm:w-md lg:w-lg shadow-lg max-h-[75vh] overflow-auto"
          style={{ color: "initial" }}
        >
          <Show when={$kanjiTooltip.kanji}>
            <KanjiContextProvider kanji={$kanjiTooltip.kanji}>
              <KanjiInfo />
              <div class="text-sm mt-2 sm:mt-4 flex flex-col gap-1 sm:gap-2">
                <KanjiInfoExtra />
              </div>
            </KanjiContextProvider>
          </Show>
        </div>
      </div>
    </Portal>
  );
}
