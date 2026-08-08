import { createContext, createUniqueId, type JSX, onMount, useContext } from "solid-js";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { createCompatPair } from "#/src/lib/context-compat";
import type { AnkiNote } from "#/src/lib/types";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

export type ContextLabel = {
  text: string;
  type: "similar" | "composedOf" | "usedIn" | "related";
};

export type KanjiPageContextStore = {
  focus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  tab: "kanji" | "reading" | "same" | "related";
  nested: boolean;
  nestedId: string;
  nestedNoteList: [string, AnkiNote[]][];
  nestedFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  nestedContextLabel?: ContextLabel;
};

export type KanjiPageContextValue = {
  $kanjiPage: Store<KanjiPageContextStore>;
  $setKanjiPage: SetStoreFunction<KanjiPageContextStore>;
  noteList: [string, AnkiNote[]][];
  sameReading?: AnkiNote[];
  sameExpression?: AnkiNote[];
  relatedExpression?: AnkiNote[];
  contextLabel?: ContextLabel;
};

const KanjiPageContext = createContext<KanjiPageContextValue>();

export function KanjiPageContextProvider(props: {
  children: JSX.Element;
  noteList: [string, AnkiNote[]][];
  sameReading?: AnkiNote[];
  sameExpression?: AnkiNote[];
  relatedExpression?: AnkiNote[];
  initialFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  initialTab: "kanji" | "reading" | "same" | "related";
  contextLabel?: ContextLabel;
  nested?: boolean;
  id: string;
}) {
  const { kanjiPageCache: cache } = useGeneralContext();
  const saved = cache.get(props.id);

  let $kanjiPage: Store<KanjiPageContextStore>;
  let $setKanjiPage: SetStoreFunction<KanjiPageContextStore>;
  if (saved) {
    $kanjiPage = saved.$kanjiPage;
    $setKanjiPage = saved.$setKanjiPage;
  } else {
    [$kanjiPage, $setKanjiPage] = createStore<KanjiPageContextStore>({
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

  const value = {
    $kanjiPage,
    $setKanjiPage,
    noteList: props.noteList,
    contextLabel: props.contextLabel,
    sameReading: props.sameReading,
    sameExpression: props.sameExpression,
    relatedExpression: props.relatedExpression,
  };

  onMount(() => {
    cache.set(props.id, value);
  });

  return <KanjiPageContext.Provider value={value}>{props.children}</KanjiPageContext.Provider>;
}

export function useKanjiPageContext() {
  const kanjiPageStore = useContext(KanjiPageContext);
  if (!kanjiPageStore) throw new Error("Missing KanjiPageContext");
  return Object.assign(
    createCompatPair(
      "$kanjiPage",
      "$setKanjiPage",
      kanjiPageStore.$kanjiPage,
      kanjiPageStore.$setKanjiPage,
    ),
    { ...kanjiPageStore },
  );
}
