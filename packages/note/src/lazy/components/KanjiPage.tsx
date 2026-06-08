import { createMemo, createSignal, For, type JSX, Match, onMount, Show, Switch } from "solid-js";
import { useCardContext } from "#/src/contexts/CardContext";
import { parseHtml } from "#/src/lib/dom";
import { useNavigationTransition } from "#/src/hooks/transition";
import { useRelatedItems } from "#/src/hooks/kanji";
import { extractKanji } from "#/src/lib/kana";
import { parseFurigana } from "#/src/lib/parse-furigana";
import { type AnkiFields, type AnkiNote, type Source, ankiFieldsSkeleton } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import HeaderKanjiPage from "./HeaderKanjiPage";
import { ArrowLeftIcon } from "./Icons";
import { KanjiContextProvider, useKanjiContext } from "#/src/lazy/contexts/KanjiContext";
import { KanjiInfo, KanjiInfoExtra } from "./KanjiInfo";
import {
  KanjiPageContextProvider,
  useKanjiPageContext,
} from "#/src/lazy/contexts/KanjiPageContext";
import { capitalize } from "#/src/lib/text";

export default function KanjiPage() {
  const { $card } = useCardContext();
  return (
    <KanjiPageContextProvider
      noteList={$card.query.noteList}
      sameReading={$card.query.sameReading}
      sameExpression={$card.query.sameExpression}
      relatedExpression={$card.query.relatedExpression}
      initialFocus={{
        kanji: $card.initialFocus.kanji,
        noteId: $card.initialFocus.noteId,
      }}
      initialTab={$card.initialTab}
      id={$card.uniqueId}
    >
      <Page />
    </KanjiPageContextProvider>
  );
}

