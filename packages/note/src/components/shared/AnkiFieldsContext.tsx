import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import type { AnkiFields, AnkiFrontFields } from "#/util/types";

const AnkiFieldsContext = createContext<{
  $ankiFields: Store<AnkiFields>;
  $setAnkiFields: SetStoreFunction<AnkiFields>;
  noteId?: number;
}>();

export function AnkiFieldContextProvider(props: {
  children: JSX.Element;
  ankiFields: AnkiFields;
  noteId?: number;
}) {
  const [$ankiFields, $setAnkiFields] = createStore<AnkiFields>(
    props.ankiFields,
  );

  return (
    <AnkiFieldsContext.Provider
      value={{
        noteId: props.noteId,
        $ankiFields,
        $setAnkiFields,
      }}
    >
      {props.children}
    </AnkiFieldsContext.Provider>
  );
}

type UseAnkiFieldSide = {
  front: {
    noteId?: number;
    $ankiFields: Store<AnkiFrontFields>;
    $setAnkiFields: SetStoreFunction<AnkiFrontFields>;
  };
  back: {
    noteId?: number;
    $ankiFields: Store<AnkiFields>;
    $setAnkiFields: SetStoreFunction<AnkiFields>;
  };
};

export function useAnkiFieldContext<T extends "front" | "back">() {
  const ankiField = useContext(AnkiFieldsContext);
  if (!ankiField) throw new Error("Missing AnkiFieldContext");
  return ankiField as UseAnkiFieldSide[T];
}

export type UseAnkiFieldContext = typeof useAnkiFieldContext;
