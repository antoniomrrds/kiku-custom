import { createMemo, createResource, type Accessor } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext, type CardStore } from "#/src/contexts/CardContext";
import { type AnkiNote, type Source } from "#/src/lib/types";
import { type Store, unwrap } from "solid-js/store";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { extractKanji } from "#/src/lib/kana";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import { useWorker } from "./worker";

export function useCardQuery({
  $initialSide,
  $card,
}: {
  $initialSide: Accessor<CardStore["side"]>;
  $card: Store<CardStore>;
}) {
  const { aborter } = useGeneralContext();
  const { initialAnkiFields: ankiFields, $isRootInitialAnkiFields } = useAnkiFieldContext();
  const { getWorker } = useWorker();

  const $expression = createMemo(() => ankiFields.Expression);
  const $expressionReading = createMemo(() => ankiFields.ExpressionReading);
  const $isFront = createMemo(() => $initialSide() === "front");
  const $kanjiList = createMemo(() => {
    const isRoot = $isRootInitialAnkiFields();
    const isFront = $isFront();
    if (isFront) return [];
    return extractKanji(
      ankiFields.ExpressionFurigana
        ? isRoot
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

  const [$$termInfo] = createResource(
    () => {
      if (!$card.ready) return undefined;
      if ($isFront()) return undefined;
      return {
        expression: $expression(),
      };
    },
    async ({ expression }) => {
      const workerApi = await getWorker();
      if (aborter.signal.aborted) return;
      return await workerApi.lookupTerm(expression);
    },
  );

  const [$$card] = createResource(
    () => {
      if (!$card.ready) return undefined;
      if ($$termInfo.loading) return undefined;
      return {
        isFront: $isFront(),
        expression: $expression(),
        expressionReading: $expressionReading(),
        kanjiList: $kanjiList(),
        readingList: $readingList(),
        relatedExpressions: $relatedExpressions(),
        expressionList: $expressionList(),
      };
    },
    async ({
      isFront,
      expression,
      expressionReading,
      kanjiList,
      readingList,
      relatedExpressions,
      expressionList,
    }) => {
      const workerApi = await getWorker();
      if (aborter.signal.aborted) return;

      const termInfo = $$termInfo.state === "errored" ? undefined : $$termInfo();
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

      const { kanjiResult, readingResult, expressionResult, newNotes, isNotesCache } =
        await workerApi.queryShared({
          kanjiList,
          readingList,
          ankiFields: unwrap(ankiFields),
          expressionList,
          withNewNotes: !isFront,
        });
      if (aborter.signal.aborted) return;

      const thisExpressionResults = expressionResult[expression] ?? [];
      const sameExpression = thisExpressionResults.filter(
        (n) => n.fields.Expression.value === expression,
      );

      let noteList: [string, AnkiNote[]][] = [];
      let sameReading: AnkiNote[] = [];
      let relatedExpression: AnkiNote[] = [];
      let forms: AnkiNote[] = [];
      let antonym: AnkiNote[] = [];
      let referenced: AnkiNote[] = [];

      if (!isFront) {
        noteList = Object.entries(kanjiResult);
        sameReading = readingResult[expressionReading] ?? [];

        const incomingRelated = thisExpressionResults.filter(
          (n) => n.fields.Expression.value !== expression,
        );
        const outgoingRelated = relatedExpressions.flatMap((e) => expressionResult[e] ?? []);
        const combinedRelated = [...incomingRelated, ...outgoingRelated];
        relatedExpression = Array.from(new Map(combinedRelated.map((n) => [n.noteId, n])).values());

        const termInfoFlatMapCb = (expression: string) => {
          const result = expressionResult[expression] ?? [];
          return result.filter((n) => n.fields.Expression.value === expression);
        };
        if (termInfo) {
          forms = termInfo.forms.flatMap(termInfoFlatMapCb);
          antonym = termInfo.antonym.flatMap(termInfoFlatMapCb);
          referenced = termInfo.referenced.flatMap(termInfoFlatMapCb);
        }
      }

      return {
        noteList,
        sameReading,
        sameExpression,
        relatedExpression,
        forms,
        antonym,
        referenced,
        newNotes,
        isNotesCache,
      };
    },
  );

  return { $$card };
}

export type $$Card = ReturnType<typeof useCardQuery>["$$card"];

export function useRelatedItems() {
  const { $$card } = useCardContext();
  const { initialAnkiFields } = useAnkiFieldContext();

  const $$relatedItems = createMemo(() => {
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

  return { $$relatedItems };
}
