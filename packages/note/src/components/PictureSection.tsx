import { createEffect, createMemo, createSignal, lazy, on, Show } from "solid-js";
import { isServer } from "solid-js/web";
import type { DatasetProp } from "#/src/lib/config";
import { parseHtml } from "#/src/lib/dom";
import { isNsfw } from "#/src/lib/util";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { usePictureModalTransition } from "#/src/hooks/transition";

const Lazy = {
  ArrowLeftIcon: lazy(async () => ({ default: (await import("#/src/lazy")).ArrowLeftIcon })),
};

export function PictureSection() {
  const { $card, $isInitialSide } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $ankiFields } = useAnkiFieldContext();
  const { $setPictureModal } = usePictureModalTransition();
  const [$clicked, $setClicked] = createSignal(false);
  const [$subIndex, $setSubIndex] = createSignal(0);

  const $pictures = createMemo(() => {
    if (isServer) return [];
    const doc = parseHtml($group().pictureField);
    return Array.from(doc.querySelectorAll("img")).map((img) => img.outerHTML);
  });

  const $currentPicture = createMemo(() => $pictures()[$subIndex()] || "");

  const $isNsfw = createMemo(() => isNsfw($ankiFields.Tags));

  const $pictureFieldDataset = createMemo<DatasetProp>(() => ({
    "data-transition": $card.ready ? "true" : undefined,
    "data-tags": isServer ? "{{Tags}}" : $ankiFields.Tags,
    "data-nsfw": $isNsfw() ? "true" : "false",
  }));

  const $dataSet1 = createMemo<DatasetProp>(() => ({
    "data-has-picture": isServer
      ? "{{#Picture}}true{{/Picture}}"
      : $ankiFields.Picture
        ? "true"
        : "",
  }));

  const $opacity = createMemo(() => {
    if ($clicked()) return 1;
    if (!$clicked() && $isInitialSide()) return undefined;
    if (!$clicked() && !$isInitialSide()) return 0;
  });

  createEffect(
    on(
      () => $group().pictureField,
      () => $setSubIndex(0),
    ),
  );

  createEffect(
    on(
      () => $isInitialSide(),
      () => $setClicked(false),
    ),
  );

  const next = (e: MouseEvent) => {
    e.stopPropagation();
    $setSubIndex((prev) => (prev + 1) % $pictures().length);
  };

  const prev = (e: MouseEvent) => {
    e.stopPropagation();
    $setSubIndex((prev) => (prev - 1 + $pictures().length) % $pictures().length);
  };

  return (
    <div
      class="sm:max-w-1/2 bg-base-200 sm:items-center rounded-lg relative overflow-hidden justify-center picture-field-container tappable"
      on:click={() => $setClicked((prev) => !prev)}
      on:touchend={(e) => e.stopPropagation()}
      {...$dataSet1()}
    >
      <div
        class="picture-field-background"
        style={{
          opacity: $opacity(),
        }}
        innerHTML={isServer ? undefined : $currentPicture()}
      >
        {isServer ? "{{Picture}}" : undefined}
      </div>
      <div
        class="picture-field tappable"
        style={{
          opacity: $opacity(),
        }}
        on:click={() => $setPictureModal($currentPicture())}
        on:touchend={(e) => e.stopPropagation()}
        {...$pictureFieldDataset()}
        innerHTML={isServer ? undefined : $currentPicture()}
      >
        {isServer ? "{{Picture}}" : undefined}
      </div>

      <Show when={$pictures().length > 1 && $card.ready}>
        <div class="absolute inset-y-0 left-0 right-0 flex justify-between pointer-events-none">
          <button
            type="button"
            class="h-full w-4 sm:w-6 cursor-pointer opacity-0 hover:opacity-100 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all flex items-center justify-center"
            on:click={prev}
            on:touchend={(e) => e.stopPropagation()}
          >
            <Lazy.ArrowLeftIcon class="size-3 sm:size-4 text-base-100"></Lazy.ArrowLeftIcon>
          </button>
          <button
            type="button"
            class="h-full w-4 sm:w-6 cursor-pointer opacity-0 hover:opacity-100 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all flex items-center justify-center"
            on:click={next}
            on:touchend={(e) => e.stopPropagation()}
          >
            <Lazy.ArrowLeftIcon class="size-3 sm:size-4 text-base-100 rotate-180"></Lazy.ArrowLeftIcon>
          </button>
        </div>
        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {$pictures().map((_, i) => (
            <div
              class="w-1.5 h-1.5 rounded-full bg-base-100/50 ring-1 ring-base-content/50"
              classList={{ "bg-primary": i === $subIndex() }}
            />
          ))}
        </div>
      </Show>
    </div>
  );
}
