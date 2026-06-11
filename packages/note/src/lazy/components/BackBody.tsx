import { useConfigContext } from "#/src/contexts/ConfigContext";
import Sentence from "./Sentence";
import Definition from "./Definition";

export default function BackBody() {
  const { $config } = useConfigContext();

  return (
    <div
      class="flex sm:flex-col gap-2 sm:gap-4"
      classList={{
        "flex-col-reverse": $config.swapSentenceAndDefinitionOnMobile,
        "flex-col": !$config.swapSentenceAndDefinitionOnMobile,
      }}
    >
      <Sentence />
      <Definition />
    </div>
  );
}
