import { createContext, createUniqueId, type JSX, onMount, useContext } from "solid-js";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { createCompatPair } from "#/lib/context-compat";
import type { AnkiNote } from "#/lib/types";

export type ContextLabel = {
  text: string;
  type: "similar" | "composedOf" | "usedIn" | "related";
};

export type KanjiPageContextStore = {
  noteList: [string, AnkiNote[]][];
  sameReading?: AnkiNote[];
  sameExpression?: AnkiNote[];
  focus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  tab: "kanji" | "reading" | "same";
  contextLabel?: ContextLabel;
  nested: boolean;
  nestedId: string;
  nestedNoteList: [string, AnkiNote[]][];
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  nestedContextLabel?: ContextLabel;
};

type KanjiPageContextValue = {
  $kanjiPage: Store<KanjiPageContextStore>;
  $setKanjiPage: SetStoreFunction<KanjiPageContextStore>;
};

const KanjiPageContext = createContext<KanjiPageContextValue>();

const cache = new Map<string, KanjiPageContextValue>();

export function KanjiPageContextProvider(props: {
  children: JSX.Element;
  noteList: [string, AnkiNote[]][];
  sameReading?: AnkiNote[];
  sameExpression?: AnkiNote[];
  initialFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  initialTab: "kanji" | "reading" | "same";
  contextLabel?: ContextLabel;
  nested?: boolean;
  id: string;
}) {
  const saved = cache.get(props.id);

  let $kanjiPage: Store<KanjiPageContextStore>;
  let $setKanjiPage: SetStoreFunction<KanjiPageContextStore>;
  if (saved) {
    $kanjiPage = saved.$kanjiPage;
    $setKanjiPage = saved.$setKanjiPage;
  } else {
    [$kanjiPage, $setKanjiPage] = createStore<KanjiPageContextStore>({
      noteList: props.noteList,
      contextLabel: props.contextLabel,
      sameReading: props.sameReading,
      sameExpression: props.sameExpression,
      focus: {
        kanji: props.initialFocus?.kanji,
        noteId: props.initialFocus?.noteId,
      },
      tab: props.initialTab,
      nested: props.nested ?? false,
      nestedId: createUniqueId(),
      nestedNoteList: [],
      nestedFocus: {
        kanji: undefined,
        noteId: undefined,
      },
      nestedContextLabel: undefined,
    });
  }

  onMount(() => {
    cache.set(props.id, { $kanjiPage, $setKanjiPage });
  });

  return (
    <KanjiPageContext.Provider value={{ $kanjiPage, $setKanjiPage }}>
      {props.children}
    </KanjiPageContext.Provider>
  );
}

export function useKanjiPageContext() {
  const kanjiPageStore = useContext(KanjiPageContext);
  if (!kanjiPageStore) throw new Error("Missing KanjiPageContext");
  return createCompatPair(
    "$kanjiPage",
    "$setKanjiPage",
    kanjiPageStore.$kanjiPage,
    kanjiPageStore.$setKanjiPage,
  );
}
