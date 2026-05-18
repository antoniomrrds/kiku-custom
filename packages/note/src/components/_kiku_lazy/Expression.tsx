import { arrow, computePosition, flip, offset, shift } from "@floating-ui/dom";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { extractKanji, parseHtml } from "#/util/general";
import { parseFurigana } from "#/util/parse-furigana";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useBreakpointContext } from "../shared/BreakpointContext";
import { useCardContext } from "../shared/CardContext";
import { useGeneralContext } from "../shared/GeneralContext";
import { XIcon } from "./Icons";
import { KanjiContextProvider } from "./KanjiContext";
import { KanjiInfo, KanjiInfoExtra } from "./KanjiInfo";

export default function Expression() {
  const { $setCard } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
  const [$activeAnchor, $setActiveAnchor] = createSignal<HTMLElement | null>(
    null,
  );
  const [$activeKanji, $setActiveKanji] = createSignal<string | null>(null);
  let timeout: ReturnType<typeof setTimeout>;

  onMount(() => {
    setTimeout(() => {
      $setCard("expressionReady", true);
    }, 100);
  });

  const handleActive = (anchor: HTMLElement, kanji: string) => {
    clearTimeout(timeout);
    $setActiveAnchor(anchor);
    $setActiveKanji(kanji);
  };

  const handleTooltipActive = () => {
    clearTimeout(timeout);
  };

  const handleInactive = () => {
    timeout = setTimeout(() => {
      $setActiveAnchor(null);
      $setActiveKanji(null);
    }, 50);
  };

  const $doc = createMemo(() => parseHtml($ankiFields.ExpressionFurigana));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() =>
    parseFurigana($isRuby() ? "" : $ankiFields.ExpressionFurigana),
  );

  function ExpressionRuby() {
    return (
      <For each={Array.from($doc().body.childNodes)}>
        {(node) => (
          <RenderNode
            node={node}
            onActive={handleActive}
            onInactive={handleInactive}
          />
        )}
      </For>
    );
  }

  function ExpressionNoFurigana() {
    return (
      <ruby>
        <For each={$ankiFields.Expression.split("")}>
          {(char) => (
            <CharSpan
              char={char}
              onActive={handleActive}
              onInactive={handleInactive}
            />
          )}
        </For>
        <Show
          when={
            $ankiFields.ExpressionReading &&
            extractKanji($ankiFields.Expression).length > 0
          }
        >
          <rt>{$ankiFields.ExpressionReading}</rt>
        </Show>
      </ruby>
    );
  }

  function ExpressionFurigana() {
    return (
      <For each={$furiganaData()}>
        {(item) => (
          <Switch>
            <Match when={item.type === "ruby" && item}>
              {(rubyItem) => (
                <ruby>
                  <For each={rubyItem().text.trim().split("")}>
                    {(char) => (
                      <CharSpan
                        char={char}
                        onActive={handleActive}
                        onInactive={handleInactive}
                      />
                    )}
                  </For>
                  <Show
                    when={
                      rubyItem().reading.trim() !== "" ||
                      rubyItem().reading === " "
                    }
                  >
                    <rt>{rubyItem().reading}</rt>
                  </Show>
                </ruby>
              )}
            </Match>
            <Match when={item.type === "text" && item}>
              <span>
                <For each={item.text.trim().split("")}>
                  {(char) => (
                    <CharSpan
                      char={char}
                      onActive={handleActive}
                      onInactive={handleInactive}
                    />
                  )}
                </For>
              </span>
            </Match>
          </Switch>
        )}
      </For>
    );
  }

  return (
    <>
      <Switch>
        <Match when={$isRuby()}>
          <ExpressionRuby />
        </Match>
        <Match
          when={
            $furiganaData().length === 0 ||
            !$ankiFields.ExpressionFurigana.includes("[")
          }
        >
          <ExpressionNoFurigana />
        </Match>
        <Match when={true}>
          <ExpressionFurigana />
        </Match>
      </Switch>
      <KanjiTooltip
        kanji={$activeKanji() ?? ""}
        show={!!$activeAnchor()}
        anchor={$activeAnchor() ?? undefined}
        onActive={handleTooltipActive}
        onInactive={handleInactive}
      />
    </>
  );
}

