import { createEffect, createMemo, lazy, Match, on, onMount, Switch } from "solid-js";
import { isServer } from "solid-js/web";
import { CardStoreContextProvider, useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { isNsfw } from "#/src/lib/util";
import { useQueryNotes } from "#/src/hooks/query";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { useNavigationTransition } from "#/src/hooks/transition";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { AnkiFieldContextProvider, useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { CtxContextProvider } from "#/src/contexts/CtxContext";
import { FieldGroupContextProvider } from "#/src/contexts/FieldGroupContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { usePitch } from "#/src/hooks/pitch";
import { ExpressionSection } from "./ExpressionSection";

// oxfmt-ignore
const Lazy = {
  Settings: lazy(async () => ({ default: (await import("#/src/lazy")).Settings })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  BackFooter: lazy(async () => ({ default: (await import("#/src/lazy")).BackFooter })),
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  AudioElements: lazy(async () => ({ default: (await import("#/src/lazy")).AudioElements })),
  PictureModal: lazy(async () => ({ default: (await import("#/src/lazy")).PictureModal })),
  BackBody: lazy(async () => ({ default: (await import("#/src/lazy")).BackBody })),
  Pitches: lazy(async () => ({ default: (await import("#/src/lazy")).Pitches })),
  KanjiPage: lazy(async () => ({ default: (await import("#/src/lazy")).KanjiPage })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
  AnkiMobileDebug: lazy(async () => ({ default: (await import("#/src/lazy")).AnkiMobileDebug })),
  RelatedExpression: lazy(async () => ({ default: (await import("#/src/lazy")).RelatedExpression, })),
  Frequency: lazy(async () => ({ default: (await import("#/src/lazy")).Frequency })),
};

export function Back(props: { onExitNested?: () => void }) {
  const { navigateBack } = useNavigationTransition();
  const { $card, $setCard } = useCardContext();
  const { $ankiFields, $isInitialAnkiFields } = useAnkiFieldContext();
  const loadPlugin = useLoadPlugin();
  const { logger } = useGeneralContext();
  useQueryNotes();
  usePitch();

  onMount(() => {
    setTimeout(() => {
      $setCard("ready", true);
      logger.info("[Back] ready, expression:", $ankiFields.Expression);
      loadPlugin();
    }, 0);
  });

  createEffect(
    on(
      () => $card.page,
      () => $setCard("fadeInTopSection", true),
      { defer: true },
    ),
  );

  const $pitchFieldDataset = createMemo<DatasetProp>(() => ({
    "data-has-pitch": isServer
      ? "{{#PitchPosition}}true{{/PitchPosition}}"
      : $card.ready
        ? $ankiFields.PitchPosition
          ? "true"
          : ""
        : "",
  }));

  return (
    <>
      {$card.ready && !$card.nested && <Lazy.UseAnkiDroid />}
      <Switch>
        <Match when={$card.page === "settings" && $card.ready}>
          <Lazy.Settings />
        </Match>
        <Match when={$card.page === "kanji" && $card.ready}>
          <Lazy.KanjiPage />
        </Match>
        <Match when={$card.page === "nested" && $card.ready}>
          <AnkiFieldContextProvider
            initialAnkiFields={$card.nestedAnkiFields}
            noteId={$card.nestedNoteId}
          >
            <CardStoreContextProvider
              nested
              initialSide="back"
              isMergePreview={$card.nestedIsMergePreview}
              initialNsfw={isNsfw($card.nestedAnkiFields.Tags)}
            >
              <FieldGroupContextProvider>
                <CtxContextProvider>
                  <Back onExitNested={navigateBack} />
                </CtxContextProvider>
              </FieldGroupContextProvider>
            </CardStoreContextProvider>
          </AnkiFieldContextProvider>
        </Match>
        <Match when={$card.page === "main"}>
          {$card.ready && <Lazy.HeaderMain onExitNested={props.onExitNested} />}
          <div class="flex flex-col">
            <div class="flex justify-between gap-2 items-start mb-0.5 sm:mb-2">
              <div
                class="text-xl sm:text-2xl min-h-lh hover:h-auto overflow-hidden transition-[height] [interpolate-size:allow-keywords] w-full"
                classList={{
                  "h-lh": $isInitialAnkiFields(),
                  "h-auto": !$isInitialAnkiFields(),
                }}
              >
                {$card.ready && <Lazy.RelatedExpression />}
              </div>
              <div class="mt-1 min-w-20 flex justify-end">
                {$card.ready && <Lazy.Frequency />}
              </div>
            </div>
            <div
              class="flex rounded-lg gap-2 sm:gap-4 flex-col sm:flex-row relative z-10"
              classList={{
                "animate-fade-in": $card.fadeInTopSection,
              }}
            >
              <div class="flex-1 bg-base-200 p-4 rounded-lg flex flex-col items-center justify-center min-h-38 sm:min-h-56">
                <ExpressionSection />
                <div
                  class="mt-2 sm:mt-4 gap-4 pitch pitch-field min-h-lh"
                  {...$pitchFieldDataset()}
                >
                  {$ankiFields.PitchPosition && $card.ready && <Lazy.Pitches />}
                </div>
                <div class="hidden sm:block sm:h-8 sm:mt-2">
                  {$card.ready && (
                    <div class="animate-fade-in-sm flex gap-2">
                      <Lazy.AudioButtons position={1} />
                    </div>
                  )}
                </div>
              </div>
              <PictureSection />
            </div>
            {$card.ready && <FieldGroupPaginationSection />}
          </div>
          {$card.ready && <Lazy.BackBody />}
          {$card.ready && (
            <>
              <Lazy.BackFooter />
              <Lazy.AudioButtons position={2} />
            </>
          )}
        </Match>
      </Switch>
      {$card.ready && <Lazy.PictureModal />}
      {$card.ready && <Lazy.AudioElements />}
    </>
  );
}
