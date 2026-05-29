import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { isServer } from "solid-js/web";
import type { DatasetProp } from "#/lib/config";
import { parseHtml } from "#/lib/dom";
import { isNsfw } from "#/lib/util";
import { useAnkiFieldContext } from "./shared/AnkiFieldsContext";
import { useCardContext } from "./shared/CardContext";
import { useFieldGroupContext } from "./shared/FieldGroupContext";

export function PictureSection() {
  const { $card, $setCard } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $ankiFields } = useAnkiFieldContext();
  const [$clicked, $setClicked] = createSignal(false);
  const [$subIndex, $setSubIndex] = createSignal(0);

  const $pictures = createMemo(() => {
    if (isServer) return [];
    const doc = parseHtml($group.pictureField);
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

  createEffect(() => {
    $group.pictureField;
    $setSubIndex(0);
  });

  const next = (e: MouseEvent) => {
    e.stopPropagation();
    $setSubIndex((prev) => (prev + 1) % $pictures().length);
  };

  const prev = (e: MouseEvent) => {
    e.stopPropagation();
    $setSubIndex(
      (prev) => (prev - 1 + $pictures().length) % $pictures().length,
    );
  };

  return (
    <div
      class="sm:max-w-1/2 bg-base-200 flex sm:items-center rounded-lg relative overflow-hidden justify-center picture-field-container group/pic tappable"
      on:click={() => {
        $setClicked((prev) => !prev);
      }}
      on:touchend={(e) => e.stopPropagation()}
      {...$dataSet1()}
    >
      <div
        class="picture-field-background"
        style={{
          opacity: $clicked() ? 1 : undefined,
        }}
        innerHTML={isServer ? undefined : $currentPicture()}
      >
        {isServer ? "{{Picture}}" : undefined}
      </div>
      <div
        class="picture-field tappable"
        style={{
          opacity: $clicked() ? 1 : undefined,
        }}
        on:click={() => {
          $setCard("pictureModal", $currentPicture());
        }}
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
            class="h-full w-6 cursor-pointer hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all"
            on:click={prev}
            on:touchend={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            class="h-full w-6 cursor-pointer hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all"
            on:click={next}
            on:touchend={(e) => e.stopPropagation()}
          />
        </div>
        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-0 group-hover/pic:opacity-100 transition-opacity">
          {$pictures().map((_, i) => (
            <div
              class="w-1.5 h-1.5 rounded-full bg-base-100/50"
              classList={{ "bg-primary": i === $subIndex() }}
            />
          ))}
        </div>
      </Show>
    </div>
  );
}
