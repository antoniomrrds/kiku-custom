import { createMemo, For, Show } from "solid-js";
import { ankiFieldsSkeleton } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";

export default function RelatedExpression() {
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

  return (
    <div class="flex gap-2 sm:gap-4 flex-wrap">
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
                "text-base-content-soft":
                  $ankiFields.CardID !== cardId && !$isFallbackRelatedExpression(),
                "text-base-content-faint":
                  $ankiFields.CardID !== cardId && $isFallbackRelatedExpression(),
                "text-base-content": $ankiFields.CardID === cardId,
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
