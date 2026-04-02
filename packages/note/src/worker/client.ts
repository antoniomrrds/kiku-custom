import type { KikuConfig } from "#/util/config";
import type { Constants } from "#/util/general";
import type { Logger } from "../util/logger";
import type { NexApi } from "./_kiku_worker.ts";

export type { NexApi } from "./_kiku_worker.ts";

export type NexPromise = PromiseWithResolvers<NexApi> & {
  resolved: boolean;
};

export function createNexPromise(): NexPromise {
  const nex = Promise.withResolvers<NexApi>() as NexPromise;
  nex.resolved = false;

  const resolve = nex.resolve.bind(nex);
  nex.resolve = (value) => {
    nex.resolved = true;
    resolve(value);
  };

  return nex;
}

export function wrap<T>(worker: Worker, logger: Logger) {
  let msgId = 0;
  const pending = new Map();

  worker.onmessage = (e) => {
    const { id, result, error, log } = e.data;
    if (log) {
      logger.push(log.level, log.args);
      return;
    }

    const { resolve, reject } = pending.get(id);
    pending.delete(id);
    error ? reject(error) : resolve(result);
  };

  return new Proxy(
    {},
    {
      get(_, fn) {
        if (fn === "then") return undefined;
        return (...args: unknown[]) =>
          new Promise((resolve, reject) => {
            const id = ++msgId;
            pending.set(id, { resolve, reject });
            worker.postMessage({ id, fn, args });
          });
      },
    },
  ) as T;
}

export async function createNex(
  opts: {
    env: Constants;
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

  const nex = wrap<NexApi>(worker, logger);
  await nex.init(opts);
  return nex;
}
