import { createContext, createUniqueId, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { createCompatPair } from "#/src/lib/context-compat";
import { type AnkiFields, type AnkiNote, ankiFieldsSkeleton } from "#/src/lib/types";
import type { KanjiPageContextStore } from "#/src/lazy/contexts/KanjiPageContext";

type Query = {
  status: "loading" | "success" | "error";
  sameReading: AnkiNote[] | undefined;
  sameExpression: AnkiNote[] | undefined;
  relatedExpression: AnkiNote[] | undefined;
  noteList: [string, AnkiNote[]][];
};

type CardStore = {
  side: "front" | "back";
  page: "main" | "settings" | "kanji" | "nested";
  ready: boolean;
  expressionReady: boolean;
  isNsfw: boolean;
  uniqueId: string;
  expressionAudioRef?: HTMLDivElement;
  sentenceAudioRef?: HTMLDivElement;
  sentenceAudios?: HTMLAnchorElement[] | HTMLAudioElement[];
  pictureModal?: string;
  query: Query;
  initialFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  initialTab: "kanji" | "reading" | "same";
  navigateBack: (() => void)[];
  nested: boolean;
  nestedAnkiFields: AnkiFields;
  nestedNoteId: number | undefined;
  nestedIsMergePreview: boolean;
  isMergePreview: boolean;
};

type CardContextValue = {
  $card: Store<CardStore>;
  $setCard: SetStoreFunction<CardStore>;
  onKanjiPageMount: Set<(ctx: { $setKanjiPage: SetStoreFunction<KanjiPageContextStore> }) => void>;
};

const CardStoreContext = createContext<CardContextValue>();

export function CardStoreContextProvider(props: {
  children: JSX.Element;
  nested?: boolean;
  isMergePreview?: boolean;
  side: "front" | "back";
  initialNsfw: boolean;
}) {
  const [$card, $setCard] = createStore<CardStore>({
    side: props.side,
    page: "main",
    ready: false,
    expressionReady: false,
    isNsfw: props.initialNsfw,
    uniqueId: createUniqueId(),
    expressionAudioRef: undefined,
    sentenceAudioRef: undefined,
    sentenceAudios: undefined,
    pictureModal: undefined,
    query: {
      status: "loading",
      sameReading: undefined,
      sameExpression: undefined,
      relatedExpression: undefined,
      noteList: [],
    },
    initialFocus: {
      kanji: undefined,
      noteId: undefined,
    },
    initialTab: "kanji",
    navigateBack: [],
    nested: props.nested ?? false,
    nestedAnkiFields: ankiFieldsSkeleton,
    nestedNoteId: undefined,
    nestedIsMergePreview: false,
    isMergePreview: props.isMergePreview ?? false,
  });
  const onKanjiPageMount: CardContextValue["onKanjiPageMount"] = new Set();

  return (
    <CardStoreContext.Provider value={{ $card, $setCard, onKanjiPageMount }}>
      {props.children}
    </CardStoreContext.Provider>
  );
}

export function useCardContext() {
  const cardStore = useContext(CardStoreContext);
  if (!cardStore) throw new Error("Missing CardStoreContext");
  return Object.assign(createCompatPair("$card", "$setCard", cardStore.$card, cardStore.$setCard), {
    onKanjiPageMount: cardStore.onKanjiPageMount,
  });
}

export type UseCardContext = typeof useCardContext;
