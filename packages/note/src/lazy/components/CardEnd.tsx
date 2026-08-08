import { ErrorBoundary, Show } from "solid-js";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";

export function CardEnd() {
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  return (
    <ErrorBoundary fallback={null}>
      <Show when={$general.plugin?.CardEnd}>
        {(get) => {
          const CardEnd = get();
          return <CardEnd ctx={ctx} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}
