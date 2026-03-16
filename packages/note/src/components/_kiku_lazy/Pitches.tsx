import { ErrorBoundary, Show } from "solid-js";
import type { DatasetProp } from "#/util/config";
import { getPitchPatternName, type PitchInfo } from "#/util/hatsuon";
import type { PitchType } from "#/util/types";
import { useCardContext } from "../shared/CardContext";
import { useCtxContext } from "../shared/CtxContext";
import { useGeneralContext } from "../shared/GeneralContext";

export default function Pitches() {
  const [$card] = useCardContext();
  return $card.pitchState.pitchInfos().map((pitchInfo, index) => {
    return <Pitch pitchInfo={pitchInfo} index={index} />;
  });
}

function Pitch(props: { pitchInfo: PitchInfo; index: number }) {
  const [$general] = useGeneralContext();
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
  const pitchInfo = props.pitchInfo;
  const pitchType = getPitchPatternName(
    pitchInfo.morae.length,
    pitchInfo.pitchNum,
    "EN",
  );

  const pitchDataset: DatasetProp = {
    "data-pitch-type": pitchType as PitchType,
  };

  return (
    <div
      class="tooltip"
      data-tip={pitchInfo.patternName}
      ref={props.ref}
      {...pitchDataset}
    >
      <div class="flex items-start gap-1 animate-fade-in-sm">
        <div>
          {pitchInfo.morae.map((mora, i) => {
            return (
              <span
                style={{ "border-color": "var(--pitch-color)" }}
                classList={{
                  "border-t-2": pitchInfo.pattern[i] === 1,
                  "pitch-segment":
                    pitchInfo.pattern[i] === 1 &&
                    pitchInfo.pattern[i + 1] === 0,
                }}
              >
                {mora}
              </span>
            );
          })}
        </div>
        <div
          class="text-sm px-0.5 rounded-sm leading-tight"
          style={{
            "background-color": "var(--pitch-color)",
            color: "var(--pitch-content-color)",
          }}
        >
          {pitchInfo.pitchNum}
        </div>
      </div>
    </div>
  );
}
