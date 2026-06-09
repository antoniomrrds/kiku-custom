import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { ErrorBoundary, Show } from "solid-js";

export default function ExternalLinks() {
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  return (
    <ErrorBoundary fallback={<DefaultExternalLinks />}>
      <Show when={$general.plugin?.ExternalLinks} fallback={<DefaultExternalLinks />}>
        {(get) => {
          const ExternalLinks = get();
          return <ExternalLinks ctx={ctx} DefaultExternalLinks={DefaultExternalLinks} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}

function DefaultExternalLinks() {
  const { $ankiFields } = useAnkiFieldContext();

  return (
    <>
      <a
        href={(() => {
          const url = new URL("https://jpdb.io/search");
          url.searchParams.set("q", $ankiFields.Expression);
          return url.toString();
        })()}
        target="_blank"
        rel="noopener"
      >
        <img
          class="size-5 object-contain rounded-xs"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAXRQTFRF//////39/6+v/2dn/7Oz//7+/9zc/x8f/wAA/yUl/+Li/9/f/yQk/yoq/+Tk/7u7/3h4/7+/+vr65+fn5eXl+/v77+/v5OTk8vLy9PT01tbWx8fH0NDQ6+vr4eHhZmZmWVlZZ2dn4+PjnZ2dV1dXWFhYqqqqzMzMc3NzUVFRS0tLTk5OZGRkqamp9vb23d3dVFRURUVFVVVV4ODgkpKSRERERkZGWlpaUFBQTU1NSEhIl5eXVlZWR0dHYmJitLS019fXysrKhoaGSkpKxMTEzc3Nfn5+g4ODfX19v7+/7Ozs2NjYUlJSnJyc3Nzc3t7ei4uL/v7+zs7OXFxc5ubm6urqnp6ecnJyjo6O/f39+Pj4wMDApqamU1NTZWVlgoKCdnZ2a2tr6enpioqKQkJCbW1t1dXVxcXFgYGBsrKyy8vLX19flpaW/Pz80dHR+fn5xsbGlZWV29vbSUlJwsLCm5ub8/Pzvr6+2tra9fX139/f7e3tX4KuCgAAAVZJREFUeJxjZCAAGOmngBEEfuNRwAZS8A2PAm7GP6yMn/AoYOViZHxPkSOFGBn/M71mEGNkYHwhCXLPYzQFciDBewzKjAhwCUWBPkjoLIMJI+Mn/v9MjH8ZWBivv0NRwMzC9h2o4C8nM0T/r3eSe7Aq4PksupuBQVL3w2+xc6+xKWAQPwsS9/z1mYNnG1YFXEdBfG/GV+/4z2JVILMZxPd7xPZHdiNWBfKM64H8oJvcsoxrsClg/aa5GsgPe/Bb7fol7N6UPmrDyHhK4qfaEuzhoHwWGFonRb4YMM7DqoBV9+I3K4aLHBqMs9CCmu3dr0dgb14PPWvyQnLLY9TIyjr/1/TVapAC6ykMDLlP1qNEt5Cz5Ke7X8TVJ8IUIAGwAu+HPP9+6whPYADGJoNNP6aColvqe3/4PF3OwFD64rLaKkwFZYxAr7WDWF4GDIytmArwATooAAA9VoEhkeDABAAAAABJRU5ErkJggg=="
          alt="JPDB"
        />
      </a>

      <a href={`https://jisho.org/search/${$ankiFields.Expression}`} target="_blank" rel="noopener">
        <img
          class="size-5 object-contain rounded-xs"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAFpQTFRFVtkm////+f73vPCpXdovWtort++j+P32u++osu2c9Pvx6vjl9Pvy9Pry2u/S5vTh4vLcSLYgR7Qfa79M6/bmc8JWR7QgU9Alf8pjfspiUs4kVc0pVM0nVtgmNSyDBQAAAH5JREFUeJxjZCAAGEcVwBXAFTEyMv5hYGVk/AUT+I+mgIGB/QcD5w8EF1MB5zcG7m/4FACFeL4SUMD7ZVQBDgV8MD7jJ7AC/n8wgU8QBYJwBYyMbxj42Rh/wwTeo6cHccYXDJKMz5CF0BKM9FMGmScMeBTIPgYhPAowwWBQAADBWTUhzGucIAAAAABJRU5ErkJggg=="
          alt="Jisho"
        />
      </a>
      <a
        href={(() => {
          const url = new URL("https://www.google.co.jp/search");
          url.searchParams.set("q", $ankiFields.Expression);
          return url.toString();
        })()}
        target="_blank"
        rel="noopener"
      >
        <img
          class="size-5 object-contain rounded-xs"
          src="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAE3ElEQVRYhc2XW2xUVRSGv30uU9rTMhUaCuVixQSMpLYmPIhYwAcTIyKFROI1KQmkxBgj8UEf5MEYiSYmPvhAfCASY02MUaFEHjSRQYtGNDAqIhKxQJVeodPLMJ2Zc/by4cz91tZ4+5Od2Wf2Xuv/z9lrr722EhFmiTagA9gEbCwz5wQQAg4D4Vl5FZGZWqeIhGXuCKdsK/qvNNgsIqG/QFyIUMrXnAR0iEjkbyBPI5LyWcSlpDgGOoG3S67XV71wshd+CMPwEAiAAShoXIy0tsL6dtS6u8qt+E7gUO4fhQI6gI+LzM6ehjf2w9AQJC1QgCi/KRMwQZmIYSLKRBYvwXj2KVTLmlIituEHaZGAZvzIDeZN/+BVOPwhTAX850QgS44CZWWaoBDTRgzbd77lfoxdTxYKGMffUZfA/35pHCoif+8F+Pxdvx/wSr1NPpSR/3z2HERvFM4KkrMMaYtOCvf2p8/A5W5ouAHz4+AkoDoJpguGB6QEpT6GAKJUVsstKzBe2QdOTSmpG1OcmSUIA62Z4eEeCD0BV+pgnoahOhhwwBCwVsL23bCuHZxaf340Cl9/g+5+H0YjcOvKSuRpfA+0KRFpA87kDX2xCgYHIWpDNOALmLLhju2w4/kscSGiUeTIMdTWzTORp3GnhR/5WYwdhUA/NBhQKzDtQZUHddvhkZcru3Mc1GMPz4Y4jQ4LP7dnETkK8wywACVgu2DUwQOvzcXxbLHJojD4pnuz/WoBF1j2KATyN0ga310p41pAkc0xCqEpqFhcr3JnbbSK7OJ9oAyUpcAEAsDSLWVfYXd3OQGFGVaxpx262vP/Ldi4KelCZk+LoWDeirICykKpbEs/l0CRABGd7aeMhNLGcxJTxk/xFxAN4uJpl6R4TIuLG79U0b+gEbxU06TSUqpVRlEMEGhGJy4zJRpLmVzXHtWRIzTUbSjpoOueNInK++35EQbGZ+THwi+jMjtB17bjXesDDKLaT7f9I+9Q37QPy6wvcrCnXeWQ+5ichu5v08IkM7725iLzEwZ+DZeB1G9lVAv9nseg1vziac7EJ/nk1z0zv04KB89EGXVjRO0pkkYCVyVJGgnWFsdyyCDnbAaw6zsYtldwUQtXtTCshUEx+HL0Mw5e2MuUO1mR/MBPf7A//DvjNcNMVI8QC0zhGR4PtZQM5MMlD6OJiRDHz91LRBTjYtAnDtd1DWPikAi0squ5i/sa1hO0nIynnoGLvHn+Ar0DMQKx5VhuNbZbg5MIYno2x3fXsTSYJyJzGEGJMizUt5fjVw8wLjaXJciEOEyKw5DXSJwASapI6lpqzflEkh6SDEJ8CYiJii3HdB0CroMdX0BXy0Je2lAUPzuBQ7kVUYiCtNx9oYuPhnoYkIV4YjGmb2JSGnBReFKFxsbVVSgE8Rz09BJQGuJNWLEmPMOlrXYZJ7fdXkh+gtQZlJsHOvHLpQweX/UWmxp3ABCXQHZAzEzXUG6mr6yJTN+1x3lw+SKObV5dSD6e4vJtZlOUnoqc5rmfX+e32AQxCSIYCCag0NryT01dhXjVSHIBtbKUF29bx9OrVxW6ggpFaRqdlCnLj42c4uhImN6x8/RPXwMUIgYKYb5Zz93BNrY0ruHBRS0E7apSLorK8v/8YvK/vZr9a5fTUjFQDv/I9fxPxUx0d1WRkbMAAAAASUVORK5CYII="
          alt="Google"
        />
      </a>
    </>
  );
}
