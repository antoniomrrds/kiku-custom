import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { ankiFieldsSkeleton, type AnkiNote } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { MoveDown } from "./Icons";
import { preloadImages } from "#/src/lib/dom";

const sortNote = (a: AnkiNote, b: AnkiNote) => b.noteId - a.noteId;

export default function RelatedExpression() {
  const { logger } = useGeneralContext();
  const { $card, $setCard, $initialSide } = useCardContext();
  const { $ankiFields, $setAnkiFields, resetAnkiFields, initialAnkiFields, $isInitialAnkiFields } =
    useAnkiFieldContext();
  const [$ref, $setRef] = createSignal<HTMLDivElement>();
  const $relatedExpression = createMemo(() => {
    if ($initialSide() === "front") {
      return [...($card.query.sameExpression ?? [])]
        .filter((v) => {
          return v.fields["ExpressionReading"].value !== initialAnkiFields.ExpressionReading;
        })
        .sort(sortNote);
    }

    const fallbackPriority1 = [
      ...($card.query.sameExpression ?? []),
      ...($card.query.sameReading ?? []),
      ...$card.query.noteList.flatMap((n) => {
        return n[1];
      }),
    ].sort(sortNote);

    const fallbackPriority2 = [
      ...($card.query.forms ?? []),
      ...($card.query.antonym ?? []),
      ...($card.query.referenced ?? []),
    ].sort(sortNote);

    if ($card.query.relatedExpression?.length) {
      if ($card.query.relatedExpression.length < 2) {
        return [...$card.query.relatedExpression, ...fallbackPriority2].slice(0, 2);
      }
      return $card.query.relatedExpression;
    }

    return [...fallbackPriority2, ...fallbackPriority1].slice(0, 2);
  });

  const isExplicitRelatedExpression = (note: AnkiNote) => {
    return $card.query.relatedExpression?.some((n) => n.noteId === note.noteId);
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
          if (audio instanceof HTMLAudioElement) audio.play();
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
      <Show when={$relatedExpression().length}>
        <div class="flex gap-px items-center">
          <MoveDown
            class="size-4 sm:size-5 text-base-content-faint"
            classList={{
              hidden: !$hasMultipleRows(),
            }}
          ></MoveDown>
          <button
            class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm"
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
            {initialAnkiFields.Expression}
          </button>
        </div>
      </Show>
      <For each={$relatedExpression()}>
        {(note) => {
          const cardId = note.cards[0]?.toString() ?? "";
          return (
            <button
              class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm"
              classList={{
                "text-base-content-soft underline underline-offset-5 decoration-1":
                  $ankiFields.CardID !== cardId && isExplicitRelatedExpression(note),
                "text-base-content-soft":
                  $ankiFields.CardID !== cardId && !isExplicitRelatedExpression(note),
                "text-base-content underline underline-offset-5 decoration-1":
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
            </button>
          );
        }}
      </For>
    </div>
  );
}
