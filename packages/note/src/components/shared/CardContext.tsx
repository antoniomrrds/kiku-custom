import {
  createContext,
  createMemo,
  createUniqueId,
  useContext,
} from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { parseHtml, unique } from "#/util/general";
import { getPitchPatternName, hatsuon } from "#/util/hatsuon";
import {
  type AnkiFields,
  type AnkiNote,
  ankiFieldsSkeleton,
  type PitchType,
} from "#/util/types";
import { useAnkiFieldContext } from "./AnkiFieldsContext";
import { useGeneralContext } from "./GeneralContext";

export type PitchState = ReturnType<typeof usePitchState>;
export function usePitchState(nested: boolean | undefined) {
  const { ankiFields } = useAnkiFieldContext<"back">();
  const [$general] = useGeneralContext();

  const pitchNumbers = createMemo(() => {
    const raw = ankiFields.PitchPosition;
    if (!raw) return [];
    const pitchPositionDoc = parseHtml(raw);
    const numbers = Array.from(pitchPositionDoc.querySelectorAll("span"))
      .map((el) => Number(el.innerText))
      .filter((value) => !Number.isNaN(value));
    const uniqueNumbers = unique(numbers);
    if (uniqueNumbers.length) {
      $general.logger.info("Detected pitch number:", uniqueNumbers);
    }
    return uniqueNumbers;
  });

  const reading = createMemo(() => {
    if (nested) return ankiFields.ExpressionReading;
    return ankiFields.ExpressionFurigana
      ? ankiFields["kana:ExpressionFurigana"]
      : ankiFields.ExpressionReading;
  });

  const pitchInfos = createMemo(() => {
    const numbers = pitchNumbers();
    if (!numbers.length) return [];
    return numbers.map((pitchNum) => hatsuon({ reading: reading(), pitchNum }));
  });

  const pitchType = createMemo(() => {
    const info = pitchInfos()[0];
    if (!info) return undefined;
    return getPitchPatternName(
      info.morae.length,
      info.pitchNum,
      "EN",
    ) as PitchType;
  });

  const hasPitch = createMemo(() => !!pitchNumbers().length);

  return {
    pitchInfos,
    pitchType,
    hasPitch,
  };
}

type Query = {
  status: "loading" | "success" | "error";
  sameReading: AnkiNote[] | undefined;
  sameExpression: AnkiNote[] | undefined;
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
  focus: {
    kanji: string | symbol | undefined;
    noteId: number | undefined;
  };
  navigateBack: (() => void)[];
  nested: boolean;
  nestedAnkiFields: AnkiFields;
  nestedNoteId: number | undefined;
  nestedIsMergePreview: boolean;
  isMergePreview: boolean;
  pitchState: PitchState;
};

const CardStoreContext =
  createContext<[Store<CardStore>, SetStoreFunction<CardStore>]>();

export function CardStoreContextProvider(props: {
  children: JSX.Element;
  nested?: boolean;
  isMergePreview?: boolean;
  side: "front" | "back";
}) {
  const pitchState = usePitchState(props.nested);
  const [$card, $setCard] = createStore<CardStore>({
    side: props.side,
    page: "main",
    ready: false,
    expressionReady: false,
    isNsfw: false,
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
      noteList: [],
    },
    focus: {
      kanji: undefined,
      noteId: undefined,
    },
    navigateBack: [],
    nested: props.nested ?? false,
    nestedAnkiFields: ankiFieldsSkeleton,
    nestedNoteId: undefined,
    nestedIsMergePreview: false,
    isMergePreview: props.isMergePreview ?? false,
    pitchState,
  });

  return (
    <CardStoreContext.Provider value={[$card, $setCard]}>
      {props.children}
    </CardStoreContext.Provider>
  );
}

export function useCardContext() {
  const cardStore = useContext(CardStoreContext);
  if (!cardStore) throw new Error("Missing CardStoreContext");
  return cardStore;
}

export type UseCardContext = typeof useCardContext;
