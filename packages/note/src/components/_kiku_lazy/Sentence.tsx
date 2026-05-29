import {
  createEffect,
  createMemo,
  createSignal,
  ErrorBoundary,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
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
  const ctx = useCtxContext();

  createEffect(() => {
    console.log($group.sentenceTranslationField);
  });

  function DefaultSentence() {
    return (
      <Switch>
        <Match when={$card.side === "back" && $group.sentenceTranslationField}>
          <SentenceFieldWithTranslation />
        </Match>
        <Match when={true}>
          <SentenceField />
        </Match>
      </Switch>
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

function SentenceFieldWithTranslation() {
  const [$inputRef, $setInputRef] = createSignal<HTMLInputElement>();
  const { $group } = useFieldGroupContext();
  onMount(() => {
    const inputRef = $inputRef();
    if (!inputRef) return;
    const handleActive = (e: MouseEvent | FocusEvent | TouchEvent) => {
      if (e.target instanceof HTMLInputElement) {
        e.target.checked = true;
      }
    };
    const handleInactive = (e: MouseEvent | FocusEvent | TouchEvent) => {
      if (e.target instanceof HTMLInputElement) {
        e.target.checked = false;
      }
    };

    inputRef.addEventListener("mouseenter", handleActive);
    inputRef.addEventListener("mouseleave", handleInactive);
    inputRef.addEventListener("focus", handleActive);
    inputRef.addEventListener("blur", handleInactive);
    inputRef.addEventListener("touchstart", handleActive);
    inputRef.addEventListener("touchend", handleInactive);

    onCleanup(() => {
      inputRef.removeEventListener("mouseenter", handleActive);
      inputRef.removeEventListener("mouseleave", handleInactive);
      inputRef.removeEventListener("focus", handleActive);
      inputRef.removeEventListener("blur", handleInactive);
      inputRef.removeEventListener("touchstart", handleActive);
      inputRef.removeEventListener("touchend", handleInactive);
    });
  });

  return (
    <div class="collapse animate-fade-in border-b-2 rounded-b-none border-base-300">
      <input class="p-0" type="checkbox" ref={$setInputRef} />
      <div class="collapse-title after:start-5 after:end-auto">
        <SentenceField />
      </div>
      <div
        class="collapse-content text-lg text-base-content-calm"
        innerHTML={$group.sentenceTranslationField}
      ></div>
    </div>
  );
}

function SentenceField() {
  const { $card } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();

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
