import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Switch,
} from "solid-js";
import { Portal } from "solid-js/web";
import { collectGlossaryImgs, parseHtml } from "#/util/general";
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
    const pics = new Map<string, string>(); // src -> html

    const addImages = (doc: Document) => {
      for (const img of doc.querySelectorAll("img")) {
        const src = img.getAttribute("src");
        if (src) {
          pics.set(src, img.outerHTML);
        }
      }
    };

    // Picture field
    addImages(parseHtml(ankiFields.Picture));

    // DefinitionPicture field
    addImages(parseHtml(ankiFields.DefinitionPicture));

    // Glossary field
    for (const pic of collectGlossaryImgs(
      ankiFields.Glossary,
      $general.plugin?.glossaryImagesFilter,
    )) {
      pics.set(pic.src, pic.html);
    }

    return Array.from(pics.entries()).map(([src, html]) => ({ src, html }));
  });

  return (
    <Portal mount={$general.layoutRef}>
      <div
        part="picture-modal"
        class="z-20 top-0 left-0 w-full h-full p-4 sm:p-8 bg-black/75 flex flex-col transition-opacity overflow-auto tappable"
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
              <div class="grid grid-cols-[repeat(auto-fit,minmax(250px,320px))] gap-4 w-full justify-center">
                <For each={allPictures()}>
                  {(pic) => (
                    <div
                      class="aspect-square relative rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group tappable"
                      on:click={(e) => {
                        e.stopPropagation();
                        setImg(pic.html);
                        setShowAll(false);
                      }}
                    >
                      <div
                        class="absolute inset-0 bg-cover bg-center blur-lg brightness-50 scale-110"
                        style={{ "background-image": `url(${pic.src})` }}
                      />
                      <div
                        class="relative z-10 w-full h-full [&_img]:w-full [&_img]:h-full [&_img]:object-contain"
                        innerHTML={pic.html}
                      />
                    </div>
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
