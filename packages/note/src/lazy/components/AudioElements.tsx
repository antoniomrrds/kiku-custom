import { createEffect, createMemo, For, on, onMount, Show } from "solid-js";
import { useCardContext } from "#/src/contexts/CardContext";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

function AudioTag(props: { text: string }) {
  // Find all `[sound:filename.mp3]` occurrences
  const $matches = createMemo(() => [...props.text.matchAll(/\[sound:([^\]]+)\]/g)]);
  const $sounds = createMemo(() => $matches().map((m) => m[1]));

  return (
    <Show when={$sounds().length > 0}>
      <div class="flex flex-wrap gap-2">
        <For each={$sounds()}>
          {(src) => {
            return <audio src={src} preload="none" />;
          }}
        </For>
      </div>
    </Show>
  );
}

export function AudioElements() {
  const { $ankiFields, $isRootAnkiFields } = useAnkiFieldContext();
  const { $card, $setCard, nested } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $config } = useConfigContext();
  const { logger, isAnkiDroidOldStudyScreen } = useGeneralContext();
  const hiddenStyle = {
    width: "0",
    height: "0",
    overflow: "hidden",
    position: "absolute",
  } as const;

  createEffect(
    on(
      () => $group().sentenceAudioField,
      () => {
        const anchors = $card.sentenceAudioRef?.querySelectorAll("a");
        const audios = $card.sentenceAudioRef?.querySelectorAll("audio");
        logger.debug("[AudioElements] sentenceAudioRef scan:", {
          anchors: anchors?.length ?? 0,
          audios: audios?.length ?? 0,
        });
        if (anchors?.length) {
          $setCard("sentenceAudios", Array.from(anchors));
        }
        if (audios?.length) {
          $setCard("sentenceAudios", Array.from(audios));
        }
        if (!anchors?.length && !audios?.length) {
          $setCard("sentenceAudios", undefined);
        }
      },
    ),
  );

  let autoPlay = true;
  createEffect(
    on(
      () => $group().sentenceAudioField,
      () => {
        if (nested && autoPlay) {
          autoPlay = false;
          const audio = $card.expressionAudioRef?.querySelector("audio");
          if (audio) {
            logger.info("[AudioElements] autoPlay: expression");
            audio.play();
            audio.onpause = () => {
              const audio = $card.sentenceAudioRef?.querySelectorAll("audio")[0];
              if (audio) {
                logger.info("[AudioElements] autoPlay: sentence");
                audio.play();
              } else {
                logger.debug("[AudioElements] autoPlay: no sentence audio to chain");
              }
            };
          } else {
            logger.debug("[AudioElements] autoPlay: no expression audio to play");
          }
        }
      },
    ),
  );

  onMount(() => {
    if ($card.isNsfw && $config.muteNsfw && !isAnkiDroidOldStudyScreen) {
      const anchor = $card.expressionAudioRef?.querySelector("a");
      logger.info(
        "[AudioElements] NSFW mute:",
        anchor ? "applied" : "no expression audio anchor to click",
      );
      anchor?.click();
    }
  });

  return (
    <>
      <div
        style={hiddenStyle}
        ref={(ref) => $setCard("expressionAudioRef", ref)}
        innerHTML={$isRootAnkiFields() ? $ankiFields.ExpressionAudio : undefined}
      >
        {!$isRootAnkiFields() && <AudioTag text={$ankiFields.ExpressionAudio} />}
      </div>
      <div
        style={hiddenStyle}
        ref={(ref) => $setCard("sentenceAudioRef", ref)}
        innerHTML={$isRootAnkiFields() ? $group().sentenceAudioField : undefined}
      >
        {!$isRootAnkiFields() && <AudioTag text={$group().sentenceAudioField} />}
      </div>
    </>
  );
}
