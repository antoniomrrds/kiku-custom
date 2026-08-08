import { createMemo } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { type AnkiNote, type Source } from "#/src/lib/types";

export function useRelatedNotes() {
  const { $$card } = useCardContext();
  const { initialAnkiFields } = useAnkiFieldContext();

  const $$relatedNotes = createMemo(() => {
    const currentExpression = initialAnkiFields.Expression;
    const noteMap = new Map<number, { note: AnkiNote; sources: Source[] }>();
    const query = $$card();

    if (!query) return [];

    for (const note of query.relatedExpression) {
      if (!noteMap.has(note.noteId)) noteMap.set(note.noteId, { note, sources: ["related"] });
    }
    for (const note of query.forms) {
      if (note.fields.Expression.value === currentExpression) continue;
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "forms"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["forms"] });
      }
    }
    for (const note of query.antonym) {
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "antonym"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["antonym"] });
      }
    }
    for (const note of query.referenced) {
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "referenced"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["referenced"] });
      }
    }

    return [...noteMap.values()];
  });

  return { $$relatedNotes };
}
