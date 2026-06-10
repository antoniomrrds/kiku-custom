import { createEffect, createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { constants } from "#/src/lib/contants";
import { extractKanji } from "#/src/lib/kana";
import { type AnkiNote, type Source } from "#/src/lib/types";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import { createWorkerApi } from "#/src/worker/client";

export function useQueryNotes() {
  const { $config } = useConfigContext();
  const { $card, $setCard, $initialSide } = useCardContext();
  const { initialAnkiFields, $isRootAnkiFields } = useAnkiFieldContext();
  const {
    $setGeneral,
    logger,
    assetsPath,
    isAnkiDesktop,
    workerPath,
    workerApi: workerApiContainer,
    aborter,
  } = useGeneralContext();
  const cacheStore = useCacheContext();

  let fetched = false;
  async function query() {
    fetched = true;
    try {
      const ankiFields = initialAnkiFields;
      const isFront = $initialSide() === "front";
      logger.info("[Kanji] setKanji start:", {
        expression: ankiFields.Expression,
        side: isFront ? "front" : "back",
      });
      const kanjiList = isFront
        ? []
        : extractKanji(
            ankiFields.ExpressionFurigana
              ? $isRootAnkiFields()
                ? ankiFields["furigana:ExpressionFurigana"]
                : ankiFields.Expression
              : ankiFields.Expression,
          );
      const readingList = isFront
        ? []
        : ankiFields.ExpressionReading
          ? [ankiFields.ExpressionReading]
          : [];
      const relatedExpressions = isFront
        ? []
        : parseRelatedExpression(ankiFields.RelatedExpression);
      const expressionList = [
        ...(ankiFields.Expression ? [ankiFields.Expression] : []),
        ...relatedExpressions,
      ];

      const opts = {
        constants,
        config: unwrap($config),
        assetsPath: import.meta.env.DEV ? "" : assetsPath,
        preferAnkiConnect: $config.preferAnkiConnect && isAnkiDesktop,
        workerPath,
      };
      const workerApi = await createWorkerApi(opts, logger, cacheStore?.workerApi);
      workerApiContainer.resolve(workerApi);
      if (cacheStore && !cacheStore.workerApi) {
        cacheStore.workerApi = workerApi;
      }

      let termInfo: Awaited<ReturnType<typeof workerApi.lookupTerm>> | undefined;
      if (!isFront && ankiFields.Expression) {
        termInfo = await workerApi.lookupTerm(ankiFields.Expression);
        //oxfmt-ignore
        if (termInfo) {
          const seen = new Set(expressionList);
          for (const f of termInfo.forms) if (!seen.has(f)) { seen.add(f); expressionList.push(f); }
          for (const a of termInfo.antonym) if (!seen.has(a)) { seen.add(a); expressionList.push(a); }
          for (const r of termInfo.referenced) if (!seen.has(r)) { seen.add(r); expressionList.push(r); }
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

      const currentExpressionResults = expressionResult[ankiFields.Expression] ?? [];
      const sameExpression = currentExpressionResults.filter(
        (n) => n.fields.Expression.value === ankiFields.Expression,
      );

      let formsResult: AnkiNote[] = [];
      let antonymResult: AnkiNote[] = [];
      let referencedResult: AnkiNote[] = [];
      if (termInfo) {
        formsResult = termInfo.forms.flatMap((f) => expressionResult[f] ?? []);
        antonymResult = termInfo.antonym.flatMap((a) => expressionResult[a] ?? []);
        referencedResult = termInfo.referenced.flatMap((r) => expressionResult[r] ?? []);
      }

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
        const incomingRelated = currentExpressionResults.filter(
          (n) => n.fields.Expression.value !== ankiFields.Expression,
        );
        const outgoingRelated = relatedExpressions.flatMap((e) => expressionResult[e] ?? []);

        const combinedRelated = [...incomingRelated, ...outgoingRelated];
        const uniqueRelated = Array.from(
          new Map(combinedRelated.map((n) => [n.noteId, n])).values(),
        );

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
    } catch (e) {
      $setCard("query", { status: "error" });
      logger.error("Failed to load kanji information:", e instanceof Error ? e.message : "");
    }
  }

  createEffect(() => {
    if (!fetched && $card.ready) query();
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
