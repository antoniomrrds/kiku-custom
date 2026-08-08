import { createMemo, Show, For } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";

export function Tag() {
  const { $ankiFields } = useAnkiFieldContext();
  const $tags = createMemo(() => $ankiFields.Tags.split(" ").filter(Boolean));

  return (
    <>
      <Show when={$tags().length}>
        <div class="flex gap-2 items-center justify-center animate-fade-in flex-wrap">
          <For each={$tags()}>
            {(tag) => {
              const isWarning = ["leech", "potential-leech", "marked"].includes(tag);
              return (
                <div
                  class="badge badge-secondary"
                  classList={{
                    "badge-secondary": !isWarning,
                    "badge-warning": isWarning,
                  }}
                >
                  {tag}
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </>
  );
}