function Page() {
  const { onKanjiPageMount } = useCardContext();
  const { $general } = useGeneralContext();
  const { initialAnkiFields } = useAnkiFieldContext();
  const { $kanjiPage, $setKanjiPage } = useKanjiPageContext();
  const $hasSameKanji = createMemo(() => $kanjiPage.noteList.length > 0);
  const $hasSameReading = createMemo(
    () => $kanjiPage.sameReading && $kanjiPage.sameReading.length > 0,
  );
  const $hasSameExpression = createMemo(
    () => $kanjiPage.sameExpression && $kanjiPage.sameExpression.length > 0,
  );
  const $relatedItems = useRelatedItems();

  const $hasRelatedExpression = createMemo(() => $relatedItems().length > 0);
  const $title = createMemo(() => {
    if ($kanjiPage.tab === "kanji") {
      if ($kanjiPage.contextLabel?.type === "similar") return "Similar";
      if ($kanjiPage.contextLabel?.type === "composedOf") return "Composed of";
      if ($kanjiPage.contextLabel?.type === "usedIn") return "Used in";
      if ($kanjiPage.contextLabel?.type === "related") return "Related";
      return "Same Kanji";
    }
    if ($kanjiPage.tab === "reading") return "Same Reading";
    if ($kanjiPage.tab === "same") return "Same Expression";
    if ($kanjiPage.tab === "related") return "Related";
  });

  const $doc = createMemo(() => parseHtml(initialAnkiFields.ExpressionFurigana));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() =>
    parseFurigana($isRuby() ? "" : initialAnkiFields.ExpressionFurigana),
  );

  onMount(() => {
    onKanjiPageMount.forEach((callback) => {
      callback({ $setKanjiPage });
    });
    onKanjiPageMount.clear();
  });

  return (
    <Switch>
      <Match when={$kanjiPage.nested}>
        <KanjiPageContextProvider
          noteList={$kanjiPage.nestedNoteList}
          sameReading={[]}
          sameExpression={[]}
          relatedExpression={[]}
          initialFocus={{
            kanji: $kanjiPage.nestedFocus.kanji,
            noteId: $kanjiPage.nestedFocus.noteId,
          }}
          initialTab="kanji"
          id={$kanjiPage.nestedId}
          contextLabel={$kanjiPage.nestedContextLabel}
        >
          <Page />
        </KanjiPageContextProvider>
      </Match>
      <Match when={!$kanjiPage.nested}>
        <HeaderKanjiPage />
        <div class="flex flex-col gap-2 sm:gap-4">
          <div role="tablist" class="tabs tabs-box">
            <TabItem
              active={$kanjiPage.tab === "kanji"}
              disabled={!$hasSameKanji()}
              onClick={() => {
                if ($hasSameKanji()) $setKanjiPage("tab", "kanji");
              }}
            >
              漢字
            </TabItem>
            <TabItem
              active={$kanjiPage.tab === "reading"}
              disabled={!$hasSameReading()}
              count={$kanjiPage.sameReading?.length ?? 0}
              onClick={() => {
                if ($hasSameReading()) $setKanjiPage("tab", "reading");
              }}
            >
              読
            </TabItem>
            <TabItem
              active={$kanjiPage.tab === "same"}
              disabled={!$hasSameExpression()}
              count={$kanjiPage.sameExpression?.length ?? 0}
              onClick={() => {
                if ($hasSameExpression()) $setKanjiPage("tab", "same");
              }}
            >
              同
            </TabItem>
            <TabItem
              active={$kanjiPage.tab === "related"}
              disabled={!$hasRelatedExpression()}
              count={$relatedItems().length}
              onClick={() => {
                if ($hasRelatedExpression()) $setKanjiPage("tab", "related");
              }}
            >
              関
            </TabItem>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="font-secondary text-5xl sm:text-6xl">
              <Switch>
                <Match when={$kanjiPage.contextLabel}>{$kanjiPage.contextLabel?.text}</Match>
                <Match when={$isRuby()}>
                  <div innerHTML={initialAnkiFields.ExpressionFurigana}></div>
                </Match>
                <Match
                  when={
                    $furiganaData().length === 0 ||
                    !initialAnkiFields.ExpressionFurigana.includes("[")
                  }
                >
                  <ruby>
                    {initialAnkiFields.Expression}
                    <Show
                      when={
                        initialAnkiFields.ExpressionFurigana &&
                        extractKanji(initialAnkiFields.Expression).length > 0
                      }
                    >
                      <rt>{initialAnkiFields.ExpressionReading}</rt>
                    </Show>
                  </ruby>
                </Match>
                <Match when={true}>
                  <For each={$furiganaData()}>
                    {(item) => (
                      <Switch fallback={<span>{item.text}</span>}>
                        <Match when={item.type === "ruby" && item}>
                          {(rubyItem) => (
                            <ruby>
                              {rubyItem().text}
                              <Show
                                when={
                                  rubyItem().reading.trim() !== "" || rubyItem().reading === " "
                                }
                              >
                                <rt>{rubyItem().reading}</rt>
                              </Show>
                            </ruby>
                          )}
                        </Match>
                      </Switch>
                    )}
                  </For>
                </Match>
              </Switch>
            </div>
            <Show when={$title()}>
              <div class="text-base-content-calm text-base sm:text-lg">{$title()}</div>
            </Show>
          </div>

          <div class="flex flex-col gap-2 sm:gap-4 ">
            <Switch>
              <Match when={$kanjiPage.tab === "kanji"}>
                <For each={$kanjiPage.noteList}>
                  {([kanji, data]) => {
                    return (
                      <KanjiContextProvider kanji={kanji}>
                        <KanjiCollapsible data={data} />
                      </KanjiContextProvider>
                    );
                  }}
                </For>
              </Match>
              <Match when={$kanjiPage.tab === "reading"}>
                <NoteList list={$kanjiPage.sameReading ?? []} />
              </Match>
              <Match when={$kanjiPage.tab === "same"}>
                <NoteList list={$kanjiPage.sameExpression ?? []} />
              </Match>
              <Match when={$kanjiPage.tab === "related"}>
                <NoteList items={$relatedItems()} />
              </Match>
            </Switch>
          </div>
        </div>
        <div class="flex justify-center items-center">
          <Show when={$general.notesManifest}>
            <div class="text-base-content-faint text-sm">
              Updated at {new Date($general.notesManifest?.generatedAt ?? 0).toLocaleString()}
            </div>
          </Show>
        </div>
      </Match>
    </Switch>
  );
}

