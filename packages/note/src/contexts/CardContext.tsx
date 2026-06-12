import {
  createContext,
  createEffect,
  createMemo,
  createUniqueId,
  useContext,
  type Accessor,
} from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { createCompatPair } from "#/src/lib/context-compat";
import { type AnkiFields, ankiFieldsSkeleton } from "#/src/lib/types";
import type { KanjiPageContextStore } from "#/src/lazy/contexts/KanjiPageContext";
import { useGeneralContext } from "./GeneralContext";
import { useCardQuery, type $$Card } from "#/src/hooks/query";

export type CardStore = {
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
  initialFocus: {
    kanji: string | undefined;
    noteId: number | undefined;
  };
  initialTab: "kanji" | "reading" | "same" | "related";
  navigateBack: (() => void)[];
  nested: boolean;
  nestedAnkiFields: AnkiFields;
  nestedNoteId: number | undefined;
  nestedIsMergePreview: boolean;
  isMergePreview: boolean;
  fadeInTopSection: boolean;
};

type CardContextValue = {
  $card: Store<CardStore>;
  $setCard: SetStoreFunction<CardStore>;
  $initialSide: Accessor<CardStore["side"]>;
  $isInitialSide: Accessor<boolean>;
  $$card: $$Card;
  onKanjiPageMount: Set<(ctx: { $setKanjiPage: SetStoreFunction<KanjiPageContextStore> }) => void>;
};

const CardStoreContext = createContext<CardContextValue>();

export function CardStoreContextProvider(props: {
  children: JSX.Element;
  nested?: boolean;
  isMergePreview?: boolean;
  initialSide: "front" | "back";
  initialNsfw: boolean;
}) {
  const { $general } = useGeneralContext();

  const [$card, $setCard] = createStore<CardStore>({
    side: props.initialSide,
    page: "main",
    ready: false,
    expressionReady: false,
    isNsfw: props.initialNsfw,
    uniqueId: createUniqueId(),
    expressionAudioRef: undefined,
    sentenceAudioRef: undefined,
    sentenceAudios: undefined,
    pictureModal: undefined,
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
    fadeInTopSection: false,
  });

  const $initialSide = createMemo(() => props.initialSide);
  const $isInitialSide = createMemo(() => $initialSide() === $card.side);
  const onKanjiPageMount: CardContextValue["onKanjiPageMount"] = new Set();
  const { $$card } = useCardQuery({ $card, $initialSide });

  createEffect(() => {
    const root = $general.root;
    const side = $card.side;
    if (!root) return;
    root.dataset.side = side;
  });

  return (
    <CardStoreContext.Provider
      value={{
        $card,
        $setCard,
        onKanjiPageMount,
        $initialSide,
        $isInitialSide,
        $$card,
      }}
    >
      {props.children}
    </CardStoreContext.Provider>
  );
}

export function useCardContext() {
  const cardStore = useContext(CardStoreContext);
  if (!cardStore) throw new Error("Missing CardStoreContext");
  return Object.assign(createCompatPair("$card", "$setCard", cardStore.$card, cardStore.$setCard), {
    ...cardStore,
  });
}

export type UseCardContext = typeof useCardContext;
