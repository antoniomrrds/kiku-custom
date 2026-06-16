<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{}>();

const cardFieldNames = [
  "IsWordAndSentenceCard",
  "IsClickCard",
  "IsSentenceCard",
  "IsAudioCard",
] as const;

type CardFieldName = (typeof cardFieldNames)[number];

const selectedField = ref<CardFieldName | "">("");
const side = ref<"front" | "back">("front");
const darkMode = ref(
  import.meta.env.SSR ? true : document.documentElement.classList.contains("dark"),
);
const toggleLabel = computed(() => (side.value === "front" ? "Show back" : "Show front"));

function toggleSide(): void {
  side.value = side.value === "front" ? "back" : "front";
}

onMounted(() => {
  const observer = new MutationObserver(() => {
    queueMicrotask(() => {
      const isDark = document.documentElement.classList.contains("dark");
      darkMode.value = isDark;
    });
  });
  observer.observe(document.documentElement, { attributes: true });
  onBeforeUnmount(() => observer.disconnect());
});

watch(selectedField, () => {
  side.value = "front";
});
</script>

<template>
  <div style="display: grid; gap: 0.75rem">
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
      <VPButton theme="alt" text="" @click="toggleSide">
        {{ toggleLabel }}
      </VPButton>
      <label style="display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer">
        <input v-model="selectedField" type="radio" value="" style="margin: 0" />
        <span>Default</span>
      </label>
      <label
        v-for="fieldName in cardFieldNames"
        :key="fieldName"
        style="display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer"
      >
        <input v-model="selectedField" type="radio" :value="fieldName" style="margin: 0" />
        <span>{{ fieldName }}</span>
      </label>
    </div>

    <kiku-host-docs
      id="kiku-host"
      data-theme="light"
      data-theme-dark="dark"
      style="
        z-index: 10;
        position: relative;
        max-height: 75vh;
        overflow: auto;
        border-radius: 0.5rem;
        box-shadow:
          0 4px 6px -1px #0000001a,
          0 2px 4px -2px #0000001a;
      "
      :data-dark-mode.attr="darkMode ? '' : null"
      :side.attr="side"
      :selected-field.attr="selectedField"
    />
  </div>
</template>
