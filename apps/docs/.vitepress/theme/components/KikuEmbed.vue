<script setup lang="ts">
import { init } from "@repo/note";
import kikuCss from "@repo/note/_kiku.css?url";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{ side?: "front" | "back" }>();

const kikuDemoFields = {
  Expression: "十中八九",
  ExpressionFurigana: "十中八九[じっちゅうはっく]",
  ExpressionReading: "じっちゅうはっく",
  ExpressionAudio: "",
  SelectionText: "",
  MainDefinition:
    "<div><ol><li>in eight or nine cases out of ten</li><li>in all probability</li></ol></div>",
  DefinitionPicture: "",
  Sentence: "<b>十中八九</b>うまくいくよ。<br>Most likely, this will work out.",
  SentenceFurigana:
    "<b>十中八九[じっちゅうはっく]</b>うまくいくよ。<br>Most likely, this will work out.",
  SentenceAudio: "",
  Picture:
    '<img alt="Kiku preview" src="/media/lapis-to-kiku.png" loading="lazy">',
  Glossary:
    "<div><ol><li>Almost certainly.</li><li>Usually; in most cases.</li></ol></div>",
  Hint: "Embedded on the docs homepage with <code>init()</code> inside a shadow root.",
  IsWordAndSentenceCard: "1",
  IsClickCard: "",
  IsSentenceCard: "",
  IsAudioCard: "",
  PitchPosition: "",
  PitchCategories: "",
  Frequency: "",
  FreqSort: "",
  MiscInfo: "Docs demo",
  Tags: "docs-demo",
  CardID: "",
  "furigana:ExpressionFurigana":
    "<ruby><rb>十中八九</rb><rt>じっちゅうはっく</rt></ruby>",
  "kana:ExpressionFurigana": "じっちゅうはっく",
  "furigana:Sentence":
    "<b><ruby><rb>十中八九</rb><rt>じっちゅうはっく</rt></ruby></b>うまくいくよ。",
  "kanji:Sentence": "<b>十中八九</b>うまくいくよ。",
  "furigana:SentenceFurigana":
    '<span class="term"><ruby><rb>十中八九</rb><rt>じっちゅうはっく</rt></ruby></span><span class="term">うまくいくよ。</span>',
  "kana:SentenceFurigana":
    '<span class="term">じっちゅうはっく</span><span class="term">うまくいくよ。</span>',
};

const host = ref();
let dispose: () => void;

onMounted(async () => {
  if (!host.value) return;

  const isDark = document.documentElement.classList.contains("dark");
  const assetsPath = window.location.origin;
  const shadowRoot = host.value.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = kikuCss;
  shadowRoot.append(link);

  const root = document.createElement("div");
  root.id = "kiku-root";
  root.dataset.side = props.side;

  shadowRoot.append(root);

  const res = await init({
    root,
    side: props.side ?? "front",
    ankiFields: kikuDemoFields,
    assetsPath,
    rootDataset: {},
    ssr: false,
    isAnkiWeb: true,
    config: (defaultConfig) => ({
      ...defaultConfig,
      theme: isDark ? "dark" : "light",
    }),
  });

  dispose = res.dispose;
});

onBeforeUnmount(() => {
  dispose?.();
});
</script>

<template>
  <div ref="host" />
</template>
