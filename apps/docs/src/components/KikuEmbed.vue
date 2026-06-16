<script setup lang="ts">
import { computed, ref } from "vue";

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
const toggleLabel = computed(() => (side.value === "front" ? "Show back" : "Show front"));

function toggleSide(): void {
  side.value = side.value === "front" ? "back" : "front";
}
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
    <div style="max-height: 75vh; overflow: auto" v-bind:side="side">
      <kiku-host-docs
        id="kiku-host"
        data-dark-mode
        data-theme="light"
        data-theme-dark="dark"
        style="z-index: 10; position: relative"
        :side.attr="side"
        :selected-field.attr="selectedField"
      />
    </div>
  </div>
</template>
