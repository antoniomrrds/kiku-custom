import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { parseHtml } from "#/util/general";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { ArrowLeftIcon } from "./Icons";

export default function DefinitionPictureSection(props: {
  onDefinitionPictureClick?: (picture: string) => void;
}) {
  const { ankiFields } = useAnkiFieldContext<"back">();

  const definitionPictures = createMemo(() => {
    if (isServer) return [];
    const doc = parseHtml(ankiFields.DefinitionPicture);
    return Array.from(doc.querySelectorAll("img")).map((img) => img.outerHTML);
  });

  const [defPicIndex, setDefPicIndex] = createSignal(0);

  createEffect(() => {
    // Reset index when field changes
    ankiFields.DefinitionPicture;
    setDefPicIndex(0);
  });

  const currentDefPic = () => definitionPictures()[defPicIndex()] || "";

  return (
    <Show when={definitionPictures().length > 0}>
      <div
        class="max-w-1/3 float-right [&_img]:rounded-sm px-2 cursor-pointer relative group/defpic"
        on:click={() => {
          const picture = currentDefPic();
          if (picture) props.onDefinitionPictureClick?.(picture);
        }}
      >
        <div innerHTML={currentDefPic()}></div>

        <Show when={definitionPictures().length > 1}>
          <div class="absolute inset-0 flex items-center justify-between p-3 opacity-0 group-hover/defpic:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              class="btn btn-circle btn-xs btn-ghost bg-base-100/50 backdrop-blur pointer-events-auto"
              on:click={(e) => {
                e.stopPropagation();
                setDefPicIndex(
                  (prev) =>
                    (prev - 1 + definitionPictures().length) %
                    definitionPictures().length,
                );
              }}
            >
              <ArrowLeftIcon class="w-3 h-3" />
            </button>
            <button
              type="button"
              class="btn btn-circle btn-xs btn-ghost bg-base-100/50 backdrop-blur pointer-events-auto"
              on:click={(e) => {
                e.stopPropagation();
                setDefPicIndex(
                  (prev) => (prev + 1) % definitionPictures().length,
                );
              }}
            >
              <ArrowLeftIcon class="w-3 h-3 rotate-180" />
            </button>
          </div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none opacity-0 group-hover/defpic:opacity-100 transition-opacity">
            <For each={definitionPictures()}>
              {(_, i) => (
                <div
                  class="w-1 h-1 rounded-full bg-base-100/50 backdrop-blur"
                  classList={{ "bg-primary": i() === defPicIndex() }}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
