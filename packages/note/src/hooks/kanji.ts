import { createEffect } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { constants } from "#/src/lib/contants";
import { createWorkerApi } from "#/src/worker/client";
import { extractKanji } from "#/src/lib/kana";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";

export function useKanji() {
  const { $config } = useConfigContext();
  const { $card, $setCard } = useCardContext();
  const { $ankiFields, $isRootAnkiFields } = useAnkiFieldContext<"back">();
  const { $general, $setGeneral } = useGeneralContext();
  const cacheStore = useCacheContext();

  let set = false;
  async function setKanji() {
    set = true;
    try {
      const ankiFields = unwrap($ankiFields);
      const kanjiList = extractKanji(
        ankiFields.ExpressionFurigana
          ? $isRootAnkiFields()
            ? ankiFields["furigana:ExpressionFurigana"]
            : ankiFields.Expression
          : ankiFields.Expression,
      );
      const readingList = ankiFields.ExpressionReading ? [ankiFields.ExpressionReading] : [];
      const relatedExpressions = parseRelatedExpression(ankiFields.RelatedExpression);
      const expressionList = [
        ...(ankiFields.Expression ? [ankiFields.Expression] : []),
        ...relatedExpressions,
      ];

      const opts = {
        constants,
        config: unwrap($config),
        assetsPath: import.meta.env.DEV ? "" : $general.assetsPath,
        preferAnkiConnect: $config.preferAnkiConnect && $general.isAnkiDesktop,
        workerPath: $general.workerPath,
      };
      const workerApi = await createWorkerApi(opts, $general.logger, cacheStore?.workerApi);
      $general.workerApi.resolve(workerApi);
      if (cacheStore && !cacheStore.workerApi) {
        cacheStore.workerApi = workerApi;
      }
      const { kanjiResult, readingResult, expressionResult } = await workerApi.queryShared({
        kanjiList,
        readingList,
        ankiFields: unwrap(ankiFields),
        expressionList,
      });

      if ($general.aborter.signal.aborted) return;

      const currentExpressionResults = expressionResult[ankiFields.Expression] ?? [];
      const sameExpression = currentExpressionResults.filter(
        (n) => n.fields.Expression.value === ankiFields.Expression,
      );
      const incomingRelated = currentExpressionResults.filter(
        (n) => n.fields.Expression.value !== ankiFields.Expression,
      );
      const outgoingRelated = relatedExpressions.flatMap((e) => expressionResult[e] ?? []);

      const combinedRelated = [...incomingRelated, ...outgoingRelated];
      const uniqueRelated = Array.from(new Map(combinedRelated.map((n) => [n.noteId, n])).values());

      $setCard("query", {
        status: "success",
        noteList: Object.entries(kanjiResult),
        sameReading: readingResult[ankiFields.ExpressionReading],
        sameExpression,
        relatedExpression: uniqueRelated,
      });

      workerApi
        .notesManifest()
        .then((manifest) => $setGeneral("notesManifest", manifest))
        .catch(() => {
          $general.logger.warn("Failed to load manifest");
        });
    } catch (e) {
      $setCard("query", { status: "error" });
      $general.logger.error(
        "Failed to load kanji information:",
        e instanceof Error ? e.message : "",
      );
    }
  }

  createEffect(() => {
    if (!set && $card.ready) {
      setKanji();
    }
  });
}
