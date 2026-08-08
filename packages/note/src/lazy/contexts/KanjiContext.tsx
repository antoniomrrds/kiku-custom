import {
  createContext,
  createEffect,
  createMemo,
  createResource,
  type JSX,
  type Resource,
  useContext,
} from "solid-js";
import { createStore, type SetStoreFunction, type Store, unwrap } from "solid-js/store";
import { createCompatPair } from "#/src/lib/context-compat";
import type { AnkiNote, KanjiInfo } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

type FetchType = "visuallySimilar" | "composedOf" | "usedIn" | "related";

type KanjiStore = {
  kanji: string;
};

type KanjiContextValue = {
  $kanjiState: Store<KanjiStore>;
  $setKanjiState: SetStoreFunction<KanjiStore>;
  $kanji: Store<KanjiStore>;
  $setKanji: SetStoreFunction<KanjiStore>;
  $$kanjiInfo: Resource<KanjiInfo | undefined>;
  $fetchFlags: Store<Record<FetchType, boolean>>;
  $setFetchFlags: SetStoreFunction<Record<FetchType, boolean>>;
  $$visuallySimilar: Resource<[string, AnkiNote[]][] | undefined>;
  $$composedOf: Resource<[string, AnkiNote[]][] | undefined>;
  $$usedIn: Resource<[string, AnkiNote[]][] | undefined>;
  $$related: Resource<[string, AnkiNote[]][] | undefined>;
};

const KanjiContext = createContext<KanjiContextValue>();

export function KanjiContextProvider(props: { kanji: string; children: JSX.Element }) {
  const { workerApi: workerApiContainer, kanjiInfoNotesCache } = useGeneralContext();
  const cacheStore = useCacheContext();
  const { initialAnkiFields } = useAnkiFieldContext();

  const $kanji = createMemo(() => props.kanji);
  const [$kanjiState, $setKanjiState] = createStore<KanjiStore>({
    kanji: $kanji(),
  });

  const kanjiInfoCache = cacheStore.kanjiInfo ?? new Map<string, KanjiInfo | undefined>();
  if (!cacheStore.kanjiInfo) cacheStore.kanjiInfo = kanjiInfoCache;

  const [$$kanjiInfo] = createResource($kanji, async (kanji) => {
    if (!kanji) return undefined;
    const cached = kanjiInfoCache.get(kanji);
    if (cached) return cached;
    const workerApi = await workerApiContainer.promise;
    const info = await workerApi.lookupKanji(kanji);
    kanjiInfoCache.set(kanji, info);
    return info;
  });

  const [$fetchFlags, $setFetchFlags] = createStore<Record<FetchType, boolean>>({
    visuallySimilar: false,
    composedOf: false,
    usedIn: false,
    related: false,
  });

  function createTypeResource(type: FetchType) {
    const [$resource] = createResource(
      () =>
        $fetchFlags[type] ? ($$kanjiInfo.state === "ready" ? $$kanjiInfo() : undefined) : undefined,
      async (kanjiInfo) => {
        if (!kanjiInfo) return;
        const list = kanjiInfo[type];
        if (!list || list.length === 0) return [];
        const cacheKey = `${initialAnkiFields.CardID}-${list.slice().sort().join("-")}`;
        const cached = kanjiInfoNotesCache.get(cacheKey);
        if (cached) return cached;
        const workerApi = await workerApiContainer.promise;
        const result = await workerApi.queryShared({
          ankiFields: unwrap(initialAnkiFields),
          kanjiList: list,
        });
        const entries = Object.entries(result.kanjiResult) as [string, AnkiNote[]][];
        kanjiInfoNotesCache.set(cacheKey, entries);
        return entries;
      },
    );
    return $resource;
  }

  const $$visuallySimilar = createTypeResource("visuallySimilar");
  const $$composedOf = createTypeResource("composedOf");
  const $$usedIn = createTypeResource("usedIn");
  const $$related = createTypeResource("related");

  createEffect(() => {
    const kanji = $kanji();
    $setKanjiState("kanji", kanji);
    $setFetchFlags({
      visuallySimilar: false,
      composedOf: false,
      usedIn: false,
      related: false,
    });
  });

  return (
    <KanjiContext.Provider
      value={{
        $kanjiState,
        $setKanjiState,
        $kanji: $kanjiState,
        $setKanji: $setKanjiState,
        $$kanjiInfo,
        $fetchFlags,
        $setFetchFlags,
        $$visuallySimilar,
        $$composedOf,
        $$usedIn,
        $$related,
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
