<script setup lang="ts">
import { init } from "@repo/note";
import kikuCssUrl from "@repo/note/_kiku.css?url";
import kikuWorkerUrl from "@repo/note/_kiku_worker.js?url";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{ side?: "front" | "back" }>();

const kikuDemoFields = {
  Expression: "貢献",
  ExpressionFurigana: "貢献[こうけん]",
  ExpressionReading: "こうけん",
  ExpressionAudio:
    '<a class="replay-button soundLink" href="#" onclick="return false;" draggable="false"></a>',
  SelectionText:
    '<ol><li data-details="JMdict"><span class="dict-group__tag-list"><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">1</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">n</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">vi</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">vs</span></span><span class="dict-group__tag dict-group__tag--dict"><span class="dict-group__tag-inner">JMdict</span></span></span><span class="dict-group__glossary"><span><ul data-sc-content="glossary" lang="en" style="list-style-type: circle;"><li>contribution (furthering a goal or cause)</li><li>services (to a cause)</li></ul><ul data-sc-content="examples" lang="ja" style="list-style-type: square;"><li>彼は国への貢献を認められてナイト爵位を与えられた。</li><li lang="en" style="font-size: 60%; list-style-type: none;">He was awarded a knighthood in acknowledgement of his services to the nation.</li></ul></span></span></li><li data-details="JMdict"><span class="dict-group__tag-list"><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">2</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">n</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">vs</span></span><span class="dict-group__tag dict-group__tag--name"><span class="dict-group__tag-inner">hist</span></span><span class="dict-group__tag dict-group__tag--dict"><span class="dict-group__tag-inner">JMdict</span></span></span><span class="dict-group__glossary">paying tribute | tribute</span></li></ol>',
  MainDefinition: "",
  DefinitionPicture: "",
  Sentence:
    '<span data-group-id="11">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id="10">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―',
  SentenceFurigana: "",
  SentenceAudio:
    '<span data-group-id="11">\n<a class="replay-button soundLink" href="#" onclick="return false;" draggable="false"></a></span><span data-group-id="10">\n<a class="replay-button soundLink" href="#" onclick="return false;" draggable="false"></a></span>\n<a class="replay-button soundLink" href="#" onclick="return false;" draggable="false"></a>',
  Picture:
    '<img data-group-id="11" src="Anime_Time_Solo_Leveli_928960_pzThqpQf.jpeg" decoding="async"><img data-group-id="10" src="SubsPlease%20Tate%20no%20Yuusha%20no%20Nariagari%20S3%20-%2010%20(1080p)%20BCA53DD5.mkv_1190221.jpeg" decoding="async"><div><img src="cbt%20gochuumon%20wa%20usagi%20desuka%20s01e09%20bdrip%201920x1080%20x264%20flac%209092049a.mkv_957803.webp" decoding="async"></div>',
  Glossary: "",
  Hint: "",
  IsWordAndSentenceCard: "",
  IsClickCard: "",
  IsSentenceCard: "",
  IsAudioCard: "",
  PitchPosition:
    '<div class="pa-positions__group" data-details="アクセント辞典"><div class="pa-positions__dictionary"><div class="pa-positions__dictionary-inner">アクセント辞典</div></div><ol><li><span style="display:inline;"><span>[</span><span>0</span><span>]</span></span></li></ol></div>',
  PitchCategories: "",
  Frequency: "",
  FreqSort: "4509",
  MiscInfo: "",
  Tags: "yomichan",
  CardID: "1763367941303",
  "furigana:ExpressionFurigana": "<ruby><rb>貢献</rb><rt>こうけん</rt></ruby>",
  "kana:ExpressionFurigana": "こうけん",
  "furigana:Sentence":
    '<span data-group-id="11">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id="10">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―',
  "kanji:Sentence":
    '<span data-group-id="11">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id="10">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―',
  "furigana:SentenceFurigana": "",
  "kana:SentenceFurigana": "",
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
  link.href = kikuCssUrl;
  shadowRoot.append(link);

  const root = document.createElement("div");
  root.id = "kiku-root";
  root.dataset.side = props.side;
  root.style.minHeight = "720px";

  shadowRoot.append(root);

  const res = await init({
    root,
    side: props.side ?? "front",
    ankiFields: kikuDemoFields,
    assetsPath,
    rootDataset: {
      blurNsfw: "true",
      modVertical: "false",
      pictureOnFront: "false",
      theme: isDark ? "dark" : "light",
    },
    ssr: false,
    isAnkiWeb: true,
    workerPath: kikuWorkerUrl,
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
  <div style="max-height: 85vh; overflow: auto">
    <div ref="host" />
  </div>
</template>
