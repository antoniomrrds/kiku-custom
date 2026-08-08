import {
  createEffect,
  createMemo,
  createSignal,
  lazy,
  on,
  Show,
} from "solid-js";
import { isServer } from "solid-js/web";
import { parseHtml } from "#/src/lib/dom";
import { isNsfw } from "#/src/lib/util";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { usePictureModalTransition } from "#/src/hooks/transition";
import { useConfigContext } from "#/src/contexts/ConfigContext";

const Lazy = {
  ArrowLeftIcon: lazy(async () => ({
    default: (await import("#/src/lazy")).ArrowLeftIcon,
  })),
};

export function PictureSection() {
  const { $card, $isInitialSide } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $ankiFields } = useAnkiFieldContext();
  const { $setPictureModal } = usePictureModalTransition();
  const [$clicked, $setClicked] = createSignal(false);
  const [$subIndex, $setSubIndex] = createSignal(0);
  const [$config] = useConfigContext();

  // Mostra a imagem se:
  // 1. o usuário clicou para revelar
  // OU
  // 2. showPictureDirectlyOnFront está ativado
  const isVisible = () => $clicked() || $config.showPictureDirectlyOnFront;

  const $pictures = createMemo(() => {
    if (isServer) return [];

    const doc = parseHtml($group().pictureField);

    return Array.from(doc.querySelectorAll("img")).map((img) => img.outerHTML);
  });

  const $currentPicture = createMemo(() => $pictures()[$subIndex()] || "");

  const $isNsfw = createMemo(() => isNsfw($ankiFields.Tags));

  const $pictureFieldDataset = createMemo(() => ({
    "data-transition": $card.ready ? "true" : undefined,
    "data-tags": isServer ? "{{Tags}}" : $ankiFields.Tags,
    "data-nsfw": $isNsfw() ? "true" : "false",
  }));

  // NOTE: if the first data-group-id has no picture,
  // the SSR output will still display the first picture from Picture field.
  // This is a bug but it is still preferable to having a layout shift.
  const $dataSet1 = createMemo(() => ({
    "data-has-picture": isServer
      ? "{{#Picture}}true{{/Picture}}"
      : $currentPicture()
        ? "true"
        : "",
  }));

  // Controla a visibilidade da imagem.
  //
  // Se showPictureDirectlyOnFront estiver ativado,
  // a imagem aparece diretamente.
  //
  // Caso contrário:
  // - no lado inicial, mantém o comportamento padrão;
  // - no outro lado, fica escondida até clicar.
  const $opacity = createMemo(() => {
    if (isVisible()) return 1;
    if ($isInitialSide()) return undefined;
    return 0;
  });

  // Quando muda o grupo de imagens,
  // volta para a primeira imagem.
  createEffect(
    on(
      () => $group().pictureField,
      () => $setSubIndex(0),
    ),
  );

  // Quando muda de lado do card,
  // reseta o estado de clique.
  createEffect(
    on(
      () => $isInitialSide(),
      () => $setClicked(false),
    ),
  );

  const next = (e: MouseEvent) => {
    e.stopPropagation();

    const length = $pictures().length;

    if (length <= 1) return;

    $setSubIndex((prev) => (prev + 1) % length);
  };

  const prev = (e: MouseEvent) => {
    e.stopPropagation();

    const length = $pictures().length;

    if (length <= 1) return;

    $setSubIndex((prev) => (prev - 1 + length) % length);
  };

  return (
    <div
      class="picture-field-container tappable"
      on:click={() => {
        // Se showPictureDirectlyOnFront estiver ativado,
        // não precisa clicar para revelar a imagem.
        if (!$config.showPictureDirectlyOnFront) {
          $setClicked((prev) => !prev);
        }
      }}
      on:touchend={(e) => e.stopPropagation()}
      {...$dataSet1()}
    >
      <div
        class="picture-field-background tappable"
        style={{
          opacity: $opacity(),
        }}
        on:click={() => $setPictureModal($currentPicture())}
        on:touchend={(e) => e.stopPropagation()}
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
      >
        {/* 
          IMPORTANTE:
          O innerHTML fica em um elemento separado.
          O Solid não controla os filhos desse elemento.
        */}
        <div
          class="picture-content"
          innerHTML={isServer ? undefined : $currentPicture()}
        >
          {isServer ? "{{Picture}}" : undefined}
        </div>

        {/* 
          O Show agora está fora do elemento que usa innerHTML.
          Assim o Solid pode controlar esses nós normalmente.
        */}
        <Show when={$pictures().length > 1 && $card.ready}>
          <div class="absolute inset-y-0 left-0 right-0 flex justify-between pointer-events-none">
            <button
              type="button"
              class="h-full w-4 sm:w-6 cursor-pointer opacity-0 hover:opacity-100 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all flex items-center justify-center"
              on:click={prev}
              on:touchend={(e) => e.stopPropagation()}
            >
              <Lazy.ArrowLeftIcon class="size-3 sm:size-4 text-base-100" />
            </button>

            <button
              type="button"
              class="h-full w-4 sm:w-6 cursor-pointer opacity-0 hover:opacity-100 hover:bg-base-content/30 hover:backdrop-blur-sm pointer-events-auto transition-all flex items-center justify-center"
              on:click={next}
              on:touchend={(e) => e.stopPropagation()}
            >
              <Lazy.ArrowLeftIcon class="size-3 sm:size-4 text-base-100 rotate-180" />
            </button>
          </div>

          <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            {$pictures().map((_, i) => (
              <div
                class="w-1.5 h-1.5 rounded-full bg-base-100/50 ring-1 ring-base-content/50"
                classList={{
                  "bg-primary": i === $subIndex(),
                }}
              />
            ))}
          </div>
        </Show>
      </div>
    </div>
  );
}
