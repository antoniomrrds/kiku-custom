import { createUniqueId, Match, Show, Switch } from "solid-js";
import { useNavigationTransition, useThemeTransition } from "#/src/hooks/transition";
import { capitalize } from "#/src/lib/text";
import { useCardContext } from "#/src/contexts/CardContext";
import { useRelatedItems } from "#/src/hooks/query";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import HeaderLayout from "./HeaderLayout";
import { ArrowLeftIcon, BoltIcon, PaintbrushIcon } from "./Icons";
import MergeContextModal from "./MergeContextModal";

export default function HeaderMain(props: { onExitNested?: () => void }) {
  const { $card, $initialSide } = useCardContext();
  const { $config, $isConfigOutOfSync } = useConfigContext();
  const { initialDarkMode, $startupTime } = useGeneralContext();
  const { navigate } = useNavigationTransition();
  const { $changeThemeNext } = useThemeTransition();

  return (
    <HeaderLayout>
      <div class="flex gap-1 sm:gap-2 items-center animate-fade-in-sm">
        <Switch>
          <Match when={$card.nested}>
            <button on:click={props.onExitNested} on:touchend={(e) => e.stopPropagation()}>
              <ArrowLeftIcon class="size-5 cursor-pointer text-base-content-soft" />
            </button>
            <MergeContextModal />
          </Match>
          <Match when={!$card.nested}>
            <div class="relative">
              <div class="flex items-center">
                <button
                  on:click={() => {
                    navigate("settings", "forward", () => navigate("main", "back"));
                  }}
                  on:touchend={(e) => e.stopPropagation()}
                >
                  <BoltIcon class="size-5 text-base-content-soft cursor-pointer"></BoltIcon>
                </button>
              </div>

              <Show when={$isConfigOutOfSync()}>
                <div class="status status-warning absolute top-0 right-0 translate-x-0.5 -translate-y-0.5"></div>
              </Show>
            </div>
            <Show when={$config.showTheme}>
              <button
                class="flex gap-1 sm:gap-2 items-center cursor-pointer"
                on:click={() => $changeThemeNext()}
                on:touchend={(e) => e.stopPropagation()}
              >
                <PaintbrushIcon class="size-5 cursor-pointer text-base-content-soft"></PaintbrushIcon>
                <span class="text-base-content-soft text-xs sm:text-sm">
                  {capitalize(initialDarkMode ? $config.themeDark : $config.theme)}
                </span>
              </button>
            </Show>
            <Show when={$config.showStartupTime}>
              <div class="text-base-content-soft bg-warning/10 rounded-sm px-px sm:px-1 text-xs sm:text-sm">
                {Math.round($startupTime())}
                {$startupTime() !== 0 && "ms"}
              </div>
            </Show>
          </Match>
        </Switch>
      </div>
      <div class="flex gap-1 sm:gap-2 items-center">
        <Show when={!$card.isMergePreview}>
          <Switch>
            <Match when={$card.query.status === "loading"}>
              <span class="loading loading-spinner loading-xs text-base-content-faint animate-fade-in-sm"></span>
            </Match>
            <Match when={$card.query.status === "error"}>
              <div class="status status-error animate-ping"></div>
            </Match>
            <Match when={$card.query.status === "success" && $initialSide() === "back"}>
              <div class="text-base-content-soft cursor-pointer animate-fade-in-sm">
                <KanjiPageIndicator />
              </div>
            </Match>
          </Switch>
        </Show>
      </div>
    </HeaderLayout>
  );
}

