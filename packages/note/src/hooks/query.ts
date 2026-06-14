import { createMemo, createResource, type Accessor } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { type CardStore } from "#/src/contexts/CardContext";
import { type AnkiNote } from "#/src/lib/types";
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
