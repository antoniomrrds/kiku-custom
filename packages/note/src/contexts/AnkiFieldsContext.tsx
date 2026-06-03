import { type Accessor, createContext, createMemo, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import type { AnkiFields, AnkiFrontFields } from "#/src/lib/types";

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

type UseAnkiFieldSide = {
  front: {
    $ankiFields: Store<AnkiFrontFields>;
    $setAnkiFields: SetStoreFunction<AnkiFields>;
    $isRootAnkiFields: Accessor<boolean>;
    noteId?: number;
    initialAnkiFields: AnkiFrontFields;
    resetAnkiFields: () => void;
  };
  back: {
    $ankiFields: Store<AnkiFields>;
    $setAnkiFields: SetStoreFunction<AnkiFields>;
    $isRootAnkiFields: Accessor<boolean>;
    noteId?: number;
    initialAnkiFields: AnkiFields;
    resetAnkiFields: () => void;
  };
};

export function useAnkiFieldContext<T extends "front" | "back">() {
  const ankiField = useContext(AnkiFieldsContext);
  if (!ankiField) throw new Error("Missing AnkiFieldContext");
  return ankiField as UseAnkiFieldSide[T];
}

export type UseAnkiFieldContext = typeof useAnkiFieldContext;
