import { createEffect, createMemo, For, on, Show } from "solid-js";
import { ankiFieldsSkeleton, type AnkiNote } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

const sortNote = (a: AnkiNote, b: AnkiNote) => b.noteId - a.noteId;

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
          const cardId = note.cards[0]?.toString() ?? "";
          return (
            <button
              class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm"
              classList={{
                "text-base-content-soft underline underline-offset-4":
                  $ankiFields.CardID !== cardId && isExplicitRelatedExpression(note),
                "text-base-content-soft":
                  $ankiFields.CardID !== cardId && !isExplicitRelatedExpression(note),
                "text-base-content underline underline-offset-4":
                  $ankiFields.CardID === cardId && isExplicitRelatedExpression(note),
                "text-base-content":
                  $ankiFields.CardID === cardId && !isExplicitRelatedExpression(note),
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
