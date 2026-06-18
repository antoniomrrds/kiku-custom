import { KikuHost } from "@repo/note";
import kikuWorkerUrl from "@repo/note/_kiku_worker.js?url";
import kikuEmbedCSS from "#/src/styles/kiku-embed.css?raw";

const cardFieldNames = [
  "IsWordAndSentenceCard",
  "IsClickCard",
  "IsSentenceCard",
  "IsAudioCard",
] as const;

//oxfmt-ignore
const exampleFields = {
  "Expression": "貢献",
  "ExpressionFurigana": "貢献[こうけん]",
  "ExpressionReading": "こうけん",
  "ExpressionAudio": "<a class=\"replay-button soundLink\" href=\"#\" onclick=\"return false;\" draggable=\"false\">\n    <svg class=\"playImage\" viewBox=\"0 0 64 64\" version=\"1.1\">\n        <circle cx=\"32\" cy=\"32\" r=\"29\"></circle>\n        <path d=\"M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z\"></path>\n    </svg>\n</a>",
  "RelatedExpression": "",
  "SelectionText": "<ol><li data-details=\"JMdict\"><span class=\"dict-group__tag-list\"><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">1</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">n</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">vi</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">vs</span></span><span class=\"dict-group__tag dict-group__tag--dict\"><span class=\"dict-group__tag-inner\">JMdict</span></span></span><span class=\"dict-group__glossary\"><span><ul data-sc-content=\"glossary\" lang=\"en\" style=\"list-style-type: circle;\"><li>contribution (furthering a goal or cause)</li><li>services (to a cause)</li></ul><ul data-sc-content=\"examples\" lang=\"ja\" style=\"list-style-type: square;\"><li>彼は国への貢献を認められてナイト爵位を与えられた。</li><li lang=\"en\" style=\"font-size: 60%; list-style-type: none;\">He was awarded a knighthood in acknowledgement of his services to the nation.</li></ul></span></span></li><li data-details=\"JMdict\"><span class=\"dict-group__tag-list\"><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">2</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">n</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">vs</span></span><span class=\"dict-group__tag dict-group__tag--name\"><span class=\"dict-group__tag-inner\">hist</span></span><span class=\"dict-group__tag dict-group__tag--dict\"><span class=\"dict-group__tag-inner\">JMdict</span></span></span><span class=\"dict-group__glossary\">paying tribute | tribute</span></li></ol>",
  "MainDefinition": "",
  "DefinitionPicture": "",
  "Sentence": "<span data-group-id=\"11\">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id=\"10\">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―",
  "SentenceFurigana": "",
  "SentenceTranslation": "<span data-group-id=\"11\">I wonder if this will allow me to contribute to the world, even just a little.</span><span data-group-id=\"10\">Anyway, if we contribute to capturing the hero...</span>To contribute to this shop—",
  "SentenceAudio": "<span data-group-id=\"11\">\n<a class=\"replay-button soundLink\" href=\"#\" onclick=\"return false;\" draggable=\"false\">\n    <svg class=\"playImage\" viewBox=\"0 0 64 64\" version=\"1.1\">\n        <circle cx=\"32\" cy=\"32\" r=\"29\"></circle>\n        <path d=\"M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z\"></path>\n    </svg>\n</a></span><span data-group-id=\"10\">\n<a class=\"replay-button soundLink\" href=\"#\" onclick=\"return false;\" draggable=\"false\">\n    <svg class=\"playImage\" viewBox=\"0 0 64 64\" version=\"1.1\">\n        <circle cx=\"32\" cy=\"32\" r=\"29\"></circle>\n        <path d=\"M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z\"></path>\n    </svg>\n</a></span>\n<a class=\"replay-button soundLink\" href=\"#\" onclick=\"return false;\" draggable=\"false\">\n    <svg class=\"playImage\" viewBox=\"0 0 64 64\" version=\"1.1\">\n        <circle cx=\"32\" cy=\"32\" r=\"29\"></circle>\n        <path d=\"M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z\"></path>\n    </svg>\n</a>",
  "Picture": "<img data-group-id=\"11\" src=\"Anime_Time_Solo_Leveli_928960_pzThqpQf.jpeg\"><img data-group-id=\"10\" src=\"SubsPlease%20Tate%20no%20Yuusha%20no%20Nariagari%20S3%20-%2010%20(1080p)%20BCA53DD5.mkv_1190221.jpeg\"><div><img src=\"cbt%20gochuumon%20wa%20usagi%20desuka%20s01e09%20bdrip%201920x1080%20x264%20flac%209092049a.mkv_957803.webp\"></div>",
  "Glossary": "",
  "Hint": "",
  "IsWordAndSentenceCard": "",
  "IsClickCard": "",
  "IsSentenceCard": "",
  "IsAudioCard": "",
  "PitchPosition": "<div class=\"pa-positions__group\" data-details=\"アクセント辞典\"><div class=\"pa-positions__dictionary\"><div class=\"pa-positions__dictionary-inner\">アクセント辞典</div></div><ol><li><span style=\"display:inline;\"><span>[</span><span>0</span><span>]</span></span></li></ol></div>",
  "PitchCategories": "",
  "Frequency": "",
  "FreqSort": "4509",
  "MiscInfo": "",
  "Tags": "leech yomichan",
  "CardID": "1763367941303",
  "furigana:ExpressionFurigana": "<ruby><rb>貢献</rb><rt>こうけん</rt></ruby>",
  "kana:ExpressionFurigana": "こうけん",
  "furigana:Sentence": "<span data-group-id=\"11\">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id=\"10\">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―",
  "kanji:Sentence": "<span data-group-id=\"11\">これで 少しは<br>世の中に<b>貢献</b>できるかな</span><span data-group-id=\"10\">どうせ勇者の捕縛に<b>貢献</b>すれば➡</span>このお店に<b>貢献</b>するために―",
  "furigana:SentenceFurigana": "",
  "kana:SentenceFurigana": ""
}

