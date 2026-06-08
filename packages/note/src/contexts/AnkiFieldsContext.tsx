import { type Accessor, createContext, createMemo, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import type { AnkiFields } from "#/src/lib/types";

const AnkiFieldsContext = createContext<{
  $ankiFields: Store<AnkiFields>;
  $setAnkiFields: SetStoreFunction<AnkiFields>;
  $isRootAnkiFields: Accessor<boolean>;
  noteId?: number;
  initialAnkiFields: AnkiFields;
  resetAnkiFields: () => void;
}>();

export function AnkiFieldContextProvider(props: {
  children: JSX.Element;
  initialAnkiFields: AnkiFields;
  noteId?: number;
  isRoot?: boolean;
}) {
  const [$ankiFields, $setAnkiFields] = createStore<AnkiFields>({
    ...props.initialAnkiFields,
    __IS_ROOT__: props.isRoot ?? false,
  });
  const $isRootAnkiFields = createMemo(() => Boolean($ankiFields.__IS_ROOT__));
  const resetAnkiFields = () => {
    $setAnkiFields({ ...props.initialAnkiFields, __IS_ROOT__: props.isRoot });
  };

  return (
    <AnkiFieldsContext.Provider
      value={{
        noteId: props.noteId,
        $ankiFields,
        $setAnkiFields,
        $isRootAnkiFields,
        initialAnkiFields: props.initialAnkiFields,
        resetAnkiFields,
      }}
    >
      {props.children}
    </AnkiFieldsContext.Provider>
  );
}

export function useAnkiFieldContext() {
  const ankiField = useContext(AnkiFieldsContext);
  if (!ankiField) throw new Error("Missing AnkiFieldContext");
  return ankiField;
}

export type UseAnkiFieldContext = typeof useAnkiFieldContext;

const RootAnkiFieldsContext = createContext<{
  $ankiFields: Store<AnkiFields>;
  $setAnkiFields: SetStoreFunction<AnkiFields>;
  $isRootAnkiFields: Accessor<boolean>;
  noteId?: number;
  initialAnkiFields: AnkiFields;
  resetAnkiFields: () => void;
}>();

export function RootAnkiFieldsContextProvider(props: { children: JSX.Element }) {
  const value = useAnkiFieldContext();

  return (
    <RootAnkiFieldsContext.Provider value={value}>{props.children}</RootAnkiFieldsContext.Provider>
  );
}

export function useRootAnkiFieldsContext() {
  const value = useContext(RootAnkiFieldsContext);
  if (!value) throw new Error("Missing RootAnkiFieldsContext");
  return value;
}
