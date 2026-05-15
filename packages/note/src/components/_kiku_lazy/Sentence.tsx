import { createEffect, ErrorBoundary, Show } from "solid-js";
import { useCardContext } from "#/components/shared/CardContext";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useCtxContext } from "../shared/CtxContext";
import { useFieldGroupContext } from "../shared/FieldGroupContext";
import { useGeneralContext } from "../shared/GeneralContext";

export default function Sentence() {
  const { $card, $setCard } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $general } = useGeneralContext();
  const { ankiFields } = useAnkiFieldContext<"back">();
  const ctx = useCtxContext();

  createEffect(() => {
    if ($card.sentenceFieldRef && $group.sentenceField) {
      const ruby = $card.sentenceFieldRef.querySelectorAll("ruby");
      ruby.forEach((el) => {
        el.classList.add(..."[&_rt]:invisible hover:[&_rt]:visible".split(" "));
      });
    }
  });

  const animateFadeIn = () => {
    if ($card.side === "back") {
      if (
        ankiFields.IsAudioCard ||
        ankiFields.IsSentenceCard ||
        ankiFields.IsClickCard ||
        ankiFields.IsWordAndSentenceCard
      ) {
        return false;
      }
    }
    return true;
  };

  const expressionPitchDataset = () => ({
    "data-pitch-type": $card.pitch.type,
  });

  function DefaultSentence() {
    return (
      <div
        class={`sentence font-secondary sentence-field`}
        classList={{
          "animate-fade-in": animateFadeIn(),
        }}
        ref={(ref) => $setCard("sentenceFieldRef", ref)}
        innerHTML={$group.sentenceField}
        {...expressionPitchDataset()}
      ></div>
    );
  }

  return (
    <ErrorBoundary fallback={<DefaultSentence />}>
      <Show when={$general.plugin?.Sentence} fallback={<DefaultSentence />}>
        {(get) => {
          const Sentence = get();
          return <Sentence ctx={ctx} DefaultSentence={DefaultSentence} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}