export class KikuHostDocs extends KikuHost {
  #dispose: (() => void) | undefined;
  #root: HTMLElement;
  #styleTags: HTMLStyleElement[] = [];
  #stylesLoaded = false;

  constructor() {
    super();
    const root = document.createElement("div");

    root.id = "kiku-root";
    root.part = "root";
    root.style.minHeight = "720px";
    root.dataset.blurNsfw = "true";
    root.dataset.modVertical = "false";
    root.dataset.pictureOnFront = "false";
    root.dataset.theme = "light";
    root.dataset.themeDark = "dark";

    this.#root = root;
  }

  static get observedAttributes() {
    return ["side", "selected-field", "data-dark-mode"];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "side") {
      this.side = value === "front" ? "front" : "back";
    }
    if (!this.#root) return;
    this.requestUpdate();
  }

  connectedCallback() {
    const { shadow } = this;
    shadow.append(this.#root);

    const style = document.createElement("style");
    style.innerHTML = kikuEmbedCSS;
    this.#styleTags = [style];
    shadow.append(style);

    this.#loadStyles().then(() => {
      this.#stylesLoaded = true;
      this.requestUpdate();
    });
    this.requestUpdate();
  }

  render() {
    console.log("#render");
    if (!this.#stylesLoaded) return;
    console.log("#render real");
    this.#dispose?.();
    this.now = performance.now();
    const isDark = document.documentElement.classList.contains("dark");
    const selectedField = this.getAttribute("selected-field") ?? "";

    const ankiFields = {
      ...exampleFields,
      ...Object.fromEntries(
        cardFieldNames.map((name) => [name, selectedField === name ? "x" : ""]),
      ),
      ExpressionAudio:
        selectedField === "IsAudioCard" && this.side === "front"
          ? ""
          : exampleFields.ExpressionAudio,
    };

    const res = super.render({
      root: this.#root,
      styleTags: this.#styleTags,
      ankiFields,
      rootDataset: {
        blurNsfw: "true",
        modVertical: "false",
        pictureOnFront: "false",
        theme: "light",
        themeDark: "dark",
      },
      isAnkiWeb: true,
      workerPath: kikuWorkerUrl,
      initialDarkMode: isDark,
      config: (defaultConfig) => ({ ...defaultConfig }),
    });
    if (res) this.#dispose = res.dispose;
  }

  async #loadStyles() {
    const { shadow } = this;
    const kikuCSSStyleSheet = new CSSStyleSheet();
    if (import.meta.env.DEV) {
      const kikuCSS = await import("@repo/note/_kiku.css?inline");
      kikuCSSStyleSheet.replaceSync(kikuCSS.default);
    } else {
      const kikuCssRes = await fetch("/_kiku.css");
      const kikuCss = await kikuCssRes.text();
      kikuCSSStyleSheet.replaceSync(kikuCss);
    }
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, kikuCSSStyleSheet];
  }
}

customElements.define("kiku-host-docs", KikuHostDocs);
