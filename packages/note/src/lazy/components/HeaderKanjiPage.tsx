import { useNavigationTransition } from "#/src/hooks/transition";
import { HeaderLayout } from "./HeaderLayout";
import { ArrowLeftIcon } from "./Icons";

export function HeaderKanjiPage() {
  const { navigateBack } = useNavigationTransition();

  return (
    <HeaderLayout>
      <div class="flex flex-row justify-between items-center">
        <button on:click={navigateBack} on:touchend={(e) => e.stopPropagation()}>
          <ArrowLeftIcon class="size-5 cursor-pointer text-base-content-soft"></ArrowLeftIcon>
        </button>
        <div class="flex flex-row gap-2 items-center"></div>
      </div>
    </HeaderLayout>
  );
}
