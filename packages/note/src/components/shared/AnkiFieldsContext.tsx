import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import type { AnkiBackFields, AnkiFields, AnkiFrontFields } from "#/util/types";

const AnkiFieldsContext = createContext<{
  ankiFields: AnkiFields;
  noteId?: number;
}>();

export function AnkiFieldContextProvider(props: {
  children: JSX.Element;
  ankiFields: AnkiFields;
  noteId?: number;
}) {
  return (
    <AnkiFieldsContext.Provider
      value={{ ankiFields: props.ankiFields, noteId: props.noteId }}
    >
      {props.children}
    </AnkiFieldsContext.Provider>
  );
}

type useAnkiFieldType = {
  front: {
    ankiFields: AnkiFrontFields;
    noteId?: number;
  };
  back: {
    ankiFields: AnkiBackFields;
    noteId?: number;
  };
};

export function useAnkiFieldContext<T extends "front" | "back">() {
  const ankiField = useContext(AnkiFieldsContext);
  if (!ankiField) throw new Error("Missing AnkiFieldContext");
  return ankiField as useAnkiFieldType[T];
}

export type UseAnkiFieldContext = typeof useAnkiFieldContext;
