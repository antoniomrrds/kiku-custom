import { batch, createContext, createEffect, type JSX, useContext } from "solid-js";
import { createStore, type SetStoreFunction, type Store, unwrap } from "solid-js/store";
import { createCompatPair } from "#/lib/context-compat";
import type { AnkiFields, AnkiNote, KanjiInfo, QuerySharedResult } from "#/lib/types";
import { useAnkiFieldContext } from "../../contexts/AnkiFieldsContext";
import { useCacheContext } from "../../contexts/CacheContext";
import { useGeneralContext } from "../../contexts/GeneralContext";

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
  fetched: Set<FetchType>;
};

type KanjiContextValue = {
  $kanji: Store<KanjiStore>;
  $setKanji: SetStoreFunction<KanjiStore>;
  fetchNotes: (type: FetchType) => Promise<void>;
};

const KanjiContext = createContext<KanjiContextValue>();

function getQuerySharedCacheKey(ankiFields: AnkiFields, kanjiList: readonly string[]) {
  if (ankiFields.CardID) {
    return `${ankiFields.CardID}-${ankiFields.Expression}-${Array.from(new Set(kanjiList))
      .sort()
      .join("-")}`;
  }

  return JSON.stringify({
    ankiFields: Object.entries(ankiFields).sort(([left], [right]) => left.localeCompare(right)),
    kanjiList: Array.from(new Set(kanjiList)).sort(),
  });
}

export function KanjiContextProvider(props: { kanji: string; children: JSX.Element }) {
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
    fetched: new Set(),
  });
  const lookupKanjiCache = cacheStore.lookupKanji ?? new Map<string, KanjiInfo | undefined>();
  if (!cacheStore.lookupKanji) cacheStore.lookupKanji = lookupKanjiCache;
  const querySharedCache = cacheStore.queryShared ?? new Map<string, QuerySharedResult>();
  if (!cacheStore.queryShared) cacheStore.queryShared = querySharedCache;

  async function fetchNotes(type: FetchType) {
    const kanji = $kanji.kanji;
    if (!kanji) return;
    const nex = await $general.nex.promise;
    const kanjiInfo = unwrap($kanji.kanjiInfo) ?? (await nex.lookupKanji(kanji));
    if (kanji !== $kanji.kanji) return;
    if (!kanjiInfo) return;
    if ($kanji.fetched.has(type)) return;
    $kanji.fetched.add(type);

    const list = kanjiInfo[type] ?? [];
    if (list.length === 0) {
      $setKanji(type, []);
      return;
    }

    $setKanji("loading", type, true);
    try {
      const ankiFields = unwrap($ankiFields);
      const cacheKey = getQuerySharedCacheKey(ankiFields, list);
      const cachedResult = querySharedCache.get(cacheKey);
      if (cachedResult) {
        $setKanji(type, Object.entries(cachedResult.kanjiResult));
        return;
      }

      const result = await nex.queryShared({ ankiFields, kanjiList: list });
      if (kanji !== $kanji.kanji) return;
      querySharedCache.set(cacheKey, result);
      $setKanji(type, Object.entries(result.kanjiResult));
    } finally {
      $setKanji("loading", type, false);
    }
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
      let kanjiInfo = lookupKanjiCache.get(kanji);
      if (!kanjiInfo) {
        $general.nex.promise.then(async (nex) => {
          if (nex) {
            kanjiInfo = await nex.lookupKanji(kanji);
            lookupKanjiCache.set(kanji, kanjiInfo);
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
    <KanjiContext.Provider value={{ $kanji, $setKanji, fetchNotes }}>
      {props.children}
    </KanjiContext.Provider>
  );
}

export function useKanjiContext() {
  const kanjiStore = useContext(KanjiContext);
  if (!kanjiStore) throw new Error("Missing KanjiContext");
  return Object.assign(
    createCompatPair("$kanji", "$setKanji", kanjiStore.$kanji, kanjiStore.$setKanji),
    { fetchNotes: kanjiStore.fetchNotes },
  );
}

export type UseKanjiContext = typeof useKanjiContext;
