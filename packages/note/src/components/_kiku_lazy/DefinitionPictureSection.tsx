import { createMemo, createSignal, For, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { parseHtml } from "#/lib/dom";
import { useCollectGlossaryImgs } from "#/hooks/glossary";
import { useAnkiFieldContext } from "../../contexts/AnkiFieldsContext";
import { useConfigContext } from "../../contexts/ConfigContext";

export default function DefinitionPictureSection(props: {
  onDefinitionPictureClick?: (picture: string) => void;
  currentHtml?: string;
}) {
  const { $ankiFields } = useAnkiFieldContext<"back">();
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

  return (
    <Show when={$definitionPictures().length > 0}>
      <div
        class="max-w-1/3 float-right [&_img]:rounded-sm px-2 cursor-pointer relative group/defpic tappable"
        on:click={() => {
          const picture = currentDefPic();
          if (picture) props.onDefinitionPictureClick?.(picture);
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <div innerHTML={currentDefPic()}></div>

        <Show when={$definitionPictures().length > 1}>
          <div class="absolute inset-y-0 left-2 right-2 flex justify-between pointer-events-none">
            <button
              type="button"
              class="h-full w-6 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-l-sm"
              on:click={(e) => {
                e.stopPropagation();
                $setDefPicIndex(
                  (prev) =>
                    (prev - 1 + $definitionPictures().length) % $definitionPictures().length,
                );
              }}
              on:touchend={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              class="h-full w-6 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-r-sm"
              on:click={(e) => {
                e.stopPropagation();
                $setDefPicIndex((prev) => (prev + 1) % $definitionPictures().length);
              }}
              on:touchend={(e) => e.stopPropagation()}
            />
          </div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none opacity-0 group-hover/defpic:opacity-100 transition-opacity">
            <For each={$definitionPictures()}>
              {(_, i) => (
                <div
                  class="w-1 h-1 rounded-full bg-base-100/50"
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