function KanjiPageIndicator() {
  const { $card, $setCard } = useCardContext();
  const { navigate } = useNavigationTransition();

  const $relatedItems = useRelatedItems();

  const length = () =>
    $card.query.noteList.length +
    ($card.query.sameReading?.length ? 1 : 0) +
    ($card.query.sameExpression?.length ? 1 : 0) +
    ($relatedItems().length ? 1 : 0);

  const onClick = ({
    initialTab,
    kanji,
  }: {
    initialTab: (typeof $card)["initialTab"];
    kanji?: string;
  }) => {
    const isKanjiResult = $card.query.noteList.length > 0;
    const isSameReadingResult = ($card.query.sameReading?.length ?? 0) > 0;
    const isSameExpressionResult = ($card.query.sameExpression?.length ?? 0) > 0;
    const isRelatedResult = $relatedItems().length > 0;
    const canOpen =
      (initialTab === "kanji" && isKanjiResult) ||
      (initialTab === "reading" && isSameReadingResult) ||
      (initialTab === "same" && isSameExpressionResult) ||
      (initialTab === "related" && isRelatedResult);

    if (!canOpen) return;

    $setCard("initialTab", initialTab);
    $setCard("initialFocus", { kanji, noteId: undefined });
    $setCard("uniqueId", createUniqueId());
    navigate("kanji", "forward", () => navigate("main", "back"));
  };

  function KanjiIndicator() {
    return $card.query.noteList.map(([kanji, data]) => {
      return (
        <button
          class="flex gap-px sm:gap-0.5 items-start hover:text-base-content transition-colors cursor-pointer"
          on:click={() => {
            onClick({ initialTab: "kanji", kanji });
          }}
          on:touchend={(e) => e.stopPropagation()}
        >
          <span>{kanji}</span>
          <span
            class="bg-base-content/5 leading-none text-xs sm:text-sm rounded-xs"
            classList={{
              "p-px": length() <= 4,
              "p-0": length() > 4,
            }}
          >
            {data.length}
          </span>
        </button>
      );
    });
  }

  function SameReadingIndicator() {
    return (
      <button
        class="flex gap-px sm:gap-0.5 items-start hover:text-base-content transition-colors cursor-pointer"
        on:click={() => {
          onClick({ initialTab: "reading" });
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <span>読</span>
        <span
          class="bg-base-content/5 leading-none text-xs sm:text-sm rounded-xs"
          classList={{
            "p-px": length() <= 4,
            "p-0": length() > 4,
          }}
        >
          {$card.query.sameReading?.length ?? 0}
        </span>
      </button>
    );
  }

  function SameExpressionIndicator() {
    return (
      <button
        class="flex gap-px sm:gap-0.5 items-start hover:text-base-content transition-colors cursor-pointer"
        on:click={() => {
          onClick({ initialTab: "same" });
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <span>同</span>
        <span
          class="bg-base-content/5 leading-none text-xs sm:text-sm rounded-xs"
          classList={{
            "p-px": length() <= 4,
            "p-0": length() > 4,
          }}
        >
          {$card.query.sameExpression?.length ?? 0}
        </span>
      </button>
    );
  }

  function RelatedExpressionIndicator() {
    return (
      <button
        class="flex gap-px sm:gap-0.5 items-start hover:text-base-content transition-colors cursor-pointer"
        on:click={() => {
          onClick({ initialTab: "related" });
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        <span>関</span>
        <span
          class="bg-base-content/5 leading-none text-xs sm:text-sm rounded-xs"
          classList={{
            "p-px": length() <= 4,
            "p-0": length() > 4,
          }}
        >
          {$relatedItems().length}
        </span>
      </button>
    );
  }

  return (
    <div
      class="flex sm:gap-2 items-center flex-wrap"
      classList={{
        "gap-1": length() <= 4,
        "gap-0": length() > 4,
      }}
    >
      <KanjiIndicator />

      <Show
        when={
          $card.query.sameReading?.length ||
          $card.query.sameExpression?.length ||
          $relatedItems().length
        }
      >
        <span>•</span>
      </Show>
      <Show when={$card.query.sameReading?.length}>
        <SameReadingIndicator />
      </Show>
      <Show when={$card.query.sameExpression?.length}>
        <SameExpressionIndicator />
      </Show>
      <Show when={$relatedItems().length}>
        <RelatedExpressionIndicator />
      </Show>
    </div>
  );
}
