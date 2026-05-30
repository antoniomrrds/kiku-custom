import { createStore } from "solid-js/store";
import { generateHydrationScript, renderToString } from "solid-js/web";
import { Front } from "#/components/Front";
import { Layout } from "#/components/Layout";
import { AnkiFieldContextProvider } from "#/contexts/AnkiFieldsContext";
import { CacheContextProvider } from "#/contexts/CacheContext";
import { CardStoreContextProvider } from "#/contexts/CardContext";
import { ConfigContextProvider } from "#/contexts/ConfigContext";
import { CtxContextProvider } from "#/contexts/CtxContext";
import {
  FieldGroupContextProvider,
  RootFieldGroupContextProvider,
} from "#/contexts/FieldGroupContext";
import { GeneralContextProvider } from "#/contexts/GeneralContext";
import { Logger } from "#/lib/logger";
import { ankiFieldsSkeleton } from "#/lib/types";
import { Back } from "../src/components/Back";
import { BreakpointContextProvider } from "../src/contexts/BreakpointContext";
import { defaultConfig } from "../src/lib/default-config";

const [$config, $setConfig] = createStore(defaultConfig);

const logger = new Logger();
const aborter = new AbortController();

export function generateSsrTemplate() {
  const frontSsrTemplate = renderToString(() => (
    <BreakpointContextProvider>
      <CacheContextProvider cacheStore={{}}>
        <GeneralContextProvider
          aborter={aborter}
          isAnkiWeb={false}
          isAnkiDesktop={false}
          workerPath={undefined}
          templateDataset={{}}
          ankiDroidAPI={undefined}
          startupTime={() => 0}
          assetsPath=""
          logger={logger}
          root={undefined}
        >
          <ConfigContextProvider value={{ $config, $setConfig }}>
            <AnkiFieldContextProvider initialAnkiFields={ankiFieldsSkeleton} isRoot>
              <CardStoreContextProvider side="front" initialNsfw={false}>
                <FieldGroupContextProvider>
                  <RootFieldGroupContextProvider>
                    <CtxContextProvider>
                      <Layout>
                        <Front />
                      </Layout>
                    </CtxContextProvider>
                  </RootFieldGroupContextProvider>
                </FieldGroupContextProvider>
              </CardStoreContextProvider>
            </AnkiFieldContextProvider>
          </ConfigContextProvider>
        </GeneralContextProvider>
      </CacheContextProvider>
    </BreakpointContextProvider>
  ));
  const backSsrTemplate = renderToString(() => (
    <BreakpointContextProvider>
      <CacheContextProvider cacheStore={{}}>
        <GeneralContextProvider
          aborter={aborter}
          isAnkiWeb={false}
          isAnkiDesktop={false}
          workerPath={undefined}
          templateDataset={{}}
          ankiDroidAPI={undefined}
          startupTime={() => 0}
          assetsPath=""
          logger={logger}
          root={undefined}
        >
          <ConfigContextProvider value={{ $config: $config, $setConfig: $setConfig }}>
            <AnkiFieldContextProvider initialAnkiFields={ankiFieldsSkeleton}>
              <CardStoreContextProvider side="back" initialNsfw={false}>
                <FieldGroupContextProvider>
                  <RootFieldGroupContextProvider>
                    <CtxContextProvider>
                      <Layout>
                        <Back />
                      </Layout>
                    </CtxContextProvider>
                  </RootFieldGroupContextProvider>
                </FieldGroupContextProvider>
              </CardStoreContextProvider>
            </AnkiFieldContextProvider>
          </ConfigContextProvider>
        </GeneralContextProvider>
      </CacheContextProvider>
    </BreakpointContextProvider>
  ));

  const hydrationScript = generateHydrationScript();

  const result = {
    frontSsrTemplate,
    backSsrTemplate,
    hydrationScript,
  };
  return result;
}
