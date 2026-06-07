import { createEffect, createMemo, For, on, Show } from "solid-js";
import { ankiFieldsSkeleton } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

export default function RelatedExpression() {
  const { $general } = useGeneralContext();
  const { $card, $setCard, $initialSide } = useCardContext();
  const { $ankiFields, $setAnkiFields, resetAnkiFields, initialAnkiFields } = useAnkiFieldContext();
  const $relatedExpression = createMemo(() => {
    if ($initialSide() === "front") {
      return [...($card.query.sameExpression ?? [])]
        .filter((v) => {
          return v.fields["ExpressionReading"].value !== initialAnkiFields.ExpressionReading;
        })
        .sort((a, b) => b.noteId - a.noteId);
    }

    if ($card.query.relatedExpression?.length) return $card.query.relatedExpression;
    return [
      ...($card.query.sameExpression ?? []),
      ...($card.query.sameReading ?? []),
      ...$card.query.noteList.flatMap((n) => {
        return n[1];
      }),
    ]
      .sort((a, b) => b.noteId - a.noteId)
      .slice(0, 2);
  });

  const $isFallbackRelatedExpression = createMemo(() => {
    return !$card.query.relatedExpression?.length;
  });

  const played = new Set<string>();
  createEffect(
    on(
      () => $ankiFields.CardID,
      () => {
        if ($ankiFields.CardID === initialAnkiFields.CardID) return;
        if (played.has($ankiFields.CardID)) return;
        played.add($ankiFields.CardID);
        const audio =
          $card.expressionAudioRef?.querySelector("a") ??
          $card.expressionAudioRef?.querySelector("audio");
        if (audio) {
          $general.logger.info("[RelatedExpression] autoPlay: expression");
          if (audio instanceof HTMLAnchorElement) audio.click();
          if (audio instanceof HTMLAudioElement) audio.play();
        } else {
          $general.logger.debug("[RelatedExpression] autoPlay: no expression audio to play");
        }
      },
      {
        defer: true,
      },
    ),
  );

  return (
    <div class="flex gap-x-2 sm:gap-x-4 flex-wrap">
      <Show when={$relatedExpression().length}>
        <button
          class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm"
          classList={{
            "text-base-content-soft": $ankiFields.CardID !== initialAnkiFields.CardID,
            "text-base-content": $ankiFields.CardID === initialAnkiFields.CardID,
          }}
          on:click={() => {
            resetAnkiFields();
            $setCard("side", $initialSide());
          }}
          on:touchend={(e) => e.stopPropagation()}
        >
          {initialAnkiFields.Expression}
        </button>
      </Show>
      <For each={$relatedExpression()}>
        {(note) => {
          // TODO: I'm not sure how to handle if the note has multiple cards
          const cardId = note.cards[0]?.toString() ?? "";
          return (
            <button
              class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm"
              classList={{
                "text-base-content-soft underline underline-offset-4":
                  $ankiFields.CardID !== cardId && !$isFallbackRelatedExpression(),
                "text-base-content-soft":
                  $ankiFields.CardID !== cardId && $isFallbackRelatedExpression(),
                "text-base-content underline underline-offset-4":
                  $ankiFields.CardID === cardId && !$isFallbackRelatedExpression(),
                "text-base-content":
                  $ankiFields.CardID === cardId && $isFallbackRelatedExpression(),
              }}
              on:click={() => {
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
