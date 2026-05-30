import { useBreakpointContext } from "#/contexts/BreakpointContext";
import { useCardContext } from "#/contexts/CardContext";
import { useConfigContext } from "#/contexts/ConfigContext";
import { useGeneralContext } from "#/contexts/GeneralContext";
import type { DaisyUITheme } from "#/lib/theme";

export function useViewTransition() {
  function startViewTransition(callback: () => void, opts: { beforeCallback?: () => void } = {}) {
    if (document.startViewTransition) {
      opts.beforeCallback?.();
      return document.startViewTransition(callback);
    } else {
      callback();
    }
  }
  return startViewTransition;
}

export function useNavigationTransition() {
  const { $card, $setCard } = useCardContext();
  const bp = useBreakpointContext();
  const startViewTransition = useViewTransition();

  function navigate(
    destination: "main" | "settings" | "nested" | "kanji" | (() => void),
    direction: "back" | "forward",
    navigateBack?: () => void,
  ) {
    if (navigateBack) $setCard("navigateBack", (old) => [...old, navigateBack]);
    const start = () => {
      if (typeof destination === "function") {
        destination();
      } else {
        $setCard("page", destination);
      }
    };

    if (!bp.isAtLeast("sm")) {
      startViewTransition(start, {
        beforeCallback() {
          document.documentElement.dataset.transitionDirection = direction;
        },
      })?.finished.then(() => {
        // TODO: this callback is called too fast when naviating to nested card, not sure why.
        document.documentElement.removeAttribute("data-transition-direction");
      });
    } else {
      start();
    }
  }
  function navigateBack() {
    const last = $card.navigateBack[$card.navigateBack.length - 1];
    $setCard("navigateBack", (list) => list.slice(0, -1));
    last?.();
  }

  return { navigate, navigateBack };
}

export function useThemeTransition() {
  const { $general } = useGeneralContext();
  const { $setConfig } = useConfigContext();
  const startViewTransition = useViewTransition();
  const { $card } = useCardContext();

  function changeTheme(theme: DaisyUITheme) {
    if ($card.query.status === "loading" || $general.isAnkiDesktop) {
      $setConfig("theme", theme);
    } else {
      startViewTransition(() => $setConfig("theme", theme), {
        beforeCallback() {
          document.documentElement.dataset.themeTransition = "true";
        },
      })?.finished.then(() => {
        document.documentElement.removeAttribute("data-theme-transition");
      });
    }
  }
  return changeTheme;
}