function RenderNode(props: {
  node: Node;
  onActive: (anchor: HTMLElement, kanji: string) => void;
  onInactive: () => void;
}) {
  const $el = createMemo(() => props.node as HTMLElement);
  const $tagName = createMemo(() => $el().tagName?.toLowerCase());

  return (
    <Switch>
      <Match when={$el().nodeType === Node.TEXT_NODE}>
        <For each={$el().textContent?.split("")}>
          {(char) => (
            <CharSpan
              char={char}
              onActive={props.onActive}
              onInactive={props.onInactive}
            />
          )}
        </For>
      </Match>
      <Match when={$el().nodeType === Node.ELEMENT_NODE}>
        <Switch fallback={<span innerHTML={$el().outerHTML} />}>
          <Match when={$tagName() === "rt"}>
            <rt innerHTML={$el().innerHTML} />
          </Match>
          <Match when={$tagName() === "rp"}>
            <rp innerHTML={$el().innerHTML} />
          </Match>
          <Match when={$tagName() === "ruby"}>
            <ruby>
              <For each={Array.from($el().childNodes)}>
                {(child) => (
                  <RenderNode
                    node={child}
                    onActive={props.onActive}
                    onInactive={props.onInactive}
                  />
                )}
              </For>
            </ruby>
          </Match>
          <Match when={$tagName() === "rb"}>
            <For each={Array.from($el().childNodes)}>
              {(child) => (
                <RenderNode
                  node={child}
                  onActive={props.onActive}
                  onInactive={props.onInactive}
                />
              )}
            </For>
          </Match>
        </Switch>
      </Match>
    </Switch>
  );
}

function CharSpan(props: {
  char: string;
  onActive: (anchor: HTMLElement, kanji: string) => void;
  onInactive: () => void;
}) {
  const [$anchorRef, $setAnchorRef] = createSignal<HTMLSpanElement>();
  const $kanji = createMemo(() => extractKanji(props.char)[0]);

  const handleActive = () => {
    const kanji = $kanji();
    const anchorRef = $anchorRef();
    if (anchorRef && kanji) {
      props.onActive(anchorRef, kanji);
    }
  };

  return (
    <span
      ref={$setAnchorRef}
      tabindex={0}
      class="tappable"
      on:mouseenter={handleActive}
      on:mouseleave={props.onInactive}
      on:focus={handleActive}
      on:blur={props.onInactive}
      on:touchstart={handleActive}
      on:touchend={(e) => e.stopPropagation()}
    >
      {props.char}
    </span>
  );
}

function KanjiTooltip(props: {
  kanji: string;
  show: boolean;
  anchor: HTMLElement | undefined;
  onActive: () => void;
  onInactive: () => void;
}) {
  const { $general } = useGeneralContext();
  const [$tooltipRef, $setTooltipRef] = createSignal<HTMLDivElement>();
  const [$arrowRef, $setArrowRef] = createSignal<HTMLDivElement>();

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
    if (props.show && props.anchor && tooltip && arrowEl) {
      computePosition(props.anchor, tooltip, {
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
        data-kanji-tooltip
        on:mouseenter={props.onActive}
        on:mouseleave={props.onInactive}
        on:focus={props.onActive}
        on:blur={props.onInactive}
        on:touchstart={props.onActive}
        on:touchend={(e) => e.stopPropagation()}
        style={{
          display: props.show ? "block" : "none",
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
          on:click={props.onInactive}
          on:touchend={(e) => e.stopPropagation()}
        >
          <XIcon class="size-5 cursor-pointer text-base-content-soft" />
        </button>
        <div
          class="relative text-base bg-base-200/97 z-10 p-2 sm:p-4 border border-base-300 rounded-lg font-primary w-xs sm:w-md lg:w-lg shadow-lg max-h-[75vh] overflow-auto"
          style={{ color: "initial" }}
        >
          <KanjiContextProvider kanji={props.kanji}>
            <KanjiInfo />
            <div class="text-sm mt-2 sm:mt-4 flex flex-col gap-1 sm:gap-2">
              <KanjiInfoExtra />
            </div>
          </KanjiContextProvider>
        </div>
      </div>
    </Portal>
  );
}
