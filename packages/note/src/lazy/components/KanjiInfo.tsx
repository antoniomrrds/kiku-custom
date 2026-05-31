import { createEffect, createUniqueId, ErrorBoundary, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { useNavigationTransition } from "#/hooks/transition";
import { capitalizeSentence } from "#/lib/text";
import type { AnkiNote } from "#/lib/types";
import { useCardContext } from "../../contexts/CardContext";
import { useCtxContext } from "../../contexts/CtxContext";
import { useGeneralContext } from "../../contexts/GeneralContext";
import { KanjiContextProvider, useKanjiContext } from "../contexts/KanjiContext";
import { type ContextLabel, useKanjiPageContext } from "../contexts/KanjiPageContext";

export function KanjiInfo() {
  const { $kanji } = useKanjiContext();

  return (
    <div class="flex flex-col text-xs sm:text-sm text-base-content-calm items-start z-10 relative">
      <div
        classList={{
          hidden: !$kanji.kanjiInfo?.keyword,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2">
          <span>Keyword: </span>
          <span>{capitalizeSentence($kanji.kanjiInfo?.keyword)}</span>
        </span>
      </div>
      <div
        classList={{
          hidden: !$kanji.kanjiInfo?.frequency,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2">
          <span>Frequency: </span>
          <span>{$kanji.kanjiInfo?.frequency}</span>
        </span>
      </div>
      <div
        classList={{
          hidden: !$kanji.kanjiInfo?.readings.length,
        }}
      >
        <span class="inline-flex flex-wrap gap-x-1 sm:gap-x-2 gap-y-0.5">
          <span>Reading: </span>
          <For each={$kanji.kanjiInfo?.readings}>
            {(reading) => {
              return (
                <Show when={reading.percentage}>
                  <span class="border border-base-content-subtle-100 inline-flex">
                    <span class="px-0.5">{reading.reading}</span>
                    <span class="border-s border-base-300 px-0.5 bg-base-300 text-base-content-soft">
                      {reading.percentage}
                    </span>
                  </span>
                </Show>
              );
            }}
          </For>
        </span>
      </div>
    </div>
  );
}

export function KanjiInfoExtra(props: { inKanjiPage?: boolean }) {
  const { $kanji, fetchNotes } = useKanjiContext();
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  const KanjiKeywordComponent = props.inKanjiPage ? KanjiKeywordKanjiPage : KanjiKeywordTooltip;
  const [$checkbox, $setCheckbox] = createStore({
    visuallySimilar: false,
    composedOf: false,
    usedIn: false,
    meanings: false,
    related: false,
  });
  const [$checkboxRef, $setCheckboxRef] = createStore<{
    visuallySimilar: undefined | HTMLInputElement;
    composedOf: undefined | HTMLInputElement;
    usedIn: undefined | HTMLInputElement;
    meanings: undefined | HTMLInputElement;
    related: undefined | HTMLInputElement;
  }>({
    visuallySimilar: undefined,
    composedOf: undefined,
    usedIn: undefined,
    meanings: undefined,
    related: undefined,
  });

  createEffect(() => {
    if ($checkbox.visuallySimilar) fetchNotes("visuallySimilar");
    if ($checkbox.composedOf) fetchNotes("composedOf");
    if ($checkbox.usedIn) fetchNotes("usedIn");
    if ($checkbox.related) fetchNotes("related");
  });

  function VisuallySimilar() {
    return (
      <Show when={$kanji.kanjiInfo?.visuallySimilar.length}>
        <div class="collapse collapse-arrow rounded-none">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("visuallySimilar", ref)}
            checked={$checkbox.visuallySimilar}
            on:change={(e) => {
              $setCheckbox("visuallySimilar", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Visually Similar</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$kanji.kanjiInfo?.visuallySimilar}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanji.kanji}
                        noteList={$kanji.visuallySimilar}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanji.kanji,
                          type: "similar",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function ComposedOf() {
    return (
      <Show when={$kanji.kanjiInfo?.composedOf.length}>
        <div class="collapse collapse-arrow rounded-none">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("composedOf", ref)}
            checked={$checkbox.composedOf}
            on:change={(e) => {
              $setCheckbox("composedOf", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Composed of</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$kanji.kanjiInfo?.composedOf}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanji.kanji}
                        noteList={$kanji.composedOf}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanji.kanji,
                          type: "composedOf",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function UsedIn() {
    return (
      <Show when={$kanji.kanjiInfo?.usedIn.length}>
        <div class="collapse collapse-arrow rounded-none">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("usedIn", ref)}
            checked={$checkbox.usedIn}
            on:change={(e) => {
              $setCheckbox("usedIn", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Used in</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$kanji.kanjiInfo?.usedIn}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanji.kanji}
                        noteList={$kanji.usedIn}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanji.kanji,
                          type: "usedIn",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function Meanings() {
    return (
      <Show when={$kanji.kanjiInfo?.meanings.length}>
        <div class="collapse collapse-arrow rounded-none">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("meanings", ref)}
            checked={$checkbox.meanings}
            on:change={(e) => {
              $setCheckbox("meanings", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Meanings</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$kanji.kanjiInfo?.meanings}>
                {(meaning) => {
                  return (
                    <div class="border border-base-300 inline-flex px-1 bg-base-300">{meaning}</div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function Related() {
    return (
      <Show when={$kanji.kanjiInfo?.related.length}>
        <div class="collapse collapse-arrow rounded-none">
          <input
            type="checkbox"
            class="p-0"
            ref={(ref) => $setCheckboxRef("related", ref)}
            checked={$checkbox.related}
            on:change={(e) => {
              $setCheckbox("related", e.currentTarget.checked);
            }}
          />
          <div class="collapse-title p-0 mb-1 after:text-base-content-calm text-start">
            <div class="font-bold text-base-content-calm">Related</div>
          </div>
          <div class="collapse-content p-0">
            <div class="flex gap-1 sm:gap-2 flex-wrap text-base-content-calm">
              <For each={$kanji.kanjiInfo?.related}>
                {(kanji) => {
                  return (
                    <KanjiContextProvider kanji={kanji}>
                      <KanjiKeywordComponent
                        parentKanji={$kanji.kanji}
                        noteList={$kanji.related}
                        nestedFocus={{
                          kanji: kanji,
                          noteId: undefined,
                        }}
                        contextLabel={{
                          text: $kanji.kanji,
                          type: "related",
                        }}
                      />
                    </KanjiContextProvider>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  function DefaultKanjiInfoExtra() {
    createEffect(() => {
      $setCheckbox("visuallySimilar", true);
      $setCheckbox("composedOf", true);
    });

    return (
      <>
        <VisuallySimilar />
        <ComposedOf />
        <UsedIn />
        <Meanings />
        <Related />
      </>
    );
  }

  const sections = {
    VisuallySimilar,
    ComposedOf,
    UsedIn,
    Meanings,
    Related,
  };

  return (
    <ErrorBoundary fallback={<DefaultKanjiInfoExtra />}>
      <Show when={$general.plugin?.KanjiInfoExtra} fallback={<DefaultKanjiInfoExtra />}>
        {(get) => {
          const KanjiInfoExtra = get();
          return (
            <KanjiInfoExtra
              inKanjiPage={props.inKanjiPage}
              DefaultKanjiInfoExtra={DefaultKanjiInfoExtra}
              sections={sections}
              checkboxRef={$checkboxRef}
              ctx={ctx}
              useKanjiContext={useKanjiContext}
            />
          );
        }}
      </Show>
    </ErrorBoundary>
  );
}

function KanjiKeyword(props: {
  noteList?: [string, AnkiNote[]][];
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  contextLabel?: ContextLabel;
  onClick?: () => void;
  parentKanji: string;
}) {
  const { $kanji } = useKanjiContext();

  const keyword = () =>
    $kanji.kanjiInfo?.wkMeaning ? $kanji.kanjiInfo?.wkMeaning : $kanji.kanjiInfo?.keyword;
  const ready = () => !!props.noteList;

  return (
    <button
      class="inline-flex border border-base-content-subtle-100 transition-colors hover:border-base-content-subtle-200"
      classList={{
        "cursor-pointer": ready(),
        "cursor-not-allowed": !ready(),
        "text-base-content-calm": ready(),
        "text-base-content-soft": !ready(),
      }}
      on:click={props.onClick}
      on:touchend={(e) => e.stopPropagation()}
    >
      <span class=" px-1 text-lg sm:text-xl">{$kanji.kanji}</span>
      <Show when={keyword()}>
        <span class="bg-base-300 border-s border-base-300 px-1 text-base-content-soft flex items-center">
          {capitalizeSentence(keyword())}
        </span>
      </Show>
    </button>
  );
}

function KanjiKeywordTooltip(props: {
  noteList?: [string, AnkiNote[]][];
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  contextLabel?: ContextLabel;
  parentKanji: string;
}) {
  const { $setCard, onKanjiPageMount } = useCardContext();
  const { navigate } = useNavigationTransition();

  const onClick = () => {
    const noteList = props.noteList;
    if (!noteList) return;

    $setCard("initialTab", "kanji");
    $setCard("initialFocus", { kanji: props.parentKanji, noteId: undefined });
    $setCard("uniqueId", createUniqueId());
    onKanjiPageMount.add(({ $setKanjiPage }) => {
      navigate(
        () =>
          applyNestedKanjiPageState($setKanjiPage, {
            contextLabel: props.contextLabel,
            nestedFocus: props.nestedFocus,
            parentKanji: props.parentKanji,
            noteList,
          }),
        "forward",
        () => navigate(() => $setKanjiPage("nested", false), "back"),
      );
    });
    navigate("kanji", "forward", () => navigate("main", "back"));
  };

  return <KanjiKeyword {...props} onClick={onClick} />;
}

function KanjiKeywordKanjiPage(props: {
  noteList?: [string, AnkiNote[]][];
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  contextLabel?: ContextLabel;
  parentKanji: string;
}) {
  const { $setKanjiPage } = useKanjiPageContext();
  const { navigate } = useNavigationTransition();

  const onClick = () => {
    const noteList = props.noteList;
    if (!noteList) return;
    navigate(
      () =>
        applyNestedKanjiPageState($setKanjiPage, {
          contextLabel: props.contextLabel,
          nestedFocus: props.nestedFocus,
          parentKanji: props.parentKanji,
          noteList,
        }),
      "forward",
      () => navigate(() => $setKanjiPage("nested", false), "back"),
    );
  };

  return <KanjiKeyword {...props} onClick={onClick} />;
}

function applyNestedKanjiPageState(
  $setKanjiPage: ReturnType<typeof useKanjiPageContext>["$setKanjiPage"],
  props: {
    contextLabel?: ContextLabel;
    nestedFocus: {
      kanji: string | undefined;
      noteId: number | undefined;
    };
    parentKanji: string;
    noteList: [string, AnkiNote[]][];
  },
) {
  $setKanjiPage("nestedContextLabel", props.contextLabel);
  $setKanjiPage("nestedId", createUniqueId());
  $setKanjiPage("nestedFocus", {
    kanji: props.nestedFocus.kanji,
    noteId: props.nestedFocus.noteId,
  });
  $setKanjiPage("focus", {
    kanji: props.parentKanji,
    noteId: undefined,
  });
  $setKanjiPage("nestedNoteList", props.noteList);
  $setKanjiPage("nested", true);
}
