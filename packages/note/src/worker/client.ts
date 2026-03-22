import type { KikuConfig } from "#/util/config";
import type { Constants } from "#/util/general";
import type { Logger } from "../util/logger";
import type { NexApi } from "./_kiku_worker.ts";

export type { NexApi } from "./_kiku_worker.ts";

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
  payload: {
    env: Constants;
    assetsPath: string;
    config: KikuConfig;
    preferAnkiConnect: boolean;
  },
  logger: Logger,
) {
  if (KIKU_STATE.nexClient) {
    const nex = KIKU_STATE.nexClient;
    await nex.init(payload);
    return nex;
  }

  let worker: Worker;
  if (payload.assetsPath !== window.location.origin && !import.meta.env.DEV) {
    worker = new Worker(`${payload.assetsPath}/_kiku_worker.js`, {
      type: "module",
    });
  } else {
    worker = new Worker(new URL("./_kiku_worker.ts", import.meta.url), {
      type: "module",
    });
  }

  const nex = wrap<NexApi>(worker, logger);
  await nex.init(payload);
  KIKU_STATE.nexClient = nex;
  return nex;
}
