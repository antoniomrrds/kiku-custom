import { createSignal } from "solid-js";

export default function AnkiMobileDebug() {
  // @ts-expect-error: global variable
  if (typeof KIKU_DEBUG === "boolean" && !KIKU_DEBUG) return null;

  const [count, setCount] = createSignal(0);

  const handleClick = () => {
    setCount(count() + 1);
  };
  const handleClickStopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
    setCount(count() + 1);
  };
  const onTouchend = (e: TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div>
      <div>Counter: {count()}</div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn" onClick={handleClick}>
          1. button onClick
        </button>
        <button class="btn" on:click={handleClick}>
          2. button on:click
        </button>
        {/*biome-ignore lint: debug*/}
        <div class="btn tappable" onClick={handleClick}>
          3. div tappable onClick
        </div>
        <div class="btn tappable" on:click={handleClick}>
          4. div tappable on:click
        </div>

        <button class="btn" onClick={handleClick} on:touchend={onTouchend}>
          5. button onClick on:touchend
        </button>
        <button class="btn" on:click={handleClick} on:touchend={onTouchend}>
          6. button on:click on:touchend
        </button>
        {/*biome-ignore lint: debug*/}
        <div
          class="btn tappable"
          onClick={handleClick}
          on:touchend={onTouchend}
        >
          7. div tappable onClick on:touchend
        </div>
        <div
          class="btn tappable"
          on:click={handleClick}
          on:touchend={onTouchend}
        >
          8. div tappable on:click on:touchend
        </div>

        <button class="btn" onClick={handleClickStopPropagation}>
          9. button onClick e.stopPropagation()
        </button>
        <button class="btn" on:click={handleClickStopPropagation}>
          10. button on:click e.stopPropagation()
        </button>
        {/*biome-ignore lint: debug*/}
        <div class="btn tappable" onClick={handleClickStopPropagation}>
          11. div tappable onClick e.stopPropagation()
        </div>
        <div class="btn tappable" on:click={handleClickStopPropagation}>
          12. div tappable on:click e.stopPropagation()
        </div>
      </div>
    </div>
  );
}
