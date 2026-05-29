import { Show } from "solid-js";
import { useFieldGroupContext } from "../shared/FieldGroupContext";

export default function SentenceTranslation() {
  const { $group } = useFieldGroupContext();

  return (
    <Show when={$group.sentenceTranslationField.trim()}>
      <div
        class="animate-fade-in text-lg text-base-content-calm"
        innerHTML={$group.sentenceTranslationField}
      ></div>
    </Show>
  );
}
