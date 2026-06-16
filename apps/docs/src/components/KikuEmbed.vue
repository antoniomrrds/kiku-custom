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

const selectedCardField = ref<CardFieldName | "">("");
const currentSide = ref<"front" | "back">("front");
const toggleLabel = computed(() => (currentSide.value === "front" ? "Show back" : "Show front"));

function toggleSide(): void {
  currentSide.value = currentSide.value === "front" ? "back" : "front";
}
</script>

<template>
  <div style="display: grid; gap: 0.75rem">
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
      <VPButton theme="alt" text="" @click="toggleSide">
        {{ toggleLabel }}
      </VPButton>
      <label style="display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer">
        <input v-model="selectedCardField" type="radio" value="" style="margin: 0" />
        <span>Default</span>
      </label>
      <label
        v-for="fieldName in cardFieldNames"
        :key="fieldName"
        style="display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer"
      >
        <input v-model="selectedCardField" type="radio" :value="fieldName" style="margin: 0" />
        <span>{{ fieldName }}</span>
      </label>
    </div>
    <div style="max-height: 75vh; overflow: auto" v-bind:side="currentSide">
      <kiku-host-docs
        id="kiku-host"
        data-theme="light"
        data-theme-dark="dark"
        style="z-index: 10; position: relative"
        :side.attr="currentSide"
        :selected-field.attr="selectedCardField"
      />
    </div>
  </div>
</template>
