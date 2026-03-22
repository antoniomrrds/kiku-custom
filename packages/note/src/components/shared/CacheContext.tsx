import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import type { CacheStore } from "#/util/types";

const CacheContext = createContext<CacheStore | undefined>();

export function CacheContextProvider(props: {
  children: JSX.Element;
  cacheStore: CacheStore | undefined;
}) {
  return (
    <CacheContext.Provider value={props.cacheStore}>
      {props.children}
    </CacheContext.Provider>
  );
}

export function useCacheContext() {
  return useContext(CacheContext);
}

export type UseCacheContext = typeof useCacheContext;
