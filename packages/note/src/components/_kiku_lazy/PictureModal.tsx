import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Switch,
} from "solid-js";
import { Portal } from "solid-js/web";
import { isSvg, parseHtml } from "#/util/general";
import { useViewTransition } from "#/util/hooks";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useGeneralContext } from "../shared/GeneralContext";

export default function PictureModal(props: {
  img: string | undefined;
  "on:click"?: () => void;
}) {
  const [$general] = useGeneralContext();
  const { ankiFields } = useAnkiFieldContext<"back">();
  const [img, setImg] = createSignal(props.img);
  const [showAll, setShowAll] = createSignal(false);
  const startViewTransition = useViewTransition();

  createEffect(() => {
    props.img;
    startViewTransition(() => {
      setImg(props.img);
    });
  });

  const allPictures = createMemo(() => {
    const pics: string[] = [];

    // Picture field
    const picDoc = parseHtml(ankiFields.Picture);
    for (const img of picDoc.querySelectorAll("img")) {
      pics.push(img.outerHTML);
    }

    // DefinitionPicture field
    const defPicDoc = parseHtml(ankiFields.DefinitionPicture);
    for (const img of defPicDoc.querySelectorAll("img")) {
      pics.push(img.outerHTML);
    }

    // Glossary field
    const glossaryDoc = parseHtml(ankiFields.Glossary);
    for (const img of glossaryDoc.querySelectorAll("img")) {
      if (
        img.src &&
        !isSvg(img.src) &&
        (img.height === 0 || img.height > 100) &&
        (img.width === 0 || img.width > 100)
      ) {
        const newImg = document.createElement("img");
        newImg.setAttribute("src", img.src);
        pics.push(newImg.outerHTML);
      }
    }

    return Array.from(new Set(pics));
  });

  return (
    <Portal mount={$general.layoutRef}>
      <div
        part="picture-modal"
        class="z-20 top-0 left-0 w-full h-full p-4 sm:p-8 bg-black/75 flex flex-col transition-opacity overflow-auto"
        classList={{
          fixed: !$general.isAnkiWeb,
          absolute: $general.isAnkiWeb,
          hidden: !img(),
        }}
        on:click={props["on:click"]}
      >
        <div class="flex justify-end items-center mb-4 sticky top-0 rounded-lg z-10">
          <button
            type="button"
            class="btn btn-sm btn-neutral"
            on:click={(e) => {
              e.stopPropagation();
              setShowAll((prev) => !prev);
            }}
          >
            {showAll() ? "Show current" : "Show all"}
          </button>
        </div>

        <div class="flex-1 flex justify-center items-center">
          <Switch>
            <Match when={!showAll()}>
              <div
                class="transition-all [&_img]:max-h-[85vh] sm:[&_img]:max-h-[95vh] [&_*:not(img)]:contents"
                innerHTML={img() ?? ""}
              ></div>
            </Match>
            <Match when={showAll()}>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                <For each={allPictures()}>
                  {(pic) => (
                    <div
                      class="aspect-square bg-base-200/20 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      on:click={(e) => {
                        e.stopPropagation();
                        setImg(pic);
                        setShowAll(false);
                      }}
                      innerHTML={pic}
                    ></div>
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </Portal>
  );
}
