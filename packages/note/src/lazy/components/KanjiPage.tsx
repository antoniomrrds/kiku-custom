import {
  createMemo,
  createSignal,
  ErrorBoundary,
  For,
  type JSX,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { useCardContext } from "#/src/contexts/CardContext";
import { parseHtml } from "#/src/lib/dom";
import { useNavigationTransition } from "#/src/hooks/transition";
import { useRelatedNotes } from "#/src/hooks/notes";
import { extractKanji } from "#/src/lib/kana";
import { parseFurigana } from "#/src/lib/parse-furigana";
import { type AnkiFields, type AnkiNote, type Source, ankiFieldsSkeleton } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { HeaderKanjiPage } from "./HeaderKanjiPage";
import { ArrowLeftIcon } from "./Icons";
import { KanjiContextProvider, useKanjiContext } from "#/src/lazy/contexts/KanjiContext";
import { $KanjiInfo, $KanjiInfoExtra } from "./KanjiInfo";
import {
  KanjiPageContextProvider,
  useKanjiPageContext,
} from "#/src/lazy/contexts/KanjiPageContext";
import { capitalize } from "#/src/lib/text";

export function KanjiPage() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <$KanjiPage />
      </Suspense>
    </ErrorBoundary>
  );
}
function $KanjiPage() {
  const { $card, $$card } = useCardContext();
  return (
    <KanjiPageContextProvider
      noteList={$$card()?.noteList ?? []}
      sameReading={$$card()?.sameReading}
      sameExpression={$$card()?.sameExpression}
      relatedExpression={$$card()?.relatedExpression}
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
  const { initialAnkiFields } = useAnkiFieldContext();
  const { $kanjiPage, $setKanjiPage, noteList, contextLabel, sameReading, sameExpression } =
    useKanjiPageContext();
  const { $$relatedNotes } = useRelatedNotes();

  const $title = createMemo(() => {
    if ($kanjiPage.tab === "kanji") {
      if (contextLabel?.type === "similar") return "Similar";
      if (contextLabel?.type === "composedOf") return "Composed of";
      if (contextLabel?.type === "usedIn") return "Used in";
      if (contextLabel?.type === "related") return "Related";
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
          <Show when={!contextLabel}>
            <div role="tablist" class="tabs tabs-box animate-fade-in">
              <TabItem
                active={$kanjiPage.tab === "kanji"}
                neverDisabled={true}
                onClick={() => {
                  $setKanjiPage("tab", "kanji");
                }}
              >
                漢字
              </TabItem>
              <TabItem
                active={$kanjiPage.tab === "reading"}
                count={sameReading?.length ?? 0}
                onClick={() => {
                  $setKanjiPage("tab", "reading");
                }}
              >
                読
              </TabItem>
              <TabItem
                active={$kanjiPage.tab === "same"}
                count={sameExpression?.length ?? 0}
                onClick={() => {
                  $setKanjiPage("tab", "same");
                }}
              >
                同
              </TabItem>
              <TabItem
                active={$kanjiPage.tab === "related"}
                count={$$relatedNotes().length}
                onClick={() => {
                  $setKanjiPage("tab", "related");
                }}
              >
                関
              </TabItem>
            </div>
          </Show>
          <div class="flex flex-col items-center gap-2 animate-fade-in">
            <div class="font-secondary text-5xl sm:text-6xl">
              <Switch>
                <Match when={contextLabel}>{contextLabel?.text}</Match>
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
                <For each={noteList}>
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
                <NoteList list={sameReading ?? []} />
              </Match>
              <Match when={$kanjiPage.tab === "same"}>
                <NoteList list={sameExpression ?? []} />
              </Match>
              <Match when={$kanjiPage.tab === "related"}>
                <NoteList items={$$relatedNotes()} />
              </Match>
            </Switch>
          </div>
        </div>
        <QueryInfo />
      </Match>
    </Switch>
  );
}

function QueryInfo() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <$QueryInfo />
      </Suspense>
    </ErrorBoundary>
  );
}

function $QueryInfo() {
  const { $$notesManifest } = useGeneralContext();
  const { $$card } = useCardContext();

  return (
    <div class="flex justify-center items-center">
      <Show when={!$$card()?.isNotesCache}>
        <div class="text-base-content-faint text-sm">[AnkiConnect]</div>
      </Show>
      <Show when={$$notesManifest() && $$card()?.isNotesCache}>
        <div class="text-base-content-faint text-sm">
          [Notes Cache] Updated at {new Date($$notesManifest()?.generatedAt ?? 0).toLocaleString()}
        </div>
      </Show>
    </div>
  );
}

function TabItem(props: {
  active: boolean;
  children: JSX.Element;
  neverDisabled?: boolean;
  count?: number;
  onClick: () => void;
}) {
  const $disabled = createMemo(() => !props.count && !props.neverDisabled);

  return (
    <button
      role="tab"
      class="tab gap-0.5 text-lg"
      classList={{
        "tab-active": props.active,
        "cursor-not-allowed": $disabled(),
      }}
      on:click={() => {
        if (!$disabled()) props.onClick();
      }}
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
  const { $kanjiState, $$kanjiInfo, $$visuallySimilar, $$composedOf, $$usedIn, $$related } =
    useKanjiContext();
  const $data = createMemo(() => props.data);
  const [$checked, $setChecked] = createSignal($kanjiPage.focus.kanji === $kanjiState.kanji);

  const $loading = createMemo(
    () =>
      $$kanjiInfo.loading ||
      $$visuallySimilar.loading ||
      $$composedOf.loading ||
      $$usedIn.loading ||
      $$related.loading,
  );

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
          <Show when={$loading()}>
            <div class="loading loading-dots loading-xs text-base-content-faint animate-fade-in-sm"></div>
          </Show>
          <div class="text-base-content-soft bg-base-300 px-1 rounded-xs animate-fade-in-sm text-sm sm:text-base">
            {$data().length}
          </div>
        </div>
      </div>

      <div class="collapse-content text-sm px-2 sm:px-4 pb-2 sm:pb-4 flex flex-col gap-1 sm:gap-2">
        <Suspense
          fallback={
            <div class="flex flex-col gap-2 sm:gap-4 animate-pulse py-1">
              <div class="h-20 sm:h-24 bg-base-300 rounded w-full" />
              <div class="h-20 sm:h-24 bg-base-300 rounded w-full" />
              <div class="h-20 sm:h-24 bg-base-300 rounded w-full" />
            </div>
          }
        >
          <ErrorBoundary fallback={null}>
            <$KanjiInfoExtra inKanjiPage />
          </ErrorBoundary>
          <ul class="list bg-base-100 rounded-box shadow-md animate-fade-in">
            <For each={$data()}>
              {(data) => {
                return <AnkiNoteItem data={data} highlightedKanji={$kanjiState.kanji} />;
              }}
            </For>
          </ul>
        </Suspense>
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
  const { $setCard, $$card } = useCardContext();
  const { $setKanjiPage } = useKanjiPageContext();
  const $data = createMemo(() => props.data);
  const $expression = createMemo(() => $data().fields.Expression.value);
  const $expressionFurigana = createMemo(() => $data().fields.ExpressionFurigana.value);
  const $expressionReading = createMemo(() => $data().fields.ExpressionReading.value);
  const $leech = createMemo(() => $data().tags.includes("leech"));
  const $$isNew = createMemo(() => $$card()?.newNotes.some((n) => n.noteId === $data().noteId) ?? false);
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
    <li class="list-row flex gap-2 relative items-end">
      <div class="flex flex-col gap-2 flex-1">
        <div class="tracking-wide flex gap-2 items-start justify-between">
          <div class="flex gap-2 items-end">
            <div class="font-secondary text-2xl sm:text-4xl">
              <Switch>
                <Match when={$isRuby() || $furiganaData().length === 0}>
                  <ExpressionNoFurigana />
                </Match>
                <Match when={true}>
                  <ExpressionFurigana />
                </Match>
              </Switch>
            </div>
            <div>
              <Show when={props.sources && props.sources.length > 0}>
                <div class="flex gap-1 flex-wrap">
                  <For each={props.sources}>
                    {(s) => (
                      <span
                        class="badge badge-xs sm:badge-sm"
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
              <div class="text-base-content-calm text-xs sm:text-sm">
                {new Date($data().noteId).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div
          class="text-base sm:text-xl text-base-content-calm font-secondary"
          innerHTML={$sentenceInnerHtmlColorized()}
        ></div>
      </div>

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

      <Show when={$$isNew() || $leech()}>
        <div class="flex items-center gap-1 absolute top-4 right-4">
          {$leech() && <div class="status status-warning"></div>}
          {$$isNew() && <div class="status status-info"></div>}
        </div>
      </Show>
    </li>
  );
}

function KanjiText() {
  const { $kanjiState } = useKanjiContext();
  const { $kanjiPage } = useKanjiPageContext();
  const [$ref, $setRef] = createSignal<HTMLDivElement>();

  onMount(() => {
    const ref = $ref();
    if (ref && $kanjiPage.focus.kanji === $kanjiState.kanji && !$kanjiPage.focus.noteId) {
      ref.scrollIntoView({ block: "center" });
    }
  });

  return (
    <div class="flex gap-2 sm:gap-4 me-2 w-full">
      <div class="font-secondary text-5xl sm:text-6xl mb-1" ref={$setRef}>
        {$kanjiState.kanji}
      </div>

      <ErrorBoundary fallback={null}>
        <Suspense
          fallback={
            <div class="flex flex-col gap-1 animate-pulse flex-1">
              <div class="h-3 sm:h-4 bg-base-300 rounded w-1/2" />
              <div class="h-3 sm:h-4 bg-base-300 rounded w-3/4" />
              <div class="h-3 sm:h-4 bg-base-300 rounded w-4/5" />
            </div>
          }
        >
          <$KanjiInfo />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
