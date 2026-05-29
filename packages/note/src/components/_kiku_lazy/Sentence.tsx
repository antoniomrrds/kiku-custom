import { createMemo, ErrorBoundary, Show } from "solid-js";
import { useCardContext } from "#/components/shared/CardContext";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useCtxContext } from "../shared/CtxContext";
import { useFieldGroupContext } from "../shared/FieldGroupContext";
import { useGeneralContext } from "../shared/GeneralContext";
import { parseHtml } from "#/lib/dom";

export default function Sentence() {
  const { $card } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $general } = useGeneralContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
  const ctx = useCtxContext();

  const $sentence = createMemo(() => {
    const doc = parseHtml($group.sentenceField);
    const ruby = doc.querySelectorAll("ruby");
    ruby.forEach((el) => {
      el.classList.add(..."[&_rt]:invisible hover:[&_rt]:visible".split(" "));
    });

    if ($card.side === "front" && $ankiFields.IsAudioCard) {
      const boldElements = doc.querySelectorAll("b");
      boldElements.forEach((el) => {
        el.innerHTML = "[...]";
        el.classList.add("text-base-content-primary");
      });
    }

    return doc.body.innerHTML;
  });

  const $animateFadeIn = createMemo(() => {
    if ($card.side === "back") {
      if (
        $ankiFields.IsAudioCard ||
        $ankiFields.IsSentenceCard ||
        $ankiFields.IsClickCard ||
        $ankiFields.IsWordAndSentenceCard
      ) {
        return false;
      }
    }
    return true;
  });

  const expressionPitchDataset = () => ({
    "data-pitch-type": $card.pitch.type,
  });

  function DefaultSentence() {
    return (
      <div
        class={`sentence font-secondary sentence-field`}
        classList={{
          "animate-fade-in": $animateFadeIn(),
        }}
        innerHTML={$sentence()}
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
