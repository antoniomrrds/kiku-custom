import {
  batch,
  createContext,
  createEffect,
  type JSX,
  useContext,
} from "solid-js";
import {
  createStore,
  type SetStoreFunction,
  type Store,
  unwrap,
} from "solid-js/store";
import { createCompatPair } from "#/util/context-compat";
import type { AnkiNote, KanjiInfo } from "#/util/types";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useCacheContext } from "../shared/CacheContext";
import { useGeneralContext } from "../shared/GeneralContext";

type FetchType = "composedOf" | "usedIn" | "visuallySimilar" | "related";

type KanjiStore = {
  kanji: string;
  kanjiInfo: KanjiInfo | undefined;
  composedOf?: [string, AnkiNote[]][];
  usedIn?: [string, AnkiNote[]][];
  visuallySimilar?: [string, AnkiNote[]][];
  related?: [string, AnkiNote[]][];
  loading: {
    composedOf: boolean;
    usedIn: boolean;
    visuallySimilar: boolean;
    related: boolean;
  };
  fetchNotes: (type: FetchType) => Promise<void>;
  fetched: Set<FetchType>;
};

type KanjiContextValue = {
  $kanji: Store<KanjiStore>;
  $setKanji: SetStoreFunction<KanjiStore>;
};

const KanjiContext = createContext<KanjiContextValue>();

export function KanjiContextProvider(props: {
  kanji: string;
  children: JSX.Element;
}) {
  const { $general } = useGeneralContext();
  const cacheStore = useCacheContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
  const [$kanji, $setKanji] = createStore<KanjiStore>({
    kanji: props.kanji,
    kanjiInfo: undefined,
    loading: {
      visuallySimilar: false,
      composedOf: false,
      usedIn: false,
      related: false,
    },
    fetchNotes,
    fetched: new Set(),
  });
  const lookupKanji = cacheStore.lookupKanji ?? new Map();
  if (!cacheStore.lookupKanji) cacheStore.lookupKanji = lookupKanji;

  async function fetchNotes(type: FetchType) {
    const nex = await $general.nex.promise;
    const kanjiInfo = unwrap($kanji.kanjiInfo);
    if (!kanjiInfo) return;
    if ($kanji.fetched.has(type)) return;
    $kanji.fetched.add(type);

    const list = kanjiInfo[type] ?? [];
    if (list.length === 0) {
      $setKanji(type, []);
      return;
    }

    $setKanji("loading", type, true);
    const result = await nex.queryShared({
      ankiFields: unwrap($ankiFields),
      kanjiList: list,
    });

    $setKanji(type, Object.entries(result.kanjiResult));
    $setKanji("loading", type, false);
  }

  createEffect(() => {
    const kanji = props.kanji;
    batch(() => {
      $setKanji({
        kanji,
        kanjiInfo: undefined,
        composedOf: undefined,
        usedIn: undefined,
        visuallySimilar: undefined,
        related: undefined,
        loading: {
          visuallySimilar: false,
          composedOf: false,
          usedIn: false,
          related: false,
        },
        fetched: new Set(),
      });
    });

    if (kanji) {
      let kanjiInfo = lookupKanji.get(kanji);
      if (!kanjiInfo) {
        $general.nex.promise.then(async (nex) => {
          if (nex) {
            kanjiInfo = await nex.lookupKanji(kanji);
            lookupKanji.set(kanji, kanjiInfo);
            if ($kanji.kanji === kanji) {
              $setKanji("kanjiInfo", kanjiInfo);
            }
          }
        });
      } else {
        if ($kanji.kanji === kanji) {
          $setKanji("kanjiInfo", kanjiInfo);
        }
      }
    }
  });

  return (
    <KanjiContext.Provider value={{ $kanji, $setKanji }}>
      {props.children}
    </KanjiContext.Provider>
  );
}

export function useKanjiContext() {
  const kanjiStore = useContext(KanjiContext);
  if (!kanjiStore) throw new Error("Missing KanjiContext");
  return createCompatPair(
    "$kanji",
    "$setKanji",
    kanjiStore.$kanji,
    kanjiStore.$setKanji,
  );
}

export type UseKanjiContext = typeof useKanjiContext;
