import { batch, createContext, createEffect, createMemo, type JSX, useContext } from "solid-js";
import { createStore, type SetStoreFunction, type Store, unwrap } from "solid-js/store";
import { createCompatPair } from "#/src/lib/context-compat";
import type { AnkiFields, AnkiNote, KanjiInfo, QuerySharedResult } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

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
};

type KanjiContextValue = {
  $kanjiState: Store<KanjiStore>;
  $setKanjiState: SetStoreFunction<KanjiStore>;
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
  const { workerApi: workerApiContainer } = useGeneralContext();
  const cacheStore = useCacheContext();
  const { $ankiFields } = useAnkiFieldContext();

  const $kanji = createMemo(() => props.kanji);
  const [$kanjiState, $setKanjiState] = createStore<KanjiStore>({
    kanji: $kanji(),
    kanjiInfo: undefined,
    loading: {
      visuallySimilar: false,
      composedOf: false,
      usedIn: false,
      related: false,
    },
  });
  const fetched = new Set<FetchType>();

  const lookupKanjiCache = cacheStore.lookupKanji ?? new Map<string, KanjiInfo | undefined>();
  if (!cacheStore.lookupKanji) cacheStore.lookupKanji = lookupKanjiCache;
  const querySharedCache = cacheStore.queryShared ?? new Map<string, QuerySharedResult>();
  if (!cacheStore.queryShared) cacheStore.queryShared = querySharedCache;

  async function fetchNotes(type: FetchType) {
    const kanji = $kanjiState.kanji;
    if (!kanji) return;
    const workerApi = await workerApiContainer.promise;
    const kanjiInfo = unwrap($kanjiState.kanjiInfo) ?? (await workerApi.lookupKanji(kanji));
    if (kanji !== $kanjiState.kanji) return;
    if (!kanjiInfo) return;
    if (fetched.has(type)) return;
    fetched.add(type);

    const list = kanjiInfo[type] ?? [];
    if (list.length === 0) {
      $setKanjiState(type, []);
      return;
    }

    $setKanjiState("loading", type, true);
    try {
      const ankiFields = unwrap($ankiFields);
      const cacheKey = getQuerySharedCacheKey(ankiFields, list);
      const cachedResult = querySharedCache.get(cacheKey);
      if (cachedResult) {
        $setKanjiState(type, Object.entries(cachedResult.kanjiResult));
        return;
      }

      const result = await workerApi.queryShared({ ankiFields, kanjiList: list });
      if (kanji !== $kanjiState.kanji) return;
      querySharedCache.set(cacheKey, result);
      $setKanjiState(type, Object.entries(result.kanjiResult));
    } finally {
      $setKanjiState("loading", type, false);
    }
  }

  createEffect(() => {
    const kanji = $kanji();
    batch(() => {
      fetched.clear();
      $setKanjiState({
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
      });
    });

    if (kanji) {
      let kanjiInfo = lookupKanjiCache.get(kanji);
      if (!kanjiInfo) {
        workerApiContainer.promise.then(async (workerApi) => {
          if (workerApi) {
            kanjiInfo = await workerApi.lookupKanji(kanji);
            lookupKanjiCache.set(kanji, kanjiInfo);
            if ($kanjiState.kanji === kanji) {
              $setKanjiState("kanjiInfo", kanjiInfo);
            }
          }
        });
      } else {
        if ($kanjiState.kanji === kanji) {
          $setKanjiState("kanjiInfo", kanjiInfo);
        }
      }
    }
  });

  return (
    <KanjiContext.Provider
      value={{
        $kanjiState,
        $setKanjiState,
        $kanji: $kanjiState,
        $setKanji: $setKanjiState,
        fetchNotes,
      }}
    >
      {props.children}
    </KanjiContext.Provider>
  );
}

export function useKanjiContext() {
  const kanjiStore = useContext(KanjiContext);
  if (!kanjiStore) throw new Error("Missing KanjiContext");
  return Object.assign(
    createCompatPair(
      "$kanjiState",
      "$setKanjiState",
      kanjiStore.$kanjiState,
      kanjiStore.$setKanjiState,
    ),
    { ...kanjiStore },
  );
}

export type UseKanjiContext = typeof useKanjiContext;
