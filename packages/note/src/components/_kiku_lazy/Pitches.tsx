import { ErrorBoundary, Show } from "solid-js";
import {
  getPitchPatternName,
  hatsuon,
  type PitchInfo,
} from "#/components/_kiku_lazy/util/hatsuon";
import { useCardContext } from "#/components/shared/CardContext";
import type { DatasetProp } from "#/util/config";
import { parseHtml, unique } from "#/util/general";
import type { PitchType } from "#/util/types";
import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useCtxContext } from "../shared/CtxContext";
import { useGeneralContext } from "../shared/GeneralContext";

export default function Pitches() {
  const [$card] = useCardContext();
  const { ankiFields } = useAnkiFieldContext<"back">();

  const pitchPositionDoc = parseHtml(ankiFields.PitchPosition);
  const pitchNumber = unique(
    Array.from(pitchPositionDoc.querySelectorAll("span"))
      .filter((el) => {
        return !Number.isNaN(Number(el.innerText));
      })
      .map((el) => {
        return Number(el.innerText);
      }),
  );
  KIKU_STATE.logger.info("Detected pitch number:", pitchNumber);

  const kana = () => {
    if ($card.nested) return ankiFields.ExpressionReading;
    return ankiFields.ExpressionFurigana
      ? ankiFields["kana:ExpressionFurigana"]
      : ankiFields.ExpressionReading;
  };

  return pitchNumber.map((pitchNum, index) => {
    const pitchInfo = hatsuon({ reading: kana(), pitchNum: pitchNum });
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
