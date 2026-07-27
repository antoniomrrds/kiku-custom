import {
  createEffect,
  createMemo,
  createSignal,
  ErrorBoundary,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import { ankiFieldsSkeleton, type AnkiNote } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { MoveDown } from "./Icons";
import { preloadImages } from "#/src/lib/dom";

const sortNote = (a: AnkiNote, b: AnkiNote) => b.noteId - a.noteId;

const dedupeByCardId = (notes: AnkiNote[]) => {
  const seen = new Set<string>();
  return notes.filter((note) => {
    const cardId = note.cards[0]?.toString() ?? "";
    if (seen.has(cardId)) return false;
    seen.add(cardId);
    return true;
  });
};

function $RelatedExpression() {
  const { logger } = useGeneralContext();
  const { $card, $setCard, $initialSide, $$card } = useCardContext();
  const { $config } = useConfigContext();
  const { $ankiFields, $setAnkiFields, resetAnkiFields, initialAnkiFields, $isInitialAnkiFields } =
    useAnkiFieldContext();
  const [$ref, $setRef] = createSignal<HTMLDivElement>();

  const $displayExpression = createMemo(() => {
    if ($initialSide() === "back") return initialAnkiFields.Expression;
    if (initialAnkiFields.IsSentenceCard || initialAnkiFields.IsAudioCard) return "?";
    return initialAnkiFields.Expression;
  });

  const $relatedExpression = createMemo(() => {
    const query = $$card();
    if (!query) return [];
    const excludeNewCards = $config.relatedExpressionExcludeNewCards;
    const newCardIds = new Set(query.newNotes.flatMap((n) => n.cards));

    // On front side, only show cards with the same expression but different reading
    if ($initialSide() === "front") {
      return [...(query.sameExpression ?? [])]
        .filter((v) => {
          if (excludeNewCards)
            return (
              !newCardIds.has(v.cards[0]) &&
              v.fields["ExpressionReading"].value !== initialAnkiFields.ExpressionReading
            );
          return v.fields["ExpressionReading"].value !== initialAnkiFields.ExpressionReading;
        })
        .sort(sortNote);
    }

    // Priority 1: same expression, same reading, same kanji
    let fallbackPriority1 = [
      ...(query.sameExpression ?? []),
      ...(query.sameReading ?? []),
      ...query.noteList.flatMap((n) => {
        return n[1];
      }),
    ];

    // Priority 2: forms, antonym, referenced
    let fallbackPriority2 = [
      ...(query.forms ?? []),
      ...(query.antonym ?? []),
      ...(query.referenced ?? []),
    ];

    // Priority 3: related expression
    let relatedExpression = query.relatedExpression;

    if (excludeNewCards) {
      fallbackPriority1 = fallbackPriority1.filter((v) => !newCardIds.has(v.cards[0]));
      fallbackPriority2 = fallbackPriority2.filter((v) => !newCardIds.has(v.cards[0]));
      relatedExpression = relatedExpression.filter((v) => !newCardIds.has(v.cards[0]));
    }

    if (!$config.relatedExpressionFallback) {
      fallbackPriority1 = [];
      fallbackPriority2 = [];
    }

    fallbackPriority1 = fallbackPriority1.sort(sortNote);
    fallbackPriority2 = fallbackPriority2.sort(sortNote);

    // If related expression is less than 2, fill with fallback priority 2 and 1
    if (relatedExpression?.length && relatedExpression.length < 2) {
      return dedupeByCardId([
        ...relatedExpression,
        ...fallbackPriority2,
        ...fallbackPriority1,
      ]).slice(0, 2);
    } else if (relatedExpression?.length && relatedExpression.length >= 2) {
      return dedupeByCardId(relatedExpression);
    } else {
      return dedupeByCardId([...fallbackPriority2, ...fallbackPriority1]).slice(0, 2);
    }
  });

  const $newNotes = createMemo(() => new Set($$card()?.newNotes.flatMap((n) => n.cards) ?? []));
  const $isNewNote = createMemo(() => $newNotes().has(Number(initialAnkiFields.CardID)));

  const isExplicitRelatedExpression = (note: AnkiNote) => {
    return $$card()?.relatedExpression?.some((n) => n.noteId === note.noteId) ?? false;
  };

  createEffect(
    on(
      () => $relatedExpression(),
      (notes) => {
        notes.forEach((note) => preloadImages(note.fields.Picture.value));
      },
      { defer: true },
    ),
  );

  const played = new Set<string>();
  createEffect(
    on(
      () => $ankiFields.CardID,
      () => {
        if ($isInitialAnkiFields()) return;
        if (played.has($ankiFields.CardID)) return;
        played.add($ankiFields.CardID);
        const audio =
          $card.expressionAudioRef?.querySelector("a") ??
          $card.expressionAudioRef?.querySelector("audio");
        if (audio) {
          logger.info("[RelatedExpression] autoPlay: expression");
          if (audio instanceof HTMLAnchorElement) audio.click();
          if (audio instanceof HTMLAudioElement) void audio.play();
        } else {
          logger.debug("[RelatedExpression] autoPlay: no expression audio to play");
        }
      },
      {
        defer: true,
      },
    ),
  );

  const [$hasMultipleRows, $setHasMultipleRows] = createSignal(false);

  onMount(() => {
    const ref = $ref();
    if (!ref) return;
    const observer = new ResizeObserver(() => {
      if (ref.children.length <= 1) {
        $setHasMultipleRows(false);
        return;
      }
      const children = Array.from(ref.children) as HTMLElement[];
      const firstTop = children[0].offsetTop;
      $setHasMultipleRows(children.some((child) => child.offsetTop > firstTop));
    });
    observer.observe(ref);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div ref={$setRef} class="flex gap-x-2 sm:gap-x-4 flex-wrap relative">
      <Show when={$relatedExpression().length || $isNewNote()}>
        <div class="flex gap-px items-center">
          <MoveDown
            class="size-4 sm:size-5 text-base-content-faint"
            classList={{
              hidden: !$hasMultipleRows(),
            }}
          ></MoveDown>
          <button
            class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm indicator"
            classList={{
              "text-base-content-soft": !$isInitialAnkiFields(),
              "text-base-content": $isInitialAnkiFields(),
            }}
            on:click={() => {
              $setCard("fadeInTopSection", false);
              resetAnkiFields();
              $setCard("side", $initialSide());
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            {$displayExpression()}
            <Show when={$isNewNote()}>
              <span class="status status-info"></span>
            </Show>
          </button>
        </div>
      </Show>
      <For each={$relatedExpression()}>
        {(note) => {
          const cardId = note.cards[0]?.toString() ?? "";
          const isNew = $newNotes().has(Number(cardId));
          return (
            <button
              class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm indicator"
              classList={{
                "text-base-content-soft underline underline-offset-4 sm:underline-offset-5 decoration-1":
                  $ankiFields.CardID !== cardId && isExplicitRelatedExpression(note),
                "text-base-content-soft":
                  $ankiFields.CardID !== cardId && !isExplicitRelatedExpression(note),
                "text-base-content underline underline-offset-4 sm:underline-offset-5 decoration-1":
                  $ankiFields.CardID === cardId && isExplicitRelatedExpression(note),
                "text-base-content":
                  $ankiFields.CardID === cardId && !isExplicitRelatedExpression(note),
              }}
              on:click={() => {
                $setCard("fadeInTopSection", false);
                $setAnkiFields({
                  ...ankiFieldsSkeleton,
                  ...Object.fromEntries(
                    Object.entries(note.fields).map(([key, value]) => {
                      return [key, value.value];
                    }),
                  ),
                  CardID: cardId,
                  Tags: note.tags.join(" "),
                  __IS_ROOT__: false,
                });
                $setCard("side", "back");
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              {$initialSide() === "front"
                ? note.fields.ExpressionReading.value
                : note.fields.Expression.value}
              <Show when={isNew}>
                <span class="status status-info"></span>
              </Show>
            </button>
          );
        }}
      </For>
    </div>
  );
}

export function RelatedExpression() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <$RelatedExpression />
      </Suspense>
    </ErrorBoundary>
  );
}
