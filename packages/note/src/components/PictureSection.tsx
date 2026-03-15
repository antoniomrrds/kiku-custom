import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { isServer } from "solid-js/web";
import type { DatasetProp } from "#/util/config";
import { parseHtml } from "#/util/general";
import { ArrowLeftIcon } from "./_kiku_lazy/Icons";
import { useAnkiFieldContext } from "./shared/AnkiFieldsContext";
import { useCardContext } from "./shared/CardContext";
import { useFieldGroupContext } from "./shared/FieldGroupContext";

export function PictureSection() {
  const [$card, $setCard] = useCardContext();
  const { $group } = useFieldGroupContext();
  const { ankiFields } = useAnkiFieldContext();
  const [clicked, setClicked] = createSignal(false);
  const [subIndex, setSubIndex] = createSignal(0);

  const pictures = createMemo(() => {
    if (isServer) return [];
    const doc = parseHtml($group.pictureField);
    return Array.from(doc.querySelectorAll("img")).map((img) => img.outerHTML);
  });

  createEffect(() => {
    $group.pictureField;
    setSubIndex(0);
  });

  const currentPicture = () => pictures()[subIndex()] || "";

  const pictureFieldDataset: () => DatasetProp = () => ({
    "data-transition": $card.ready ? "true" : undefined,
    "data-tags": "{{Tags}}",
    "data-nsfw": $card.isNsfw ? "true" : "false",
  });

  const dataSet1: () => DatasetProp = () => ({
    "data-has-picture": isServer
      ? "{{#Picture}}true{{/Picture}}"
      : ankiFields.Picture
        ? "true"
        : "",
  });

  const next = (e: MouseEvent) => {
    e.stopPropagation();
    setSubIndex((prev) => (prev + 1) % pictures().length);
  };

  const prev = (e: MouseEvent) => {
    e.stopPropagation();
    setSubIndex((prev) => (prev - 1 + pictures().length) % pictures().length);
  };

  return (
    <div
      class="sm:max-w-1/2 bg-base-200 flex sm:items-center rounded-lg relative overflow-hidden justify-center picture-field-container group/pic"
      on:click={() => {
        setClicked((prev) => !prev);
      }}
      {...dataSet1()}
    >
      <div
        class="picture-field-background"
        style={{
          opacity: clicked() ? 1 : undefined,
        }}
        innerHTML={isServer ? undefined : currentPicture()}
      >
        {isServer ? "{{Picture}}" : undefined}
      </div>
      <div
        class="picture-field"
        style={{
          opacity: clicked() ? 1 : undefined,
        }}
        on:click={() => {
          $setCard("pictureModal", currentPicture());
        }}
        {...pictureFieldDataset()}
        innerHTML={isServer ? undefined : currentPicture()}
      >
        {isServer ? "{{Picture}}" : undefined}
      </div>

      <Show when={pictures().length > 1}>
        <div class="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/pic:opacity-100 transition-opacity pointer-events-none">
          <button
            class="btn btn-circle btn-xs btn-ghost bg-base-100/50 backdrop-blur pointer-events-auto"
            on:click={prev}
          >
            <ArrowLeftIcon class="w-4 h-4" />
          </button>
          <button
            class="btn btn-circle btn-xs btn-ghost bg-base-100/50 backdrop-blur pointer-events-auto"
            on:click={next}
          >
            <ArrowLeftIcon class="w-4 h-4 rotate-180" />
          </button>
        </div>
        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-0 group-hover/pic:opacity-100 transition-opacity">
          {pictures().map((_, i) => (
            <div
              class="w-1.5 h-1.5 rounded-full bg-base-100/50 backdrop-blur"
              classList={{ "bg-primary": i === subIndex() }}
            />
          ))}
        </div>
      </Show>
    </div>
  );
}
