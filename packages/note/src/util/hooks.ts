import { createEffect, createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAnkiFieldContext } from "#/components/shared/AnkiFieldsContext";
import { useBreakpointContext } from "#/components/shared/BreakpointContext";
import { useCacheContext } from "#/components/shared/CacheContext";
import { useCardContext } from "#/components/shared/CardContext";
import { useConfigContext } from "#/components/shared/ConfigContext";
import { useGeneralContext } from "#/components/shared/GeneralContext";
import { createNex } from "#/worker/client";
import { constants, extractKanji, parseHtml, unique } from "./general";
import { getPitchPatternName, hatsuon } from "./hatsuon";
import type { DaisyUITheme } from "./theme";
import type { PitchType } from "./types";

export function useViewTransition() {
  const [$general] = useGeneralContext();
  function startViewTransition(
    callback: () => void,
    {
      beforeCallback,
    }: {
      beforeCallback?: () => void;
    } = {},
  ) {
    if (
      document.startViewTransition &&
      !$general.isAnkiDesktop &&
      !$general.isAnkiWeb
    ) {
      beforeCallback?.();
      return document.startViewTransition(callback);
    } else {
      callback();
    }
  }
  return startViewTransition;
}

export function useNavigationTransition() {
  const [$card, $setCard] = useCardContext();
  const bp = useBreakpointContext();
  const startViewTransition = useViewTransition();

  function navigate(
    destination: "main" | "settings" | "nested" | "kanji" | (() => void),
    direction: "back" | "forward",
    navigateBack?: () => void,
  ) {
    if (navigateBack) $setCard("navigateBack", (old) => [...old, navigateBack]);
    const start = () => {
      if (typeof destination === "function") {
        destination();
      } else {
        $setCard("page", destination);
      }
    };

    if (!bp.isAtLeast("sm")) {
      startViewTransition(start, {
        beforeCallback() {
          document.documentElement.dataset.transitionDirection = direction;
        },
      })?.finished.then(() => {
        // TODO: this callback is called too fast when naviating to nested card, not sure why.
        document.documentElement.removeAttribute("data-transition-direction");
      });
    } else {
      start();
    }
  }
  function navigateBack() {
    const last = $card.navigateBack[$card.navigateBack.length - 1];
    $setCard("navigateBack", (list) => list.slice(0, -1));
    last?.();
  }

  return { navigate, navigateBack };
}

export function usePitch() {
  const [$card, $setCard] = useCardContext();
  const { ankiFields } = useAnkiFieldContext<"back">();
  const [$general] = useGeneralContext();

  const pitchNumbers = createMemo(() => {
    const raw = ankiFields.PitchPosition;
    if (!raw) return [];
    const pitchPositionDoc = parseHtml(raw);
    const numbers = Array.from(pitchPositionDoc.querySelectorAll("span"))
      .map((el) => Number(el.innerText))
      .filter((value) => !Number.isNaN(value));
    const uniqueNumbers = unique(numbers);
    if (uniqueNumbers.length) {
      $general.logger.info("Detected pitch number:", uniqueNumbers);
    }
    return uniqueNumbers;
  });

  const reading = createMemo(() => {
    if ($card.nested) return ankiFields.ExpressionReading;
    return ankiFields.ExpressionFurigana
      ? ankiFields["kana:ExpressionFurigana"]
      : ankiFields.ExpressionReading;
  });

  const pitchInfos = createMemo(() => {
    const numbers = pitchNumbers();
    if (!numbers.length) return [];
    return numbers.map((pitchNum) => hatsuon({ reading: reading(), pitchNum }));
  });

  const pitchType = createMemo(() => {
    const info = pitchInfos()[0];
    if (!info) return undefined;
    return getPitchPatternName(
      info.morae.length,
      info.pitchNum,
      "EN",
    ) as PitchType;
  });

  createEffect(() => {
    $setCard("pitch", {
      infos: pitchInfos(),
      type: pitchType(),
    });
  });
}

export function useThemeTransition() {
  const [$config, $setConfig] = useConfigContext();
  const startViewTransition = useViewTransition();
  const [$card, $setCard] = useCardContext();

  function changeTheme(theme: DaisyUITheme) {
    if ($card.query.status === "loading") {
      $setConfig("theme", theme);
    } else {
      startViewTransition(() => $setConfig("theme", theme), {
        beforeCallback() {
          document.documentElement.dataset.themeTransition = "true";
        },
      })?.finished.then(() => {
        document.documentElement.removeAttribute("data-theme-transition");
      });
    }
  }
  return changeTheme;
}

export function useKanji() {
  const [$config] = useConfigContext();
  const [$card, $setCard] = useCardContext();
  const { ankiFields } = useAnkiFieldContext<"back">();
  const [$general, $setGeneral] = useGeneralContext();
  const cacheStore = useCacheContext();

  let set = false;
  async function setKanji() {
    set = true;
    try {
      const kanjiList = extractKanji(
        ankiFields.ExpressionFurigana
          ? $card.nested
            ? ankiFields.Expression
            : ankiFields["furigana:ExpressionFurigana"]
          : ankiFields.Expression,
      );
      const readingList = ankiFields.ExpressionReading
        ? [ankiFields.ExpressionReading]
        : [];
      const expressionList = ankiFields.Expression
        ? [ankiFields.Expression]
        : [];

      const opts = {
        env: constants,
        config: unwrap($config),
        assetsPath: import.meta.env.DEV ? "" : $general.assetsPath,
        preferAnkiConnect:
          $config.preferAnkiConnect && !!$general.isAnkiDesktop,
      };
      const nex = await createNex(opts, $general.logger, cacheStore?.nex);
      $general.nex.resolve(nex);
      if (cacheStore && !cacheStore.nex) {
        cacheStore.nex = nex;
      }
      const { kanjiResult, readingResult, expressionResult } =
        await nex.queryShared({
          kanjiList,
          readingList,
          ankiFields: unwrap(ankiFields),
          expressionList,
        });

      if ($general.aborter.signal.aborted) return;

      $setCard("query", {
        status: "success",
        noteList: Object.entries(kanjiResult),
        sameReading: readingResult[ankiFields.ExpressionReading],
        sameExpression: expressionResult[ankiFields.Expression],
      });

      nex
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
