import { createContext, createUniqueId, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { createCompatPair } from "#/util/context-compat";
import type { PitchInfo } from "#/util/hatsuon";
import {
  type AnkiFields,
  type AnkiNote,
  ankiFieldsSkeleton,
  type PitchType,
} from "#/util/types";

export type PitchState = {
  infos: PitchInfo[];
  type: PitchType | undefined;
};

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
  sentenceFieldRef?: HTMLDivElement;
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
  pitch: PitchState;
};

type CardContextValue = {
  $card: Store<CardStore>;
  $setCard: SetStoreFunction<CardStore>;
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
    sentenceFieldRef: undefined,
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
    pitch: {
      infos: [],
      type: undefined,
    },
  });

  return (
    <CardStoreContext.Provider value={{ $card, $setCard }}>
      {props.children}
    </CardStoreContext.Provider>
  );
}

export function useCardContext() {
  const cardStore = useContext(CardStoreContext);
  if (!cardStore) throw new Error("Missing CardStoreContext");
  return createCompatPair(
    "$card",
    "$setCard",
    cardStore.$card,
    cardStore.$setCard,
  );
}

export type UseCardContext = typeof useCardContext;
