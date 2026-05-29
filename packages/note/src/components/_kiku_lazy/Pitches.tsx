import { createMemo, ErrorBoundary, For, Show } from "solid-js";
import type { DatasetProp } from "#/lib/config";
import type { PitchInfo } from "#/lib/hatsuon";
import type { PitchType } from "#/lib/types";
import { useCardContext } from "../shared/CardContext";
import { useCtxContext } from "../shared/CtxContext";
import { useGeneralContext } from "../shared/GeneralContext";

export default function Pitches() {
  const { $card } = useCardContext();
  return (
    <For each={$card.pitch.infos}>
      {(pitchInfo, index) => {
        return <Pitch pitchInfo={pitchInfo} index={index()} />;
      }}
    </For>
  );
}

function Pitch(props: { pitchInfo: PitchInfo; index: number }) {
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  return (
    <ErrorBoundary fallback={<DefaultPitch {...props} />}>
      <Show
        when={$general.plugin?.Pitch}
        fallback={<DefaultPitch {...props} />}
      >
        {(get) => {
          const Pitch = get();
          return (
            <Pitch
              ctx={ctx}
              index={props.index}
              pitchInfo={props.pitchInfo}
              DefaultPitch={(props) => <DefaultPitch {...props} />}
            />
          );
        }}
      </Show>
    </ErrorBoundary>
  );
}

export function DefaultPitch(props: {
  pitchInfo: PitchInfo;
  index: number;
  ref?: (ref: HTMLDivElement) => void;
}) {
  const $pitchDataset = createMemo<DatasetProp>(() => ({
    "data-pitch-type": props.pitchInfo.patternName as PitchType,
  }));

  const $pitchTypeJA = createMemo(() => {
    switch (props.pitchInfo.patternName) {
      case "heiban":
        return "平板";
      case "atamadaka":
        return "頭高";
      case "nakadaka":
        return "中高";
      case "odaka":
        return "尾高";
      case "kifuku":
        return "起伏";
    }
  });

  return (
    <div
      class="tooltip"
      data-tip={$pitchTypeJA()}
      ref={props.ref}
      {...$pitchDataset()}
    >
      <div class="flex items-start gap-1 animate-fade-in-sm">
        <div>
          <For each={props.pitchInfo.morae}>
            {(mora, i) => {
              return (
                <span
                  style={{
                    "border-color": "var(--pitch-color)",
                    color: "var(--pitch-color)",
                  }}
                  classList={{
                    "border-t-2": props.pitchInfo.pattern[i()] === 1,
                    "pitch-segment":
                      props.pitchInfo.pattern[i()] === 1 &&
                      props.pitchInfo.pattern[i() + 1] === 0,
                  }}
                >
                  {mora}
                </span>
              );
            }}
          </For>
        </div>
        <div
          class="text-sm px-0.5 rounded-sm leading-tight"
          style={{
            "background-color": "var(--pitch-color)",
            color: "var(--pitch-content-color)",
          }}
        >
          {props.pitchInfo.pitchNum}
        </div>
      </div>
    </div>
  );
}
