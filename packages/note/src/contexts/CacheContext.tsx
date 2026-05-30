import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import type { CacheStore } from "#/lib/types";

const CacheContext = createContext<CacheStore>();

export function CacheContextProvider(props: { children: JSX.Element; cacheStore: CacheStore }) {
  props.cacheStore.lookupKanji ??= new Map();
  props.cacheStore.queryShared ??= new Map();

  return <CacheContext.Provider value={props.cacheStore}>{props.children}</CacheContext.Provider>;
}

export function useCacheContext() {
  const cacheStore = useContext(CacheContext);
  if (!cacheStore) throw new Error("Missing CacheContext");
  return cacheStore;
}

export type UseCacheContext = typeof useCacheContext;
