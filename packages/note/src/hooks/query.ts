import { createEffect, createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { extractKanji } from "#/src/lib/kana";
import { type AnkiNote, type Source, type TermInfo } from "#/src/lib/types";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import { useWorker } from "./worker";

export function useQueryNotes() {
  const { $card, $setCard, $initialSide } = useCardContext();
  const { initialAnkiFields: ankiFields, $isRootAnkiFields } = useAnkiFieldContext();
  const { $setGeneral, logger, aborter } = useGeneralContext();
  const { getWorker } = useWorker();

  const $isFront = createMemo(() => $initialSide() === "front");
  const $kanjiList = createMemo(() => {
    if ($isFront()) return [];
    return extractKanji(
      ankiFields.ExpressionFurigana
        ? $isRootAnkiFields()
          ? ankiFields["furigana:ExpressionFurigana"]
          : ankiFields.Expression
        : ankiFields.Expression,
    );
  });
  const $readingList = createMemo(() => {
    if ($isFront()) return [];
    return ankiFields.ExpressionReading ? [ankiFields.ExpressionReading] : [];
  });
  const $relatedExpressions = createMemo(() => {
    if ($isFront()) return [];
    return parseRelatedExpression(ankiFields.RelatedExpression);
  });
  const $expressionList = createMemo(() => {
    return [...(ankiFields.Expression ? [ankiFields.Expression] : []), ...$relatedExpressions()];
  });

  async function query() {
    const isFront = $isFront();
    const kanjiList = $kanjiList();
    const readingList = $readingList();
    const relatedExpressions = $relatedExpressions();
    let expressionList = $expressionList();

    logger.info("[Kanji] setKanji start:", {
      expression: ankiFields.Expression,
      side: isFront ? "front" : "back",
    });
    const workerApi = await getWorker();
    if (aborter.signal.aborted) return;

    let termInfo: TermInfo | undefined;
    if (!isFront && ankiFields.Expression) {
      termInfo = await workerApi.lookupTerm(ankiFields.Expression);
      if (aborter.signal.aborted) return;
      if (termInfo) {
        expressionList = [
          ...new Set([
            ...expressionList,
            ...termInfo.forms,
            ...termInfo.antonym,
            ...termInfo.referenced,
          ]),
        ];
      }
    }

    const { kanjiResult, readingResult, expressionResult, newNotes, isNotesCache } =
      await workerApi.queryShared({
        kanjiList,
        readingList,
        ankiFields: unwrap(ankiFields),
        expressionList,
        withNewNotes: !isFront,
      });
    if (aborter.signal.aborted) return;

    const thisExpressionResults = expressionResult[ankiFields.Expression] ?? [];
    const sameExpression = thisExpressionResults.filter(
      (n) => n.fields.Expression.value === ankiFields.Expression,
    );

    if (isFront) {
      $setCard("query", {
        status: "success",
        noteList: [],
        sameReading: [],
        sameExpression,
        relatedExpression: [],
        forms: [],
        antonym: [],
        referenced: [],
        newNotes,
        isNotesCache,
      });
    } else {
      const incomingRelated = thisExpressionResults.filter(
        (n) => n.fields.Expression.value !== ankiFields.Expression,
      );
      const outgoingRelated = relatedExpressions.flatMap((e) => expressionResult[e] ?? []);
      const combinedRelated = [...incomingRelated, ...outgoingRelated];
      const uniqueRelated = Array.from(new Map(combinedRelated.map((n) => [n.noteId, n])).values());

      let formsResult: AnkiNote[] = [];
      let antonymResult: AnkiNote[] = [];
      let referencedResult: AnkiNote[] = [];
      const termInfoFlatMapCb = (expression: string) => {
        const result = expressionResult[expression] ?? [];
        return result.filter((n) => n.fields.Expression.value === expression);
      };
      if (termInfo) {
        formsResult = termInfo.forms.flatMap(termInfoFlatMapCb);
        antonymResult = termInfo.antonym.flatMap(termInfoFlatMapCb);
        referencedResult = termInfo.referenced.flatMap(termInfoFlatMapCb);
      }

      $setCard("query", {
        status: "success",
        noteList: Object.entries(kanjiResult),
        sameReading: readingResult[ankiFields.ExpressionReading],
        sameExpression,
        relatedExpression: uniqueRelated,
        forms: formsResult,
        antonym: antonymResult,
        referenced: referencedResult,
        newNotes,
        isNotesCache,
      });
    }

    logger.info("[Kanji] setKanji done:", {
      kanji: Object.keys(kanjiResult).length,
      reading: Object.keys(readingResult).length,
      expression: Object.keys(expressionResult).length,
      sameExpression: sameExpression.length,
      newNotes: newNotes.length,
    });

    workerApi
      .notesManifest()
      .then((manifest) => $setGeneral("notesManifest", manifest))
      .catch(() => {
        logger.warn("Failed to load manifest");
      });
  }

  let fetched = false;
  function startQuery() {
    fetched = true;
    try {
      query();
    } catch (e) {
      $setCard("query", { status: "error" });
      logger.error("Failed to load kanji information:", e instanceof Error ? e.message : "");
    }
  }

  createEffect(() => {
    if (!fetched && $card.ready) startQuery();
  });
}

export function useRelatedItems() {
  const { $card } = useCardContext();
  const { initialAnkiFields } = useAnkiFieldContext();

  return createMemo(() => {
    const currentExpression = initialAnkiFields.Expression;
    const noteMap = new Map<number, { note: AnkiNote; sources: Source[] }>();

    for (const note of $card.query.relatedExpression ?? []) {
      if (!noteMap.has(note.noteId)) noteMap.set(note.noteId, { note, sources: ["related"] });
    }
    for (const note of $card.query.forms ?? []) {
      if (note.fields.Expression.value === currentExpression) continue;
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "forms"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["forms"] });
      }
    }
    for (const note of $card.query.antonym ?? []) {
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "antonym"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["antonym"] });
      }
    }
    for (const note of $card.query.referenced ?? []) {
      const existing = noteMap.get(note.noteId);
      if (existing) {
        existing.sources = [...new Set<Source>([...existing.sources, "referenced"])];
      } else {
        noteMap.set(note.noteId, { note, sources: ["referenced"] });
      }
    }

    return [...noteMap.values()];
  });
}
