import {
  createComputed,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  getOwner,
  type JSX,
  lazy,
  onCleanup,
  onMount,
  runWithOwner,
  untrack,
  useContext,
} from "solid-js";
import h from "solid-js/h";
import html from "solid-js/html";
import { createStore, unwrap } from "solid-js/store";
import { Match, Portal, Show, Suspense, Switch } from "solid-js/web";
import type { Ctx } from "#/plugins/plugin-types";
import { useAnkiFieldContext } from "./AnkiFieldsContext";
import { useBreakpointContext } from "./BreakpointContext";
import { useCardContext } from "./CardContext";
import { useConfigContext } from "./ConfigContext";
import { useGeneralContext } from "./GeneralContext";

const CtxContext = createContext<Ctx>();

export function CtxContextProvider(props: { children: JSX.Element }) {
  const { $ankiFields } = useAnkiFieldContext();
  const ctx: Ctx = {
    h,
    html,
    createSignal,
    createEffect,
    createMemo,
    createResource,
    createComputed,
    onMount,
    onCleanup,
    createContext,
    useContext,
    lazy,
    ErrorBoundary,
    For,
    Portal,
    Show,
    Suspense,
    Switch,
    Match,
    untrack,
    runWithOwner,
    getOwner,
    createStore,
    // ankiFields is deprecated, use $ankiFields instead
    ankiFields: unwrap($ankiFields),
    $ankiFields,
    useAnkiFieldContext,
    useBreakpointContext,
    useCardContext,
    useConfigContext,
    useGeneralContext,
  };

  return <CtxContext.Provider value={ctx}>{props.children}</CtxContext.Provider>;
}

export function useCtxContext() {
  const ctx = useContext(CtxContext);
  if (!ctx) throw new Error("Missing CtxContext");
  return ctx;
}
