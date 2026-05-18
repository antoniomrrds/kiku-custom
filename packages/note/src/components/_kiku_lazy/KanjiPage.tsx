import {
  createMemo,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { useCardContext } from "#/components/shared/CardContext";
import { extractKanji, parseHtml } from "#/util/general";
import { useNavigationTransition } from "#/util/hooks";
import { parseFurigana } from "#/util/parse-furigana";
import {
  type AnkiFields,
  type AnkiNote,
  ankiFieldsSkeleton,
} from "#/util/types";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useGeneralContext } from "../shared/GeneralContext";
import HeaderKanjiPage from "./HeaderKanjiPage";
import { ArrowLeftIcon } from "./Icons";
import { KanjiContextProvider, useKanjiContext } from "./KanjiContext";
import { KanjiInfo, KanjiInfoExtra } from "./KanjiInfo";
import {
  KanjiPageContextProvider,
  useKanjiPageContext,
} from "./KanjiPageContext";

export default function KanjiPage() {
  const { $card } = useCardContext();
  return (
    <KanjiPageContextProvider
      noteList={$card.query.noteList}
      sameReading={$card.query.sameReading}
      sameExpression={$card.query.sameExpression}
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
  const { $general } = useGeneralContext();
  const { $kanjiPage, $setKanjiPage } = useKanjiPageContext();
  const $hasSameKanji = createMemo(() => $kanjiPage.noteList.length > 0);
  const $hasSameReading = createMemo(
    () => $kanjiPage.sameReading && $kanjiPage.sameReading.length > 0,
  );
  const $hasSameExpression = createMemo(
    () => $kanjiPage.sameExpression && $kanjiPage.sameExpression.length > 0,
  );
  const $title = createMemo(() => {
    if ($kanjiPage.contextLabel?.type === "similar") return "Similar";
    if ($kanjiPage.contextLabel?.type === "composedOf") return "Composed of";
    if ($kanjiPage.contextLabel?.type === "usedIn") return "Used in";
    if ($kanjiPage.contextLabel?.type === "related") return "Related";
  });

  return (
    <Switch>
      <Match when={$kanjiPage.nested}>
        <KanjiPageContextProvider
          noteList={$kanjiPage.nestedNoteList}
          sameReading={[]}
          sameExpression={[]}
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
            <button
              role="tab"
              class="tab"
              classList={{
                "tab-active": $kanjiPage.tab === "kanji",
                "cursor-not-allowed": !$hasSameKanji(),
              }}
              on:click={() => {
                if ($hasSameKanji()) $setKanjiPage("tab", "kanji");
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              漢字
            </button>
            <button
              role="tab"
              class="tab gap-1"
              classList={{
                "tab-active": $kanjiPage.tab === "reading",
                "cursor-not-allowed": !$hasSameReading(),
              }}
              on:click={() => {
                if ($hasSameReading()) $setKanjiPage("tab", "reading");
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              読
              <span class="text-base-content-soft bg-base-300 px-0.5 rounded-xs text-xs sm:text-sm">
                {$kanjiPage.sameReading?.length ?? 0}
              </span>
            </button>
            <button
              role="tab"
              class="tab gap-1"
              classList={{
                "tab-active": $kanjiPage.tab === "same",
                "cursor-not-allowed": !$hasSameExpression(),
              }}
              on:click={() => {
                if ($hasSameExpression()) $setKanjiPage("tab", "same");
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              同
              <span class="text-base-content-soft bg-base-300 px-0.5 rounded-xs text-xs sm:text-sm">
                {$kanjiPage.sameExpression?.length ?? 0}
              </span>
            </button>
          </div>
          <Show when={$kanjiPage.contextLabel}>
            <div class="flex flex-col items-center gap-2">
              <div class="flex justify-center text-5xl sm:text-6xl font-secondary ">
                {$kanjiPage.contextLabel?.text}
              </div>
              <Show when={$title()}>
                <div class="text-base-content-calm text-base sm:text-lg">
                  {$title()}
                </div>
              </Show>
            </div>
          </Show>

          <div class="flex flex-col gap-2 sm:gap-4 ">
            <Show when={$kanjiPage.tab === "kanji"}>
              <For each={$kanjiPage.noteList}>
                {([kanji, data]) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiCollapsible data={data} />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </Show>
            <Show
              when={
                $kanjiPage.sameReading &&
                $kanjiPage.sameReading.length > 0 &&
                $kanjiPage.tab === "reading"
              }
            >
              <NoteList
                list={$kanjiPage.sameReading ?? []}
                title="Same Reading"
              />
            </Show>
            <Show
              when={
                $kanjiPage.sameExpression &&
                $kanjiPage.sameExpression.length > 0 &&
                $kanjiPage.tab === "same"
              }
            >
              <NoteList
                list={$kanjiPage.sameExpression ?? []}
                title="Same Expression"
              />
            </Show>
          </div>
        </div>
        <div class="flex justify-center items-center">
          <Show when={$general.notesManifest}>
            <div class="text-base-content-faint text-sm">
              Updated at{" "}
              {new Date(
                $general.notesManifest?.generatedAt ?? 0,
              ).toLocaleString()}
            </div>
          </Show>
        </div>
      </Match>
    </Switch>
  );
}

function KanjiCollapsible(props: { data: AnkiNote[] }) {
  const { $kanjiPage } = useKanjiPageContext();
  const { $kanji } = useKanjiContext();
  const data = () => props.data;
  const [$checked, $setChecked] = createSignal(
    $kanjiPage.focus.kanji === $kanji.kanji,
  );

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
              return (
                <AnkiNoteItem data={data} highlightedKanji={$kanji.kanji} />
              );
            }}
          </For>
        </ul>
      </div>
    </div>
  );
}

function NoteList(props: { title: string; list: AnkiNote[] }) {
  const { $ankiFields } = useAnkiFieldContext<"back">();

  const $doc = createMemo(() => parseHtml($ankiFields.ExpressionFurigana));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() =>
    parseFurigana($isRuby() ? "" : $ankiFields.ExpressionFurigana),
  );

  return (
    <div class="flex flex-col gap-2 sm:gap-4">
      <div class="flex-col flex justify-between items-center gap-2">
        <div class="font-secondary text-5xl sm:text-6xl">
          <Switch>
            <Match when={$isRuby()}>
              <div innerHTML={$ankiFields.ExpressionFurigana}></div>
            </Match>
            <Match
              when={
                $furiganaData().length === 0 ||
                !$ankiFields.ExpressionFurigana.includes("[")
              }
            >
              <ruby>
                {$ankiFields.Expression}
                <Show
                  when={
                    $ankiFields.ExpressionFurigana &&
                    extractKanji($ankiFields.Expression).length > 0
                  }
                >
                  <rt>{$ankiFields.ExpressionReading}</rt>
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
                              rubyItem().reading.trim() !== "" ||
                              rubyItem().reading === " "
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
        <div class="text-base-content-calm text-base sm:text-lg">
          {props.title}
        </div>
      </div>
      <ul class="list bg-base-100 rounded-box shadow-md animate-fade-in">
        <For each={props.list ?? []}>
          {(data) => {
            return <AnkiNoteItem data={data} />;
          }}
        </For>
      </ul>
    </div>
  );
}

function AnkiNoteItem(props: { data: AnkiNote; highlightedKanji?: string }) {
  const { navigate } = useNavigationTransition();
  const { $setCard } = useCardContext();
  const { $kanjiPage, $setKanjiPage } = useKanjiPageContext();
  const $data = createMemo(() => props.data);
  const $expression = createMemo(() => $data().fields.Expression.value);
  const $expressionFurigana = createMemo(
    () => $data().fields.ExpressionFurigana.value,
  );
  const $expressionReading = createMemo(
    () => $data().fields.ExpressionReading.value,
  );
  const $leech = createMemo(() => $data().tags.includes("leech"));
  const $doc = createMemo(() => parseHtml($expressionFurigana()));
  const $isRuby = createMemo(() => $doc().querySelector("ruby"));
  const $furiganaData = createMemo(() =>
    parseFurigana($isRuby() ? "" : $expressionFurigana()),
  );

  function ExpressionNoFurigana() {
    return (
      <ruby>
        <For each={$expression().split("")}>
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
        <Show
          when={$expressionReading() && extractKanji($expression()).length > 0}
        >
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
                  <For each={rubyItem().text.trim().split("")}>
                    {(char) => (
                      <span
                        classList={{
                          "text-base-content-primary":
                            char === props.highlightedKanji,
                        }}
                      >
                        {char}
                      </span>
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

  let ref: HTMLDivElement | undefined;
  onMount(() => {
    if (ref && $kanjiPage.focus.noteId === props.data.noteId) {
      ref.scrollIntoView({ block: "center" });
    }
  });

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
        </div>
        {$leech() && <div class="status status-warning"></div>}
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

  let ref: HTMLDivElement | undefined;
  onMount(() => {
    if (
      ref &&
      $kanjiPage.focus.kanji === $kanji.kanji &&
      !$kanjiPage.focus.noteId
    ) {
      ref.scrollIntoView({ block: "center" });
    }
  });

  return (
    <div class="flex gap-2 sm:gap-4 me-2">
      <div class="font-secondary text-5xl sm:text-6xl" ref={ref}>
        {$kanji.kanji}
      </div>
      <KanjiInfo />
    </div>
  );
}
