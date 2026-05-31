import { createMemo, For, Match, onMount, Show, Switch } from "solid-js";
import { parseHtml } from "#/lib/dom";
import { extractKanji } from "#/lib/kana";
import { parseFurigana } from "#/lib/parse-furigana";
import { useAnkiFieldContext } from "../../contexts/AnkiFieldsContext";
import { useCardContext } from "../../contexts/CardContext";
import {
  KanjiTooltipContextProvider,
  useKanjiTooltipContext,
} from "../contexts/KanjiTooltipContext";

export default function Expression() {
  const { $setCard } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();

  onMount(() => {
    setTimeout(() => {
      $setCard("expressionReady", true);
    }, 100);
  });

  const $doc = createMemo(() => parseHtml($ankiFields.ExpressionFurigana));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() =>
    parseFurigana($isRuby() ? "" : $ankiFields.ExpressionFurigana),
  );

  function ExpressionRuby() {
    return (
      <For each={Array.from($doc().body.childNodes)}>{(node) => <RenderNode node={node} />}</For>
    );
  }

  function ExpressionNoFurigana() {
    return (
      <ruby>
        <For each={$ankiFields.Expression.split("")}>{(char) => <CharSpan char={char} />}</For>
        <Show
          when={$ankiFields.ExpressionReading && extractKanji($ankiFields.Expression).length > 0}
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
                    {(char) => <CharSpan char={char} />}
                  </For>
                  <Show when={rubyItem().reading.trim() !== "" || rubyItem().reading === " "}>
                    <rt>{rubyItem().reading}</rt>
                  </Show>
                </ruby>
              )}
            </Match>
            <Match when={item.type === "text" && item}>
              <span>
                <For each={item.text.trim().split("")}>{(char) => <CharSpan char={char} />}</For>
              </span>
            </Match>
          </Switch>
        )}
      </For>
    );
  }

  return (
    <KanjiTooltipContextProvider>
      <Switch>
        <Match when={$isRuby()}>
          <ExpressionRuby />
        </Match>
        <Match when={$furiganaData().length === 0 || !$ankiFields.ExpressionFurigana.includes("[")}>
          <ExpressionNoFurigana />
        </Match>
        <Match when={true}>
          <ExpressionFurigana />
        </Match>
      </Switch>
    </KanjiTooltipContextProvider>
  );
}

function RenderNode(props: { node: Node }) {
  const $el = createMemo(() => props.node as HTMLElement);
  const $tagName = createMemo(() => $el().tagName?.toLowerCase());

  return (
    <Switch>
      <Match when={$el().nodeType === Node.TEXT_NODE}>
        <For each={$el().textContent?.split("")}>{(char) => <CharSpan char={char} />}</For>
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
                {(child) => <RenderNode node={child} />}
              </For>
            </ruby>
          </Match>
          <Match when={$tagName() === "rb"}>
            <For each={Array.from($el().childNodes)}>{(child) => <RenderNode node={child} />}</For>
          </Match>
        </Switch>
      </Match>
    </Switch>
  );
}

function CharSpan(props: { char: string }) {
  const $kanji = createMemo(() => extractKanji(props.char)[0]);
  const { onInactive, onActive } = useKanjiTooltipContext();

  return (
    <span
      tabindex={0}
      class="tappable"
      on:mouseenter={(e) => onActive(e, $kanji())}
      on:mouseleave={onInactive}
      on:focus={(e) => onActive(e, $kanji())}
      on:blur={onInactive}
      on:touchstart={(e) => onActive(e, $kanji())}
      on:touchend={(e) => e.stopPropagation()}
    >
      {props.char}
    </span>
  );
}
