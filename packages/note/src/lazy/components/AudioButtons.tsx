import { For, Match, Portal, Show, Switch } from "solid-js/web";
import { useCardContext } from "#/src/contexts/CardContext";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { PlayIcon } from "./Icons";

function NotePlayIcon(props: { "on:click"?: () => void; color: "primary" | "secondary" }) {
  return (
    <button on:click={props["on:click"]} on:touchend={(e) => e.stopPropagation()}>
      <PlayIcon
        class="bg-primary rounded-full text-primary-content p-1 w-8 h-8 cursor-pointer"
        classList={{
          "bg-primary text-primary-content": props.color === "primary",
          "bg-secondary text-secondary-content": props.color === "secondary",
        }}
      />
    </button>
  );
}

function NotePlayIcons() {
  const { $ankiFields } = useAnkiFieldContext();
  const { $card } = useCardContext();

  return (
    <>
      <Show when={$ankiFields.ExpressionAudio}>
        <NotePlayIcon
          color="primary"
          on:click={() => {
            $card.expressionAudioRef?.querySelector("a")?.click();
            $card.expressionAudioRef?.querySelector("audio")?.play();
          }}
        ></NotePlayIcon>
      </Show>
      <For each={$card.sentenceAudios}>
        {(el) => (
          <NotePlayIcon
            color="secondary"
            on:click={() => {
              el.click();
              if (el instanceof HTMLAudioElement) el.play();
            }}
          ></NotePlayIcon>
        )}
      </For>
    </>
  );
}

export default function AudioButtons(props: { position: 1 | 2 }) {
  const { $general } = useGeneralContext();

  return (
    <Switch>
      <Match when={props.position === 1}>
        <NotePlayIcons />
      </Match>
      <Match when={props.position === 2}>
        <Portal mount={$general.layoutRef}>
          <div
            class="bottom-4 left-4 flex sm:hidden flex-col gap-2 items-center animate-fade-in-sm"
            classList={{
              fixed: !$general.isAnkiWeb,
              absolute: $general.isAnkiWeb,
            }}
          >
            <NotePlayIcons />
          </div>
        </Portal>
      </Match>
    </Switch>
  );
}