function TabItem(props: {
  active: boolean;
  children: JSX.Element;
  count?: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      class="tab gap-1"
      classList={{
        "tab-active": props.active,
        "cursor-not-allowed": props.disabled,
      }}
      on:click={props.onClick}
      on:touchend={(e) => e.stopPropagation()}
    >
      {props.children}
      <Show when={props.count !== undefined}>
        <span class="text-base-content-soft bg-base-300 px-0.5 rounded-xs text-xs sm:text-sm">
          {props.count}
        </span>
      </Show>
    </button>
  );
}

function KanjiCollapsible(props: { data: AnkiNote[] }) {
  const { $kanjiPage } = useKanjiPageContext();
  const { $kanji } = useKanjiContext();
  const data = () => props.data;
  const [$checked, $setChecked] = createSignal($kanjiPage.focus.kanji === $kanji.kanji);

  const loading = () => {
    return Object.values($kanji.loading).some((v) => v);
  };

  return (
    <div class="collapse bg-base-200 border border-base-300 animate-fade-in">
      <input
        type="checkbox"
        checked={$checked()}
        on:change={(e) => {
          $setChecked(e.currentTarget.checked);
        }}
      />
      <div
        class="collapse-title justify-between flex items-center ps-2 sm:ps-4 pe-2 sm:pe-4 py-2 sm:py-4 tappable"
        on:click={() => {
          $setChecked(!$checked());
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <KanjiText />
        <div class="flex gap-1 sm:gap-2 absolute top-2 right-2 sm:top-4 sm:right-4">
          <Show when={loading()}>
            <div class="loading loading-sm text-base-content-soft animate-fade-in-sm"></div>
          </Show>
          <div class="text-base-content-soft bg-base-300 px-1 rounded-xs animate-fade-in-sm text-sm sm:text-base">
            {data().length}
          </div>
        </div>
      </div>

      <div class="collapse-content text-sm px-2 sm:px-4 pb-2 sm:pb-4 flex flex-col gap-1 sm:gap-2">
        <KanjiInfoExtra inKanjiPage />
        <ul class="list bg-base-100 rounded-box shadow-md">
          <For each={data()}>
            {(data) => {
              return <AnkiNoteItem data={data} highlightedKanji={$kanji.kanji} />;
            }}
          </For>
        </ul>
      </div>
    </div>
  );
}

function NoteList(props: { list?: AnkiNote[]; items?: { note: AnkiNote; sources: Source[] }[] }) {
  return (
    <ul class="list bg-base-100 rounded-box shadow-md animate-fade-in">
      <For each={props.items ?? props.list ?? []}>
        {(item) => {
          if ("note" in item) {
            return <AnkiNoteItem data={item.note} sources={item.sources} />;
          }
          return <AnkiNoteItem data={item} />;
        }}
      </For>
    </ul>
  );
}

function AnkiNoteItem(props: { data: AnkiNote; highlightedKanji?: string; sources?: Source[] }) {
  const { navigate } = useNavigationTransition();
  const { $card, $setCard } = useCardContext();
  const { $setKanjiPage } = useKanjiPageContext();
  const $data = createMemo(() => props.data);
  const $expression = createMemo(() => $data().fields.Expression.value);
  const $expressionFurigana = createMemo(() => $data().fields.ExpressionFurigana.value);
  const $expressionReading = createMemo(() => $data().fields.ExpressionReading.value);
  const $leech = createMemo(() => $data().tags.includes("leech"));
  const $isNew = createMemo(() => $card.query.newNotes.includes($data().noteId));
  const $doc = createMemo(() => parseHtml($expressionFurigana()));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() => parseFurigana($isRuby() ? "" : $expressionFurigana()));

  function ExpressionNoFurigana() {
    return (
      <ruby>
        <For each={Array.from($expression())}>
          {(char) => (
            <span
              classList={{
                "text-base-content-primary": char === props.highlightedKanji,
              }}
            >
              {char}
            </span>
          )}
        </For>
        <Show when={$expressionReading() && extractKanji($expression()).length > 0}>
          <rt>{$expressionReading()}</rt>
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
                  <For each={Array.from(rubyItem().text.trim())}>
                    {(char) => (
                      <span
                        classList={{
                          "text-base-content-primary": char === props.highlightedKanji,
                        }}
                      >
                        {char}
                      </span>
                    )}
                  </For>
                  <Show when={rubyItem().reading.trim() !== "" || rubyItem().reading === " "}>
                    <rt>{rubyItem().reading}</rt>
                  </Show>
                </ruby>
              )}
            </Match>
            <Match when={item.type === "text" && item}>
              <span>{item.text}</span>
            </Match>
          </Switch>
        )}
      </For>
    );
  }

  const $sentenceInnerHtmlColorized = createMemo(() => {
    if (!props.highlightedKanji) return $data().fields.Sentence.value;
    return $data().fields.Sentence.value.replaceAll(
      props.highlightedKanji,
      `<span class="text-base-content-primary">${props.highlightedKanji}</span>`,
    );
  });

  const onNextClick = () => {
    const ankiFields: AnkiFields = {
      ...ankiFieldsSkeleton,
      ...Object.fromEntries(
        Object.entries($data().fields).map(([key, value]) => {
          return [key, value.value];
        }),
      ),
      // TODO: I'm not sure how to handle if the note has multiple cards
      CardID: $data().cards[0]?.toString() ?? "",
      Tags: $data().tags.join(" "),
    };

    $setKanjiPage("focus", {
      kanji: props.highlightedKanji,
      noteId: $data().noteId,
    });

    $setCard({ nestedAnkiFields: ankiFields });
    $setCard("nestedNoteId", $data().noteId);
    navigate("nested", "forward", () => navigate("kanji", "back"));
  };

  return (
    <>
      <li class="p-4 pb-0 tracking-wide flex gap-2 items-start justify-between">
        <div class="flex gap-2 items-end">
          <div class="font-secondary text-2xl sm:text-4xl">
            <Switch>
              <Match when={$isRuby()}>
                <ExpressionNoFurigana />
              </Match>
              <Match when={true}>
                <ExpressionFurigana />
              </Match>
            </Switch>
          </div>
          <div class="text-base-content-calm text-xs sm:text-sm">
            {new Date($data().noteId).toLocaleDateString()}
          </div>
          <Show when={props.sources && props.sources.length > 0}>
            <div class="flex gap-1 flex-wrap">
              <For each={props.sources}>
                {(s) => (
                  <span
                    class="badge badge-sm"
                    classList={{
                      "badge-primary": s === "related",
                      "badge-success": s === "forms",
                      "badge-error": s === "antonym",
                      "badge-warning": s === "referenced",
                    }}
                  >
                    {capitalize(s)}
                  </span>
                )}
              </For>
            </div>
          </Show>
        </div>
        <Show when={$isNew() || $leech()}>
          <div class="flex items-center gap-1">
            {$leech() && <div class="status status-warning"></div>}
            {$isNew() && <div class="status status-info"></div>}
          </div>
        </Show>
      </li>

      <li class="list-row">
        <div></div>
        <div
          class="text-base sm:text-xl text-base-content-calm font-secondary"
          innerHTML={$sentenceInnerHtmlColorized()}
        ></div>
        <div class="flex justify-center items-center">
          <button
            on:click={() => {
              onNextClick();
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            <ArrowLeftIcon class="size-5 sm:size-8 text-base-content-soft rotate-180 cursor-pointer"></ArrowLeftIcon>
          </button>
        </div>
      </li>
    </>
  );
}

function KanjiText() {
  const { $kanji } = useKanjiContext();
  const { $kanjiPage } = useKanjiPageContext();
  const [$ref, $setRef] = createSignal<HTMLDivElement>();

  onMount(() => {
    const ref = $ref();
    if (ref && $kanjiPage.focus.kanji === $kanji.kanji && !$kanjiPage.focus.noteId) {
      ref.scrollIntoView({ block: "center" });
    }
  });

  return (
    <div class="flex gap-2 sm:gap-4 me-2">
      <div class="font-secondary text-5xl sm:text-6xl" ref={$setRef}>
        {$kanji.kanji}
      </div>
      <KanjiInfo />
    </div>
  );
}
