import type { KikuConfig } from "#/lib/config.ts";
import type { Constants } from "#/lib/contants.ts";
import type { Logger } from "../lib/logger.ts";
import { MainThreadApi } from "./MainThreadApi.ts";
import { NexMain, type NexRemote } from "./nex";
import type { WorkerThreadApi } from "./WorkerThreadApi.ts";

export type NexApi = NexRemote<WorkerThreadApi>;

export async function createNex(
  opts: {
    constants: Constants;
    assetsPath: string;
    config: KikuConfig;
    preferAnkiConnect: boolean;
    workerPath?: string;
  },
  logger: Logger,
  existingNex?: NexApi,
) {
  if (existingNex) {
    const nex = existingNex;
    await nex.init(opts);
    return nex;
  }

  let worker: Worker;
  if (opts.assetsPath !== window.location.origin && !import.meta.env.DEV) {
    worker = new Worker(`${opts.assetsPath}/_kiku_worker.js`, {
      type: "module",
    });
  } else if (opts.workerPath) {
    worker = new Worker(opts.workerPath, { type: "module" });
  } else {
    worker = new Worker(new URL("./_kiku_worker.ts", import.meta.url), {
      type: "module",
    });
  }

  const mainThreadApi = new MainThreadApi(logger);
  const nex: NexApi = new NexMain<WorkerThreadApi>(worker).wrap(mainThreadApi);
  await nex.init(opts);
  return nex;
}
