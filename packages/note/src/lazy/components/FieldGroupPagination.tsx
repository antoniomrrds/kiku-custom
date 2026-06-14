import { onCleanup, onMount } from "solid-js";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { ArrowLeftIcon } from "./Icons";

export function FieldGroupPagination() {
  const { $group, $index, $next, $prev } = useFieldGroupContext();
  const { $card } = useCardContext();
  const { $config } = useConfigContext();

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === $config.keybindFieldGroupPrev) onPrevClick();
      if (e.key === $config.keybindFieldGroupNext) onNextClick();
    };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  const onPrevClick = () => {
    if ($prev()) {
      const el = $card.sentenceAudios?.[0];
      if (el) {
        el.click();
        if (el instanceof HTMLAudioElement) el.play();
      }
    }
  };

  const onNextClick = () => {
    if ($next()) {
      const el = $card.sentenceAudios?.[0];
      if (el) {
        el.click();
        if (el instanceof HTMLAudioElement) el.play();
      }
    }
  };

  const groupId = () => $group().ids[$index()];

  const date = () => {
    const ms = Number(groupId());
    const MIN = Date.UTC(2000, 0, 1); // 2000-01-01
    const MAX = Date.UTC(2100, 0, 1); // 2100-01-01 (exclusive)
    if (ms < MIN || ms >= MAX) return null;
    return new Date(ms).toLocaleDateString();
  };

  return (
    $group().ids.length > 1 && (
      <>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          on:click={onPrevClick}
          on:touchend={(e) => e.stopPropagation()}
        >
          <ArrowLeftIcon class="size-6 hover:text-base-content-calm transition-colors" />
        </button>
        <div class="flex flex-col items-center">
          <div class="text-xs text-base-content-faint leading-none">{date()}</div>
          <div class="text-sm sm:text-base leading-none">{`${$index() + 1} / ${$group().ids.length}`}</div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          on:click={onNextClick}
          on:touchend={(e) => e.stopPropagation()}
        >
          <ArrowLeftIcon class="size-6 rotate-180 hover:text-base-content-calm transition-colors" />
        </button>
      </>
    )
  );
}
