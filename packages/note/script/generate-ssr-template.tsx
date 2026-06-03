import { createStore } from "solid-js/store";
import { generateHydrationScript, renderToString } from "solid-js/web";
import { Front } from "#/src/components/Front";
import { Layout } from "#/src/components/Layout";
import { AnkiFieldContextProvider } from "#/src/contexts/AnkiFieldsContext";
import { CacheContextProvider } from "#/src/contexts/CacheContext";
import { CardStoreContextProvider } from "#/src/contexts/CardContext";
import { ConfigContextProvider } from "#/src/contexts/ConfigContext";
import { CtxContextProvider } from "#/src/contexts/CtxContext";
import {
  FieldGroupContextProvider,
  RootFieldGroupContextProvider,
} from "#/src/contexts/FieldGroupContext";
import { GeneralContextProvider } from "#/src/contexts/GeneralContext";
import { Logger } from "#/src/lib/logger";
import { ankiFieldsSkeleton } from "#/src/lib/types";
import { Back } from "#/src/components/Back";
import { BreakpointContextProvider } from "#/src/contexts/BreakpointContext";
import { defaultConfig } from "#/src/lib/default-config";

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
              <CardStoreContextProvider initialSide="front" initialNsfw={false}>
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
            <AnkiFieldContextProvider initialAnkiFields={ankiFieldsSkeleton} isRoot>
              <CardStoreContextProvider initialSide="back" initialNsfw={false}>
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
