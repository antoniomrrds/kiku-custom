import { useAnkiFieldContext } from "../shared/AnkiFieldsContext";
import { useConfigContext } from "../shared/ConfigContext";

const FREQ_LEVELS = [
  {
    test: (f: number) => f === 9999999,
    orb: "🦕",
    stars: 0,
    label: "desconhecida",
    desc: "Fora dos rankings de frequência padrão",
    hint: "Possivelmente muito rara ou técnica",
  },
  {
    test: (f: number) => Number.isNaN(f) || f === 0,
    orb: "∅",
    stars: 0,
    label: "sem dados",
    desc: "Frequência não encontrada",
    hint: "Verifique a fonte de frequência",
  },
  {
    test: (f: number) => f >= 60000,
    orb: "📖",
    stars: 1,
    label: "muito baixa",
    desc: "Vocabulário especializado",
    hint: "Encontrada principalmente em textos técnicos",
  },
  {
    test: (f: number) => f >= 30000,
    orb: "📙",
    stars: 1,
    label: "baixa",
    desc: "Aparece em textos específicos",
    hint: "Mais útil para leitura avançada",
  },
  {
    test: (f: number) => f >= 15000,
    orb: "📗",
    stars: 2,
    label: "média-baixa",
    desc: "Menos frequente",
    hint: "Intermediário-avançado",
  },
  {
    test: (f: number) => f >= 5000,
    orb: "📘",
    stars: 3,
    label: "média",
    desc: "Comum em vários tipos de texto",
    hint: "Bom vocabulário intermediário",
  },
  {
    test: (f: number) => f >= 1500,
    orb: "⭐",
    stars: 4,
    label: "alta",
    desc: "Muito comum",
    hint: "Prioridade alta de aprendizado",
  },
  {
    test: (f: number) => f > 0,
    orb: "🔥",
    stars: 5,
    label: "muito alta",
    desc: "Vocabulário essencial",
    hint: "Fundamental para fluência básica",
  },
];

export default function FrequencyIndicator() {
  const { ankiFields } = useAnkiFieldContext<"back">();
  const [$config] = useConfigContext();

  const visible = ["back", "both", "front"].includes(
    $config.frequencyIndicatorPosition as string,
  );

  if (!visible) {
    return null;
  }

  const freq = Number(ankiFields.FreqSort);
  const level = FREQ_LEVELS.find((l) => l.test(freq));
  if (!level) return null;

  const stars = Array.from({ length: 5 }, (_, i) =>
    i < level.stars ? "★" : "☆",
  ).join("");

  const rank =
    !Number.isNaN(freq) && freq > 0 ? `#${freq.toLocaleString("pt-BR")}` : "—";

  return (
    <div class="w-full">
      <div class="w-full mt-4 p-3 bg-base-200 rounded-lg border-s-4 border-primary flex flex-col gap-1">
        <div class="flex items-center gap-3">
          <span class="text-xl">{level.orb}</span>

          <div class="text-yellow-400 text-sm">{stars}</div>

          <span class="flex-1 text-xs uppercase tracking-widest font-bold color-dict">
            freq.{level.label}
          </span>

          <span class="hidden md:inline text-xs opacity-70">{level.desc}</span>

          <span class="text-xs font-bold px-2 py-1 rounded-full bg-base-300 color-dict">
            {rank}
          </span>

          <span
            class="md:hidden tooltip tooltip-left text-xs px-2 py-1 rounded-full bg-base-300 cursor-help"
            data-tip={level.hint}
          >
            💡
          </span>
        </div>

        <p class="hidden md:block text-xs opacity-50 text-center">
          {level.hint}
        </p>
      </div>
    </div>
  );
}
