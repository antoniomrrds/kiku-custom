import { createMemo, createSignal, For, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { isSvg, parseHtml } from "#/util/general";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";

export default function DefinitionPictureSection(props: {
  onDefinitionPictureClick?: (picture: string) => void;
  currentHtml?: string;
}) {
  const { ankiFields } = useAnkiFieldContext<"back">();

  const definitionPictures = createMemo(() => {
    if (isServer) return [];

    const displayedImages = new Set<string>();
    if (props.currentHtml) {
      const doc = parseHtml(props.currentHtml);
      for (const img of doc.querySelectorAll("img")) {
        if (img.src) displayedImages.add(img.src);
      }
    }

    const defPicDoc = parseHtml(ankiFields.DefinitionPicture);
    const defPics = Array.from(defPicDoc.querySelectorAll("img")).map(
      (img) => img.outerHTML,
    );

    const glossaryDoc = parseHtml(ankiFields.Glossary);
    const glossaryPics = Array.from(glossaryDoc.querySelectorAll("img"))
      .filter(
        (img) =>
          img.src &&
          !isSvg(img.src) &&
          (img.height === 0 || img.height > 100) &&
          (img.width === 0 || img.width > 100) &&
          !displayedImages.has(img.src),
      )
      .map((img) => {
        const newImg = document.createElement("img");
        newImg.setAttribute("src", img.src);
        return newImg.outerHTML;
      });

    return [...defPics, ...glossaryPics];
  });

  const [defPicIndex, setDefPicIndex] = createSignal(0);

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
          <div class="absolute inset-y-0 left-2 right-2 flex justify-between pointer-events-none">
            <button
              type="button"
              class="h-full w-6 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-l-sm"
              on:click={(e) => {
                e.stopPropagation();
                setDefPicIndex(
                  (prev) =>
                    (prev - 1 + definitionPictures().length) %
                    definitionPictures().length,
                );
              }}
            />
            <button
              type="button"
              class="h-full w-6 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto cursor-pointer transition-all rounded-r-sm"
              on:click={(e) => {
                e.stopPropagation();
                setDefPicIndex(
                  (prev) => (prev + 1) % definitionPictures().length,
                );
              }}
            />
          </div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none opacity-0 group-hover/defpic:opacity-100 transition-opacity">
            <For each={definitionPictures()}>
              {(_, i) => (
                <div
                  class="w-1 h-1 rounded-full bg-base-100/50"
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
