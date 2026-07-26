import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { VPButton } from "vitepress/theme";

const cardFieldNames = [
  "IsWordAndSentenceCard",
  "IsClickCard",
  "IsSentenceCard",
  "IsAudioCard",
] as const;

type CardFieldName = (typeof cardFieldNames)[number];

export default defineComponent({
  setup() {
    const selectedField = ref<CardFieldName | "">("");
    const side = ref<"front" | "back">("front");
    const darkMode = ref(
      import.meta.env.SSR
        ? true
        : document.documentElement.classList.contains("dark"),
    );
    const hostRef = ref<HTMLElement | null>(null);
    const toggleLabel = computed(() =>
      side.value === "front" ? "Show back" : "Show front",
    );

    function toggleSide(): void {
      side.value = side.value === "front" ? "back" : "front";
    }

    function updateHostAttrs(): void {
      const el = hostRef.value;
      if (!el) return;
      if (darkMode.value) {
        el.setAttribute("data-dark-mode", "");
      } else {
        el.removeAttribute("data-dark-mode");
      }
      el.setAttribute("side", side.value);
      el.setAttribute("selected-field", selectedField.value);
    }

    onMounted(() => {
      updateHostAttrs();
      const observer = new MutationObserver(() => {
        queueMicrotask(() => {
          const isDark = document.documentElement.classList.contains("dark");
          darkMode.value = isDark;
        });
      });
      observer.observe(document.documentElement, { attributes: true });
      onBeforeUnmount(() => observer.disconnect());
    });

    watch([darkMode, side, selectedField], updateHostAttrs);

    watch(selectedField, () => {
      side.value = "front";
    });

    return () => (
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          {
            // @ts-expect-error - VPButton lacks prop types
            <VPButton theme="alt" text="" onClick={toggleSide}>
              {toggleLabel.value}
            </VPButton>
          }
          <label
            style={{
              display: "inline-flex",
              gap: "0.4rem",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              value=""
              checked={selectedField.value === ""}
              onChange={() => (selectedField.value = "")}
              style={{ margin: 0 }}
            />
            <span>Default</span>
          </label>
          {cardFieldNames.map((fieldName) => (
            <label
              key={fieldName}
              style={{
                display: "inline-flex",
                gap: "0.4rem",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                value={fieldName}
                checked={selectedField.value === fieldName}
                onChange={() => (selectedField.value = fieldName)}
                style={{ margin: 0 }}
              />
              <span>{fieldName}</span>
            </label>
          ))}
        </div>

        <kiku-host-docs
          ref={hostRef}
          id="kiku-host"
          data-theme="light"
          data-theme-dark="dark"
          style={{
            zIndex: 10,
            position: "relative",
            maxHeight: "75vh",
            overflow: "auto",
            borderRadius: "0.5rem",
            boxShadow:
              "0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a",
          }}
        />
      </div>
    );
  },
});
