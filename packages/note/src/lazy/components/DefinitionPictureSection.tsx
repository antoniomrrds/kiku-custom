import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { parseHtml } from "#/src/lib/dom";
import { useCollectGlossaryImgs } from "#/src/hooks/glossary";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { usePictureModalTransition } from "#/src/hooks/transition";
import { ArrowLeftIcon } from "./Icons";

export function DefinitionPictureSection(props: { currentHtml?: string }) {
  const { $setPictureModal } = usePictureModalTransition();
  const { $ankiFields } = useAnkiFieldContext();
  const { $config } = useConfigContext();
  const collectGlossaryImgs = useCollectGlossaryImgs();

  const $definitionPictures = createMemo(() => {
    if (isServer) return [];

    const displayedImages = new Set<string>();
    if (props.currentHtml) {
      const doc = parseHtml(props.currentHtml);
      for (const img of doc.querySelectorAll("img")) {
        const src = img.getAttribute("src");
        if (src) displayedImages.add(src);
      }
    }

    const defPicDoc = parseHtml($ankiFields.DefinitionPicture);
    const defPics = Array.from(defPicDoc.querySelectorAll("img")).map((img) => img.outerHTML);

    const glossaryPics = $config.definitionPictureFromGlossary
      ? collectGlossaryImgs($ankiFields.Glossary)
          .filter((pic) => !displayedImages.has(pic.src))
          .map((pic) => pic.html)
      : [];

    return [...defPics, ...glossaryPics];
  });

  const [$defPicIndex, $setDefPicIndex] = createSignal(0);

  const currentDefPic = () => $definitionPictures()[$defPicIndex()] || "";

  createEffect(
    on(
      () => $ankiFields.CardID,
      () => $setDefPicIndex(0),
      { defer: true },
    ),
  );

  return (
    <Show when={$definitionPictures().length > 0}>
      <div
        class="max-w-1/3 float-right [&_img]:rounded-sm ms-2 cursor-pointer relative tappable"
        on:click={() => {
          const picture = currentDefPic();
          if (picture) $setPictureModal(picture);
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <div innerHTML={currentDefPic()}></div>

        <Show when={$definitionPictures().length > 1}>
          <div class="absolute inset-y-0 left-0 right-0 flex justify-between pointer-events-none">
            <button
              type="button"
              class="h-full w-4 sm:w-6 opacity-0 hover:opacity-100 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-l-sm flex items-center justify-center"
              on:click={(e) => {
                e.stopPropagation();
                $setDefPicIndex(
                  (prev) =>
                    (prev - 1 + $definitionPictures().length) % $definitionPictures().length,
                );
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              <ArrowLeftIcon class="size-3 sm:size-4 text-base-100"></ArrowLeftIcon>
            </button>
            <button
              type="button"
              class="h-full w-4 sm:w-6 opacity-0 hover:opacity-100  hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-r-sm flex items-center justify-center"
              on:click={(e) => {
                e.stopPropagation();
                $setDefPicIndex((prev) => (prev + 1) % $definitionPictures().length);
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              <ArrowLeftIcon class="size-3 sm:size-4 text-base-100 rotate-180"></ArrowLeftIcon>
            </button>
          </div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            <For each={$definitionPictures()}>
              {(_, i) => (
                <div
                  class="w-1.5 h-1.5 rounded-full bg-base-100/50 ring-1 ring-base-content/50"
                  classList={{ "bg-primary": i() === $defPicIndex() }}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
